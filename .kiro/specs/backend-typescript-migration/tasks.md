# 实现计划：后端 TypeScript 迁移

## 概述

按照渐进式策略将后端从 JavaScript 迁移到 TypeScript：先搭建工具链，再创建共享类型定义，逐模块转换源文件，最后迁移测试、更新 Docker 配置和文档。每个步骤确保增量可验证，迁移后运行时行为完全不变。

## 任务

- [ ] 1. 搭建 TypeScript 工具链
  - [ ] 1.1 创建 `backend/tsconfig.json`，配置 `strict: true`、`target: ES2020`、`module: commonjs`、`outDir: ./dist`、`rootDir: ./src`、`esModuleInterop: true`、`skipLibCheck: true`、`sourceMap: true`、`declaration: true`
    - _需求: 1.1_
  - [ ] 1.2 安装 TypeScript 相关 devDependencies：`typescript`、`tsx`、`ts-jest`、`@types/node`、`@types/express`、`@types/cors`、`@types/jsonwebtoken`、`@types/jest`、`@types/supertest`
    - _需求: 1.2_
  - [ ] 1.3 更新 `backend/package.json` 的 scripts：`build: tsc`、`start: node dist/index.js`、`dev: tsx watch src/index.ts`、`test: jest`、`typecheck: tsc --noEmit`
    - _需求: 1.3, 1.4, 1.5, 1.6, 1.7_
  - [ ] 1.4 创建 `backend/jest.config.ts`，配置 `ts-jest` preset、`testEnvironment: node`、`testMatch: ['**/__tests__/**/*.test.ts']`
    - _需求: 1.7, 6.2_

- [ ] 2. 创建共享类型定义模块
  - [ ] 2.1 创建 `backend/src/types/index.ts`，定义 `User`、`AuthenticatedRequest`、`ApiResponse<T>`、`PaginatedResult<T>`、`TokenMetadata`、`Sample`、`CreateSampleBody`、`UpdateSampleBody`、`ValidationResult`、`HealthStatus` 接口
    - 按照设计文档中组件 1 的接口定义实现
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 3. 转换基础设施模块
  - [ ] 3.1 将 `src/db.js` 转换为 `src/db.ts`：替换 `require` 为 `import`，类型化连接池为 `mysql2/promise.Pool`，替换 `module.exports` 为 `export`
    - _需求: 3.1, 3.2, 3.3, 3.4_
  - [ ] 3.2 将 `src/redis.js` 转换为 `src/redis.ts`：替换 `require` 为 `import`，类型化客户端为 `ioredis.Redis`，使用 `export default`
    - _需求: 3.1, 3.2, 3.3, 3.5_
  - [ ]* 3.3 为 db.ts 和 redis.ts 编写类型检查验证
    - 运行 `tsc --noEmit` 确认无类型错误
    - _需求: 10.1_

- [ ] 4. 转换 Token 服务
  - [ ] 4.1 将 `src/tokenService.js` 转换为 `src/tokenService.ts`：为 `hashToken`、`generateRefreshToken`、`verifyRefreshToken`、`rotateRefreshToken`、`isTokenUsed`、`getUserIdFromUsedToken`、`revokeAllUserTokens` 添加参数类型和返回类型，使用 `TokenMetadata` 接口
    - _需求: 3.1, 3.2, 3.3, 3.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [ ]* 4.2 编写 tokenService 属性测试：hashToken 确定性
    - **属性 2: hashToken 确定性** — 相同输入始终返回相同的 64 字符十六进制字符串
    - **验证: 需求 5.1, 5.2**
  - [ ]* 4.3 编写 tokenService 属性测试：hashToken 输出格式
    - **属性 1: hashToken 输出格式** — 任意非空字符串输入，输出始终为 64 字符十六进制
    - **验证: 需求 5.1**

- [ ] 5. 检查点 - 基础模块类型检查
  - 确保所有已转换文件通过 `tsc --noEmit`，如有问题请询问用户。

- [ ] 6. 转换工具和中间件模块
  - [ ] 6.1 将 `src/utils/pluginAuth.js` 转换为 `src/utils/pluginAuth.ts`：为 `verifyToken`、`checkPermission`、`getAllowedActions` 添加参数类型和返回类型，使用 `User` 接口
    - _需求: 3.1, 3.2, 3.3_
  - [ ] 6.2 将 `src/middleware/auth.js` 转换为 `src/middleware/auth.ts`：使用 `AuthenticatedRequest` 类型，为 `ensureRefreshToken` 和 `auth` 函数添加类型注解
    - _需求: 3.1, 3.2, 3.3, 3.7_

