# 需求文档

## 简介

将后端项目从 JavaScript 迁移到 TypeScript，涵盖 TypeScript 工具链搭建、源文件转换、类型定义、测试迁移、Docker 配置更新和项目文档更新。迁移后运行时行为保持完全不变，前后端技术栈统一为 TypeScript。

## 术语表

- **Backend**：后端 Express API 服务，位于 `backend/` 目录
- **TypeScript_Compiler**：TypeScript 编译器（`tsc`），负责类型检查和编译
- **Build_System**：构建系统，包括 `tsconfig.json` 配置、`package.json` 脚本和依赖管理
- **Type_Module**：类型定义模块（`src/types/index.ts`），集中定义共享的 TypeScript 接口和类型
- **Source_Module**：后端源代码模块，包括 `db.ts`、`redis.ts`、`tokenService.ts`、`middleware/auth.ts`、`utils/pluginAuth.ts`、`routes/auth.ts`、`routes/samples.ts`、`index.ts`
- **Test_Suite**：测试套件，包括 `__tests__/` 下的所有测试文件
- **Docker_Config**：Docker 构建配置，即 `backend/Dockerfile`
- **Documentation**：项目文档，位于 `docs/` 目录下的 Markdown 文件
- **Validator**：输入验证函数，如 `validateSampleBody`

## 需求

### 需求 1：TypeScript 工具链搭建

**用户故事：** 作为开发者，我希望后端项目具备完整的 TypeScript 工具链，以便能够编写、编译和运行 TypeScript 代码。

#### 验收标准

1. THE Build_System SHALL include a `tsconfig.json` file with `strict: true`, `target: ES2020`, `module: commonjs`, `outDir: ./dist`, and `rootDir: ./src`
2. THE Build_System SHALL include `typescript`, `tsx`, `ts-jest`, and all required `@types/*` packages as devDependencies
3. WHEN `npm run build` is executed, THE TypeScript_Compiler SHALL compile all `.ts` files in `src/` to JavaScript in the `dist/` directory
4. WHEN `npm run dev` is executed, THE Build_System SHALL start the development server using `tsx watch` for hot-reload
5. WHEN `npm start` is executed, THE Build_System SHALL run the compiled JavaScript from `dist/index.js`
6. WHEN `npm run typecheck` is executed, THE TypeScript_Compiler SHALL perform type checking without emitting output files
7. WHEN `npm test` is executed, THE Test_Suite SHALL run all tests using `ts-jest` preset

### 需求 2：共享类型定义

**用户故事：** 作为开发者，我希望项目有集中的类型定义，以便所有模块共享一致的接口和类型。

#### 验收标准

1. THE Type_Module SHALL define a `User` interface with `id: number`, `username: string`, `nickname: string`, and `roles: string[]` fields
2. THE Type_Module SHALL define an `AuthenticatedRequest` interface extending Express `Request` with a `user: User` property
3. THE Type_Module SHALL define an `ApiResponse<T>` generic interface with `code: number`, optional `data: T`, and optional `message: string`
4. THE Type_Module SHALL define a `TokenMetadata` interface with `userId: string`, `createdAt: string`, and `expiresAt: string`
5. THE Type_Module SHALL define `Sample`, `CreateSampleBody`, `UpdateSampleBody`, and `ValidationResult` interfaces matching the existing data model
6. THE Type_Module SHALL define a `HealthStatus` interface with `status: 'ok' | 'error'`, `version: string`, and optional `db`, `redis`, `message` fields

### 需求 3：源文件 TypeScript 转换

**用户故事：** 作为开发者，我希望所有后端源文件从 `.js` 转换为 `.ts`，以便获得类型安全和更好的开发体验。

#### 验收标准

1. WHEN a `.js` source file is converted, THE Source_Module SHALL rename it to `.ts` and add explicit type annotations to all function parameters, return types, and variables
2. THE Source_Module SHALL replace all `require()` calls with ES module `import` statements
3. THE Source_Module SHALL replace all `module.exports` with named `export` or `export default` statements
4. WHEN the database module is converted, THE Source_Module SHALL type the connection pool as `mysql2/promise.Pool`
5. WHEN the Redis module is converted, THE Source_Module SHALL type the client as `ioredis.Redis`
6. WHEN the token service is converted, THE Source_Module SHALL add explicit parameter types and return types to all exported functions (`hashToken`, `generateRefreshToken`, `verifyRefreshToken`, `rotateRefreshToken`, `isTokenUsed`, `getUserIdFromUsedToken`, `revokeAllUserTokens`)
7. WHEN the auth middleware is converted, THE Source_Module SHALL use `AuthenticatedRequest` type for request parameters in authenticated route handlers
8. WHEN route handlers are converted, THE Source_Module SHALL type request bodies, query parameters, and response objects using the defined interfaces

### 需求 4：输入验证类型安全

**用户故事：** 作为开发者，我希望输入验证函数具有完整的类型定义，以便在编译期捕获类型错误。

#### 验收标准

