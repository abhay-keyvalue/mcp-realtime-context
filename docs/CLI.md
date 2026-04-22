# CLI Documentation

Complete guide for the MCP Context Logger CLI tool.

## Installation

### NPM (Global)

```bash
npm install -g @mcp/cli
```

### Local (Development)

```bash
cd mcp-cli
npm install
npm link
```

---

## Quick Start

```bash
# 1. Configure server URL (optional, defaults to localhost:3000)
mcp config set-server https://your-server.com

# 2. Register or login
mcp auth register
# or
mcp auth login

# 3. Create a project
mcp project create

# 4. Select active project
mcp project select

# 5. Log context
mcp log

# 6. View contexts
mcp list

# 7. View statistics
mcp stats
```

---

## Commands

### Configuration

#### Show Configuration

View current CLI configuration.

```bash
mcp config show
```

Output:
```
📋 Current Configuration:

Server URL: http://localhost:3000
Token: ✓ Set
Project ID: abc-123-def
Author: John Doe
Status: ✓ Configured
```

#### Set Server URL

```bash
mcp config set-server <url>
```

Example:
```bash
mcp config set-server https://mcp-server.onrender.com
```

#### Clear Configuration

```bash
mcp config clear
```

---

### Authentication

#### Register

Create a new account.

```bash
mcp auth register
```

Prompts:
- Full Name
- Email
- Password (min 8 characters)

#### Login

Authenticate with existing account.

```bash
mcp auth login
```

Prompts:
- Email
- Password

---

### Projects

#### List Projects

View all projects you have access to.

```bash
mcp project list
```

Output:
```
📁 Your Projects:

→ My Project (abc-123-def)
   My first project

  Another Project (xyz-789-ghi)
   Second project
```

The `→` indicates your currently selected project.

#### Create Project

```bash
mcp project create
```

Prompts:
- Project name (required)
- Description (optional)
- Set as active project? (yes/no)

#### Select Project

Switch active project.

```bash
mcp project select
```

Interactive menu to choose from your projects.

---

### Context Logging

#### Log Context

Add context to your project.

```bash
mcp log
```

Prompts:
- Context type (api, feature, decision, wip, bug)
- Title
- Description
- Status (draft, in-progress, finalized)
- Tags (comma-separated, optional)

Options:
- `--type <type>` - Pre-select type
- `--status <status>` - Pre-select status
- `--smart` - Use AI-powered smart detection

#### Smart Log

Use AI to automatically detect type and extract tags.

```bash
mcp log --smart
```

Prompt:
- What are you working on? (free text)

The AI will:
- Detect context type (api, feature, decision, wip, bug)
- Extract a title
- Auto-tag based on content
- Calculate confidence score

Example:
```bash
mcp log --smart
? What are you working on? Working on fixing a bug in the API endpoint 
  that returns 500 errors when user email is missing

✓ Context logged successfully

📝 Context created:
Title: Working on fixing a bug in the API endpoint that returns 500 errors
Type: bug
Tags: api, bug
Confidence: 75%
ID: abc-123-def
```

#### Pre-filled Options

```bash
# Pre-select type
mcp log --type wip

# Pre-select status
mcp log --status in-progress

# Both
mcp log --type feature --status in-progress
```

---

### Viewing Contexts

#### List Contexts

View contexts with filters.

```bash
mcp list
```

Options:
- `--type <type>` - Filter by type
- `--status <status>` - Filter by status
- `--limit <number>` - Limit results (default: 20)

Examples:
```bash
# All contexts
mcp list

# Only WIP contexts
mcp list --type wip

# In-progress items
mcp list --status in-progress

# Limit to 5 results
mcp list --limit 5

# Combine filters
mcp list --type bug --status draft --limit 10
```

Output:
```
📋 Contexts (3):

[WIP] User Authentication
  Implementing JWT-based authentication with refresh tokens
  Status: in-progress | Author: John Doe | Confidence: 85%
  Tags: auth, security, jwt
  ID: abc-123-def

[BUG] API 500 Error
  API endpoint returns 500 when email is missing
  Status: in-progress | Author: Jane Smith | Confidence: 90%
  Tags: api, bug
  ID: xyz-789-ghi
```

---

### Statistics

View project statistics.

```bash
mcp stats
```

