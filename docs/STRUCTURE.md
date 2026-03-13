# 目录结构说明

本文档说明插件模板示例项目的目录结构和各文件的职责。

## 项目总览

```
plugin-template-sample/
├── frontend/                  # 前端应用（Vue 3 + TypeScript + Element Plus）
├── backend/                   # 后端应用（Node.js + TypeScript + Express）
├── docs/                      # 项目文档
├── docker-compose.yml         # Docker 编排配置
├── plugins.json.example       # 主系统插件注册配置示例
├── README.md                  # 项目入口文档
└── LICENSE                    # 许可证
```

## 前端目录结构

```
frontend/
├── src/
│   ├── api/
│   │   └── index.ts              # API 请求封装（Axios 实例、拦截器、CRUD 方法）
│   ├── composables/
│   │   ├── usePermissions.ts     # 权限检查组合式函数（调用 Plugin Auth API）
│   │   ├── usePluginBridge.ts    # PostMessage 通信桥接（接收 INIT/TOKEN_UPDATE/DESTROY）
│   │   └── useTheme.ts          # 主题适配（从主系统接收并应用主题）
│   ├── i18n/
│   │   ├── index.ts             # Vue I18n 配置（支持 URL 参数切换语言）
│   │   └── locales/             # 语言文件目录
│   │       ├── zh-CN.ts         # 简体中文
│   │       ├── zh-TW.ts         # 繁体中文
│   │       ├── en-US.ts         # 英语
│   │       ├── ja-JP.ts         # 日语
│   │       └── th-TH.ts         # 泰语
│   ├── layout/
│   │   └── AppLayout.vue        # 应用布局组件（响应式布局、导航栏）
│   ├── router/
│   │   └── index.ts             # Vue Router 路由配置（列表页、创建页、编辑页）
│   ├── stores/
│   │   └── sample.ts            # Pinia 状态管理（示例数据的 CRUD 操作）
│   ├── styles/
│   │   └── index.css            # 全局样式（CSS 变量，适配 6 种主题）
│   ├── utils/
│   │   └── token.ts             # Token 管理工具（存储、获取、删除、过期检查）
│   ├── views/
│   │   ├── SampleList.vue       # 列表页（表格展示、分页、搜索、权限控制）
│   │   └── SampleForm.vue       # 表单页（创建/编辑模式、表单验证）
│   ├── App.vue                  # 根组件（初始化通信桥接和主题）
│   ├── main.ts                  # 应用入口（注册 Element Plus、Pinia、Router、I18n）
│   └── env.d.ts                 # TypeScript 环境类型声明
├── .env.example                 # 环境变量模板
├── .eslintrc.cjs                # ESLint 代码检查配置
├── .prettierrc.cjs              # Prettier 代码格式化配置
├── .vscode/settings.json        # VS Code 编辑器推荐配置
├── Dockerfile                   # 生产环境 Docker 镜像（多阶段构建 + Nginx）
├── index.html                   # HTML 入口页面
├── nginx.conf                   # Nginx 配置（SPA 路由支持）
├── package.json                 # 依赖和脚本配置
├── tsconfig.json                # TypeScript 编译配置
└── vite.config.ts               # Vite 构建工具配置
```

### 核心文件说明

| 文件 | 职责 |
|------|------|
| `api/index.ts` | 封装 Axios 实例，自动添加 JWT Token 到请求头，统一处理错误响应 |
| `composables/usePluginBridge.ts` | 处理与主系统的 PostMessage 通信，接收初始化消息、Token 更新和销毁事件 |
| `composables/usePermissions.ts` | 调用主后端 Plugin Auth API 检查用户权限，支持权限缓存 |
| `composables/useTheme.ts` | 从主系统接收主题信息，动态应用 CSS 变量实现主题切换 |
| `stores/sample.ts` | Pinia Store，管理示例数据的状态和 CRUD 操作 |
| `i18n/index.ts` | 配置 Vue I18n，从 URL 参数 `lang` 读取语言设置 |
| `utils/token.ts` | 管理 JWT Token 的存储、获取和过期检查 |

## 后端目录结构

