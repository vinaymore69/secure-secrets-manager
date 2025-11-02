import pool from '../db/connection';
import { QueryResult } from 'pg';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  is_locked: boolean;
  failed_login_attempts: number;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  profile: any;
}

export interface CreateUserData {
  username: string;
  email: string;
  password_hash: string;
}

export interface UpdateUserData {
  email?: string;
  password_hash?: string;
  is_active?: boolean;
  is_locked?: boolean;
  failed_login_attempts?: number;
  last_login_at?: Date;
  mfa_enabled?: boolean;
  mfa_secret?: string;
  profile?: any;
}

export class UserModel {
  static async create(userData: CreateUserData): Promise<User> {
    const query = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [userData.username, userData.email, userData.password_hash];
    const result: QueryResult<User> = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result: QueryResult<User> = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result: QueryResult<User> = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result: QueryResult<User> = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async update(id: string, userData: UpdateUserData): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result: QueryResult<User> = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async list(limit: number = 50, offset: number = 0): Promise<User[]> {
    const query = `
      SELECT * FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result: QueryResult<User> = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  static async incrementFailedLoginAttempts(id: string): Promise<void> {
    const query = `
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1,
          is_locked = CASE WHEN failed_login_attempts + 1 >= 5 THEN true ELSE is_locked END
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  static async resetFailedLoginAttempts(id: string): Promise<void> {
    const query = `
      UPDATE users
      SET failed_login_attempts = 0,
          last_login_at = NOW()
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  static async getUserRoles(userId: string): Promise<string[]> {
    const query = `
      SELECT r.name
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map((row) => row.name);
  }

  static async assignRole(userId: string, roleId: number): Promise<void> {
    const query = `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `;
    await pool.query(query, [userId, roleId]);
  }

  static async removeRole(userId: string, roleId: number): Promise<void> {
    const query = 'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2';
    await pool.query(query, [userId, roleId]);
  }
}