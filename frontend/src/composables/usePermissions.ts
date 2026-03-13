import { ref, readonly } from 'vue'
import axios, { AxiosInstance } from 'axios'
import { getToken } from '../utils/token'

/**
 * 权限检查组合式函数
 * Permissions Check Composable
 * 
 * 功能特性 / Features:
 * - 调用主后端 Plugin Auth API 检查权限 / Call main backend Plugin Auth API to check permissions
 * - 支持单个权限检查 / Support single permission check
 * - 支持批量获取允许的操作 / Support batch fetching of allowed actions
 * - 权限结果缓存 / Cache permission results
 * - 自动处理认证错误 / Auto-handle authentication errors
 * 
 * API 参考 / API Reference:
 * - GET /v1/plugin/check-permission - 检查单个权限 / Check single permission
 * - GET /v1/plugin/allowed-actions - 批量获取允许的操作 / Batch get allowed actions
 * 
 * 详见 / See: web/docs/plugin-auth-api-reference.md
 */

// 插件标识 - 需要与主系统中注册的插件名称一致
// Plugin identifier - must match the plugin name registered in the main system
const PLUGIN_NAME = 'plugin-template-sample'

// 主后端 API 基础地址
// Main backend API base URL
const MAIN_API_URL = import.meta.env.VITE_MAIN_API_URL || 'http://localhost:8082'

