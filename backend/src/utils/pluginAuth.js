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

const axios = require('axios');

const MAIN_API_BASE = process.env.MAIN_API_URL || 'http://localhost:8091';
const PLUGIN_NAME = process.env.PLUGIN_NAME || 'plugin-template-sample';

// 默认重试配置
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY = 500; // 毫秒

/**
 * 带重试的请求封装
 * @param {Function} requestFn - 返回 Promise 的请求函数
 * @param {number} retries - 最大重试次数
 * @param {number} delay - 重试间隔（毫秒）
 * @returns {Promise<any>}
 */
async function withRetry(requestFn, retries = DEFAULT_RETRY_COUNT, delay = DEFAULT_RETRY_DELAY) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await requestFn();
    } catch (err) {
      // 4xx 错误不重试（客户端错误，重试无意义）
      const status = err.response?.status;
      if (status && status >= 400 && status < 500) {
        throw err;
      }
      // 最后一次尝试仍失败，抛出错误
      if (attempt === retries) {
        throw err;
      }
      console.warn(`[PluginAuth] 请求失败，${delay}ms 后第 ${attempt + 1} 次重试...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * 验证 JWT Token 并获取用户信息
 * @param {string} authHeader - Authorization 请求头（Bearer xxx）
 * @returns {Promise<{id: number, username: string, nickname: string, roles: string[]}>}
 * @throws {Error} Token 无效或验证失败时抛出错误
 */
async function verifyToken(authHeader) {
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
 * @param {string} authHeader - Authorization 请求头（Bearer xxx）
 * @param {string} action - 操作标识，如 'manage-samples'
 * @returns {Promise<boolean>} 是否有权限
 */
async function checkPermission(authHeader, action) {
  try {
    const response = await withRetry(() =>
      axios.get(`${MAIN_API_BASE}/v1/plugin/check-permission`, {
        headers: { Authorization: authHeader },
        params: { plugin_name: PLUGIN_NAME, action },
      })
    );

    return response.data.code === 0 && response.data.data?.allowed === true;
  } catch (err) {
    console.error('[PluginAuth] 权限检查失败:', err.message);
    return false;
  }
}

/**
 * 批量获取用户允许的操作列表
 * @param {string} authHeader - Authorization 请求头（Bearer xxx）
 * @returns {Promise<string[]>} 允许的操作列表
 */
async function getAllowedActions(authHeader) {
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
  } catch (err) {
    console.error('[PluginAuth] 获取允许操作列表失败:', err.message);
    return [];
  }
}

module.exports = { verifyToken, checkPermission, getAllowedActions };
