# 插件模板示例（Plugin Template Sample）

通用插件开发模板，从 `user-management` 插件提取核心架构和模式，作为开发新插件的起点。包含完整的前后端分离示例（CRUD）、多语言支持（5 种语言）、6 种主题适配和完善的文档体系。

## 目录

- [插件架构选项](#插件架构选项)
- [快速开始](#快速开始)
- [目录结构](#目录结构)
- [现有文档资源](#现有文档资源)
- [技术文档](#技术文档)
- [设计系统](#设计系统)
- [设计系统集成](#设计系统集成)
- [多语言支持](#多语言支持)
- [参考实现](#参考实现)
- [配置说明](#配置说明)
- [部署指南](#部署指南)
- [最佳实践](#最佳实践)
- [贡献指南](#贡献指南)

---

## 插件架构选项

插件系统支持两种架构模式，开发者可根据需求选择：

### 纯前端插件（Frontend_Only_Plugin）

只包含前端代码，不需要独立后端服务。通过主后端的 Plugin Auth API 进行身份验证和权限验证。

**适用场景：**
- 简单的 UI 功能、数据展示
- 客户端交互（计算器、可视化工具等）
- 不需要独立数据存储
- 不需要复杂的服务端业务逻辑

**参考实现：** [`plugins/counter-plugin`](../counter-plugin/)

### 前后端分离插件（Full_Stack_Plugin）

包含独立的前端和后端服务，后端可以有自己的数据库。后端通过调用主后端的 Plugin Auth API 来验证身份和权限。

**适用场景：**
- 需要复杂业务逻辑
- 需要独立数据存储（MySQL、Redis 等）
- 需要第三方服务集成
- 需要后端定时任务或异步处理

**参考实现：** [`plugins/user-management`](../user-management/)

### 如何选择？

| 考虑因素 | Frontend_Only_Plugin | Full_Stack_Plugin |
|---------|---------------------|-------------------|
| 是否需要独立数据库 | ❌ 不需要 | ✅ 需要 |
| 是否需要服务端逻辑 | ❌ 不需要 | ✅ 需要 |
| 部署复杂度 | 低（仅前端静态文件） | 中（前端 + 后端 + 数据库） |
| 开发周期 | 短 | 中 |
| 技术栈 | Vue 3 + TypeScript | Vue 3 + Node.js + MySQL |

> **本模板以 Full_Stack_Plugin 为主要示例。** 如需创建纯前端插件，可删除 `backend/` 目录并简化 `docker-compose.yml`，详见 [docs/QUICK_START.md](docs/QUICK_START.md) 中的"纯前端插件"章节。

### 主后端插件 API

所有插件的身份验证和权限验证都通过主后端（Yii2）提供的 Plugin Auth API 完成：

| API | 说明 |
|-----|------|
| `GET /v1/plugin/verify-token` | 验证 JWT Token 并获取用户信息 |
| `GET /v1/plugin/check-permission` | 检查用户是否有权限执行特定操作 |
| `GET /v1/plugin/allowed-actions` | 批量获取用户允许的操作列表 |
| `POST /v1/plugin/refresh-token` | 为插件用户刷新 access token |

### Token 刷新机制

本模板内置了完整的 token 刷新机制，当 access token 过期时自动刷新，无需用户重新登录。

**刷新流程：**
1. 前端 API 请求收到 401 → 触发刷新
2. iframe 模式下先通过 `postMessage` 请求主框架刷新（3 秒超时）
3. 超时或独立模式下，使用本地 refresh token 调用插件后端 `POST /api/auth/refresh`
4. 插件后端调用主后端 `POST /v1/plugin/refresh-token` 获取新 access token
5. 旧 refresh token 轮换失效，返回新的 token 对
6. 刷新彻底失败时发送 `TOKEN_EXPIRED` 通知主框架

**安全特性：**
- Refresh token 以 SHA-256 哈希存储在 Redis，原始值不落盘
- Token 轮换（rotation）：每次刷新后旧 token 立即失效
- 重放攻击检测：已使用的 token 再次出现时撤销该用户所有 token
- 速率限制：每用户每分钟最多 10 次刷新（可配置）

**相关文件：**
- 后端：`backend/src/tokenService.js`、`backend/src/routes/auth.js`
- 前端：`frontend/src/utils/token.ts`（`requestParentTokenRefresh`）、`frontend/src/api/index.ts`（401 自动重试）

**关键原则：**
- 插件不需要直接访问主数据库的用户表或权限表
- 插件不需要自己实现 JWT 验证逻辑
- 所有认证授权通过主后端 API 完成

---

## 快速开始

详细的分步教程请参考 📖 [docs/QUICK_START.md](docs/QUICK_START.md)

**快速预览：**

```bash
# 1. 复制模板
cp -r plugins/plugin-template-sample plugins/my-plugin

# 2. 安装前端依赖
cd plugins/my-plugin/frontend && npm install

# 3. 配置环境变量
cp .env.example .env

# 4. 启动开发服务器
npm run dev

# 5. 在主系统 plugins.json 中注册插件
```

---

## 目录结构

详细的目录结构和文件职责说明请参考 📖 [docs/STRUCTURE.md](docs/STRUCTURE.md)

**项目总览：**

```
plugin-template-sample/
├── frontend/                  # 前端应用（Vue 3 + TypeScript + Element Plus + Vite 7）
│   ├── src/
│   │   ├── api/               # API 请求封装（Axios + 拦截器 + 401 自动刷新重试）
│   │   ├── composables/       # 组合式函数（通信桥接、权限、主题）
│   │   ├── i18n/              # 国际化（5 种语言）
│   │   ├── layout/            # 布局组件
│   │   ├── router/            # 路由配置
│   │   ├── stores/            # Pinia 状态管理
│   │   ├── styles/            # 全局样式（CSS 变量）
│   │   ├── utils/             # 工具函数（Token 管理 + Refresh Token）
│   │   └── views/             # 页面组件（列表、表单）
│   └── ...                    # 配置文件（Vite、TS、ESLint、Prettier）
├── backend/                   # 后端应用（Node.js + Express）
│   └── src/
│       ├── middleware/         # 认证中间件（含 refresh token 自动生成）
│       ├── routes/            # REST API 路由（samples + auth/refresh + auth/logout）
│       ├── utils/             # Plugin Auth API 客户端
│       └── ...                # 数据库、Redis 连接
├── docs/                      # 📚 模板特定文档
│   ├── QUICK_START.md         # 快速开始指南
│   ├── STRUCTURE.md           # 目录结构说明
│   ├── I18N.md                # 多语言实现指南
│   ├── TESTING-I18N.md        # 多语言测试指南
│   └── CONTRIBUTING.md        # 贡献指南
├── docker-compose.yml         # Docker 编排配置
├── plugins.json.example       # 插件注册配置示例
├── README.md                  # 📖 本文档（入口）
└── LICENSE                    # MIT 许可证
```

---

## 现有文档资源

本模板采用"引用 > 改编 > 创建"的文档策略，避免重复维护。

### 📌 引用主系统文档（无需维护）

以下文档由主系统维护，模板直接引用：

| 类别 | 文档 | 路径（相对于插件根目录） |
|------|------|------------------------|
| 技术文档 | 插件开发指南 | [`../../web/docs/plugin-development-guide.md`](../../web/docs/plugin-development-guide.md) |
| 技术文档 | 认证授权 API 使用指南 | [`../../web/docs/plugin-auth-api-usage.md`](../../web/docs/plugin-auth-api-usage.md) |
| 技术文档 | 认证授权 API 参考 | [`../../web/docs/plugin-auth-api-reference.md`](../../web/docs/plugin-auth-api-reference.md) |
| 设计系统 | 设计系统索引 | [`../../web/docs/DESIGN_SYSTEM_INDEX.md`](../../web/docs/DESIGN_SYSTEM_INDEX.md) |
| 设计系统 | 完整设计指南 | [`../../web/docs/plugin-design-guide.md`](../../web/docs/plugin-design-guide.md) |
| 设计系统 | 设计快速参考 | [`../../web/docs/plugin-design-quick-reference.md`](../../web/docs/plugin-design-quick-reference.md) |

### 📝 模板特定文档（需要维护）

以下文档是模板自身的，基于 `user-management` 插件改编或全新创建：

| 文档 | 路径 | 说明 |
|------|------|------|
| 快速开始指南 | [`docs/QUICK_START.md`](docs/QUICK_START.md) | 30 分钟内创建并运行新插件 |
| 目录结构说明 | [`docs/STRUCTURE.md`](docs/STRUCTURE.md) | 文件组织方式和职责说明 |
| 多语言实现指南 | [`docs/I18N.md`](docs/I18N.md) | 基于 user-management 改编的通用版 |
| 多语言测试指南 | [`docs/TESTING-I18N.md`](docs/TESTING-I18N.md) | 基于 user-management 改编的通用版 |
| 贡献指南 | [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | 代码规范、提交规范、PR 流程 |

---

## 技术文档

插件开发的核心技术文档由主系统维护，请直接参考：

| 文档 | 说明 | 链接 |
|------|------|------|
| 插件开发指南 | 完整的插件开发流程、架构说明、通信协议 | [plugin-development-guide.md](../../web/docs/plugin-development-guide.md) |
| 认证授权 API 使用指南 | 如何在插件中集成认证和权限验证 | [plugin-auth-api-usage.md](../../web/docs/plugin-auth-api-usage.md) |
| 认证授权 API 参考 | API 接口详细参数和响应格式 | [plugin-auth-api-reference.md](../../web/docs/plugin-auth-api-reference.md) |

---

## 设计系统

插件的视觉设计必须与主系统保持一致。设计系统文档由主系统维护：

| 文档 | 说明 | 链接 |
|------|------|------|
| 设计系统索引 | 设计系统总览和导航 | [DESIGN_SYSTEM_INDEX.md](../../web/docs/DESIGN_SYSTEM_INDEX.md) |
| 完整设计指南 | 颜色、排版、间距、组件等完整规范 | [plugin-design-guide.md](../../web/docs/plugin-design-guide.md) |
| 设计快速参考 | 常用 CSS 变量和组件速查表 | [plugin-design-quick-reference.md](../../web/docs/plugin-design-quick-reference.md) |

---

## 设计系统集成

本章节说明如何在插件中正确集成主系统的设计系统，确保视觉一致性。

### CSS 变量（核心原则）

**永远使用 CSS 变量，不要硬编码颜色值。** 这是确保插件在所有主题下正确显示的关键。

```css
/* ✅ 正确 - 使用 CSS 变量 */
.my-card {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.my-button {
  background: var(--primary-color);
  color: var(--text-inverse);
  transition: all var(--transition-fast);
}

/* ❌ 错误 - 硬编码颜色 */
.my-card {
  background: #ffffff;
  color: #333333;
  border: 1px solid #e4e7ed;
}
```

**常用 CSS 变量速查：**

| 类别 | 变量 | 说明 |
|------|------|------|
| 主色 | `--primary-color` | 主题主色调 |
| 主色悬停 | `--primary-hover` | 主色悬停状态 |
| 文字 | `--text-primary` | 主要文字颜色 |
| 文字 | `--text-secondary` | 次要文字颜色 |
| 文字 | `--text-muted` | 辅助/禁用文字 |
| 背景 | `--bg-page` | 页面背景 |
| 背景 | `--bg-card` | 卡片/面板背景 |
| 背景 | `--bg-hover` | 悬停状态背景 |
| 边框 | `--border-color` | 默认边框颜色 |
| 语义 | `--success-color` | 成功状态 |
| 语义 | `--warning-color` | 警告状态 |
| 语义 | `--danger-color` | 危险/错误状态 |

完整变量列表参见 [`frontend/src/styles/index.css`](frontend/src/styles/index.css)。

### 图标系统

使用 Element Plus Icons，与主系统保持一致：

```vue
<script setup lang="ts">
import { Edit, Delete, Plus, Search } from '@element-plus/icons-vue'
</script>

<template>
  <!-- 按钮图标 -->
  <el-button type="primary" :icon="Plus">添加</el-button>
  
  <!-- 独立图标 -->
  <el-icon><Search /></el-icon>
  
  <!-- 表格操作列 -->
  <el-button link type="primary" :icon="Edit" />
  <el-button link type="danger" :icon="Delete" />
</template>
```

图标列表参考：[Element Plus Icons](https://element-plus.org/zh-CN/component/icon.html)

### 动画和过渡效果

使用 CSS 变量定义的过渡时间，确保动画节奏一致：

```css
/* 过渡变量 */
--transition-fast: 0.15s ease;    /* 按钮悬停、输入框聚焦 */
--transition-normal: 0.2s ease;   /* 卡片悬停、面板展开 */
--transition-slow: 0.3s ease;     /* 页面切换、模态框 */
```

```css
/* 示例：卡片悬停效果 */
.card {
  transition: all var(--transition-normal);
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

```vue
<!-- Vue 过渡动画 -->
<Transition name="fade">
  <div v-if="visible">内容</div>
</Transition>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 阴影系统

三级阴影层次，用于表达元素的层级关系：

```css
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);   /* 卡片默认状态 */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);   /* 卡片悬停、下拉菜单 */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);   /* 模态框、弹出层 */
```

> 暗色主题下阴影会自动加深（通过 `[data-theme="dark"]` 选择器覆盖）。

### 圆角系统

统一的圆角规范，营造柔和的视觉风格：

```css
--radius-sm: 12px;      /* 按钮、输入框、小卡片 */
--radius-md: 20px;      /* 卡片、面板 */
--radius-lg: 24px;      /* 大面板、对话框 */
--radius-full: 9999px;  /* 圆形按钮、徽章 */
```

```css
/* 示例 */
.btn { border-radius: var(--radius-sm); }
.card { border-radius: var(--radius-md); }
.badge { border-radius: var(--radius-full); }
```

### 主题适配

本模板支持主系统的 6 种主题：

| 主题 | 标识 | 风格 | 明/暗 |
|------|------|------|-------|
| 科技蓝 | `modern-blue` | 现代简洁 | 亮色（默认） |
| 深空蓝 | `deep-space` | 专业沉浸 | 暗色 |
| 赛博霓虹 | `cyber-tech` | 未来感 | 暗色 |
| 活力橙 | `edu-friendly` | 温暖友好 | 亮色 |
| 大胆黄 | `neo-brutalism` | 艺术风格 | 亮色 |
| 极简黑白 | `minimal-pure` | 专注 | 亮色 |

主题通过 `useTheme` 组合式函数自动适配：

```typescript
import { useTheme } from '@/composables/useTheme'

const { isDark, themeName } = useTheme()
// isDark: 是否为暗色主题（deep-space、cyber-tech）
// themeName: 当前主题标识
```

**确保视觉一致性的关键：**
1. 所有颜色使用 CSS 变量
2. `[data-theme="dark"]` 选择器自动覆盖暗色主题变量
3. Element Plus 组件通过 `--el-*` 变量覆盖自动适配
4. 测试时切换所有 6 种主题验证显示效果

### 设计系统集成检查清单

开发插件时，请逐项检查：

- [ ] 所有颜色使用 CSS 变量（`var(--xxx)`），无硬编码颜色值
- [ ] 所有圆角使用 `var(--radius-*)`
- [ ] 所有阴影使用 `var(--shadow-*)`
- [ ] 所有过渡动画使用 `var(--transition-*)`
- [ ] 所有间距使用 `var(--spacing-*)`
- [ ] 所有字体大小使用 `var(--font-size-*)`
- [ ] 图标使用 Element Plus Icons
- [ ] 已导入 `styles/index.css` 全局样式
- [ ] 已集成 `useTheme` 组合式函数
- [ ] 在 6 种主题下测试通过（特别是暗色主题）

### 设计审查标准清单

提交代码前，请确认以下设计标准：

- [ ] 页面布局与主系统风格一致
- [ ] 卡片、表格、表单等组件使用统一的圆角和阴影
- [ ] 按钮样式遵循主色调规范
- [ ] 文字层级清晰（primary > secondary > muted）
- [ ] 状态颜色使用语义色（success/warning/danger/info）
- [ ] 暗色主题下文字可读性良好
- [ ] 暗色主题下边框和分割线可见
- [ ] 响应式布局在不同屏幕尺寸下正常显示
- [ ] 空状态和加载状态有合适的视觉反馈
- [ ] 交互元素有明确的悬停和聚焦状态

---

## 多语言支持

本模板已实现完整的 5 种语言支持：zh-CN（简体中文）、zh-TW（繁体中文）、en-US（英语）、ja-JP（日语）、th-TH（泰语）。

| 文档 | 说明 | 链接 |
|------|------|------|
| 多语言实现指南 | 语言文件结构、URL 参数切换、组件中使用翻译 | [docs/I18N.md](docs/I18N.md) |
| 多语言测试指南 | 测试方法、检查清单、常见问题排查 | [docs/TESTING-I18N.md](docs/TESTING-I18N.md) |

---

## 参考实现

| 插件 | 类型 | 说明 | 路径 |
|------|------|------|------|
| user-management | Full_Stack_Plugin | 完整的用户管理 CRUD 插件，包含多语言、权限控制、Docker 部署 | [`../user-management/`](../user-management/) |
| counter-plugin | Frontend_Only_Plugin | 最简单的纯前端插件示例，无独立后端 | [`../counter-plugin/`](../counter-plugin/) |

---

## 配置说明

### 环境变量

**前端** (`frontend/.env`)：

```dotenv
# 主后端 API 地址（用于认证授权）
VITE_MAIN_API_URL=http://localhost:8082

# 插件后端 API 地址（仅 Full_Stack_Plugin 需要）
VITE_BACKEND_URL=http://localhost:8085

# 开发服务器端口
VITE_PORT=3004
```

**后端** (`backend/.env`)：

```dotenv
# 服务端口
PORT=8085

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=plugin_template
DB_USER=root
DB_PASSWORD=your_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=2

# 主后端 API 地址（用于调用 Plugin Auth API）
MAIN_API_URL=http://localhost:8082
PLUGIN_NAME=my-plugin-name
```

> **Frontend_Only_Plugin** 只需要配置 `VITE_MAIN_API_URL`，不需要后端相关配置。

### 插件注册配置

将插件注册到主系统的 `web/public/config/plugins.json`：

```json
{
  "id": "my-plugin",
  "name": "我的插件",
  "description": "插件功能描述",
  "url": "http://localhost:3004",
  "icon": "Document",
  "group": "tools",
  "enabled": true,
  "order": 10,
  "allowedOrigin": "http://localhost:3004",
  "version": "1.0.0",
  "extraConfig": {
    "apiBaseUrl": "http://localhost:8085/api"
  }
}
```

> `extraConfig.apiBaseUrl` 仅 Full_Stack_Plugin 需要。详细字段说明参见 [`plugins.json.example`](plugins.json.example)。

---

## 部署指南

### Docker 部署（推荐）

```bash
# 启动所有服务（前端 + 后端 + MySQL + Redis）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

**服务端口映射：**

| 服务 | 容器端口 | 宿主机端口 |
|------|---------|-----------|
| 前端（Nginx） | 80 | 3003 |
| 后端（Express） | 8085 | 8085 |
| MySQL | 3306 | 3307 |
| Redis | 6379 | 6380 |

### 纯前端插件部署

如果是 Frontend_Only_Plugin，只需部署前端静态文件：

```bash
# 构建
cd frontend && npm run build

# 使用 Nginx 或任意静态文件服务器托管 dist/ 目录
```

### 生产环境注意事项

1. 修改 `docker-compose.yml` 中的数据库密码
2. 修改 `plugins.json` 中的 `url` 和 `allowedOrigin` 为生产域名
3. 配置 HTTPS
4. 设置合适的 CORS 策略

---

## 最佳实践

### 错误处理

统一的错误处理模式，确保用户体验一致：

```typescript
// API 层：响应拦截器统一处理（参考 frontend/src/api/index.ts）
// 401 时自动尝试刷新 token 并重试原始请求
// 刷新彻底失败时才清理 token 并通知主框架
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 自动刷新 token 并重试（详见 api/index.ts）
    }
    return Promise.reject(error)
  }
)

// Store 层：try-catch + 用户提示（参考 frontend/src/stores/sample.ts）
async function fetchList() {
  listLoading.value = true
  error.value = null
  try {
    const response = await getSampleList(queryParams)
    items.value = response.data.data
  } catch (err: any) {
    const msg = err.response?.data?.message || '获取列表失败'
    error.value = msg
    ElMessage.error(msg)
    throw err
  } finally {
    listLoading.value = false
  }
}
```

**要点：**
- API 层处理通用错误（401、网络错误）
- Store 层处理业务错误并给出用户提示
- 始终使用 `finally` 重置 loading 状态
- 错误信息优先使用服务端返回的 message

### 状态管理

使用 Pinia Composition API 风格，参考 [`frontend/src/stores/sample.ts`](frontend/src/stores/sample.ts)：

```typescript
export const useSampleStore = defineStore('sample', () => {
  // 状态：使用 ref 定义响应式数据
  const items = ref<SampleItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性：派生状态
  const isEmpty = computed(() => !loading.value && items.value.length === 0)

  // Actions：异步操作，包含 loading 和 error 管理
  async function fetchList() { /* ... */ }
  async function createItem(data: SampleItem) { /* ... */ }

  // 重置方法：清理所有状态
  function $reset() {
    items.value = []
    loading.value = false
    error.value = null
  }

  return { items, loading, error, isEmpty, fetchList, createItem, $reset }
})
```

**要点：**
- 每个 Store 管理一个功能模块的状态
- 分离 `listLoading`、`detailLoading`、`submitting`、`deleting` 等细粒度 loading 状态
- 提供 `$reset` 方法用于清理状态
- 操作成功后同步更新本地状态，避免重新请求

### API 请求封装

参考 [`frontend/src/api/index.ts`](frontend/src/api/index.ts)：

```typescript
// 1. 创建独立的 Axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// 2. 请求拦截器：自动注入 Token
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 3. 定义类型安全的 API 方法
export const getSampleList = (params?: { page?: number; keyword?: string }) =>
  api.get<SampleListResponse>('/samples', { params })

export const createSample = (data: SampleItem) =>
  api.post<SampleItem>('/samples', data)
```

**要点：**
- 使用独立的 Axios 实例，不污染全局配置
- 请求拦截器自动添加 Token
- 响应拦截器统一处理错误
- API 方法使用 TypeScript 泛型确保类型安全
- 导出接口类型供 Store 和组件使用

### 组件拆分

遵循单一职责原则：

```
views/
├── SampleList.vue    # 页面组件：负责页面级逻辑和布局
└── SampleForm.vue    # 页面组件：负责表单交互

composables/
├── usePermissions.ts  # 逻辑复用：权限检查
├── useTheme.ts        # 逻辑复用：主题适配
└── usePluginBridge.ts # 逻辑复用：PostMessage 通信

layout/
└── AppLayout.vue      # 布局组件：全局布局框架
```

**要点：**
- 页面组件（views）负责组合逻辑和布局
- 可复用逻辑提取为组合式函数（composables）
- 布局组件（layout）负责全局框架
- 使用 `<script setup>` 语法简化组件代码

### 代码注释

使用中文注释，关键函数添加 JSDoc：

```typescript
/**
 * 检查单个权限
 * @param action 操作标识（如 'create-sample'、'delete-sample'）
 * @returns 是否有权限
 *
 * @example
 * const canCreate = await checkPermission('create-sample')
 */
async function checkPermission(action: string): Promise<boolean> {
  // 如果缓存中已有结果，直接返回
  if (action in permissionCache.value) {
    return permissionCache.value[action]
  }
  // ...
}
```

**要点：**
- 文件顶部添加模块说明注释
- 公共函数使用 JSDoc 格式（含 `@param`、`@returns`、`@example`）
- 关键逻辑添加行内注释说明"为什么"而非"做什么"
- CSS 文件使用分区注释（`/* ===== 区域名 ===== */`）

### 安全性

Token 处理最佳实践，参考 [`frontend/src/utils/token.ts`](frontend/src/utils/token.ts)：

```typescript
// 1. Token 存储在 localStorage，使用专用 key
const TOKEN_KEY = 'plugin-template-token'
const REFRESH_TOKEN_KEY = 'plugin-template-refresh-token'

// 2. 只接受来自父窗口的 PostMessage
window.addEventListener('message', (event) => {
  if (event.source !== window.parent) return  // 安全检查
  // ...
})

// 3. Token 过期检查
export function isTokenExpired(token: string): boolean {
  const payload = JSON.parse(atob(token.split('.')[1]))
  return Math.floor(Date.now() / 1000) >= payload.exp
}

// 4. 401 时自动刷新 token，刷新失败才清理并通知主框架
// （参考 frontend/src/api/index.ts 中的响应拦截器）
```

**要点：**
- PostMessage 始终验证 `event.source`
- Token 过期时主动清理并通知主框架
- 不在前端存储敏感信息（密码等）
- 权限验证在前端和后端双重执行
- 后端通过 Plugin Auth API 验证，不自行解析 JWT

### 性能优化

```typescript
// 1. 权限缓存：避免重复 API 调用（参考 usePermissions.ts）
const permissionCache = ref<Record<string, boolean>>({})
async function checkPermission(action: string) {
  if (action in permissionCache.value) return permissionCache.value[action]
  // ... 调用 API 并缓存结果
}

// 2. 细粒度 loading 状态：避免全局 loading 阻塞交互
const listLoading = ref(false)   // 列表加载
const submitting = ref(false)    // 表单提交
const deleting = ref(false)      // 删除操作

// 3. 操作后本地更新：避免重新请求整个列表
async function createItem(data: SampleItem) {
  const response = await createSample(data)
  items.value.unshift(response.data)  // 直接插入本地列表
  pagination.value.total += 1
}

// 4. 主题监听使用 watchEffect 自动同步（参考 useTheme.ts）
watchEffect(() => {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
})
```

**要点：**
- 缓存不常变化的数据（权限、配置）
- 使用细粒度 loading 状态提升交互体验
- CRUD 操作后本地更新状态，减少网络请求
- 使用 `watchEffect` 替代手动监听，自动追踪依赖

---

## 贡献指南

详细的贡献流程请参考 📖 [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

包含：代码规范、提交规范（Conventional Commits）、Pull Request 流程、问题报告模板、功能请求模板。

---

## 许可证

[MIT License](LICENSE)
