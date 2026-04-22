import { pool } from '../db/pool';
import { redisService } from './redis.service';
import { Context, ContextCreate, ContextUpdate, ContextQuery } from '@mcp/shared-types';
import { nanoid } from 'nanoid';

export class ContextService {
  async create(data: ContextCreate): Promise<Context> {
    const id = nanoid();
    
    const query = `
      INSERT INTO contexts (
        id, project_id, type, title, description, status, tags, 
        author, source, confidence, metadata, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      id,
      data.projectId,
      data.type,
      data.title,
      data.description,
      data.status || 'draft',
      data.tags || [],
      data.author,
      data.source,
      data.confidence || 50,
      JSON.stringify(data.metadata || {}),
      data.expiresAt || null,
    ];
    
    const result = await pool.query(query, values);
    const context = this.mapRowToContext(result.rows[0]);
    
    // Publish to Redis
    await this.publishContextEvent('created', context);
    
    // Cache in Redis
    await this.cacheContext(context);
    
    return context;
  }

  async update(id: string, data: ContextUpdate): Promise<Context | null> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.type !== undefined) {
      setParts.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (data.title !== undefined) {
      setParts.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      setParts.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      setParts.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.tags !== undefined) {
      setParts.push(`tags = $${paramIndex++}`);
      values.push(data.tags);
    }
    if (data.confidence !== undefined) {
      setParts.push(`confidence = $${paramIndex++}`);
      values.push(data.confidence);
    }
    if (data.metadata !== undefined) {
      setParts.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(data.metadata));
    }
    if (data.expiresAt !== undefined) {
      setParts.push(`expires_at = $${paramIndex++}`);
      values.push(data.expiresAt);
    }

    if (setParts.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE contexts 
      SET ${setParts.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }

    const context = this.mapRowToContext(result.rows[0]);
    
    // Publish to Redis
    await this.publishContextEvent('updated', context, data);
    
    // Update cache
    await this.cacheContext(context);
    
    return context;
  }

  async findById(id: string): Promise<Context | null> {
    // Try cache first
    const cached = await redisService.get(`context:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const query = 'SELECT * FROM contexts WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const context = this.mapRowToContext(result.rows[0]);
    await this.cacheContext(context);
    
    return context;
  }

  async query(filters: ContextQuery): Promise<Context[]> {
    const conditions: string[] = ['(expires_at IS NULL OR expires_at > NOW())'];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.projectId) {
      conditions.push(`project_id = $${paramIndex++}`);
      values.push(filters.projectId);
    }

    if (filters.type) {
      if (Array.isArray(filters.type)) {
        conditions.push(`type = ANY($${paramIndex++})`);
        values.push(filters.type);
      } else {
        conditions.push(`type = $${paramIndex++}`);
        values.push(filters.type);
      }
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(`status = ANY($${paramIndex++})`);
        values.push(filters.status);
      } else {
        conditions.push(`status = $${paramIndex++}`);
        values.push(filters.status);
      }
    }

    if (filters.author) {
      conditions.push(`author = $${paramIndex++}`);
      values.push(filters.author);
    }

    if (filters.source) {
      conditions.push(`source = $${paramIndex++}`);
      values.push(filters.source);
    }

    if (filters.tags && filters.tags.length > 0) {
      conditions.push(`tags @> $${paramIndex++}`);
      values.push(filters.tags);
    }

    if (filters.minConfidence !== undefined) {
      conditions.push(`confidence >= $${paramIndex++}`);
      values.push(filters.minConfidence);
    }

    const sortBy = filters.sortBy || 'updated_at';
    const sortOrder = filters.sortOrder || 'desc';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT * FROM contexts
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows.map(row => this.mapRowToContext(row));
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM contexts WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length > 0) {
      await redisService.del(`context:${id}`);
      await this.publishContextEvent('deleted', { id } as any);
      return true;
    }
    
    return false;
  }

  async getStats(projectId?: string): Promise<any> {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE type = 'api') as api_count,
        COUNT(*) FILTER (WHERE type = 'feature') as feature_count,
        COUNT(*) FILTER (WHERE type = 'decision') as decision_count,
        COUNT(*) FILTER (WHERE type = 'wip') as wip_count,
        COUNT(*) FILTER (WHERE type = 'bug') as bug_count,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'finalized') as finalized_count,
        COUNT(DISTINCT author) as active_authors,
        COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '24 hours') as recent_updates
      FROM contexts
      WHERE (expires_at IS NULL OR expires_at > NOW())
    `;

    const values: any[] = [];
    if (projectId) {
      query += ' AND project_id = $1';
      values.push(projectId);
    }

    const result = await pool.query(query, values);
    const row = result.rows[0];

    return {
      total: parseInt(row.total),
      byType: {
        api: parseInt(row.api_count),
        feature: parseInt(row.feature_count),
        decision: parseInt(row.decision_count),
        wip: parseInt(row.wip_count),
        bug: parseInt(row.bug_count),
      },
      byStatus: {
        draft: parseInt(row.draft_count),
        'in-progress': parseInt(row.in_progress_count),
        finalized: parseInt(row.finalized_count),
      },
      activeAuthors: parseInt(row.active_authors),
      recentUpdates: parseInt(row.recent_updates),
    };
  }

  private async cacheContext(context: Context): Promise<void> {
    const ttl = 3600; // 1 hour
    await redisService.set(`context:${context.id}`, JSON.stringify(context), ttl);
  }

  private async publishContextEvent(
    eventType: 'created' | 'updated' | 'deleted',
    context: Context,
    changes?: any
  ): Promise<void> {
    const event = {
      eventType,
      context,
      changes,
      timestamp: new Date(),
    };

    await redisService.publish('context:events', JSON.stringify(event));
  }

  private mapRowToContext(row: any): Context {
    return {
      id: row.id,
      projectId: row.project_id,
      type: row.type,
      title: row.title,
      description: row.description,
      status: row.status,
      tags: row.tags || [],
      author: row.author,
      source: row.source,
      confidence: row.confidence,
      version: row.version,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
    };
  }
}

export const contextService = new ContextService();
