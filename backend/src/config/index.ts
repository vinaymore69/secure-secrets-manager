import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  crypto: {
    serviceUrl: process.env.CRYPTO_SERVICE_URL || 'http://localhost:8000',
    apiKey: process.env.CRYPTO_SERVICE_API_KEY || '',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3001').split(','),
  },
  kms: {
    provider: process.env.KMS_PROVIDER || 'mock',
    keyId: process.env.KMS_KEY_ID || 'dev-master-key',
  },
};