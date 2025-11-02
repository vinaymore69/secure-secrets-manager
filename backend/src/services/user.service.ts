import { UserModel, UpdateUserData } from '../models/user.model';
import { AuditModel } from '../models/audit.model';
import { Logger } from '../utils/logger';
import pool from '../db/connection';

export class UserService {
  async getUserById(userId: string): Promise<any> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const roles = await UserModel.getUserRoles(userId);
    const { password_hash, mfa_secret, ...safeUser } = user;

    return { ...safeUser, roles };
  }

  async listUsers(limit: number = 50, offset: number = 0): Promise<any[]> {
    const users = await UserModel.list(limit, offset);

    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roles = await UserModel.getUserRoles(user.id);
        const { password_hash, mfa_secret, ...safeUser } = user;
        return { ...safeUser, roles };
      })
    );

    return usersWithRoles;
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<any> {
    const updatedUser = await UserModel.update(userId, data);
    if (!updatedUser) {
      throw new Error('User not found');
    }

    const { password_hash, mfa_secret, ...safeUser } = updatedUser;
    return safeUser;
  }

  async assignUserRole(userId: string, roleName: string, adminId: string): Promise<void> {
    // Get role ID
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
    if (roleResult.rows.length === 0) {
      throw new Error('Role not found');
    }

    const roleId = roleResult.rows[0].id;
    await UserModel.assignRole(userId, roleId);

    // Audit log
    await AuditModel.create({
      event_type: 'role_assigned',
      user_id: adminId,
      resource_type: 'user',
      resource_id: userId,
      details: { role: roleName },
    });

    Logger.info(`Role ${roleName} assigned to user ${userId} by ${adminId}`);
  }

  async removeUserRole(userId: string, roleName: string, adminId: string): Promise<void> {
    // Get role ID
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
    if (roleResult.rows.length === 0) {
      throw new Error('Role not found');
    }

    const roleId = roleResult.rows[0].id;
    await UserModel.removeRole(userId, roleId);

    // Audit log
    await AuditModel.create({
      event_type: 'role_removed',
      user_id: adminId,
      resource_type: 'user',
      resource_id: userId,
      details: { role: roleName },
    });

    Logger.info(`Role ${roleName} removed from user ${userId} by ${adminId}`);
  }

  async deleteUser(userId: string, adminId: string): Promise<void> {
    const deleted = await UserModel.delete(userId);
    if (!deleted) {
      throw new Error('User not found');
    }

    // Audit log
    await AuditModel.create({
      event_type: 'user_deleted',
      user_id: adminId,
      resource_type: 'user',
      resource_id: userId,
    });

    Logger.info(`User ${userId} deleted by ${adminId}`);
  }
}

export const userService = new UserService();