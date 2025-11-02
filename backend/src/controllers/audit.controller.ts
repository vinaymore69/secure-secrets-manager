import { Response, NextFunction } from 'express';
import { AuditModel } from '../models/audit.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Logger } from '../utils/logger';

export class AuditController {
  async listAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const filters: any = {};
      if (req.query.event_type) filters.event_type = req.query.event_type as string;
      if (req.query.user_id) filters.user_id = req.query.user_id as string;
      if (req.query.resource_type) filters.resource_type = req.query.resource_type as string;

      const logs = await AuditModel.list(limit, offset, filters);

      res.json({
        logs,
        pagination: { limit, offset, total: logs.length },
      });
    } catch (error: any) {
      Logger.error('List audit logs error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const auditController = new AuditController();