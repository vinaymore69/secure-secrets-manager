import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/rbac.middleware';

const router = Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

// List all users
router.get('/', usersController.listUsers);

// Get specific user
router.get('/:id', usersController.getUser);

// Assign role to user
router.post('/:id/roles', usersController.assignRole);

// Remove role from user
router.delete('/:id/roles/:roleId', usersController.removeRole);

// Delete user
router.delete('/:id', usersController.deleteUser);

export default router;