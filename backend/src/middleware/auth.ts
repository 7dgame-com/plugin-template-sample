/**
 * 认证中间件
 *
 * 通过主后端 Plugin Auth API 验证 JWT Token。
 * 验证成功后将用户信息注入到 req.user，供后续路由使用。
 * 首次认证时自动生成 refresh token 并通过 X-Refresh-Token 响应头返回。
 *
 * 使用示例：
 *   import { auth } from './middleware/auth';
 *   router.get('/api/samples', auth, (req, res) => {
 *     console.log((req as AuthenticatedRequest).user);
 *   });
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { verifyToken } from '../utils/pluginAuth';
import redis from '../redis';
import * as tokenService from '../tokenService';

/**
 * 检查用户是否已有 refresh token，若无则生成并设置到响应头
 */
export async function ensureRefreshToken(userId: string, res: Response): Promise<void> {
  try {
    const setKey = `refresh_token:${userId}`;
    const count = await redis.scard(setKey);
    if (count === 0) {
      const refreshToken = await tokenService.generateRefreshToken(userId);
      res.setHeader('X-Refresh-Token', refreshToken);
    }
  } catch (err: unknown) {
    // 生成 refresh token 失败不应阻塞正常请求
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Auth] Failed to ensure refresh token:', message);
  }
}

/**
 * Express 中间件：验证 JWT Token
 */
export async function auth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录，请先在主系统登录' });
    return;
  }

  try {
    const user = await verifyToken(header);
    (req as AuthenticatedRequest).user = user;
    await ensureRefreshToken(String(user.id), res);
    next();
  } catch (err: unknown) {
    let message = '认证失败';
    if (err instanceof Error) {
      message = err.message || message;
    }
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      message = axiosErr.response?.data?.message || message;
    }
    console.error('[Auth] Token 验证失败:', message);
    res.status(401).json({ error: message });
  }
}
