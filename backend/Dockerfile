# ============================================================
# 插件模板示例 - 后端 Dockerfile
# ============================================================
# 使用 Node.js 18 Alpine 镜像运行 Express API 服务
#
# 构建命令：
#   docker build -t plugin-template-backend .
#
# 运行命令：
#   docker run -p 8085:8085 plugin-template-backend
# ============================================================

FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 先复制依赖文件，利用 Docker 层缓存
# 只有 package.json 变化时才重新安装依赖
COPY package.json package-lock.json* ./

# 安装生产依赖（不安装 devDependencies）
RUN npm install --production

# 复制源代码
COPY . .

# 暴露服务端口
EXPOSE 8085

# 启动 Express 服务
CMD ["node", "src/index.js"]
