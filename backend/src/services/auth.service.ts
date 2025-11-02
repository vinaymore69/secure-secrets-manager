import { UserModel, CreateUserData } from '../models/user.model';
import { AuditModel } from '../models/audit.model';
import { cryptoAdapter } from './crypto-adapter';
import { JWTUtil, JWTPayload } from '../utils/jwt';
import { Logger } from '../utils/logger';
import pool from '../db/connection';

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async signup(data: SignupData, ipAddress?: string): Promise<{ userId: string }> {
    // Validate username and email uniqueness
    const existingUser = await UserModel.findByUsername(data.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const existingEmail = await UserModel.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Hash password using crypto service
    const passwordHash = await cryptoAdapter.hashPassword(data.password);

    // Create user
    const userData: CreateUserData = {
      username: data.username,
      email: data.email,
      password_hash: passwordHash,
    };

    const user = await UserModel.create(userData);

    // Assign default 'user' role
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['user']);
    if (roleResult.rows.length > 0) {
      await UserModel.assignRole(user.id, roleResult.rows[0].id);
    }

    // Audit log
    await AuditModel.create({
      event_type: 'user_signup',
      user_id: user.id,
      resource_type: 'user',
      resource_id: user.id,
      ip_address: ipAddress,
      details: { username: user.username, email: user.email },
    });

    Logger.info(`User signed up: ${user.username}`);

    return { userId: user.id };
  }

  async login(
    data: LoginData,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: any; tokens: AuthTokens }> {
    // Find user
    const user = await UserModel.findByUsername(data.username);
    if (!user) {
      await AuditModel.create({
        event_type: 'login_failed',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { username: data.username, reason: 'user_not_found' },
      });
      throw new Error('Invalid username or password');
    }

    // Check if account is locked
    if (user.is_locked) {
      await AuditModel.create({
        event_type: 'login_failed',
        user_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { username: data.username, reason: 'account_locked' },
      });
      throw new Error('Account is locked due to too many failed login attempts');
    }

    // Check if account is active
    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const verifyResult = await cryptoAdapter.verifyPassword(user.password_hash, data.password);

    if (!verifyResult.valid) {
      // Increment failed login attempts
      await UserModel.incrementFailedLoginAttempts(user.id);

      await AuditModel.create({
        event_type: 'login_failed',
        user_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { username: data.username, reason: 'invalid_password' },
      });

      throw new Error('Invalid username or password');
    }

    // Reset failed login attempts and update last login
    await UserModel.resetFailedLoginAttempts(user.id);

    // Get user roles
    const roles = await UserModel.getUserRoles(user.id);

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      roles,
    };

    const tokens: AuthTokens = {
      accessToken: JWTUtil.generateAccessToken(payload),
      refreshToken: JWTUtil.generateRefreshToken(payload),
    };

    // Audit log
    await AuditModel.create({
      event_type: 'login_success',
      user_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: { username: user.username },
    });

    Logger.info(`User logged in: ${user.username}`);

    // Return user without sensitive data
    const { password_hash, mfa_secret, ...safeUser } = user;

    return {
      user: { ...safeUser, roles },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = JWTUtil.verifyToken(refreshToken);

      // Re-fetch user roles (in case they changed)
      const roles = await UserModel.getUserRoles(payload.userId);

      const newPayload: JWTPayload = {
        userId: payload.userId,
        username: payload.username,
        roles,
      };

      return {
        accessToken: JWTUtil.generateAccessToken(newPayload),
        refreshToken: JWTUtil.generateRefreshToken(newPayload),
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string, ipAddress?: string): Promise<void> {
    await AuditModel.create({
      event_type: 'logout',
      user_id: userId,
      ip_address: ipAddress,
    });

    Logger.info(`User logged out: ${userId}`);
  }
}

// Singleton
export const authService = new AuthService();