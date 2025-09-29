# Index-home Docker 镜像

基于 Next.js 14 App Router 的内容门户系统，支持语雀集成、本地 MDX 内容、PWA 等功能。

## 快速开始

### 使用 Docker 运行

```bash
# 拉取并运行最新版本
docker run -d \
  --name index-home \
  -p 3000:3000 \
  lushi78778/index-home:latest

# 访问应用
open http://localhost:3000
```

### 使用 Docker Compose

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'
services:
  index-home:
    image: lushi78778/index-home:latest
    ports:
      - "3000:3000"
    environment:
      # 站点基础配置
      - NEXT_PUBLIC_SITE_URL=http://localhost:3000
      
      # 语雀集成（可选）
      - YUQUE_TOKEN=your_yuque_token
      - YUQUE_LOGIN=your_yuque_login
      
      # 邮件服务（可选）
      - RESEND_API_KEY=your_resend_api_key
      - CONTACT_TO_EMAIL=contact@example.com
      
      # Redis 限流（可选）
      - UPSTASH_REDIS_REST_URL=your_redis_url
      - UPSTASH_REDIS_REST_TOKEN=your_redis_token
      
      # 其他配置
      - REVALIDATE_SECRET=your_secret_key
    restart: unless-stopped
```

然后运行：

```bash
docker-compose up -d
```

## 镜像信息

- **基础镜像**: `gcr.io/distroless/nodejs20-debian12:nonroot` (默认) / `node:20-alpine` (备选)
- **架构支持**: `linux/amd64`, `linux/arm64`
- **镜像大小**: ~178MB (distroless) / ~180MB (alpine)
- **运行用户**: `nonroot` / `nextjs` (非 root)
- **暴露端口**: `3000`
- **优化特性**: 多阶段构建、standalone 输出、最小化运行时依赖

## 环境变量

### 必需环境变量
- `NEXT_PUBLIC_SITE_URL`: 站点访问 URL

### 可选环境变量
- `YUQUE_TOKEN`: 语雀 API Token
- `YUQUE_LOGIN`: 语雀用户名
- `RESEND_API_KEY`: Resend 邮件服务 API Key
- `CONTACT_TO_EMAIL`: 联系表单接收邮箱
- `UPSTASH_REDIS_REST_URL`: Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis Token
- `REVALIDATE_SECRET`: ISR 重新验证密钥

## 标签说明

- `latest`: 最新稳定版本
- `v1.x.x`: 具体版本号
- `v1.x`: 主版本号（如 v1.0、v1.1）
- `v1`: 大版本号

## 健康检查

容器启动后可通过以下端点检查状态：

```bash
# 基础健康检查
curl http://localhost:3000/api/yuque/health

# 站点地图
curl http://localhost:3000/sitemap.xml

# RSS 订阅
curl http://localhost:3000/rss.xml
```

## 数据持久化

镜像为无状态设计，所有内容来源于：
- 语雀 API（实时获取）
- 构建时打包的本地 MDX 文件
- 外部 Redis（缓存和限流）

无需挂载数据卷。

## 源码与支持

- **GitHub**: https://github.com/lushi78778/Index-home
- **问题反馈**: https://github.com/lushi78778/Index-home/issues
- **文档**: https://github.com/lushi78778/Index-home#readme

## 构建选项

### Distroless 版本（推荐，更安全）
```bash
# 构建 distroless 版本（默认 Dockerfile）
docker build -t index-home:distroless .
```

### Alpine 版本（更熟悉的环境）
```bash
# 构建 Alpine 版本
docker build -f Dockerfile.alpine -t index-home:alpine .
```

### 镜像对比
| 版本 | 基础镜像 | 大小 | 特点 |
|------|----------|------|------|
| Distroless | gcr.io/distroless/nodejs20 | ~178MB | 更安全，无 shell，Google 维护 |
| Alpine | node:20-alpine | ~180MB | 包含基础工具，传统 Linux 环境 |

## 许可证

MIT License