// 创建独立的 Axios 实例用于调用主后端 API
// Create separate Axios instance for calling main backend API
const mainApi: AxiosInstance = axios.create({
  baseURL: `${MAIN_API_URL}/v1/plugin`,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：添加 JWT Token
// Request interceptor: Add JWT token
mainApi.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 权限缓存
 * Permission cache
 * 
 * 存储格式 / Storage format:
 * {
 *   'action-name': true/false,
 *   ...
 * }
 */
const permissionCache = ref<Record<string, boolean>>({})

/**
 * 允许的操作列表缓存
 * Allowed actions list cache
 */
const allowedActions = ref<string[]>([])

/**
 * 是否已加载权限
 * Whether permissions have been loaded
 */
const loaded = ref(false)

/**
 * 是否正在加载权限
 * Whether permissions are being loaded
 */
const loading = ref(false)

/**
 * 权限检查组合式函数
 * Permissions check composable function
 */
export function usePermissions() {
  /**
   * 检查单个权限
   * Check single permission
   * 
   * @param action 操作标识 / Action identifier (e.g., 'view-sample', 'create-sample')
   * @returns Promise<boolean> 是否有权限 / Whether has permission
   * 
   * 示例 / Example:
   * ```ts
   * const { checkPermission } = usePermissions()
   * const canCreate = await checkPermission('create-sample')
   * if (canCreate) {
   *   // 执行创建操作 / Perform create operation
   * }
   * ```
   */
  async function checkPermission(action: string): Promise<boolean> {
    // 如果缓存中已有结果，直接返回
    // If result exists in cache, return directly
    if (action in permissionCache.value) {
      return permissionCache.value[action]
    }

    try {
      const response = await mainApi.get('/check-permission', {
        params: {
          plugin_name: PLUGIN_NAME,
          action: action
        }
      })

      // 检查响应格式
      // Check response format
      if (response.data.code === 0 && response.data.data) {
        const allowed = response.data.data.allowed === true
        // 缓存结果
        // Cache result
        permissionCache.value[action] = allowed
        return allowed
      }

      // 响应格式不正确，默认无权限
      // Response format incorrect, default to no permission
      permissionCache.value[action] = false
      return false
    } catch (error) {
      // API 调用失败，默认无权限
      // API call failed, default to no permission
      console.error(`[usePermissions] Failed to check permission for action: ${action}`, error)
      permissionCache.value[action] = false
      return false
    }
  }

  /**
   * 批量获取允许的操作列表
   * Batch fetch allowed actions list
   * 
   * 调用主后端的 /v1/plugin/allowed-actions API
   * Call main backend's /v1/plugin/allowed-actions API
   * 
   * 该方法会缓存结果，避免重复调用
   * This method caches results to avoid repeated calls
   * 
   * @returns Promise<string[]> 允许的操作列表 / List of allowed actions
   * 
   * 示例 / Example:
   * ```ts
   * const { fetchAllowedActions, can } = usePermissions()
   * await fetchAllowedActions()
   * if (can('create-sample')) {
   *   // 执行创建操作 / Perform create operation
   * }
   * ```
   */
  async function fetchAllowedActions(): Promise<string[]> {
    // 如果已加载或正在加载，避免重复请求
    // If already loaded or loading, avoid duplicate requests
    if (loaded.value || loading.value) {
      return allowedActions.value
    }

    loading.value = true

    try {
      const response = await mainApi.get('/allowed-actions', {
        params: {
          plugin_name: PLUGIN_NAME
        }
      })

      // 检查响应格式
      // Check response format
      if (response.data.code === 0 && response.data.data && Array.isArray(response.data.data.actions)) {
        const actions = response.data.data.actions
        allowedActions.value = actions

        // 更新权限缓存
        // Update permission cache
        // 清空现有缓存 / Clear existing cache
        permissionCache.value = {}
        // 将所有允许的操作标记为 true / Mark all allowed actions as true
        actions.forEach((action: string) => {
          permissionCache.value[action] = true
        })

        loaded.value = true
        return actions
      }

      // 响应格式不正确，返回空数组
      // Response format incorrect, return empty array
      console.error('[usePermissions] Invalid response format from allowed-actions API')
      allowedActions.value = []
      loaded.value = true
      return []
    } catch (error) {
      // API 调用失败，返回空数组
      // API call failed, return empty array
      console.error('[usePermissions] Failed to fetch allowed actions', error)
      allowedActions.value = []
      loaded.value = true
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * 检查是否有指定权限（基于缓存）
   * Check if has specified permission (based on cache)
   * 
   * 注意：使用此方法前需要先调用 fetchAllowedActions()
   * Note: Must call fetchAllowedActions() before using this method
   * 
   * @param action 操作标识 / Action identifier
   * @returns boolean 是否有权限 / Whether has permission
   * 
   * 示例 / Example:
   * ```ts
   * const { fetchAllowedActions, can } = usePermissions()
   * await fetchAllowedActions()
   * if (can('create-sample')) {
   *   // 显示创建按钮 / Show create button
   * }
   * ```
   */
  function can(action: string): boolean {
    return permissionCache.value[action] === true
  }

  /**
   * 检查是否有任意权限
   * Check if has any permission
   * 
   * @returns boolean 是否有任意权限 / Whether has any permission
   * 
   * 示例 / Example:
   * ```ts
   * const { fetchAllowedActions, hasAny } = usePermissions()
   * await fetchAllowedActions()
   * if (!hasAny()) {
   *   // 显示无权限提示 / Show no permission message
   * }
   * ```
   */
  function hasAny(): boolean {
    return allowedActions.value.length > 0
  }

  /**
   * 清除权限缓存
   * Clear permission cache
   * 
   * 用于用户登出或切换用户时清除缓存
   * Used to clear cache when user logs out or switches user
   * 
   * 示例 / Example:
   * ```ts
   * const { clearCache } = usePermissions()
   * clearCache()
   * ```
   */
  function clearCache(): void {
    permissionCache.value = {}
    allowedActions.value = []
    loaded.value = false
    loading.value = false
  }

  /**
   * 重新加载权限
   * Reload permissions
   * 
   * 强制重新从服务器获取权限信息
   * Force reload permission information from server
   * 
   * 示例 / Example:
   * ```ts
   * const { reloadPermissions } = usePermissions()
   * await reloadPermissions()
   * ```
   */
  async function reloadPermissions(): Promise<string[]> {
    clearCache()
    return await fetchAllowedActions()
  }

  return {
    // 状态 / State
    permissions: readonly(permissionCache),
    allowedActions: readonly(allowedActions),
    loaded: readonly(loaded),
    loading: readonly(loading),

    // 方法 / Methods
    checkPermission,
    fetchAllowedActions,
    can,
    hasAny,
    clearCache,
    reloadPermissions
  }
}
