# Posts List Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将文章列表页改造成更有栏目感、内容感和收尾感的博客列表页。

**Architecture:** 保持当前 `posts/index.vue` 的数据获取与 URL 同步逻辑不变，重点重构模板与样式结构。通过扩展 `PostCard.vue` 支持 featured 变体，建立文章列表主次关系，同时补充列表页底部的轻量收尾模块。

**Tech Stack:** Nuxt 3, Vue 3 `<script setup>`, scoped CSS

---

### Task 1: 重构文章列表页头部

**Files:**
- Modify: `apps/web/pages/posts/index.vue`

**Steps:**
1. 保留搜索、标签、分页逻辑。
2. 将页头改为栏目介绍区，加入标题、副标题、筛选摘要与轻量搜索入口。
3. 把标签区改为更轻的胶囊式筛选条。

### Task 2: 建立文章列表主次关系

**Files:**
- Modify: `apps/web/pages/posts/index.vue`
- Modify: `apps/web/components/PostCard.vue`

**Steps:**
1. 将列表第一篇作为 featured 入口展示。
2. 其余文章保持网格，但压缩尺寸并补足元信息层级。
3. 为 `PostCard` 增加 featured 变体样式。

### Task 3: 完善底部收尾

**Files:**
- Modify: `apps/web/pages/posts/index.vue`

**Steps:**
1. 调整结果统计与分页样式。
2. 增加轻量 footer rail，承接“继续浏览”与页面结束区域。
3. 确保文章较少时页面底部仍有视觉收尾。

### Task 4: 验证

**Files:**
- None

**Steps:**
1. 运行 `npm run web:build`
2. 检查是否存在编译错误。
