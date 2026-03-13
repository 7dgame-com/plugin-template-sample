/**
 * Plugin Auth API 客户端
 *
 * 封装对主后端 Plugin Auth API 的调用，提供：
 * - verifyToken: 验证 JWT Token 并获取用户信息
 * - checkPermission: 检查用户是否有权限执行特定操作
 * - getAllowedActions: 批量获取用户允许的操作列表
 *
 * 所有方法都包含错误处理和重试逻辑。
 *
 * API 端点（在主后端）：
 * - GET /v1/plugin/verify-token
 * - GET /v1/plugin/check-permission
 * - GET /v1/plugin/allowed-actions
 */

import axios, { AxiosError } from 'axios';
import { User } from '../types';

const MAIN_API_BASE: string = process.env.MAIN_API_URL || 'http://localhost:8091';
const PLUGIN_NAME: string = process.env.PLUGIN_NAME || 'plugin-template-sample';

// 默认重试配置
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY = 500; // 毫秒

/**
 * 带重试的请求封装
 * @param requestFn - 返回 Promise 的请求函数
 * @param retries - 最大重试次数
 * @param delay - 重试间隔（毫秒）
 */
async function withRetry<T>(requestFn: () => Promise<T>, retries: number = DEFAULT_RETRY_COUNT, delay: number = DEFAULT_RETRY_DELAY): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (err: unknown) {
      // 4xx 错误不重试（客户端错误，重试无意义）
      if (err instanceof AxiosError) {
        const status = err.response?.status;
        if (status && status >= 400 && status < 500) {
          throw err;
        }
      }
      // 最后一次尝试仍失败，抛出错误
      if (attempt === retries) {
        throw err;
      }
      console.warn(`[PluginAuth] 请求失败，${delay}ms 后第 ${attempt + 1} 次重试...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  // TypeScript 需要显式的不可达返回（循环保证会 return 或 throw）
  throw new Error('[PluginAuth] Unexpected: retry loop exited without result');
}

/**
 * 验证 JWT Token 并获取用户信息
 * @param authHeader - Authorization 请求头（Bearer xxx）
 * @returns 用户信息对象
 * @throws Token 无效或验证失败时抛出错误
 */
export async function verifyToken(authHeader: string): Promise<User> {
  const response = await withRetry(() =>
    axios.get(`${MAIN_API_BASE}/v1/plugin/verify-token`, {
      headers: { Authorization: authHeader },
    })
  );

  if (response.data.code === 0) {
    return response.data.data; // { id, username, nickname, roles }
  }

  throw new Error(response.data.message || '认证失败');
}

/**
 * 检查用户是否有权限执行特定操作
 * @param authHeader - Authorization 请求头（Bearer xxx）
 * @param action - 操作标识，如 'manage-samples'
 * @returns 是否有权限
 */
export async function checkPermission(authHeader: string, action: string): Promise<boolean> {
  try {
    const response = await withRetry(() =>
      axios.get(`${MAIN_API_BASE}/v1/plugin/check-permission`, {
        headers: { Authorization: authHeader },
        params: { plugin_name: PLUGIN_NAME, action },
      })
    );

    return response.data.code === 0 && response.data.data?.allowed === true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[PluginAuth] 权限检查失败:', message);
    return false;
  }
}

/**
 * 批量获取用户允许的操作列表
 * @param authHeader - Authorization 请求头（Bearer xxx）
 * @returns 允许的操作列表
 */
export async function getAllowedActions(authHeader: string): Promise<string[]> {
  try {
    const response = await withRetry(() =>
      axios.get(`${MAIN_API_BASE}/v1/plugin/allowed-actions`, {
        headers: { Authorization: authHeader },
        params: { plugin_name: PLUGIN_NAME },
      })
    );

    if (response.data.code === 0) {
      return response.data.data?.actions || [];
    }

    return [];
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[PluginAuth] 获取允许操作列表失败:', message);
    return [];
  }
}
