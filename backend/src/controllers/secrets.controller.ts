import { Response, NextFunction } from 'express';
import { secretsService } from '../services/secrets.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Logger } from '../utils/logger';

export class SecretsController {
  async createSecret(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { name, plaintext } = req.body;

      if (!name || !plaintext) {
        return res.status(400).json({ error: 'Name and plaintext are required' });
      }

      const result = await secretsService.createSecret(
        {
          name,
          plaintext,
          ownerId: req.user.userId,
        },
        req.ip
      );

      res.status(201).json({
        message: 'Secret created successfully',
        secretId: result.secretId,
      });
    } catch (error: any) {
      Logger.error('Create secret error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async listSecrets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const secrets = await secretsService.listSecrets(
        req.user.userId,
        req.user.roles,
        limit,
        offset
      );

      res.json({
        secrets,
        pagination: {
          limit,
          offset,
          total: secrets.length,
        },
      });
    } catch (error: any) {
      Logger.error('List secrets error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getSecretMetadata(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;

      const metadata = await secretsService.getSecretMetadata(
        id,
        req.user.userId,
        req.user.roles
      );

      res.json({ secret: metadata });
    } catch (error: any) {
      Logger.error('Get secret metadata error:', error);
      const status = error.message.includes('not found') ? 404 : 
                     error.message.includes('Access denied') ? 403 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  async revealSecret(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;

      const result = await secretsService.revealSecret(id, req.user.userId, req.ip);

      res.json({
        plaintext: result.plaintext,
        metadata: result.metadata,
      });
    } catch (error: any) {
      Logger.error('Reveal secret error:', error);
      const status = error.message.includes('not found') ? 404 : 
                     error.message.includes('Access denied') ? 403 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  async updateSecret(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const { name, plaintext } = req.body;

      if (!name && !plaintext) {
        return res.status(400).json({ error: 'At least one field (name or plaintext) is required' });
      }

      await secretsService.updateSecret(
        id,
        req.user.userId,
        { name, plaintext },
        req.ip
      );

      res.json({ message: 'Secret updated successfully' });
    } catch (error: any) {
      Logger.error('Update secret error:', error);
      const status = error.message.includes('not found') ? 404 : 
                     error.message.includes('Access denied') ? 403 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  async deleteSecret(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;

      await secretsService.deleteSecret(id, req.user.userId, req.ip);

      res.json({ message: 'Secret deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete secret error:', error);
      const status = error.message.includes('not found') ? 404 : 
                     error.message.includes('Access denied') ? 403 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  async searchSecrets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Search query (q) is required' });
      }

      const limit = parseInt(req.query.limit as string) || 50;

      const secrets = await secretsService.searchSecrets(req.user.userId, q, limit);

      res.json({ secrets });
    } catch (error: any) {
      Logger.error('Search secrets error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const secretsController = new SecretsController();