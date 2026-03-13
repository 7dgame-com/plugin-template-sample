/**
 * 认证中间件
 *
 * 通过主后端 Plugin Auth API 验证 JWT Token。
 * 验证成功后将用户信息注入到 req.user，供后续路由使用。
 * 首次认证时自动生成 refresh token 并通过 X-Refresh-Token 响应头返回。
 *
 * 使用示例：
 *   const { auth } = require('./middleware/auth');
 *   router.get('/api/samples', auth, (req, res) => {
 *     console.log(req.user); // { id, username, nickname, roles }
 *   });
 */

const { verifyToken } = require('../utils/pluginAuth');
const redis = require('../redis');
const tokenService = require('../tokenService');

/**
 * 检查用户是否已有 refresh token，若无则生成并设置到响应头
 */
async function ensureRefreshToken(userId, res) {
  try {
    const setKey = `refresh_token:${userId}`;
    const count = await redis.scard(setKey);
    if (count === 0) {
      const refreshToken = await tokenService.generateRefreshToken(userId);
      res.setHeader('X-Refresh-Token', refreshToken);
    }
  } catch (err) {
    // 生成 refresh token 失败不应阻塞正常请求
    console.error('[Auth] Failed to ensure refresh token:', err.message);
  }
}

/**
 * Express 中间件：验证 JWT Token
 */
async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先在主系统登录' });
  }

  try {
    const user = await verifyToken(header);
    req.user = user; // { id, username, nickname, roles }
    await ensureRefreshToken(String(user.id), res);
    next();
  } catch (err) {
    const message = err.response?.data?.message || err.message || '认证失败';
    console.error('[Auth] Token 验证失败:', message);
    return res.status(401).json({ error: message });
  }
}

module.exports = { auth, ensureRefreshToken };
