/**
 * 插件模板示例 - 后端入口文件
 *
 * 配置 Express 应用，注册中间件和路由，启动 HTTP 服务器。
 *
 * 启动方式：
 *   node src/index.js
 *   或
 *   npm start
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { pool } = require('./db');
const redis = require('./redis');
const { auth } = require('./middleware/auth');
const sampleRoutes = require('./routes/samples');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 8085;

// ========== CORS 配置 ==========
// 允许前端开发服务器和生产环境的域名访问
app.use(
  cors({
    origin: [
      'http://localhost:3003', // 插件前端开发服务器
      'http://localhost:3001', // 主前端开发服务器
    ],
    credentials: true,
  })
);

// ========== 请求体解析 ==========
app.use(express.json());

// ========== 健康检查 ==========
// 不需要认证，用于 Docker 健康检查和运维监控
const APP_VERSION = '1.0.0';
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    await redis.ping();
    res.json({
      status: 'ok',
      version: APP_VERSION,
      db: 'connected',
      redis: 'connected',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      version: APP_VERSION,
      message: err.message,
    });
  }
});

// ========== 注册路由 ==========
// 认证路由（token 刷新、登出）
app.use('/api/auth', authRoutes);
// 示例功能路由（需要认证）
app.use('/api/samples', auth, sampleRoutes);

// ========== 全局错误处理 ==========
// 捕获未处理的路由错误，返回统一格式的错误响应
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Server] 未处理的错误:', err.message);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
  });
});

// ========== 启动服务器 ==========
app.listen(PORT, () => {
  console.log(`[Plugin Template] API 服务已启动，端口: ${PORT}`);
});
