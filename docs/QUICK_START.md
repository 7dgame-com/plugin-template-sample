# 快速开始指南

本指南帮助你在 30 分钟内使用插件模板创建并运行一个新插件。

## 目录

- [环境准备](#环境准备)
- [第一步：获取模板](#第一步获取模板)
- [第二步：安装依赖](#第二步安装依赖)
- [第三步：配置环境变量](#第三步配置环境变量)
- [第四步：启动开发服务器](#第四步启动开发服务器)
- [第五步：注册插件到主系统](#第五步注册插件到主系统)
- [从模板创建新插件](#从模板创建新插件)
- [自定义功能指导](#自定义功能指导)
- [常见错误排查](#常见错误排查)
- [发布插件检查清单](#发布插件检查清单)

---

## 环境准备

开始之前，请确保已安装以下工具：

| 工具 | 最低版本 | 检查命令 |
|------|---------|---------|
| Node.js | 18.0+ | `node -v` |
| npm | 9.0+ | `npm -v` |
| Docker | 20.0+ | `docker -v` |
| Docker Compose | 2.0+ | `docker compose version` |
| Git | 2.0+ | `git -v` |

> 如果只进行前端开发，Docker 不是必需的。后端服务和数据库需要 Docker 来运行。

---

## 第一步：获取模板

```bash
# 复制模板到新目录
cp -r plugins/plugin-template-sample plugins/my-new-plugin
cd plugins/my-new-plugin
```

---

## 第二步：安装依赖

### 前端依赖

```bash
cd frontend
npm install
```

### 后端依赖

```bash
cd ../backend
npm install
```

---

## 第三步：配置环境变量

### 前端配置

```bash
cd frontend
cp .env.example .env
```

编辑 `frontend/.env`：

```dotenv
# 主后端 API 地址（用于认证授权）
VITE_MAIN_API_URL=http://localhost:8082

# 插件后端 API 地址
VITE_BACKEND_URL=http://localhost:8085

# 开发服务器端口（避免与其他插件冲突）
VITE_PORT=3004
```

### 后端配置

```bash
cd ../backend
cp .env.example .env
```

编辑 `backend/.env`：

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
PLUGIN_NAME=my-new-plugin
```

> **注意**：`MAIN_API_URL` 必须指向主系统后端，插件通过它验证用户身份和权限。

---

## 第四步：启动开发服务器

### 方式一：本地开发（推荐）

分别启动前端和后端：

```bash
# 终端 1 - 启动前端
cd frontend
npm run dev
# 前端运行在 http://localhost:3004（或 .env 中配置的端口）

# 终端 2 - 启动后端
cd backend
npm run dev
# 后端运行在 http://localhost:8085
```

### 方式二：Docker 部署

```bash
# 在项目根目录
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

Docker 部署后的服务地址：

| 服务 | 地址 |
|------|------|
| 前端 | http://localhost:3003 |
| 后端 API | http://localhost:8085 |
| MySQL | localhost:3307 |
| Redis | localhost:6380 |

---

## 第五步：注册插件到主系统

1. 打开主系统的插件配置文件 `web/public/config/plugins.json`
2. 参考 `plugins.json.example` 中的示例，将插件条目添加到 `plugins` 数组中
3. 重启主系统前端开发服务器
4. 在主系统侧边栏中应该能看到新注册的插件

```json
{
  "id": "my-new-plugin",
  "name": "我的新插件",
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

---

## 从模板创建新插件

按照以下步骤将模板转换为你自己的插件：

### 1. 重命名项目

```bash
# 复制模板
cp -r plugins/plugin-template-sample plugins/my-plugin

# 进入新目录
cd plugins/my-plugin
```

### 2. 修改项目标识

需要修改以下文件中的名称和标识：

- `frontend/package.json` — 修改 `name` 字段
- `backend/package.json` — 修改 `name` 字段
- `backend/.env.example` — 修改 `PLUGIN_NAME`
- `docker-compose.yml` — 根据需要修改端口号
- `plugins.json.example` — 修改 `id`、`name`、`description`、`url` 等

### 3. 修改前端端口

编辑 `frontend/vite.config.ts`，修改开发服务器端口（避免与其他插件冲突）。

### 4. 修改后端端口

编辑 `backend/.env.example` 和 `docker-compose.yml`，修改后端服务端口。

### 5. 替换示例功能

- 将 `frontend/src/views/SampleList.vue` 和 `SampleForm.vue` 替换为你的业务页面
- 将 `frontend/src/stores/sample.ts` 替换为你的状态管理
- 将 `backend/src/routes/samples.ts` 替换为你的 API 路由
- 更新 `frontend/src/api/index.ts` 中的 API 方法
- 更新 `frontend/src/router/index.ts` 中的路由配置

### 6. 更新多语言文件

修改 `frontend/src/i18n/locales/` 下的五个语言文件，替换为你的翻译文本。

### 7. 更新权限配置

在 `frontend/src/composables/usePermissions.ts` 中修改权限动作名称，使其匹配你的业务需求。

---

## 自定义功能指导

### 添加新页面

1. 在 `frontend/src/views/` 下创建新的 `.vue` 文件
2. 在 `frontend/src/router/index.ts` 中添加路由
3. 在语言文件中添加对应的翻译文本

### 添加新 API

1. 在 `backend/src/routes/` 下创建新的路由文件
2. 在 `backend/src/index.ts` 中注册路由
3. 在 `frontend/src/api/index.ts` 中添加对应的请求方法

### 添加新的 Pinia Store

1. 在 `frontend/src/stores/` 下创建新的 store 文件
2. 参考 `sample.ts` 的模式实现 state、getters 和 actions

### 添加权限控制

1. 在主系统后台配置插件权限动作
2. 在前端使用 `usePermissions()` 检查权限
3. 在后端路由中调用 `pluginAuth.checkPermission()` 验证权限

### 纯前端插件

如果你的插件不需要独立后端，可以：

1. 删除 `backend/` 目录
2. 从 `docker-compose.yml` 中移除 `backend`、`mysql`、`redis` 服务
3. 从 `plugins.json.example` 中移除 `extraConfig.apiBaseUrl`
4. 前端直接通过主后端 API 获取数据

参考 `plugins/counter-plugin` 了解纯前端插件的实现方式。

---

## 常见错误排查

### 插件在主系统中无法加载

**现象**：侧边栏看不到插件，或 iframe 显示空白。

**排查步骤**：
1. 确认 `web/public/config/plugins.json` 中已添加插件配置
2. 确认插件前端开发服务器正在运行
3. 确认 `url` 和 `allowedOrigin` 地址正确
4. 打开浏览器控制台，检查是否有跨域错误

### PostMessage 通信失败

**现象**：插件加载后显示"等待初始化"或无法获取用户信息。

**排查步骤**：
1. 确认 `plugins.json` 中的 `allowedOrigin` 与插件实际地址一致
2. 检查浏览器控制台是否有 `postMessage` 相关错误
3. 确认主系统已登录且 Token 有效

### 后端 API 返回 401

**现象**：调用插件后端 API 时返回 401 Unauthorized。

**排查步骤**：
1. 确认后端 `.env` 中的 `MAIN_API_URL` 指向正确的主后端地址
2. 确认主后端服务正在运行
3. 确认前端请求头中包含有效的 JWT Token
4. 检查后端日志中 Plugin Auth API 的调用结果

### 后端 API 返回 403

**现象**：调用后端 API 时返回 403 Forbidden。

**排查步骤**：
1. 确认当前用户在主系统后台已配置对应的插件权限
2. 确认 `PLUGIN_NAME` 与主系统中注册的插件 ID 一致
3. 检查权限动作名称是否匹配

### 数据库连接失败

**现象**：后端启动时报数据库连接错误。

**排查步骤**：
1. 确认 MySQL 服务正在运行
2. 确认 `.env` 中的数据库连接信息正确
3. 如果使用 Docker，确认容器网络配置正确（Docker 内部使用服务名 `mysql` 而非 `localhost`）

### 前端编译错误

**现象**：`npm run dev` 报 TypeScript 或依赖错误。

**排查步骤**：
1. 确认 Node.js 版本 >= 18
2. 删除 `node_modules` 和 `package-lock.json`，重新执行 `npm install`
3. 检查 `.env` 文件是否存在（从 `.env.example` 复制）

### 主题样式异常

**现象**：插件在某些主题下颜色或布局不正确。

**排查步骤**：
1. 确认样式使用 CSS 变量（`var(--el-color-primary)` 等），而非硬编码颜色值
2. 检查 `useTheme` 组合式函数是否正确初始化
3. 参考 `web/docs/plugin-design-guide.md` 中的主题适配说明


---

## 发布插件检查清单

发布插件前，请逐项确认以下检查项：

### 代码质量
- [ ] 前端代码通过 ESLint 检查（`npm run lint`）
- [ ] 前端代码通过 TypeScript 编译（`npm run build` 无错误）
- [ ] 后端代码无未处理的异常
- [ ] 所有 API 路由都有认证中间件保护
- [ ] 所有操作都有权限检查

### 功能测试
- [ ] CRUD 操作正常（创建、读取、更新、删除）
- [ ] 分页和搜索功能正常
- [ ] 表单验证正常（必填项、长度限制）
- [ ] 权限控制正常（无权限时按钮隐藏、API 返回 403）
- [ ] 错误处理正常（网络错误、服务端错误有友好提示）

### 多语言测试
- [ ] 5 种语言切换正常（zh-CN、zh-TW、en-US、ja-JP、th-TH）
- [ ] 所有界面文本已翻译（无硬编码中文）
- [ ] 表单验证消息已翻译
- [ ] 操作成功/失败消息已翻译

### 主题适配测试
- [ ] 6 种主题下显示正常
- [ ] 暗色主题（deep-space、cyber-tech）下文字可读
- [ ] 无硬编码颜色值（全部使用 CSS 变量）
- [ ] Element Plus 组件在暗色主题下正常显示

### 性能测试
- [ ] 页面首次加载时间合理（< 3 秒）
- [ ] 列表页大数据量下不卡顿
- [ ] 无内存泄漏（长时间使用后内存稳定）

### 安全性检查
- [ ] Token 存储和传递安全
- [ ] PostMessage 通信验证了 event.source
- [ ] API 请求都携带了认证 Token
- [ ] 无敏感信息硬编码在前端代码中

### 文档完整性
- [ ] README.md 已更新
- [ ] plugins.json.example 配置正确
- [ ] .env.example 包含所有必要的环境变量
- [ ] 多语言文件结构完整
