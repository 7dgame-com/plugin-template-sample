import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import {
  getToken, setToken, removeToken, removeAllTokens,
  getRefreshToken, setRefreshToken,
  isInIframe, requestParentTokenRefresh
} from '../utils/token'

/**
 * API 请求封装
 *
 * 功能特性：
 * - 自动添加 JWT Token 到请求头
 * - 401 时自动尝试刷新 token 并重试原始请求
 *   - iframe 模式：先请求主框架刷新，超时后回退到本地 refresh token
 *   - 独立模式：直接使用本地 refresh token
 * - 刷新彻底失败时通知主框架 TOKEN_EXPIRED
 */

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// 防止并发刷新
let isRefreshing = false
let pendingRequests: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processPendingRequests(token: string | null, error?: unknown) {
  for (const req of pendingRequests) {
    if (token) {
      req.resolve(token)
    } else {
      req.reject(error || new Error('Token refresh failed'))
    }
  }
  pendingRequests = []
}

/**
 * 尝试刷新 token
 * iframe 模式下先请求主框架，超时后回退到本地 refresh token
 */
async function tryRefreshToken(): Promise<string | null> {
  // 1. iframe 模式：先尝试主框架刷新
  if (isInIframe()) {
    const result = await requestParentTokenRefresh()
    if (result?.accessToken) {
      setToken(result.accessToken)
      if (result.refreshToken) {
        setRefreshToken(result.refreshToken)
      }
      return result.accessToken
    }
    // 主框架超时，回退到本地刷新
  }

  // 2. 本地 refresh token 刷新
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const res = await axios.post('/api/auth/refresh', { refreshToken })
    const { accessToken, refreshToken: newRefreshToken } = res.data
    setToken(accessToken)
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken)
    }
    return accessToken
  } catch {
    return null
  }
}

/**
 * 请求拦截器：自动添加 JWT Token
 * 同时从响应头中提取 X-Refresh-Token（首次认证时后端自动生成）
 */
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * 响应拦截器：处理 X-Refresh-Token 响应头 + 401 自动刷新重试
 */
api.interceptors.response.use(
  (response) => {
    // 从响应头提取 refresh token（首次认证时后端自动生成）
    const refreshToken = response.headers['x-refresh-token']
    if (refreshToken) {
      setRefreshToken(refreshToken)
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        // 已有刷新在进行中，排队等待
        return new Promise((resolve, reject) => {
          pendingRequests.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(api(originalRequest))
            },
            reject
          })
        })
      }

      isRefreshing = true
      try {
        const newToken = await tryRefreshToken()
        if (newToken) {
          processPendingRequests(newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }

        // 刷新彻底失败
        processPendingRequests(null, error)
        removeAllTokens()
        if (isInIframe()) {
          window.parent.postMessage({ type: 'TOKEN_EXPIRED' }, '*')
        }
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

/**
 * 示例功能 API 方法
 */

export interface SampleItem {
  id?: number
  name: string
  description?: string
  status?: 'active' | 'inactive'
  created_at?: string
  updated_at?: string
}

export interface SampleListResponse {
  data: SampleItem[]
  total: number
  page: number
  pageSize: number
}

export const getSampleList = (params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
}) => api.get<SampleListResponse>('/samples', { params })

export const getSampleDetail = (id: number) =>
  api.get<SampleItem>(`/samples/${id}`)

export const createSample = (data: SampleItem) =>
  api.post<SampleItem>('/samples', data)

export const updateSample = (id: number, data: Partial<SampleItem>) =>
  api.put<SampleItem>(`/samples/${id}`, data)

export const deleteSample = (id: number) =>
  api.delete(`/samples/${id}`)

export const batchDeleteSamples = (ids: number[]) =>
  api.post('/samples/batch-delete', { ids })

export default api
