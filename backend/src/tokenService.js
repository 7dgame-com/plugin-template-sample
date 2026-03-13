/**
 * Refresh Token 服务
 *
 * 基于 Redis 实现 refresh token 的生成、验证、轮换和撤销。
 * 安全特性：
 * - Token 以 SHA-256 哈希存储，原始值不落盘
 * - 支持 token 轮换（rotation），旧 token 使用后立即失效
 * - 重放攻击检测：已使用的 token 再次出现时撤销该用户所有 token
 * - 每用户独立的 token 集合，支持批量撤销
 *
 * Redis 数据结构：
 * - SET  refresh_token:{userId}           → 该用户所有有效 token hash
 * - HASH refresh_token_data:{tokenHash}   → { userId, createdAt, expiresAt }
 * - STR  refresh_token_used:{tokenHash}   → userId（已使用的旧 token，用于重放检测）
 */

const crypto = require('crypto');
const redis = require('./redis');

const REFRESH_TOKEN_TTL = parseInt(process.env.REFRESH_TOKEN_TTL || '604800', 10); // 7 days

/**
 * 对 token 进行 SHA-256 哈希
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * 生成并存储 refresh token
 * @param {string} userId
 * @returns {Promise<string>} 原始 token 字符串
 */
async function generateRefreshToken(userId) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + REFRESH_TOKEN_TTL;

  const setKey = `refresh_token:${userId}`;
  const dataKey = `refresh_token_data:${tokenHash}`;

  const pipeline = redis.pipeline();
  pipeline.sadd(setKey, tokenHash);
  pipeline.expire(setKey, REFRESH_TOKEN_TTL);
  pipeline.hset(dataKey, 'userId', String(userId), 'createdAt', String(now), 'expiresAt', String(expiresAt));
  pipeline.expire(dataKey, REFRESH_TOKEN_TTL);
  await pipeline.exec();

  return rawToken;
}

/**
 * 验证 refresh token 的有效性
 * @param {string} token - 原始 token 字符串
 * @returns {Promise<string|null>} 有效时返回 userId，否则返回 null
 */
async function verifyRefreshToken(token) {
  if (!token) return null;

  const tokenHash = hashToken(token);
  const dataKey = `refresh_token_data:${tokenHash}`;

  const metadata = await redis.hgetall(dataKey);
  if (!metadata || !metadata.userId) return null;

  const { userId, expiresAt } = metadata;
  const now = Math.floor(Date.now() / 1000);
  if (now >= parseInt(expiresAt, 10)) return null;

  const isMember = await redis.sismember(`refresh_token:${userId}`, tokenHash);
  if (!isMember) return null;

  return userId;
}

/**
 * 轮换 refresh token：使旧 token 失效，生成新 token
 * @param {string} oldToken - 旧的原始 token 字符串
 * @param {string} userId
 * @returns {Promise<string>} 新的原始 token 字符串
 */
async function rotateRefreshToken(oldToken, userId) {
  const oldTokenHash = hashToken(oldToken);

  const pipeline = redis.pipeline();
  pipeline.srem(`refresh_token:${userId}`, oldTokenHash);
  pipeline.set(`refresh_token_used:${oldTokenHash}`, String(userId), 'EX', REFRESH_TOKEN_TTL);
  pipeline.del(`refresh_token_data:${oldTokenHash}`);
  await pipeline.exec();

  return generateRefreshToken(userId);
}

/**
 * 检测 token 是否已被使用过（重放攻击检测）
 */
async function isTokenUsed(token) {
  if (!token) return false;
  const tokenHash = hashToken(token);
  return (await redis.exists(`refresh_token_used:${tokenHash}`)) === 1;
}

/**
 * 获取已使用 token 关联的用户 ID
 */
async function getUserIdFromUsedToken(token) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const value = await redis.get(`refresh_token_used:${tokenHash}`);
  return value && value !== '1' ? value : null;
}

/**
 * 撤销用户的所有 refresh token
 */
async function revokeAllUserTokens(userId) {
  const setKey = `refresh_token:${userId}`;
  const tokenHashes = await redis.smembers(setKey);

  const pipeline = redis.pipeline();
  for (const tokenHash of tokenHashes) {
    pipeline.del(`refresh_token_data:${tokenHash}`);
  }
  pipeline.del(setKey);
  await pipeline.exec();
}

module.exports = {
  hashToken,
  generateRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  isTokenUsed,
  getUserIdFromUsedToken,
  revokeAllUserTokens,
};
