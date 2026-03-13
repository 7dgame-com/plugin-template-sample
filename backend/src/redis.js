/**
 * Redis 连接模块
 *
 * 使用 ioredis 创建 Redis 客户端，支持自动重连。
 * 连接参数从环境变量读取，使用 keyPrefix 避免不同插件之间的 key 冲突。
 *
 * 使用示例：
 *   const redis = require('./redis');
 *   await redis.set('key', 'value', 'EX', 3600);
 *   const val = await redis.get('key');
 */

require('dotenv').config();
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: parseInt(process.env.REDIS_DB || '2'),
  // key 前缀，避免与其他插件冲突（请根据插件名称修改）
  keyPrefix: 'plugin-tpl:',
  // 自动重连配置
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000);
    console.warn(`[Redis] 第 ${times} 次重连，${delay}ms 后重试...`);
    return delay;
  },
});

// 连接成功
redis.on('connect', () => {
  console.log('[Redis] 连接成功');
});

// 连接错误
redis.on('error', (err) => {
  console.error('[Redis] 连接错误:', err.message);
});

module.exports = redis;