- [ ] 7. 转换路由模块
  - [ ] 7.1 将 `src/routes/auth.js` 转换为 `src/routes/auth.ts`：类型化请求体、响应对象，使用 `AuthenticatedRequest`，`Router` 类型导出
    - _需求: 3.1, 3.2, 3.3, 3.8_
  - [ ] 7.2 将 `src/routes/samples.js` 转换为 `src/routes/samples.ts`：类型化 `validateSampleBody` 函数（参数 `CreateSampleBody | UpdateSampleBody`，返回 `ValidationResult`），类型化查询参数和响应对象
    - _需求: 3.1, 3.2, 3.3, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [ ]* 7.3 编写 validateSampleBody 属性测试：创建模式下 name 为空返回无效
    - **属性 5: validateSampleBody 创建模式空名称** — 创建模式下 name 为空或缺失时始终返回 `{ valid: false }`
    - **验证: 需求 4.1**
  - [ ]* 7.4 编写 validateSampleBody 属性测试：有效输入返回有效
    - **属性 5: validateSampleBody 有效输入** — name 长度在 2-100 之间且 description 长度 ≤ 500 时始终返回 `{ valid: true }`
    - **验证: 需求 4.5**

- [ ] 8. 转换应用入口
  - [ ] 8.1 将 `src/index.js` 转换为 `src/index.ts`：替换所有 `require` 为 `import`，添加类型注解，使用 `HealthStatus` 接口类型化健康检查响应
    - _需求: 3.1, 3.2, 3.3, 9.1, 9.2_

- [ ] 9. 检查点 - 全部源文件类型检查
  - 确保所有 `.ts` 源文件通过 `tsc --noEmit` 编译无错误，如有问题请询问用户。

- [ ] 10. 迁移测试文件
  - [ ] 10.1 将 `src/__tests__/tokenService.test.js` 转换为 `tokenService.test.ts`：添加 mock 对象类型注解，更新 import 语句
    - _需求: 6.1, 6.3_
  - [ ] 10.2 将 `src/__tests__/authMiddleware.test.js` 转换为 `authMiddleware.test.ts`：使用 `AuthenticatedRequest` 类型化 mock request，添加类型注解
    - _需求: 6.1, 6.3_
  - [ ] 10.3 将 `src/__tests__/authRoutes.test.js` 转换为 `authRoutes.test.ts`：类型化 supertest 请求和响应，更新 mock 类型
    - _需求: 6.1, 6.3_
  - [ ]* 10.4 运行全部测试确保迁移前后结果一致
    - 执行 `npm test` 验证所有测试通过
    - _需求: 6.4, 9.3, 9.4, 9.5_

- [ ] 11. 更新 Docker 配置
  - [ ] 11.1 更新 `backend/Dockerfile` 为多阶段构建：构建阶段复制 `tsconfig.json` 和 `package*.json`，执行 `npm install` 和 `npm run build`；生产阶段仅复制 `dist/` 和生产 `node_modules`，入口设为 `node dist/index.js`
    - _需求: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 12. 更新项目文档
  - [ ] 12.1 更新 `docs/CONTRIBUTING.md`：将后端技术描述改为 "TypeScript + Express"，更新代码示例为 TypeScript
    - _需求: 8.1_
  - [ ] 12.2 更新 `docs/QUICK_START.md`：更新构建命令（`npm run build`、`npm run dev` 使用 tsx、`npm run typecheck`）
    - _需求: 8.2_
  - [ ] 12.3 更新 `docs/STRUCTURE.md`：更新后端目录结构，包含 `types/`、`tsconfig.json`、`dist/`，文件扩展名从 `.js` 改为 `.ts`
    - _需求: 8.3_

- [ ] 13. 最终检查点 - 全面验证
  - 确保 `tsc --noEmit` 零错误、所有测试通过、无遗留 `.js` 源文件，如有问题请询问用户。
    - _需求: 10.1, 10.2, 10.3_

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加快 MVP 进度
- 每个任务引用了具体的需求编号以确保可追溯性
- 检查点任务确保增量验证，及时发现问题
- 属性测试验证核心函数的通用正确性属性
- 迁移过程中删除原 `.js` 文件，确保不留冗余代码
