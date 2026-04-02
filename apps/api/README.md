# @boke/api

独立后端服务（NestJS），提供博客中 API：

1. `GET /api/health`
2. `GET /api/posts?page=&size=`
3. `GET /api/posts/:slug`（返回正文 `content`）
4. `GET /api/search?q=&page=&size=`
5. `GET /api/tags`
6. `GET /api/tags/:slug/posts`
7. `GET /api/topics`
8. `GET /api/topics/:slug/posts`

## 运行

```bash
npm install
npm run api:dev
```

默认端口 `3000`，可通过环境变量覆盖。

## 环境变量

复制 `apps/api/.env.example` 到 `apps/api/.env` 后按需调整：

- `PORT`：服务端口
- `CONTENT_ROOT`：Markdown 内容目录（默认自动探测 `content/posts`）
- `INDEX_DRIVER`：索引后端（`memory` 或 `postgres`）
- `DATABASE_URL`：PostgreSQL 连接串（当 `INDEX_DRIVER=postgres` 时必填）
- `REDIS_URL`：Redis 连接串（可选，用于结果缓存）
- `CACHE_TTL_SECONDS`：缓存 TTL 秒数

## 测试

```bash
npm run api:test
```

当前 e2e 测试覆盖：health、search、tags、topics 主要行为。

## Docker 本地启动（含 PostgreSQL + Redis）

```bash
copy infra\\docker\\.env.example infra\\docker\\.env
powershell -ExecutionPolicy Bypass -File infra\\scripts\\backend-up.ps1 -Build
```

启动后访问：

1. API: `http://localhost:3000/api/health`
2. PostgreSQL: `localhost:5432`
3. Redis: `localhost:6379`

停止：

```bash
powershell -ExecutionPolicy Bypass -File infra\\scripts\\backend-down.ps1
```
