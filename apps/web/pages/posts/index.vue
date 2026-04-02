<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const size = 12;
const { buildUrl } = useSiteUrl();

function parsePage(input: unknown) {
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

const q = ref(typeof route.query.q === 'string' ? route.query.q : '');
const page = ref(parsePage(route.query.page));
const selectedTag = ref(typeof route.query.tag === 'string' ? route.query.tag : '');

const activeQuery = computed(() => q.value.trim());
const hasSearchQuery = computed(() => activeQuery.value.length > 0);
const hasSelectedTag = computed(() => selectedTag.value.length > 0);

const pageTitle = computed(() => {
  if (hasSelectedTag.value && hasSearchQuery.value) {
    return `Tag "${selectedTag.value}" + Search "${activeQuery.value}" | Posts | Doopex`;
  }

  if (hasSelectedTag.value) {
    return `Tag "${selectedTag.value}" | Posts | Doopex`;
  }

  if (hasSearchQuery.value) {
    return `Search "${activeQuery.value}" | Posts | Doopex`;
  }

  return 'Posts | Doopex';
});

const pageDescription = computed(() => {
  if (hasSelectedTag.value && hasSearchQuery.value) {
    return `Search results for "${activeQuery.value}" within tag "${selectedTag.value}" in AI and embedded technical posts.`;
  }

  if (hasSelectedTag.value) {
    return `Posts tagged with "${selectedTag.value}" in AI and embedded technical notes.`;
  }

  if (hasSearchQuery.value) {
    return `Search results for "${activeQuery.value}" in AI and embedded technical posts.`;
  }

  return 'Browse all technical posts about AI applications and embedded systems.';
});

useSeoMeta({
  title: () => pageTitle.value,
  description: () => pageDescription.value,
  ogTitle: () => pageTitle.value,
  ogDescription: () => pageDescription.value,
  ogType: 'website',
  ogUrl: buildUrl('/posts'),
  twitterCard: 'summary_large_image',
});

useHead({
  link: [{ rel: 'canonical', href: buildUrl('/posts') }],
});

const { data: tagsData, refresh: refreshTags } = useAsyncData('posts-tags', () => fetchTags(), {
  lazy: true,
  dedupe: 'defer',
  default: () => [],
});

const { data: listData, pending, error, refresh } = useAsyncData(
  'posts-list',
  async () => {
    if (hasSelectedTag.value) {
      return fetchTagPosts(selectedTag.value, page.value, size, activeQuery.value);
    }

    if (hasSearchQuery.value) {
      return fetchSearch(activeQuery.value, page.value, size);
    }

    return fetchPosts(page.value, size);
  },
  {
    lazy: true,
    default: () => ({
      total: 0,
      page: 1,
      size,
      items: [],
    }),
    watch: [activeQuery, selectedTag, page],
  },
);

const autoRetryCount = ref(0);
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const maxAutoRetry = 2;

watch(error, (nextError) => {
  if (!nextError || autoRetryCount.value >= maxAutoRetry) {
    return;
  }

  const delay = 350 * (autoRetryCount.value + 1);
  autoRetryCount.value += 1;

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  retryTimer = setTimeout(async () => {
    await Promise.all([refresh(), refreshTags()]);
  }, delay);
});

watch([activeQuery, selectedTag, page], () => {
  autoRetryCount.value = 0;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
});

onBeforeUnmount(() => {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
});

const hasItems = computed(() => (listData.value?.items?.length ?? 0) > 0);
const isErrorWithoutData = computed(() => Boolean(error.value) && !hasItems.value);
const showEmptyState = computed(() => !pending.value && !error.value && !hasItems.value);

const total = computed(() => listData.value?.total ?? 0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size)));
const showPagination = computed(() => total.value > size);
const featuredPost = computed(() => listData.value?.items?.[0] ?? null);
const restPosts = computed(() => listData.value?.items?.slice(1) ?? []);

const heroSummary = computed(() => {
  if (hasSelectedTag.value && hasSearchQuery.value) {
    return `聚焦标签「${selectedTag.value}」，并检索关键词「${activeQuery.value}」下的相关文章。`;
  }

  if (hasSelectedTag.value) {
    return `围绕标签「${selectedTag.value}」浏览相关文章、调试记录与系统设计笔记。`;
  }

  if (hasSearchQuery.value) {
    return `查看关键词「${activeQuery.value}」相关的文章结果与内容入口。`;
  }

  return '这里收录关于 AI 应用、嵌入式系统与工程实践的长期写作与阶段复盘。';
});

const filterHint = computed(() => {
  if (hasSelectedTag.value && hasSearchQuery.value) {
    return `当前筛选：标签 ${selectedTag.value} + 关键词 ${activeQuery.value}`;
  }

  if (hasSelectedTag.value) {
    return `当前标签：${selectedTag.value}`;
  }

  if (hasSearchQuery.value) {
    return `当前搜索：${activeQuery.value}`;
  }

  return '';
});

