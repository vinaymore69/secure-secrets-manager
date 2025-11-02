import pool from '../db/connection';
import { QueryResult } from 'pg';

export interface Secret {
  id: string;
  owner_id: string;
  name: string;
  ciphertext: Buffer;
  encrypted_dek: Buffer;
  dek_kms_key_id: string;
  dek_version: number;
  nonce: Buffer;
  aad: Buffer | null;
  metadata: any;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSecretData {
  owner_id: string;
  name: string;
  ciphertext: Buffer;
  encrypted_dek: Buffer;
  dek_kms_key_id: string;
  nonce: Buffer;
  aad?: Buffer;
  metadata?: any;
}

export interface UpdateSecretData {
  name?: string;
  ciphertext?: Buffer;
  encrypted_dek?: Buffer;
  nonce?: Buffer;
  aad?: Buffer;
  metadata?: any;
}

export class SecretModel {
  static async create(data: CreateSecretData): Promise<Secret> {
    const query = `
      INSERT INTO secrets (
        owner_id, name, ciphertext, encrypted_dek, 
        dek_kms_key_id, nonce, aad, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      data.owner_id,
      data.name,
      data.ciphertext,
      data.encrypted_dek,
      data.dek_kms_key_id,
      data.nonce,
      data.aad || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ];

    const result: QueryResult<Secret> = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id: string): Promise<Secret | null> {
    const query = 'SELECT * FROM secrets WHERE id = $1 AND is_deleted = false';
    const result: QueryResult<Secret> = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByOwner(
    ownerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Secret[]> {
    const query = `
      SELECT * FROM secrets
      WHERE owner_id = $1 AND is_deleted = false
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result: QueryResult<Secret> = await pool.query(query, [ownerId, limit, offset]);
    return result.rows;
  }

  static async findAll(limit: number = 50, offset: number = 0): Promise<Secret[]> {
    const query = `
      SELECT * FROM secrets
      WHERE is_deleted = false
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result: QueryResult<Secret> = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  static async update(id: string, data: UpdateSecretData): Promise<Secret | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(data.name);
      paramCount++;
    }

    if (data.ciphertext !== undefined) {
      fields.push(`ciphertext = $${paramCount}`);
      values.push(data.ciphertext);
      paramCount++;
    }

    if (data.encrypted_dek !== undefined) {
      fields.push(`encrypted_dek = $${paramCount}`);
      values.push(data.encrypted_dek);
      paramCount++;
    }

    if (data.nonce !== undefined) {
      fields.push(`nonce = $${paramCount}`);
      values.push(data.nonce);
      paramCount++;
    }

    if (data.aad !== undefined) {
      fields.push(`aad = $${paramCount}`);
      values.push(data.aad);
      paramCount++;
    }

    if (data.metadata !== undefined) {
      fields.push(`metadata = $${paramCount}`);
      values.push(JSON.stringify(data.metadata));
      paramCount++;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE secrets
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND is_deleted = false
      RETURNING *
    `;

    const result: QueryResult<Secret> = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async softDelete(id: string): Promise<boolean> {
    const query = `
      UPDATE secrets
      SET is_deleted = true, updated_at = NOW()
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async hardDelete(id: string): Promise<boolean> {
    const query = 'DELETE FROM secrets WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async countByOwner(ownerId: string): Promise<number> {
    const query = 'SELECT COUNT(*) FROM secrets WHERE owner_id = $1 AND is_deleted = false';
    const result = await pool.query(query, [ownerId]);
    return parseInt(result.rows[0].count, 10);
  }

  static async search(
    ownerId: string,
    searchTerm: string,
    limit: number = 50
  ): Promise<Secret[]> {
    const query = `
      SELECT * FROM secrets
      WHERE owner_id = $1 
        AND is_deleted = false
        AND name ILIKE $2
      ORDER BY created_at DESC
      LIMIT $3
    `;
    const result: QueryResult<Secret> = await pool.query(query, [
      ownerId,
      `%${searchTerm}%`,
      limit,
    ]);
    return result.rows;
  }
}