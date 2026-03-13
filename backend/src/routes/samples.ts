/**
 * 示例功能路由
 *
 * 实现简单的 CRUD 操作，展示插件后端的标准开发模式：
 * - GET    /api/samples      获取列表（支持分页、搜索）
 * - POST   /api/samples      创建记录
 * - PUT    /api/samples/:id   更新记录
 * - DELETE /api/samples/:id   删除记录
 *
 * 每个路由都通过 Plugin Auth API 检查权限，
 * 无权限时返回 403 错误。
 */

import { Router, Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import redis from '../redis';
import { checkPermission } from '../utils/pluginAuth';
import { AuthenticatedRequest, ValidationResult, CreateSampleBody, UpdateSampleBody } from '../types';

const router: Router = Router();
const CACHE_TTL = 300; // 缓存 5 分钟

// ========== 权限检查中间件工厂 ==========

/**
 * 创建权限检查中间件
 * @param action - 操作标识，如 'view-sample'
 * @returns Express 中间件
 */
function requirePermission(action: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    try {
      const allowed = await checkPermission(header as string, action);
      if (allowed) {
        next();
      } else {
        res.status(403).json({ error: '无权限执行此操作' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[Samples] 权限检查失败 (${action}):`, message);
      res.status(403).json({ error: '权限检查失败' });
    }
  };
}

// ========== 请求验证辅助函数 ==========

/**
 * 验证创建/更新请求体
 * @param body - 请求体
 * @param isUpdate - 是否为更新操作
 * @returns 验证结果
 */
export function validateSampleBody(body: CreateSampleBody | UpdateSampleBody, isUpdate = false): ValidationResult {
  const { name, description } = body as CreateSampleBody;

  // 创建时 name 必填
  if (!isUpdate && (name === undefined || name === null)) {
    return { valid: false, error: '名称不能为空' };
  }

  // 如果提供了 name，检查长度
  if (name !== undefined && name !== null) {
    const trimmed = String(name).trim();
    if (trimmed.length < 2) {
      return { valid: false, error: '名称至少需要 2 个字符' };
    }
    if (trimmed.length > 100) {
      return { valid: false, error: '名称不能超过 100 个字符' };
    }
  }

  // 如果提供了 description，检查长度
  if (description !== undefined && description !== null) {
    if (String(description).length > 500) {
      return { valid: false, error: '描述不能超过 500 个字符' };
    }
  }

  return { valid: true };
}

// ========== 缓存辅助函数 ==========

/**
 * 清除列表缓存
 */
async function clearListCache(): Promise<void> {
  try {
    // 使用 SCAN 查找匹配的 key（keyPrefix 已在 redis 配置中设置）
    const stream = redis.scanStream({ match: 'samples:list:*', count: 100 });
    const keysToDelete: string[] = [];
    for await (const keys of stream) {
      keysToDelete.push(...(keys as string[]));
    }
    if (keysToDelete.length > 0) {
      // ioredis 的 keyPrefix 会自动添加前缀，删除时需要去掉前缀
      const rawKeys = keysToDelete.map((k) => k.replace('plugin-tpl:', ''));
      await redis.del(...rawKeys);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('[Samples] 清除缓存失败:', message);
  }
}

// ========== 路由定义 ==========

/**
 * GET /api/samples
 * 获取示例列表（支持分页、搜索、Redis 缓存）
 *
 * 查询参数：
 * - page: 页码（默认 1）
 * - pageSize: 每页条数（默认 20，最大 100）
 * - keyword: 搜索关键词（按名称模糊匹配）
 */
router.get('/', requirePermission('view-sample'), async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const keyword = (req.query.keyword as string) || '';
    const offset = (page - 1) * pageSize;

    // 尝试从缓存读取
    const cacheKey = `samples:list:${page}:${pageSize}:${keyword}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // 构建查询条件
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (keyword) {
      where += ' AND name LIKE ?';
      params.push(`%${keyword}%`);
    }

    // 查询总数
    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM samples ${where}`,
      params
    );

    // 查询列表
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, description, status, created_by, created_at, updated_at
       FROM samples ${where}
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const result = {
      data: rows,
      pagination: {
        page,
        pageSize,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / pageSize),
      },
    };

    // 写入缓存
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));

    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Samples] 获取列表失败:', message);
    res.status(500).json({ error: '获取列表失败' });
  }
});

/**
 * POST /api/samples
 * 创建示例记录
 *
 * 请求体：
 * - name: 名称（必填，至少 2 个字符）
 * - description: 描述（可选）
 * - status: 状态（可选，默认 1）
 */
router.post('/', requirePermission('create-sample'), async (req: Request, res: Response) => {
  try {
    // 验证请求体
    const validation = validateSampleBody(req.body as CreateSampleBody, false);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, description = '', status = 1 } = req.body;
    const trimmedName = String(name).trim();
    const now = new Date();

    // 检查名称是否重复
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM samples WHERE name = ?',
      [trimmedName]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: '名称已存在' });
    }

    // 插入记录
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO samples (name, description, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [trimmedName, description, status, (req as AuthenticatedRequest).user.id, now, now]
    );

    // 清除列表缓存
    await clearListCache();

    // 返回新创建的记录
    const [newRow] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, description, status, created_by, created_at, updated_at FROM samples WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newRow[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Samples] 创建失败:', message);
    res.status(500).json({ error: '创建失败' });
  }
});

/**
 * PUT /api/samples/:id
 * 更新示例记录
 *
 * 请求体（至少提供一个字段）：
 * - name: 名称（至少 2 个字符）
 * - description: 描述
 * - status: 状态
 */
router.put('/:id', requirePermission('update-sample'), async (req: Request, res: Response) => {
  try {
    // 验证请求体
    const validation = validateSampleBody(req.body as UpdateSampleBody, true);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, description, status } = req.body;
    const updates: string[] = [];
    const params: unknown[] = [];

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      // 检查名称是否与其他记录重复
      const [existing] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM samples WHERE name = ? AND id != ?',
        [trimmedName, req.params.id]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: '名称已存在' });
      }
      updates.push('name = ?');
      params.push(trimmedName);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有要更新的字段' });
    }

    updates.push('updated_at = ?');
    params.push(new Date());
    params.push(req.params.id);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE samples SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    // 清除列表缓存
    await clearListCache();

    // 返回更新后的记录
    const [updatedRow] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, description, status, created_by, created_at, updated_at FROM samples WHERE id = ?',
      [req.params.id]
    );

    res.json(updatedRow[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Samples] 更新失败:', message);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * DELETE /api/samples/:id
 * 删除示例记录
 */
router.delete('/:id', requirePermission('delete-sample'), async (req: Request, res: Response) => {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM samples WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }

    // 清除列表缓存
    await clearListCache();

    res.json({ message: '删除成功' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Samples] 删除失败:', message);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;