watch(totalPages, (pages) => {
  if (page.value > pages) {
    page.value = pages;
  }
});

watch(
  () => route.query,
  (query) => {
    const nextQ = typeof query.q === 'string' ? query.q : '';
    const nextTag = typeof query.tag === 'string' ? query.tag : '';
    const nextPage = parsePage(query.page);

    if (q.value !== nextQ) q.value = nextQ;
    if (selectedTag.value !== nextTag) selectedTag.value = nextTag;
    if (page.value !== nextPage) page.value = nextPage;
  },
);

watch([activeQuery, selectedTag, page], async ([query, tag, nextPage]) => {
  const nextQuery: Record<string, string> = {};
  if (query) nextQuery.q = query;
  if (tag) nextQuery.tag = tag;
  if (nextPage > 1) nextQuery.page = String(nextPage);

  const current = route.query;
  const currentQ = typeof current.q === 'string' ? current.q : '';
  const currentTag = typeof current.tag === 'string' ? current.tag : '';
  const currentPage = parsePage(current.page);

  if (
    currentQ === (nextQuery.q ?? '') &&
    currentTag === (nextQuery.tag ?? '') &&
    currentPage === parsePage(nextQuery.page)
  ) {
    return;
  }

  await router.replace({ query: nextQuery });
});

function onSearch() {
  page.value = 1;
}

function selectTag(slug: string) {
  if (selectedTag.value === slug) return;
  selectedTag.value = slug;
  page.value = 1;
}

function clearTag() {
  if (!selectedTag.value) return;
  selectedTag.value = '';
  page.value = 1;
}

async function retryLoad() {
  autoRetryCount.value = 0;
  await Promise.all([refresh(), refreshTags()]);
}
</script>

<template>
  <div class="page-stack">
    <section class="posts-hero">
      <div class="hero-copy">
        <p class="hero-kicker">Journal / Posts</p>
        <h1 class="hero-title">文章</h1>
        <p class="hero-description">{{ heroSummary }}</p>

        <div class="hero-meta">
          <span class="hero-stat">{{ total }} 篇文章</span>
          <span class="hero-stat">{{ tagsData?.length ?? 0 }} 个标签</span>
          <span class="hero-stat">长期更新中</span>
        </div>

        <p v-if="filterHint" class="filter-hint">{{ filterHint }}</p>
      </div>

      <div class="hero-tools">
        <form class="search-shell" @submit.prevent="onSearch">
          <label class="search-label" for="post-search">搜索文章</label>
          <div class="search-row">
            <input
              id="post-search"
              v-model="q"
              type="search"
              placeholder="搜索标题、摘要、标签"
            />
            <button type="submit">搜索</button>
          </div>
        </form>

        <div class="tag-filter">
          <button class="tag-chip" :class="{ active: !selectedTag }" type="button" @click="clearTag">
            全部
          </button>
          <button
            v-for="tag in tagsData ?? []"
            :key="tag.slug"
            class="tag-chip"
            :class="{ active: selectedTag === tag.slug }"
            type="button"
            @click="selectTag(tag.slug)"
          >
            <span>{{ tag.name }}</span>
            <em>{{ tag.count }}</em>
          </button>
        </div>
      </div>
    </section>

    <section class="posts-section">
      <div v-if="pending" class="posts-skeleton">
        <article class="card skeleton-card featured-skeleton">
          <span class="skeleton-line h-22 w-40" />
          <span class="skeleton-line w-70" />
          <span class="skeleton-line" />
          <span class="skeleton-line w-55" />
        </article>

        <div class="skeleton-grid">
          <article v-for="item in 4" :key="`post-list-skeleton-${item}`" class="card skeleton-card">
            <span class="skeleton-line h-22 w-70" />
            <span class="skeleton-line" />
            <span class="skeleton-line w-55" />
            <span class="skeleton-line w-40" />
          </article>
        </div>
      </div>

      <DataState
        v-else-if="isErrorWithoutData"
        type="error"
        title="文章加载失败"
        message="请稍后重试，或检查后端服务是否可用。"
        action-text="重新加载"
        @action="retryLoad"
      />

      <template v-else>
        <DataState v-if="showEmptyState" type="empty" message="当前条件下暂时没有文章。" />

        <div v-else class="posts-layout">
          <PostCard v-if="featuredPost" :post="featuredPost" featured />

          <div v-if="restPosts.length" class="post-grid-compact">
            <PostCard v-for="post in restPosts" :key="post.slug" :post="post" />
          </div>
        </div>

        <div class="result-footer">
          <div class="result-row">
            <p class="result-total">共 {{ total }} 篇</p>
            <div v-if="showPagination" class="pager">
              <button type="button" :disabled="page <= 1" @click="page -= 1">上一页</button>
              <span>第 {{ page }} / {{ totalPages }} 页</span>
              <button type="button" :disabled="page >= totalPages" @click="page += 1">下一页</button>
            </div>
          </div>

          <div class="footer-rail">
            <article class="footer-note">
              <span>阅读方式</span>
              <strong>优先看首篇入口，再顺着标签继续深入。</strong>
            </article>
            <article class="footer-note">
              <span>继续浏览</span>
              <strong v-if="selectedTag">当前标签下继续查看更多相关文章。</strong>
              <strong v-else>可按标签筛选，或直接搜索你关心的话题。</strong>
            </article>
            <article class="footer-note">
              <span>内容方向</span>
              <strong>AI 应用、调试手记、系统设计与工程复盘。</strong>
            </article>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.page-stack {
  display: grid;
  gap: 2rem;
}

