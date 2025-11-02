import { SecretModel, CreateSecretData } from '../models/secret.model';
import { AuditModel } from '../models/audit.model';
import { cryptoAdapter } from './crypto-adapter';
import { config } from '../config';
import { Logger } from '../utils/logger';

export interface CreateSecretRequest {
  name: string;
  plaintext: string;
  ownerId: string;
}

export interface UpdateSecretRequest {
  name?: string;
  plaintext?: string;
}

export interface SecretMetadata {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
  metadata: any;
}

export class SecretsService {
  /**
   * Create a new encrypted secret using envelope encryption
   */
  async createSecret(
    request: CreateSecretRequest,
    ipAddress?: string
  ): Promise<{ secretId: string }> {
    try {
      // Step 1: Generate a random Data Encryption Key (DEK)
      Logger.debug('Generating DEK');
      const dek = await cryptoAdapter.generateDEK(32); // 256 bits

      // Step 2: Encrypt the plaintext with the DEK using AEAD
      Logger.debug('Encrypting plaintext');
      const plaintextBase64 = Buffer.from(request.plaintext).toString('base64');
      const encryptResult = await cryptoAdapter.encrypt(dek, plaintextBase64);

      // Step 3: Wrap (encrypt) the DEK using KMS
      Logger.debug('Wrapping DEK with KMS');
      const wrapResult = await cryptoAdapter.wrapDEK(dek, config.kms.keyId);

      // Step 4: Store everything in the database
      const secretData: CreateSecretData = {
        owner_id: request.ownerId,
        name: request.name,
        ciphertext: Buffer.from(encryptResult.ciphertext, 'base64'),
        encrypted_dek: Buffer.from(wrapResult.encrypted_dek, 'base64'),
        dek_kms_key_id: wrapResult.kms_key_id,
        nonce: Buffer.from(encryptResult.nonce, 'base64'),
        aad: encryptResult.tag ? Buffer.from(encryptResult.tag, 'base64') : undefined,
        metadata: {
          algorithm: encryptResult.algorithm,
          kms_algorithm: wrapResult.algorithm,
          version: 1,
        },
      };

      const secret = await SecretModel.create(secretData);

      // Audit log
      await AuditModel.create({
        event_type: 'secret_created',
        user_id: request.ownerId,
        resource_type: 'secret',
        resource_id: secret.id,
        ip_address: ipAddress,
        details: {
          secret_name: request.name,
          kms_key_id: wrapResult.kms_key_id,
        },
      });

      Logger.info(`Secret created: ${secret.id} for user: ${request.ownerId}`);

      return { secretId: secret.id };
    } catch (error) {
      Logger.error('Error creating secret:', error);
      throw new Error('Failed to create secret');
    }
  }

  /**
   * Reveal (decrypt) a secret
   */
  async revealSecret(
    secretId: string,
    userId: string,
    ipAddress?: string
  ): Promise<{ plaintext: string; metadata: any }> {
    try {
      // Step 1: Fetch the secret from database
      const secret = await SecretModel.findById(secretId);
      if (!secret) {
        throw new Error('Secret not found');
      }

      // Step 2: Check ownership (or role-based access)
      if (secret.owner_id !== userId) {
        // TODO: Add role-based check for admins/auditors
        throw new Error('Access denied: You do not own this secret');
      }

      // Step 3: Unwrap the DEK using KMS
      Logger.debug(`Unwrapping DEK for secret: ${secretId}`);
      const encryptedDekBase64 = secret.encrypted_dek.toString('base64');
      const dek = await cryptoAdapter.unwrapDEK(encryptedDekBase64, secret.dek_kms_key_id);

      // Step 4: Decrypt the ciphertext using the DEK
      Logger.debug(`Decrypting secret: ${secretId}`);
      const ciphertextBase64 = secret.ciphertext.toString('base64');
      const nonceBase64 = secret.nonce.toString('base64');
      const tagBase64 = secret.aad ? secret.aad.toString('base64') : '';

      const plaintextBase64 = await cryptoAdapter.decrypt(
        dek,
        ciphertextBase64,
        nonceBase64,
        tagBase64
      );

      const plaintext = Buffer.from(plaintextBase64, 'base64').toString('utf-8');

      // Audit log
      await AuditModel.create({
        event_type: 'secret_revealed',
        user_id: userId,
        resource_type: 'secret',
        resource_id: secretId,
        ip_address: ipAddress,
        details: {
          secret_name: secret.name,
          kms_key_id: secret.dek_kms_key_id,
        },
      });

      Logger.info(`Secret revealed: ${secretId} by user: ${userId}`);

      return {
        plaintext,
        metadata: secret.metadata,
      };
    } catch (error: any) {
      Logger.error('Error revealing secret:', error);
      
      // Audit failed attempt
      await AuditModel.create({
        event_type: 'secret_reveal_failed',
        user_id: userId,
        resource_type: 'secret',
        resource_id: secretId,
        ip_address: ipAddress,
        details: {
          error: error.message,
        },
      });

      throw new Error('Failed to reveal secret: ' + error.message);
    }
  }

