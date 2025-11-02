import pool from '../db/connection';
import { QueryResult } from 'pg';

export interface AuditLog {
  id: string;
  event_type: string;
  user_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
  created_at: Date;
}

export interface CreateAuditLogData {
  event_type: string;
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: any;
}

export class AuditModel {
  static async create(data: CreateAuditLogData): Promise<AuditLog> {
    const query = `
      INSERT INTO audit_logs (event_type, user_id, resource_type, resource_id, ip_address, user_agent, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      data.event_type,
      data.user_id || null,
      data.resource_type || null,
      data.resource_id || null,
      data.ip_address || null,
      data.user_agent || null,
      data.details ? JSON.stringify(data.details) : null,
    ];

    const result: QueryResult<AuditLog> = await pool.query(query, values);
    return result.rows[0];
  }

  static async list(
    limit: number = 100,
    offset: number = 0,
    filters?: {
      event_type?: string;
      user_id?: string;
      resource_type?: string;
    }
  ): Promise<AuditLog[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.event_type) {
      query += ` AND event_type = $${paramCount}`;
      values.push(filters.event_type);
      paramCount++;
    }

    if (filters?.user_id) {
      query += ` AND user_id = $${paramCount}`;
      values.push(filters.user_id);
      paramCount++;
    }

    if (filters?.resource_type) {
      query += ` AND resource_type = $${paramCount}`;
      values.push(filters.resource_type);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result: QueryResult<AuditLog> = await pool.query(query, values);
    return result.rows;
  }
}