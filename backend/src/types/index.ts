import { Request } from 'express';

// ========== 用户与认证 ==========

export interface User {
  id: number;
  username: string;
  nickname: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

// ========== API 响应 ==========

export interface ApiResponse<T = unknown> {
  code: number;
  data?: T;
  message?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ========== Token 服务 ==========

export interface TokenMetadata {
  userId: string;
  createdAt: string;
  expiresAt: string;
}

// ========== 数据模型 ==========

export interface Sample {
  id: number;
  name: string;
  description: string;
  status: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSampleBody {
  name: string;
  description?: string;
  status?: number;
}

export interface UpdateSampleBody {
  name?: string;
  description?: string;
  status?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ========== 健康检查 ==========

export interface HealthStatus {
  status: 'ok' | 'error';
  version: string;
  db?: string;
  redis?: string;
  message?: string;
}
