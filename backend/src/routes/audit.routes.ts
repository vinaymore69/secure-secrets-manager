import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

// Require authentication and admin/auditor role
router.use(authMiddleware);
router.use(requireRole('admin', 'auditor'));

// List audit logs
router.get('/', auditController.listAuditLogs);

export default router;