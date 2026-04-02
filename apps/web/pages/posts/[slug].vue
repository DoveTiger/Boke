<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import type { PostSummary } from '~/types/api';

const route = useRoute();
const slug = computed(() => String(route.params.slug || ''));
const { buildUrl } = useSiteUrl();

const {
  data: post,
  pending,
  error,
  refresh: refreshPost,
} = useAsyncData(
  'post-detail',
  async () => {
    if (!slug.value) {
      return null;
    }

    return fetchPostBySlug(slug.value);
  },
  {
    lazy: true,
    default: () => null,
    watch: [slug],
  },
);

const {
  data: relations,
  refresh: refreshRelations,
} = useAsyncData(
  'post-relations',
  async () => {
    if (!slug.value) {
      return null;
    }

    try {
      return await fetchPostRelations(slug.value);
    } catch {
      return null;
    }
  },
  {
    lazy: true,
    default: () => null,
    watch: [slug],
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
    await Promise.all([refreshPost(), refreshRelations()]);
  }, delay);
});

watch(slug, () => {
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

const previousPost = computed<PostSummary | null>(() => relations.value?.previous ?? null);
const nextPost = computed<PostSummary | null>(() => relations.value?.next ?? null);
const relatedPosts = computed<PostSummary[]>(() => relations.value?.related ?? []);

const pageTitle = computed(() => (post.value ? `${post.value.title} | Doopex` : 'Post | Doopex'));
const pageDescription = computed(
  () => post.value?.summary || 'Technical notes on AI applications and embedded systems.',
);
const canonicalUrl = computed(() => buildUrl(`/posts/${encodeURIComponent(slug.value)}`));
const articleJsonLd = computed(() => {
  if (!post.value) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.value.title,
    description: post.value.summary,
    datePublished: post.value.date,
    dateModified: post.value.updated || post.value.date,
    keywords: post.value.tags,
    inLanguage: post.value.lang || 'zh-CN',
    mainEntityOfPage: canonicalUrl.value,
    author: {
      '@type': 'Person',
      name: 'Doopex',
    },
  };
});

useSeoMeta({
  title: () => pageTitle.value,
  description: () => pageDescription.value,
  ogTitle: () => pageTitle.value,
  ogDescription: () => pageDescription.value,
  ogType: 'article',
  ogUrl: () => canonicalUrl.value,
  twitterCard: 'summary_large_image',
});

useHead(() => ({
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
  script: articleJsonLd.value
    ? [
        {
          key: 'ld-article',
          type: 'application/ld+json',
          children: JSON.stringify(articleJsonLd.value),
        },
      ]
    : [],
}));

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const renderedContent = computed(() => {
  const content = post.value?.content ?? '';
  return md.render(content);
});

type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

const contentRef = ref<HTMLElement | null>(null);
const tocItems = ref<TocItem[]>([]);
const activeHeadingId = ref('');
const readingProgress = ref(0);
let headingObserver: IntersectionObserver | null = null;

function calcReadingProgress() {
  const content = contentRef.value;
  if (!content) {
    readingProgress.value = 0;
    return;
  }

  const rect = content.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const scrollableDistance = content.scrollHeight - viewportHeight * 0.35;

  if (scrollableDistance <= 0) {
    readingProgress.value = rect.top <= 0 ? 100 : 0;
    return;
  }

  const passedDistance = Math.min(Math.max(-rect.top + 80, 0), scrollableDistance);
  readingProgress.value = Math.round((passedDistance / scrollableDistance) * 100);
}

function createHeadingId(text: string, index: number) {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${normalized || 'section'}-${index + 1}`;
}

function setupTocAndCopy() {
  const content = contentRef.value;
  if (!content) return;

  if (headingObserver) {
    headingObserver.disconnect();
    headingObserver = null;
  }

  const headings = Array.from(content.querySelectorAll('h2, h3')) as HTMLHeadingElement[];
  tocItems.value = headings.map((heading, index) => {
    const headingText = heading.textContent?.trim() || `section-${index + 1}`;
    const id = createHeadingId(headingText, index);
    const level = heading.tagName === 'H3' ? 3 : 2;
    heading.id = id;

    return {
      id,
      text: headingText,
      level,
    };
  });

  activeHeadingId.value = tocItems.value[0]?.id ?? '';

  if (headings.length > 0) {
    headingObserver = new IntersectionObserver(
      (entries) => {
        const visibleHeading = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visibleHeading) {
          activeHeadingId.value = (visibleHeading.target as HTMLElement).id;
        }
      },
      {
        rootMargin: '-120px 0px -55% 0px',
        threshold: [0, 1],
      },
    );

    headings.forEach((heading) => headingObserver?.observe(heading));
  }

  const preBlocks = Array.from(content.querySelectorAll('pre')) as HTMLElement[];
  preBlocks.forEach((pre) => {
    if (pre.querySelector('.code-copy-btn')) return;

    const code = pre.querySelector('code');
    if (!code) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy-btn';
    btn.textContent = '复制';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent ?? '');
        btn.textContent = '已复制';
        setTimeout(() => {
          btn.textContent = '复制';
        }, 1200);
      } catch {
        btn.textContent = '失败';
        setTimeout(() => {
          btn.textContent = '复制';
        }, 1200);
      }
    });

    pre.appendChild(btn);
  });
}

function scrollToHeading(id: string) {
  const heading = document.getElementById(id);
  if (!heading) return;

  const top = heading.getBoundingClientRect().top + window.scrollY - 92;
  window.scrollTo({ top, behavior: 'smooth' });
}

async function retryPostDetail() {
  autoRetryCount.value = 0;
  await Promise.all([refreshPost(), refreshRelations()]);
}

watch([post, renderedContent], async () => {
  await nextTick();
  setupTocAndCopy();
  calcReadingProgress();
});

onMounted(() => {
  window.addEventListener('scroll', calcReadingProgress, { passive: true });
  window.addEventListener('resize', calcReadingProgress, { passive: true });

  nextTick(() => {
    setupTocAndCopy();
    calcReadingProgress();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', calcReadingProgress);
  window.removeEventListener('resize', calcReadingProgress);

  if (headingObserver) {
    headingObserver.disconnect();
    headingObserver = null;
  }
});
</script>

<template>
  <article v-if="post" class="card detail">
    <div class="reading-progress" :style="{ width: `${readingProgress}%` }" />
    <h1>{{ post.title }}</h1>
    <p class="summary">{{ post.summary }}</p>
    <div class="meta">
      <time>{{ post.date }}</time>
      <span v-for="tag in post.tags" :key="tag" class="pill">{{ tag }}</span>
    </div>
    <div class="detail-layout">
      <aside v-if="tocItems.length" class="toc-panel">
        <p class="toc-title">目录</p>
        <button
          v-for="item in tocItems"
          :key="item.id"
          type="button"
          class="toc-link"
          :class="[`level-${item.level}`, { active: activeHeadingId === item.id }]"
          @click="scrollToHeading(item.id)"
        >
          {{ item.text }}
        </button>
      </aside>
      <section ref="contentRef" class="markdown-body" v-html="renderedContent" />
    </div>

    <div class="post-footer">
      <nav v-if="previousPost || nextPost" class="post-nav">
        <NuxtLink v-if="previousPost" class="nav-item" :to="`/posts/${previousPost.slug}`">
          <span class="nav-label">上一篇</span>
          <span class="nav-title">{{ previousPost.title }}</span>
        </NuxtLink>
        <NuxtLink v-if="nextPost" class="nav-item nav-item-right" :to="`/posts/${nextPost.slug}`">
          <span class="nav-label">下一篇</span>
          <span class="nav-title">{{ nextPost.title }}</span>
        </NuxtLink>
      </nav>

      <section v-if="relatedPosts.length" class="related-posts">
        <h2>相关文章</h2>
        <div class="related-grid">
          <NuxtLink v-for="item in relatedPosts" :key="item.slug" class="related-card" :to="`/posts/${item.slug}`">
            <h3>{{ item.title }}</h3>
            <p>{{ item.summary }}</p>
            <span>{{ item.date }}</span>
          </NuxtLink>
        </div>
      </section>
    </div>
  </article>

  <DataState v-else-if="pending" type="loading" message="加载中..." />
  <DataState
    v-else-if="error"
    type="error"
    title="文章加载失败"
    message="请稍后重试，或检查后端服务是否可用。"
    action-text="重新加载"
    @action="retryPostDetail"
  />
</template>

<style scoped>
.detail {
  padding: 1.5rem;
  position: relative;
}

.reading-progress {
  position: fixed;
  top: 68px;
  left: 0;
  height: 3px;
  width: 0;
  z-index: 30;
  border-radius: 0 2px 2px 0;
  background: linear-gradient(90deg, var(--brand), #3b7dff);
  transition: width 80ms linear;
}

h1 {
  margin: 0;
  font-size: clamp(1.6rem, 2.6vw, 2.3rem);
}

.summary {
  margin: 1rem 0;
  color: var(--text-muted);
  line-height: 1.7;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  margin-bottom: 1rem;
}

time {
  color: var(--text-muted);
  margin-right: 0.35rem;
}

.detail-layout {
  display: flex;
  gap: 1.4rem;
}

.toc-panel {
  width: 210px;
  flex-shrink: 0;
  position: sticky;
  top: 90px;
  max-height: calc(100vh - 120px);
  overflow: auto;
  border-left: 1px solid var(--border);
  padding-left: 0.75rem;
}

.toc-title {
  margin: 0 0 0.55rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.toc-link {
  width: 100%;
  text-align: left;
  border: 0;
  padding: 0.32rem 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.84rem;
  cursor: pointer;
}

.toc-link.level-3 {
  padding-left: 0.7rem;
}

.toc-link.active {
  color: var(--brand-deep);
}

.markdown-body {
  color: var(--text);
  line-height: 1.8;
  flex: 1;
  min-width: 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  margin: 1.3rem 0 0.8rem;
  font-family: 'Space Grotesk', sans-serif;
}

.markdown-body :deep(p) {
  margin: 0.85rem 0;
}

.markdown-body :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  background: #eef3ff;
  border-radius: 6px;
  padding: 0.1rem 0.35rem;
}

.markdown-body :deep(pre) {
  position: relative;
  background: #0f1b33;
  color: #e8efff;
  border-radius: 10px;
  padding: 0.9rem;
  overflow: auto;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.markdown-body :deep(.code-copy-btn) {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: 1px solid var(--border);
  background: #172646;
  color: #d6e3ff;
  border-radius: 6px;
  font-size: 0.74rem;
  padding: 0.16rem 0.55rem;
  cursor: pointer;
}

.markdown-body :deep(a) {
  color: var(--brand-deep);
}

.post-footer {
  margin-top: 2rem;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.post-nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.nav-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.85rem 0.95rem;
  color: inherit;
  text-decoration: none;
  background: #fff;
}

.nav-item-right {
  text-align: right;
}

.nav-label {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.nav-title {
  font-size: 0.96rem;
  line-height: 1.5;
}

.related-posts {
  margin-top: 1.1rem;
}

.related-posts h2 {
  margin: 0 0 0.75rem;
  font-size: 1.08rem;
}

.related-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.related-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.8rem;
  background: #fff;
  color: inherit;
  text-decoration: none;
}

.related-card h3 {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
}

.related-card p {
  margin: 0.45rem 0 0.6rem;
  color: var(--text-muted);
  font-size: 0.84rem;
  line-height: 1.5;
}

.related-card span {
  color: var(--text-muted);
  font-size: 0.8rem;
}

@media (max-width: 1100px) {
  .toc-panel {
    display: none;
  }
}

@media (max-width: 900px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .reading-progress {
    top: 64px;
  }

  .post-nav {
    grid-template-columns: 1fr;
  }

  .nav-item-right {
    text-align: left;
  }
}
</style>
