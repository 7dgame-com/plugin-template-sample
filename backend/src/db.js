/**
 * 数据库连接模块
 *
 * 使用 mysql2/promise 创建连接池，支持异步操作。
 * 连接参数从环境变量读取，提供合理的默认值。
 *
 * 使用示例：
 *   const { pool } = require('./db');
 *   const [rows] = await pool.query('SELECT * FROM samples');
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'bujiaban',
  user: process.env.DB_USER || 'bujiaban',
  password: process.env.DB_PASSWORD || 'testpassword',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 连接错误处理
pool.on('connection', (connection) => {
  console.log('[DB] 新连接已建立, id:', connection.threadId);
});

// 验证连接是否可用
pool.getConnection()
  .then((conn) => {
    console.log('[DB] 数据库连接成功');
    conn.release();
  })
  .catch((err) => {
    console.error('[DB] 数据库连接失败:', err.message);
  });

module.exports = { pool };
