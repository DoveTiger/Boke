# @boke/web

Nuxt 3 前端应用，页面包括：

1. 首页
2. 文章列表与搜索
3. 文章详情
4. 标签页与标签文章页
5. 专题文章页
6. 项目页
7. 关于页

## 运行

```bash
npm install
npm run web:dev
```

默认地址：`http://localhost:3001`（Nuxt dev 会自动选择可用端口）。

## API 对接

默认读取：`http://127.0.0.1:3000/api`

可通过环境变量覆盖：

```bash
NUXT_PUBLIC_API_BASE=http://127.0.0.1:3000/api
```

## 构建

```bash
npm run web:build
```