1. WHEN `validateSampleBody` receives a `CreateSampleBody` with an empty or missing `name`, THE Validator SHALL return `{ valid: false, error: '名称不能为空' }`
2. WHEN `validateSampleBody` receives a body with `name` shorter than 2 characters, THE Validator SHALL return `{ valid: false, error: '名称至少需要 2 个字符' }`
3. WHEN `validateSampleBody` receives a body with `name` longer than 100 characters, THE Validator SHALL return `{ valid: false, error: '名称不能超过 100 个字符' }`
4. WHEN `validateSampleBody` receives a body with `description` longer than 500 characters, THE Validator SHALL return `{ valid: false, error: '描述不能超过 500 个字符' }`
5. WHEN `validateSampleBody` receives a valid body, THE Validator SHALL return `{ valid: true }`
6. WHEN `validateSampleBody` is called with `isUpdate=true`, THE Validator SHALL allow `name` to be omitted

### 需求 5：Token 服务类型安全

**用户故事：** 作为开发者，我希望 Token 服务的所有函数具有严格的类型定义，以便确保 token 操作的正确性。

#### 验收标准

1. WHEN `hashToken` receives a non-empty string, THE Source_Module SHALL return a 64-character hexadecimal string
2. WHEN `hashToken` receives the same input twice, THE Source_Module SHALL return identical output (deterministic behavior)
3. WHEN `generateRefreshToken` is called with a valid `userId`, THE Source_Module SHALL return a 64-character hexadecimal token string
4. WHEN `verifyRefreshToken` receives a null or empty token, THE Source_Module SHALL return `null`
5. WHEN `verifyRefreshToken` receives a valid token, THE Source_Module SHALL return the associated `userId` string
6. WHEN `rotateRefreshToken` is called, THE Source_Module SHALL invalidate the old token and return a new token string

### 需求 6：测试文件迁移

**用户故事：** 作为开发者，我希望所有测试文件迁移到 TypeScript，以便测试代码也能享受类型检查。

#### 验收标准

1. WHEN test files are migrated, THE Test_Suite SHALL rename all `__tests__/*.test.js` files to `*.test.ts`
2. THE Test_Suite SHALL use `ts-jest` preset in the Jest configuration
3. WHEN mock objects are used in tests, THE Test_Suite SHALL add appropriate type annotations to mock objects
4. WHEN all tests are executed after migration, THE Test_Suite SHALL produce the same pass/fail results as before migration

### 需求 7：Docker 配置更新

**用户故事：** 作为运维人员，我希望 Docker 构建配置支持 TypeScript 编译，以便能够正确构建和部署后端服务。

#### 验收标准

1. THE Docker_Config SHALL use a multi-stage build with a build stage and a production stage
2. WHEN the build stage executes, THE Docker_Config SHALL copy `tsconfig.json` along with `package*.json` and run `npm install` with all dependencies
3. WHEN the build stage executes, THE Docker_Config SHALL run `npm run build` to compile TypeScript to JavaScript
4. WHEN the production stage executes, THE Docker_Config SHALL copy only the `dist/` directory and production `node_modules` from the build stage
5. THE Docker_Config SHALL set the entry point to `node dist/index.js`

### 需求 8：文档更新

**用户故事：** 作为开发者，我希望项目文档反映 TypeScript 迁移后的变化，以便新成员能够正确理解和使用项目。

#### 验收标准

1. WHEN `docs/CONTRIBUTING.md` is updated, THE Documentation SHALL describe the backend technology as "TypeScript + Express" and include TypeScript code examples
2. WHEN `docs/QUICK_START.md` is updated, THE Documentation SHALL reflect the new build commands (`npm run build`, `npm run dev` with tsx, `npm run typecheck`)
3. WHEN `docs/STRUCTURE.md` is updated, THE Documentation SHALL show the updated directory structure including `types/`, `tsconfig.json`, and `dist/`
4. THE Documentation SHALL keep `docs/TESTING-I18N.md` and `docs/I18N.md` unchanged as they only concern the frontend

### 需求 9：运行时行为保持不变

**用户故事：** 作为用户，我希望 TypeScript 迁移不改变任何 API 行为，以便现有的前端和集成不受影响。

#### 验收标准

1. WHEN the migrated backend starts, THE Backend SHALL listen on the same port and serve the same API endpoints as before migration
2. WHEN the health check endpoint is called, THE Backend SHALL return the same JSON response structure with `status`, `version`, `db`, and `redis` fields
3. WHEN authentication middleware processes a request, THE Backend SHALL produce the same authorization behavior (accept/reject) as the JavaScript version
4. WHEN CRUD operations are performed on samples, THE Backend SHALL return the same response format and status codes as before migration
5. IF an error occurs during request processing, THE Backend SHALL return the same error response format as the JavaScript version

### 需求 10：编译期类型安全

**用户故事：** 作为开发者，我希望 TypeScript 严格模式能在编译期捕获潜在错误，以便提升代码质量。

#### 验收标准

1. WHEN `tsc --noEmit` is executed, THE TypeScript_Compiler SHALL report zero type errors across all source files
2. THE Source_Module SHALL avoid using `any` type except where third-party library types are incomplete
3. WHEN environment variables are accessed, THE Source_Module SHALL handle the `string | undefined` type with appropriate defaults or checks
