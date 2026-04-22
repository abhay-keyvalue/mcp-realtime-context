import bcrypt from 'bcrypt';
import { pool } from '../db/pool';
import { User } from '@mcp/shared-types';
import { nanoid } from 'nanoid';

const SALT_ROUNDS = 10;

export class AuthService {
  async createUser(email: string, password: string, name: string, role: string = 'developer'): Promise<User> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = nanoid();

    const query = `
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role, created_at, updated_at
    `;

    const result = await pool.query(query, [id, email, passwordHash, name, role]);
    return this.mapRowToUser(result.rows[0]);
  }

  async validateCredentials(email: string, password: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return null;
    }

    return this.mapRowToUser(user);
  }

  async findUserById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async getUserProjects(userId: string): Promise<string[]> {
    const query = 'SELECT project_id FROM user_projects WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => row.project_id);
  }

  async addUserToProject(userId: string, projectId: string): Promise<void> {
    const query = 'INSERT INTO user_projects (user_id, project_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';
    await pool.query(query, [userId, projectId]);
  }

  async removeUserFromProject(userId: string, projectId: string): Promise<void> {
    const query = 'DELETE FROM user_projects WHERE user_id = $1 AND project_id = $2';
    await pool.query(query, [userId, projectId]);
  }

  async hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM user_projects 
      WHERE user_id = $1 AND project_id = $2
      UNION
      SELECT 1 FROM projects 
      WHERE id = $2 AND owner_id = $1
    `;
    const result = await pool.query(query, [userId, projectId]);
    return result.rows.length > 0;
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      projectIds: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const authService = new AuthService();
