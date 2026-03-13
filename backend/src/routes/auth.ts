/**
 * 认证路由 - Token 刷新与登出
 *
 * 端点：
 * - POST /api/auth/refresh  使用 refresh token 获取新的 access token
 * - POST /api/auth/logout   撤销该用户的所有 refresh token
 *
 * 刷新流程：
 * 1. 验证 refresh token（检查重放攻击 → 验证有效性 → 速率限制）
 * 2. 调用主后端 POST /v1/plugin/refresh-token 获取新 access token
 * 3. 轮换 refresh token（旧 token 失效，生成新 token）
 * 4. 返回 { accessToken, refreshToken }
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import * as tokenService from '../tokenService';
import redis from '../redis';
import { auth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router: Router = Router();

const MAIN_API_BASE: string = process.env.MAIN_API_URL || 'http://localhost:8091';
const REFRESH_RATE_LIMIT: number = parseInt(process.env.REFRESH_RATE_LIMIT || '10', 10);
const RATE_LIMIT_WINDOW = 60; // seconds

/**
 * 速率限制检查
 */
async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `rate_limit:refresh:${userId}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }
  return current > REFRESH_RATE_LIMIT;
}

/**
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'refresh token 不能为空' });
  }

  try {
    // 重放攻击检测
    const used = await tokenService.isTokenUsed(refreshToken);
    if (used) {
      const userId = await tokenService.getUserIdFromUsedToken(refreshToken);
      if (userId) {
        await tokenService.revokeAllUserTokens(userId);
      }
      console.warn('[Auth] Replay attack detected for refresh token');
      return res.status(401).json({ error: '检测到异常，请重新登录' });
    }

    // 验证 refresh token
    const userId = await tokenService.verifyRefreshToken(refreshToken);
    if (!userId) {
      return res.status(401).json({ error: 'refresh token 无效或已过期' });
    }

    // 速率限制
    const rateLimited = await checkRateLimit(userId);
    if (rateLimited) {
      return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
    }

    // 调用主后端获取新 access token
    let accessToken: string;
    try {
      const response = await axios.post(`${MAIN_API_BASE}/v1/plugin/refresh-token`, { userId });
      if (response.data.code === 0) {
        accessToken = response.data.data.accessToken;
      } else {
        console.error('[Auth] Main backend refresh failed:', response.data.message);
        return res.status(502).json({ error: '认证服务暂时不可用' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Auth] Main backend unavailable:', message);
      return res.status(502).json({ error: '认证服务暂时不可用' });
    }

    // 轮换 refresh token
    const newRefreshToken = await tokenService.rotateRefreshToken(refreshToken, userId);

    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Auth] Refresh token error:', message);
    return res.status(500).json({ error: '服务内部错误' });
  }
});

/**
 * POST /api/auth/logout
 * 需要认证
 */
router.post('/logout', auth, async (req: Request, res: Response) => {
  try {
    const userId = String((req as AuthenticatedRequest).user.id);
    await tokenService.revokeAllUserTokens(userId);
    return res.json({ message: '登出成功' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Auth] Logout error:', message);
    return res.status(500).json({ error: '服务内部错误' });
  }
});

export default router;
