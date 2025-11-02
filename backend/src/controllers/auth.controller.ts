import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Logger } from '../utils/logger';

export class AuthController {
  async signup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { username, email, password } = req.body;
      const ipAddress = req.ip;

      const result = await authService.signup(
        { username, email, password },
        ipAddress
      );

      res.status(201).json({
        message: 'User created successfully',
        userId: result.userId,
      });
    } catch (error: any) {
      Logger.error('Signup error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login(
        { username, password },
        ipAddress,
        userAgent
      );

      // Set HTTP-only cookies
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        message: 'Login successful',
        user: result.user,
        tokens: result.tokens,
      });
    } catch (error: any) {
      Logger.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const tokens = await authService.refreshToken(refreshToken);

      // Update cookies
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        message: 'Token refreshed',
        tokens,
      });
    } catch (error: any) {
      Logger.error('Refresh error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await authService.logout(req.user.userId, req.ip);
      }

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({ message: 'Logout successful' });
    } catch (error: any) {
      Logger.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.json({ user: req.user });
    } catch (error: any) {
      Logger.error('Me error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  }
}

export const authController = new AuthController();