# ============================================================
# 插件模板示例 - 后端 Dockerfile (TypeScript 多阶段构建)
# ============================================================
# 使用多阶段构建：
#   阶段 1 (builder)：安装全部依赖，编译 TypeScript 为 JavaScript
#   阶段 2 (production)：仅包含生产依赖和编译产物
#
# 构建命令：
#   docker build -t plugin-template-backend .
#
# 运行命令：
#   docker run -p 8085:8085 plugin-template-backend
# ============================================================

# ---- 阶段 1：构建 ----
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 先复制依赖文件和 TypeScript 配置，利用 Docker 层缓存
COPY package.json package-lock.json* tsconfig.json ./

# 安装全部依赖（包括 devDependencies，用于 tsc 编译）
RUN npm install

# 复制 TypeScript 源代码
COPY src/ ./src/

# 编译 TypeScript 为 JavaScript
RUN npm run build

# ---- 阶段 2：生产 ----
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json* ./

# 仅安装生产依赖
RUN npm install --production

# 从构建阶段复制编译产物
COPY --from=builder /app/dist ./dist

# 暴露服务端口
EXPOSE 8085

# 启动 Express 服务
CMD ["node", "dist/index.js"]