.posts-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(20rem, 28rem);
  gap: 1.6rem 2rem;
  align-items: end;
  padding: 0.6rem 0 1.1rem;
  border-bottom: 1px solid rgba(217, 228, 248, 0.72);
}

.hero-copy {
  max-width: 42rem;
}

.hero-kicker {
  margin: 0 0 0.65rem;
  color: var(--brand);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.hero-title {
  margin: 0;
  font-size: clamp(2.4rem, 4vw, 3.4rem);
}

.hero-description {
  margin: 0.9rem 0 0;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.85;
  max-width: 38rem;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.hero-stat {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.28rem 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(217, 228, 248, 0.78);
  color: var(--text-muted);
  font-size: 0.86rem;
  font-weight: 600;
}

.filter-hint {
  margin: 1rem 0 0;
  color: var(--brand-deep);
  font-size: 0.9rem;
  font-weight: 600;
}

.hero-tools {
  display: grid;
  gap: 0.9rem;
}

.search-shell {
  padding: 1rem;
  border-radius: 20px;
  border: 1px solid rgba(217, 228, 248, 0.8);
  background: rgba(255, 255, 255, 0.56);
  box-shadow: 0 16px 34px rgba(22, 58, 124, 0.05);
  backdrop-filter: blur(12px);
}

.search-label {
  display: block;
  margin-bottom: 0.6rem;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.search-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.7rem;
}

.search-row input,
.search-row button {
  height: 2.95rem;
  border-radius: 12px;
  border: 1px solid rgba(217, 228, 248, 0.92);
  font-size: 0.95rem;
}

.search-row input {
  padding: 0 0.9rem;
  background: rgba(255, 255, 255, 0.96);
  color: var(--text);
}

.search-row button {
  padding: 0 1.2rem;
  background: linear-gradient(135deg, var(--brand), #3b7dff);
  color: #fff;
  border-color: transparent;
  cursor: pointer;
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.tag-chip {
  min-height: 2.2rem;
  padding: 0.35rem 0.78rem;
  border: 1px solid rgba(217, 228, 248, 0.82);
  background: rgba(255, 255, 255, 0.68);
  color: var(--text-muted);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.84rem;
  cursor: pointer;
}

.tag-chip em {
  font-style: normal;
  color: rgba(87, 103, 129, 0.75);
}

.tag-chip.active {
  color: var(--brand-deep);
  border-color: rgba(20, 72, 176, 0.25);
  background: #eef4ff;
}

.posts-section {
  display: grid;
  gap: 1.4rem;
  min-height: 34rem;
}

.posts-skeleton {
  display: grid;
  gap: 1rem;
}

.featured-skeleton {
  min-height: 240px;
}

.posts-layout {
  display: grid;
  gap: 1rem;
}

.post-grid-compact {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.result-footer {
  display: grid;
  gap: 1rem;
  padding-top: 0.2rem;
}

.result-row {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.result-total {
  margin: 0;
  color: var(--text-muted);
}

.pager {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.pager button {
  height: 2.2rem;
  border-radius: 10px;
  border: 1px solid rgba(217, 228, 248, 0.9);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
  padding: 0 0.9rem;
  cursor: pointer;
}

.pager button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pager span {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.footer-rail {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  padding: 1rem 0 0.2rem;
  border-top: 1px solid rgba(217, 228, 248, 0.72);
}

.footer-note span {
  display: block;
  margin-bottom: 0.45rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.footer-note strong {
  line-height: 1.7;
  font-size: 0.96rem;
  letter-spacing: -0.01em;
}

@media (max-width: 1024px) {
  .posts-hero {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .post-grid-compact {
    grid-template-columns: 1fr;
  }

  .footer-rail {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .page-stack {
    gap: 1.6rem;
  }

  .search-row {
    grid-template-columns: 1fr;
  }
}
</style>
