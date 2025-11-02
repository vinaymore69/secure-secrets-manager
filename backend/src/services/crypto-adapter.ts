import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

interface HashPasswordResponse {
  hash: string;
}

interface VerifyPasswordResponse {
  valid: boolean;
  needs_rehash: boolean;
}

interface GenerateDEKResponse {
  dek: string;
}

interface EncryptResponse {
  ciphertext: string;
  nonce: string;
  tag: string;
  algorithm: string;
}

interface DecryptResponse {
  plaintext: string;
}

interface WrapDEKResponse {
  encrypted_dek: string;
  kms_key_id: string;
  algorithm: string;
}

interface UnwrapDEKResponse {
  dek: string;
}

export class CryptoAdapter {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.crypto.serviceUrl,
      headers: {
        'X-API-Key': config.crypto.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const response = await this.client.post<HashPasswordResponse>(
        '/crypto/hash-password',
        { password }
      );
      return response.data.hash;
    } catch (error) {
      console.error('Crypto service error (hash):', error);
      throw new Error('Failed to hash password');
    }
  }

  async verifyPassword(hash: string, password: string): Promise<VerifyPasswordResponse> {
    try {
      const response = await this.client.post<VerifyPasswordResponse>(
        '/crypto/verify-password',
        { hash, password }
      );
      return response.data;
    } catch (error) {
      console.error('Crypto service error (verify):', error);
      throw new Error('Failed to verify password');
    }
  }

  async generateDEK(length: number = 32): Promise<string> {
    try {
      const response = await this.client.post<GenerateDEKResponse>(
        '/crypto/generate-dek',
        { length }
      );
      return response.data.dek;
    } catch (error) {
      console.error('Crypto service error (generate DEK):', error);
      throw new Error('Failed to generate DEK');
    }
  }

  async encrypt(dek: string, plaintext: string, aad?: string): Promise<EncryptResponse> {
    try {
      const response = await this.client.post<EncryptResponse>('/crypto/encrypt', {
        dek,
        plaintext,
        aad,
      });
      return response.data;
    } catch (error) {
      console.error('Crypto service error (encrypt):', error);
      throw new Error('Failed to encrypt data');
    }
  }

  async decrypt(
    dek: string,
    ciphertext: string,
    nonce: string,
    tag: string,
    aad?: string
  ): Promise<string> {
    try {
      const response = await this.client.post<DecryptResponse>('/crypto/decrypt', {
        dek,
        ciphertext,
        nonce,
        tag,
        aad,
      });
      return response.data.plaintext;
    } catch (error) {
      console.error('Crypto service error (decrypt):', error);
      throw new Error('Failed to decrypt data');
    }
  }

  async wrapDEK(dek: string, kmsKeyId?: string): Promise<WrapDEKResponse> {
    try {
      const response = await this.client.post<WrapDEKResponse>('/crypto/wrap-dek', {
        dek,
        kms_key_id: kmsKeyId || config.kms.keyId,
      });
      return response.data;
    } catch (error) {
      console.error('Crypto service error (wrap DEK):', error);
      throw new Error('Failed to wrap DEK');
    }
  }

  async unwrapDEK(encryptedDek: string, kmsKeyId?: string): Promise<string> {
    try {
      const response = await this.client.post<UnwrapDEKResponse>('/crypto/unwrap-dek', {
        encrypted_dek: encryptedDek,
        kms_key_id: kmsKeyId || config.kms.keyId,
      });
      return response.data.dek;
    } catch (error) {
      console.error('Crypto service error (unwrap DEK):', error);
      throw new Error('Failed to unwrap DEK');
    }
  }
}

// Singleton instance
export const cryptoAdapter = new CryptoAdapter();