Output:
```
📊 Project Statistics:

Total Contexts: 42
Active Authors: 3
Recent Updates (24h): 8

📝 By Type:
  API: 8
  Feature: 15
  Decision: 5
  WIP: 12
  Bug: 2

🔄 By Status:
  Draft: 5
  In Progress: 20
  Finalized: 17
```

---

## Context Types

| Type | Description | Use Case |
|------|-------------|----------|
| `api` | API endpoints or integrations | "Creating REST API for user management" |
| `feature` | New features or capabilities | "Adding dark mode to the app" |
| `decision` | Architecture or technical decisions | "Decided to use PostgreSQL over MongoDB" |
| `wip` | Work in progress | "Currently working on authentication flow" |
| `bug` | Bug fixes | "Fixing memory leak in data processor" |

---

## Context Status

| Status | Description |
|--------|-------------|
| `draft` | Initial draft, not started |
| `in-progress` | Currently being worked on |
| `finalized` | Completed and finalized |
| `archived` | Archived (not shown by default) |

---

## Configuration File

The CLI stores configuration in:

**macOS/Linux:**
```
~/.config/mcp-cli/config.json
```

**Windows:**
```
C:\Users\<username>\AppData\Local\mcp-cli\config.json
```

Contents:
```json
{
  "serverUrl": "http://localhost:3000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "projectId": "abc-123-def",
  "author": "John Doe"
}
```

---

## Tips & Best Practices

### 1. Use Smart Log for Quick Updates

```bash
mcp log --smart
```

Fast way to log what you're working on without selecting type/status manually.

### 2. Filter Contexts Efficiently

```bash
# See only what you're working on
mcp list --status in-progress --limit 5

# Check bugs
mcp list --type bug

# Review recent WIP
mcp list --type wip --status in-progress
```

### 3. Regular Updates

Log context frequently:
- When starting new work
- When switching tasks
- When making key decisions
- When fixing bugs

### 4. Use Descriptive Titles

Good: "Implementing JWT authentication with refresh tokens"
Bad: "Working on auth"

### 5. Tag Appropriately

Use tags for:
- Technologies: `react`, `node`, `postgres`
- Components: `api`, `frontend`, `auth`
- Priority: `urgent`, `blocked`

---

## Troubleshooting

### Connection Errors

```bash
# Verify server URL
mcp config show

# Test server connection
curl https://your-server.com/health

# Update server URL if needed
mcp config set-server https://correct-url.com
```

### Authentication Issues

```bash
# Re-login
mcp auth login

# Or clear config and start fresh
mcp config clear
mcp auth login
```

### No Projects Found

```bash
# Create a project
mcp project create

# Or ask admin to add you to a project
```

### Token Expired

```bash
# Re-login to get new token
mcp auth login
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_SERVER_URL` | Override server URL | `http://localhost:3000` |
| `MCP_TOKEN` | Override auth token | (from config) |
| `MCP_PROJECT_ID` | Override project ID | (from config) |

---

## Examples

### Daily Workflow

```bash
# Morning: Check what team is working on
mcp list --status in-progress --limit 10

# Start new feature
mcp log --smart
? What are you working on? Building user profile page with avatar upload

# Mid-day: Update status
mcp list --type wip
# (find your context ID)
# (update via API or create new context)

# End of day: Review stats
mcp stats
```

### Bug Fix Workflow

```bash
# Log bug
mcp log --type bug --status in-progress
? Title: API returns 500 on missing email
? Description: User registration endpoint crashes when email field is not provided
? Tags: api, bug, urgent

# Fix bug...

# Update to finalized (via API or create new context with finalized status)
```

### Feature Development

```bash
# Start feature
mcp log --smart
? What are you working on? Adding OAuth2 login with Google and GitHub support

# Make architectural decision
mcp log --type decision
? Title: OAuth2 Strategy Selection
? Description: Decided to use Passport.js with passport-google-oauth20 and passport-github2...
? Status: finalized

# Complete feature
mcp log
? Type: feature
? Title: OAuth2 Login Complete
? Description: Implemented Google and GitHub OAuth2 login with Passport.js...
? Status: finalized
? Tags: oauth, auth, google, github
```

---

## API vs CLI

The CLI is a wrapper around the REST API. For advanced use cases, you can use the API directly.

See [API.md](./API.md) for complete API documentation.