```
backend/
├── src/
│   ├── __tests__/
│   │   ├── tokenService.test.ts     # Token 服务单元测试
│   │   ├── authMiddleware.test.ts   # 认证中间件单元测试
│   │   └── authRoutes.test.ts       # 认证路由单元测试
│   ├── middleware/
│   │   └── auth.ts                  # JWT 认证中间件（调用 Plugin Auth API 验证）
│   ├── routes/
│   │   ├── auth.ts                  # 认证路由（Token 刷新、登出）
│   │   └── samples.ts              # 示例功能 REST API 路由（CRUD 操作）
│   ├── types/
│   │   └── index.ts                 # 共享 TypeScript 类型定义
│   ├── utils/
│   │   └── pluginAuth.ts           # Plugin Auth API 客户端（验证 Token、检查权限）
│   ├── db.ts                       # MySQL 数据库连接池配置
│   ├── redis.ts                    # Redis 客户端连接配置
│   ├── tokenService.ts             # Refresh Token 服务（生成、验证、轮换、撤销）
│   └── index.ts                    # Express 应用入口（中间件注册、路由挂载、错误处理）
├── dist/                            # TypeScript 编译输出目录
├── .env.example                     # 环境变量模板
├── Dockerfile                       # 生产环境 Docker 镜像（多阶段构建）
├── jest.config.ts                   # Jest 测试配置
├── package.json                     # 依赖和脚本配置
└── tsconfig.json                    # TypeScript 编译配置
```

### 核心文件说明

| 文件 | 职责 |
|------|------|
| `index.ts` | Express 应用入口，配置 CORS、注册中间件和路由、启动 HTTP 服务 |
| `middleware/auth.ts` | 认证中间件，从请求头提取 JWT Token 并调用 Plugin Auth API 验证，将用户信息注入 `req.user` |
| `routes/auth.ts` | 认证路由，处理 Token 刷新和用户登出 |
| `routes/samples.ts` | 示例功能的 REST API，包含列表查询（分页/搜索）、创建、更新、删除操作 |
| `utils/pluginAuth.ts` | Plugin Auth API 客户端，封装 `verifyToken`、`checkPermission`、`getAllowedActions` 方法 |
| `types/index.ts` | 共享 TypeScript 类型定义，包含 User、AuthenticatedRequest、ApiResponse 等接口 |
| `tokenService.ts` | Refresh Token 服务，基于 Redis 实现 token 的生成、验证、轮换和撤销 |
| `db.ts` | MySQL 连接池配置，支持连接错误处理和自动重连 |
| `redis.ts` | Redis 客户端配置，支持连接错误处理 |

## 文档目录

```
docs/
├── I18N.md                      # 多语言实现指南（五种语言支持）
├── TESTING-I18N.md              # 多语言测试指南
├── STRUCTURE.md                 # 目录结构说明（本文档）
├── QUICK_START.md               # 快速开始指南
└── CONTRIBUTING.md              # 贡献指南
```

## 配置文件说明

### 环境变量

| 文件 | 说明 |
|------|------|
| `frontend/.env.example` | 前端环境变量模板：主后端 API 地址（`VITE_MAIN_API_URL`）、插件后端地址（`VITE_BACKEND_URL`）、开发端口（`VITE_PORT`） |
| `backend/.env.example` | 后端环境变量模板：服务端口、MySQL 连接信息、Redis 连接信息、主后端 API 地址、插件名称 |

### Docker 配置

| 文件 | 说明 |
|------|------|
| `docker-compose.yml` | 编排 4 个服务：前端（Nginx，端口 3003）、后端（Express，端口 8085）、MySQL（端口 3307 映射到 3306）、Redis（端口 6380 映射到 6379） |
| `frontend/Dockerfile` | 前端多阶段构建：先用 Node.js 构建静态文件，再用 Nginx 提供服务 |
| `frontend/nginx.conf` | Nginx 配置：静态文件服务 + SPA 路由回退 |
| `backend/Dockerfile` | 后端镜像：多阶段构建，TypeScript 编译 + Node.js 运行环境 |

### 插件注册

| 文件 | 说明 |
|------|------|
| `plugins.json.example` | 主系统插件注册配置示例，包含插件元数据（id、name、url、icon、权限等）的详细说明和字段注释 |

### 开发工具

| 文件 | 说明 |
|------|------|
| `frontend/tsconfig.json` | TypeScript 编译选项 |
| `frontend/vite.config.ts` | Vite 构建配置（代理、端口、别名等） |
| `frontend/.eslintrc.cjs` | ESLint 代码检查规则（Vue + TypeScript） |
| `frontend/.prettierrc.cjs` | Prettier 代码格式化规则 |
| `frontend/.vscode/settings.json` | VS Code 编辑器推荐设置（保存时自动格式化等） |
| `backend/tsconfig.json` | TypeScript 编译选项（strict 模式、ES2020 目标） |
| `backend/jest.config.ts` | Jest 测试配置（ts-jest 预设） |
