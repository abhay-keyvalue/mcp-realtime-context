-- MCP Real-Time Context Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT projects_name_unique UNIQUE (name)
);

CREATE INDEX idx_projects_owner_id ON projects(owner_id);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'developer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'developer', 'viewer'))
);

CREATE INDEX idx_users_email ON users(email);

-- User-Project mapping table
CREATE TABLE IF NOT EXISTS user_projects (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX idx_user_projects_project_id ON user_projects(project_id);

-- Contexts table
CREATE TABLE IF NOT EXISTS contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  tags TEXT[] DEFAULT '{}',
  author VARCHAR(100) NOT NULL,
  source VARCHAR(20) NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 50,
  version INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT contexts_type_check CHECK (type IN ('api', 'feature', 'decision', 'wip', 'bug')),
  CONSTRAINT contexts_status_check CHECK (status IN ('draft', 'in-progress', 'finalized', 'archived')),
  CONSTRAINT contexts_source_check CHECK (source IN ('ai', 'cli', 'git', 'manual')),
  CONSTRAINT contexts_confidence_check CHECK (confidence >= 0 AND confidence <= 100)
);

CREATE INDEX idx_contexts_project_id ON contexts(project_id);
CREATE INDEX idx_contexts_type ON contexts(type);
CREATE INDEX idx_contexts_status ON contexts(status);
CREATE INDEX idx_contexts_author ON contexts(author);
CREATE INDEX idx_contexts_source ON contexts(source);
CREATE INDEX idx_contexts_created_at ON contexts(created_at DESC);
CREATE INDEX idx_contexts_updated_at ON contexts(updated_at DESC);
CREATE INDEX idx_contexts_expires_at ON contexts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_contexts_tags ON contexts USING GIN(tags);
CREATE INDEX idx_contexts_metadata ON contexts USING GIN(metadata);

-- Context versions (for history tracking)
CREATE TABLE IF NOT EXISTS context_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_id UUID NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  tags TEXT[],
  confidence INTEGER NOT NULL,
  metadata JSONB,
  changed_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT context_versions_context_version_unique UNIQUE (context_id, version)
);

CREATE INDEX idx_context_versions_context_id ON context_versions(context_id);
CREATE INDEX idx_context_versions_created_at ON context_versions(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contexts_updated_at BEFORE UPDATE ON contexts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create context version on update
CREATE OR REPLACE FUNCTION create_context_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    OLD.type IS DISTINCT FROM NEW.type OR
    OLD.title IS DISTINCT FROM NEW.title OR
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.status IS DISTINCT FROM NEW.status OR
    OLD.tags IS DISTINCT FROM NEW.tags OR
    OLD.confidence IS DISTINCT FROM NEW.confidence OR
    OLD.metadata IS DISTINCT FROM NEW.metadata
  ) THEN
    INSERT INTO context_versions (
      context_id,
      version,
      type,
      title,
      description,
      status,
      tags,
      confidence,
      metadata,
      changed_by
    ) VALUES (
      OLD.id,
      OLD.version,
      OLD.type,
      OLD.title,
      OLD.description,
      OLD.status,
      OLD.tags,
      OLD.confidence,
      OLD.metadata,
      OLD.author
    );
    
    NEW.version = OLD.version + 1;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for context versioning
CREATE TRIGGER context_versioning BEFORE UPDATE ON contexts
  FOR EACH ROW EXECUTE FUNCTION create_context_version();

-- View for active contexts (not expired)
CREATE OR REPLACE VIEW active_contexts AS
SELECT * FROM contexts
WHERE (expires_at IS NULL OR expires_at > NOW())
  AND status != 'archived';
