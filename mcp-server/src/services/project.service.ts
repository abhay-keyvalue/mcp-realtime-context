import { pool } from '../db/pool';
import { Project } from '@mcp/shared-types';
import { nanoid } from 'nanoid';

export class ProjectService {
  async create(name: string, description: string | undefined, ownerId: string): Promise<Project> {
    const id = nanoid();

    const query = `
      INSERT INTO projects (id, name, description, owner_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [id, name, description, ownerId]);
    return this.mapRowToProject(result.rows[0]);
  }

  async findById(id: string): Promise<Project | null> {
    const query = 'SELECT * FROM projects WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProject(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<Project[]> {
    const query = `
      SELECT p.* FROM projects p
      LEFT JOIN user_projects up ON p.id = up.project_id
      WHERE p.owner_id = $1 OR up.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows.map(row => this.mapRowToProject(row));
  }

  async update(id: string, name?: string, description?: string): Promise<Project | null> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      setParts.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (description !== undefined) {
      setParts.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (setParts.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE projects 
      SET ${setParts.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProject(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM projects WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const projectService = new ProjectService();