  /**
   * List secrets (metadata only, no plaintext)
   */
  async listSecrets(
    userId: string,
    userRoles: string[],
    limit: number = 50,
    offset: number = 0
  ): Promise<SecretMetadata[]> {
    try {
      let secrets;

      // Admins and auditors can see all secrets
      if (userRoles.includes('admin') || userRoles.includes('auditor')) {
        secrets = await SecretModel.findAll(limit, offset);
      } else {
        // Regular users see only their own secrets
        secrets = await SecretModel.findByOwner(userId, limit, offset);
      }

      // Return metadata only (no ciphertext or keys)
      return secrets.map((secret) => ({
        id: secret.id,
        name: secret.name,
        owner_id: secret.owner_id,
        created_at: secret.created_at,
        updated_at: secret.updated_at,
        metadata: secret.metadata,
      }));
    } catch (error) {
      Logger.error('Error listing secrets:', error);
      throw new Error('Failed to list secrets');
    }
  }

  /**
   * Get secret metadata (without revealing plaintext)
   */
  async getSecretMetadata(secretId: string, userId: string, userRoles: string[]): Promise<SecretMetadata> {
    try {
      const secret = await SecretModel.findById(secretId);
      if (!secret) {
        throw new Error('Secret not found');
      }

      // Check access
      const isOwner = secret.owner_id === userId;
      const isAdmin = userRoles.includes('admin') || userRoles.includes('auditor');

      if (!isOwner && !isAdmin) {
        throw new Error('Access denied');
      }

      return {
        id: secret.id,
        name: secret.name,
        owner_id: secret.owner_id,
        created_at: secret.created_at,
        updated_at: secret.updated_at,
        metadata: secret.metadata,
      };
    } catch (error) {
      Logger.error('Error getting secret metadata:', error);
      throw error;
    }
  }

  /**
   * Update a secret (re-encrypt with new plaintext)
   */
  async updateSecret(
    secretId: string,
    userId: string,
    request: UpdateSecretRequest,
    ipAddress?: string
  ): Promise<void> {
    try {
      const secret = await SecretModel.findById(secretId);
      if (!secret) {
        throw new Error('Secret not found');
      }

      // Check ownership
      if (secret.owner_id !== userId) {
        throw new Error('Access denied: You do not own this secret');
      }

      const updateData: any = {};

      // Update name if provided
      if (request.name) {
        updateData.name = request.name;
      }

      // Re-encrypt if new plaintext provided
      if (request.plaintext) {
        // Generate new DEK
        const dek = await cryptoAdapter.generateDEK(32);

        // Encrypt new plaintext
        const plaintextBase64 = Buffer.from(request.plaintext).toString('base64');
        const encryptResult = await cryptoAdapter.encrypt(dek, plaintextBase64);

        // Wrap new DEK
        const wrapResult = await cryptoAdapter.wrapDEK(dek, config.kms.keyId);

        updateData.ciphertext = Buffer.from(encryptResult.ciphertext, 'base64');
        updateData.encrypted_dek = Buffer.from(wrapResult.encrypted_dek, 'base64');
        updateData.nonce = Buffer.from(encryptResult.nonce, 'base64');
        updateData.aad = Buffer.from(encryptResult.tag, 'base64');
        updateData.metadata = {
          algorithm: encryptResult.algorithm,
          kms_algorithm: wrapResult.algorithm,
          version: (secret.metadata?.version || 1) + 1,
        };
      }

      await SecretModel.update(secretId, updateData);

      // Audit log
      await AuditModel.create({
        event_type: 'secret_updated',
        user_id: userId,
        resource_type: 'secret',
        resource_id: secretId,
        ip_address: ipAddress,
        details: {
          secret_name: request.name || secret.name,
          plaintext_updated: !!request.plaintext,
        },
      });

      Logger.info(`Secret updated: ${secretId} by user: ${userId}`);
    } catch (error) {
      Logger.error('Error updating secret:', error);
      throw new Error('Failed to update secret');
    }
  }

  /**
   * Delete a secret (soft delete)
   */
  async deleteSecret(secretId: string, userId: string, ipAddress?: string): Promise<void> {
    try {
      const secret = await SecretModel.findById(secretId);
      if (!secret) {
        throw new Error('Secret not found');
      }

      // Check ownership
      if (secret.owner_id !== userId) {
        throw new Error('Access denied: You do not own this secret');
      }

      await SecretModel.softDelete(secretId);

      // Audit log
      await AuditModel.create({
        event_type: 'secret_deleted',
        user_id: userId,
        resource_type: 'secret',
        resource_id: secretId,
        ip_address: ipAddress,
        details: {
          secret_name: secret.name,
        },
      });

      Logger.info(`Secret deleted: ${secretId} by user: ${userId}`);
    } catch (error) {
      Logger.error('Error deleting secret:', error);
      throw error;
    }
  }

  /**
   * Search secrets by name
   */
  async searchSecrets(userId: string, searchTerm: string, limit: number = 50): Promise<SecretMetadata[]> {
    try {
      const secrets = await SecretModel.search(userId, searchTerm, limit);

      return secrets.map((secret) => ({
        id: secret.id,
        name: secret.name,
        owner_id: secret.owner_id,
        created_at: secret.created_at,
        updated_at: secret.updated_at,
        metadata: secret.metadata,
      }));
    } catch (error) {
      Logger.error('Error searching secrets:', error);
      throw new Error('Failed to search secrets');
    }
  }
}

// Singleton
export const secretsService = new SecretsService();