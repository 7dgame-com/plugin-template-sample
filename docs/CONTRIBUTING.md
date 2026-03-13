# 贡献指南

感谢你对插件模板示例项目的关注！本文档说明如何为本项目做出贡献。

## 目录

- [行为准则](#行为准则)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [问题报告](#问题报告)
- [功能请求](#功能请求)
- [许可证](#许可证)
- [维护者联系方式](#维护者联系方式)

---

## 行为准则

- 尊重所有参与者，保持友善和专业的交流
- 欢迎不同经验水平的开发者参与贡献
- 对建设性的批评保持开放态度

---

## 代码规范

### 前端（TypeScript + Vue）

- 使用 TypeScript 编写所有前端代码，避免使用 `any` 类型
- Vue 组件使用 `<script setup lang="ts">` 语法
- 组件命名使用 PascalCase（如 `SampleList.vue`）
- 组合式函数命名使用 `use` 前缀（如 `usePermissions.ts`）
- 样式使用 CSS 变量，不使用硬编码颜色值
- 所有用户可见文本必须使用 `$t()` 国际化函数
- 代码注释使用中文

```vue
<!-- ✅ 推荐 -->
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const loading = ref(false)
</script>

<!-- ❌ 避免 -->
<script lang="ts">
export default {
  data() {
    return { loading: false }
  }
}
</script>
```

### 后端（TypeScript + Express）

- 使用 TypeScript 编写所有后端代码，避免使用 `any` 类型
- 所有函数参数和返回值必须有明确的类型注解
- 路由文件放在 `src/routes/` 目录下
- 中间件文件放在 `src/middleware/` 目录下
- 所有 API 路由必须通过认证中间件保护
- 权限检查通过 Plugin Auth API 完成，不在本地实现
- 错误响应使用统一格式：`{ error: '错误描述' }`

### 格式化

项目使用 ESLint + Prettier 进行代码检查和格式化：

```bash
# 检查代码
cd frontend && npm run lint

# 自动修复
cd frontend && npm run lint:fix

# 格式化代码
cd frontend && npm run format
```

---

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

### 类型

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构（不新增功能或修复 Bug） |
| `perf` | 性能优化 |
| `test` | 添加或修改测试 |
| `chore` | 构建工具或辅助工具变更 |

### 范围

| 范围 | 说明 |
|------|------|
| `frontend` | 前端相关变更 |
| `backend` | 后端相关变更 |
| `docs` | 文档相关变更 |
| `docker` | Docker 配置变更 |
| `i18n` | 多语言相关变更 |

### 示例

```
feat(frontend): 添加数据导出功能
fix(backend): 修复分页查询参数验证
docs: 更新快速开始指南
style(frontend): 统一按钮间距
refactor(backend): 重构数据库查询逻辑
chore(docker): 升级 Node.js 基础镜像版本
```

---

## Pull Request 流程

### 1. Fork 和克隆

```bash
# Fork 项目到你的 GitHub 账号
# 克隆你的 Fork
git clone https://github.com/your-username/plugin-template-sample.git
cd plugin-template-sample
```

### 2. 创建分支

```bash
# 从 main 分支创建功能分支
git checkout -b feat/my-feature
```

分支命名规范：
- 功能：`feat/feature-name`
- 修复：`fix/bug-description`
- 文档：`docs/doc-name`

### 3. 开发和测试

```bash
# 安装依赖
cd frontend && npm install
cd ../backend && npm install

# 启动开发服务器进行测试
cd frontend && npm run dev
```

### 4. 提交代码

```bash
git add .
git commit -m "feat(frontend): 添加数据导出功能"
```

### 5. 推送并创建 PR

```bash
git push origin feat/my-feature
```

在 GitHub 上创建 Pull Request，填写以下信息：
- 变更描述
- 关联的 Issue 编号（如有）
- 测试方法

### 6. 代码审查

- 至少需要一位维护者审查通过
- 确保 CI 检查全部通过
- 根据审查意见修改代码

---

## 问题报告

发现 Bug 时，请创建 Issue 并包含以下信息：

### 问题报告模板

```markdown
## 问题描述

简要描述遇到的问题。

## 复现步骤

1. 执行 '...'
2. 点击 '...'
3. 查看 '...'

## 期望行为

描述你期望看到的结果。

## 实际行为

描述实际发生的情况。

## 环境信息

- 操作系统：
- Node.js 版本：
- 浏览器：
- Docker 版本（如适用）：

## 截图或日志

如有相关截图或错误日志，请附上。
```

---

## 功能请求

如果你有新功能的想法，请创建 Issue 并包含以下信息：

### 功能请求模板

```markdown
## 功能描述

简要描述你希望添加的功能。

## 使用场景

描述在什么场景下需要这个功能。

## 建议方案

如果你有实现思路，请描述你的方案。

## 替代方案

是否考虑过其他替代方案？

## 补充信息

其他相关信息或截图。
```

---

## 许可证

本项目采用 [MIT 许可证](../LICENSE) 开源。

提交贡献即表示你同意将你的代码以 MIT 许可证发布。MIT 许可证允许任何人自由使用、修改和分发代码，只需保留版权声明和许可证文本。

---

## 维护者联系方式

如有问题或建议，可通过以下方式联系项目维护者：

- **GitHub Issues**：在项目仓库中创建 Issue（推荐）
- **邮箱**：[maintainer@example.com]（请替换为实际邮箱）

我们会尽快回复你的问题。感谢你的贡献！
