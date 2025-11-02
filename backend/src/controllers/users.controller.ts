import { Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Logger } from '../utils/logger';

export class UsersController {
  async listUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const users = await userService.listUsers(limit, offset);

      res.json({
        users,
        pagination: { limit, offset, total: users.length },
      });
    } catch (error: any) {
      Logger.error('List users error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.json({ user });
    } catch (error: any) {
      Logger.error('Get user error:', error);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  async assignRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error: 'Role is required' });
      }

      await userService.assignUserRole(id, role, req.user.userId);

      res.json({ message: 'Role assigned successfully' });
    } catch (error: any) {
      Logger.error('Assign role error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async removeRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id, roleId } = req.params;

      // Get role name from ID
      const pool = require('../db/connection').default;
      const roleResult = await pool.query('SELECT name FROM roles WHERE id = $1', [roleId]);
      
      if (roleResult.rows.length === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }

      const roleName = roleResult.rows[0].name;
      await userService.removeUserRole(id, roleName, req.user.userId);

      res.json({ message: 'Role removed successfully' });
    } catch (error: any) {
      Logger.error('Remove role error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user.userId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await userService.deleteUser(id, req.user.userId);

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      Logger.error('Delete user error:', error);
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }
}

export const usersController = new UsersController();