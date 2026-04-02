# Vue3 + API 技术博客方案文档（V1）

- 文档日期：2026-04-01
- 适用项目：个人技术博客（AI 应用 + 嵌入式）
- 文档状态：可执行方案

## 1. 项目目标

构建一个以“技术内容沉淀”为核心的个人博客系统，满足以下目标：

1. 写作方式稳定：采用 `Markdown + Git` 进行内容生产与发布。
2. 面向公开传播：全站公开访问，强化 SEO，提升搜索可见度。
3. 架构可持续：前端与 API 分层，支持后续能力扩展。
4. 运维可控：在单台阿里云服务器上通过 Docker 完整部署。

## 2. 范围定义

### 2.1 V1 包含范围

1. 页面：`首页`、`文章列表`、`文章详情`、`标签页`、`项目页`、`关于页`。
2. 内容：文章与项目均通过本地文件（Markdown/JSON）维护。
3. 搜索：仅支持标题、摘要、标签搜索。
4. 聚合：标签/专题由 frontmatter 自动聚合。
5. 发布：`git push` 后自动部署上线。

### 2.2 V1 不包含范围

1. 评论系统
2. 访问分析面板
3. 后台登录与内容管理系统
4. 暗黑模式

## 3. 技术栈选型

### 3.1 前端

1. `Nuxt 3 + Vue 3`
2. 渲染策略：`SSG`（静态生成）
3. 视觉方向：浅色、蓝色系、简洁卡片布局

### 3.2 后端

1. `NestJS`
2. 提供中 API：搜索、标签/专题聚合等

### 3.3 数据层

1. `PostgreSQL`：搜索索引与聚合数据
2. `Redis`：搜索缓存与热点结果缓存

### 3.4 运维与部署

1. `Docker + Docker Compose`
2. `Nginx` 统一入口
3. `GitHub Actions + SSH` 自动部署到阿里云
4. HTTPS：`Let's Encrypt`

## 4. 信息架构与路由

### 4.1 主导航

1. 首页
2. 文章
3. 项目
4. 关于

### 4.2 路由规则

1. 文章详情：`/posts/<slug>`
2. 标签页：`/tags`、`/tags/<tag-slug>`
3. 项目页：`/projects`
4. 关于页：`/about`

## 5. 内容模型

### 5.1 文章 frontmatter 建议字段

```yaml
title: "示例标题"
slug: "example-post"
date: "2026-04-01"
updated: "2026-04-01"
summary: "文章摘要"
tags: ["ai", "embedded"]
topics: ["工程实践"]
pinned: false
status: "draft" # draft | published
lang: "zh-CN"
```

### 5.2 状态规则

1. `draft`：不进入公开页面、不生成 sitemap 条目。
2. `published`：可公开访问并参与聚合。
3. `pinned=true`：进入置顶池，首页/文章列表最多展示 3 篇。

## 6. API 设计（V1）

1. `GET /api/search?q=&page=&size=`
2. `GET /api/tags`
3. `GET /api/tags/:slug/posts`
4. `GET /api/topics`
5. `GET /api/topics/:slug/posts`
6. `GET /api/health`

### 6.1 搜索行为

1. 搜索字段：`title`、`summary`、`tags`。
2. 排序建议：标题命中权重 > 标签命中权重 > 摘要命中权重。
3. 返回字段：标题、摘要、标签、发布日期、slug。

## 7. SEO 方案（强 SEO）

1. 自动生成 `sitemap.xml`、`robots.txt`。
2. 全页面设置 `canonical`。
3. 文章页输出 `JSON-LD`（Article + Breadcrumb）。
4. 完整 `Open Graph` 与 `Twitter Card`。
5. 分类/标签列表配置合理索引策略，避免低质量重复页。
6. 资源优化：图片懒加载、静态压缩、关键资源优先加载。

## 8. Monorepo 结构建议

```text
.
├─ apps/
│  ├─ web/                # Nuxt 3
│  └─ api/                # NestJS
├─ content/
│  ├─ posts/              # 文章 Markdown
│  └─ projects/           # 项目 Markdown/JSON
├─ packages/
│  └─ content-schema/     # frontmatter 校验与共享类型
├─ infra/
│  ├─ docker/
│  ├─ nginx/
│  └─ scripts/
└─ docs/
   └─ plans/
```

## 9. 部署架构

1. `Nginx`：处理 HTTPS、静态资源、反向代理 `/api`。
2. `web`：提供 Nuxt SSG 产物。
3. `api`：NestJS 服务。
4. `postgres`：存储检索与聚合数据。
5. `redis`：缓存层。

### 9.1 自动化发布流程

1. 本地提交 Markdown/代码并 `git push`。
2. GitHub Actions 执行构建与检查。
3. 通过 SSH 登录阿里云服务器。
4. 拉取最新代码并执行 `docker compose up -d --build`。
5. 健康检查通过后完成切换。

## 10. 安全与稳定性基线

1. 仅开放 `80/443/22` 端口。
2. API 开启 DTO 校验与基础限流。
3. 数据库定期备份（建议每日增量 + 每周全量）。
4. 部署保留上一版本镜像，支持快速回滚。
5. 关键日志：Nginx 访问日志、API 错误日志、部署日志。

## 11. 里程碑计划

### M1：基础骨架（2~3 天）

1. Monorepo 初始化
2. Nuxt3/NestJS/PostgreSQL/Redis 接通
3. Docker Compose 基础环境可运行

### M2：内容与页面（3~5 天）

1. Markdown 内容读取与渲染
2. 首页、文章列表、文章详情、项目、关于、标签页完成
3. 置顶策略与列表排序完成

### M3：API 与搜索（2~4 天）

1. 内容索引构建任务
2. 搜索 API（标题/摘要/标签）
3. 标签/专题聚合 API

### M4：SEO 与上线（2~3 天）

1. sitemap/canonical/结构化数据接入
2. GitHub Actions 自动部署
3. HTTPS、生效验证与回滚演练

## 12. 验收标准

1. 通过 `git push` 可自动发布到线上。
2. 六个核心页面均可在桌面端与移动端正常访问。
3. 搜索可稳定命中标题/摘要/标签。
4. `draft` 内容不外露，置顶上限规则生效。
5. SEO 关键项（sitemap、canonical、JSON-LD）可验证通过。
6. HTTPS 证书有效且可自动续期。

## 13. 后续扩展（V2+）

1. 开启多语言（中英双语）
2. 搜索升级到正文全文检索
3. 增加专题页增强能力（手动排序、引导页）
4. 引入评论或订阅能力（按需要）

---

如需进入实施阶段，建议下一步产出：

1. `实施任务拆解文档`（按周与里程碑）
2. `仓库初始化清单`（命令级）
3. `服务器初始化清单`（Docker/Nginx/HTTPS）
