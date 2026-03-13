/**
 * 数据库连接模块
 *
 * 使用 mysql2/promise 创建连接池，支持异步操作。
 * 连接参数从环境变量读取，提供合理的默认值。
 *
 * 使用示例：
 *   import { pool } from './db';
 *   const [rows] = await pool.query('SELECT * FROM samples');
 */

import 'dotenv/config';
import mysql, { Pool, PoolConnection } from 'mysql2/promise';

const pool: Pool = mysql.createPool({
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
pool.on('connection', (connection: PoolConnection) => {
  console.log('[DB] 新连接已建立, id:', connection.threadId);
});

// 验证连接是否可用
pool.getConnection()
  .then((conn: PoolConnection) => {
    console.log('[DB] 数据库连接成功');
    conn.release();
  })
  .catch((err: Error) => {
    console.error('[DB] 数据库连接失败:', err.message);
  });

export { pool };
