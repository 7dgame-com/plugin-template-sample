# ============================================================
# 插件模板示例 - 前端 Dockerfile
# ============================================================
# 多阶段构建：
#   1. 构建阶段 - 使用 Node.js 编译 Vue 3 + TypeScript 项目
#   2. 服务阶段 - 使用 Nginx 提供静态文件服务
#
# 构建命令：
#   docker build -t plugin-template-frontend .
#
# 运行命令：
#   docker run -p 3003:80 \
#     -e APP_API_1_URL=http://api:80 \
#     plugin-template-frontend
# ============================================================

# ========== 第一阶段：构建 ==========
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 先复制依赖文件，利用 Docker 层缓存
# 只有 package.json 或 package-lock.json 变化时才重新安装依赖
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建生产版本
RUN npx vite build

# ========== 第二阶段：Nginx 服务 ==========
FROM nginx:alpine

# 复制 Nginx 配置模板（由 docker-entrypoint.sh 动态处理占位符）
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# 复制自定义 entrypoint 脚本（动态生成负载均衡配置）
COPY docker-entrypoint.sh /docker-entrypoint-custom.sh
RUN chmod +x /docker-entrypoint-custom.sh

# 从构建阶段复制编译产物到 Nginx 静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 生成健康检查文件
RUN echo "{\"status\":\"ok\",\"buildTime\":\"$(TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M:%S')\"}" > /usr/share/nginx/html/health.json

# 暴露端口（Nginx 默认 80 端口）
EXPOSE 80

# 使用自定义 entrypoint（动态生成 Nginx 配置后启动 Nginx）
ENTRYPOINT ["/docker-entrypoint-custom.sh"]
