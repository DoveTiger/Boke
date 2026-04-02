<script setup lang="ts">
const { buildUrl } = useSiteUrl();

useSeoMeta({
  title: 'Doopex | AI & Embedded Blog',
  description: 'Technical notes on AI applications and embedded systems.',
  ogTitle: 'Doopex | AI & Embedded Blog',
  ogDescription: 'Technical notes on AI applications and embedded systems.',
  ogType: 'website',
  ogUrl: buildUrl('/'),
  twitterCard: 'summary_large_image',
});

useHead({
  link: [{ rel: 'canonical', href: buildUrl('/') }],
});

const {
  data: postData,
  pending: postsPending,
  error: postsError,
  refresh: refreshPosts,
} = useAsyncData('home-posts', () => fetchPosts(1, 6), {
  dedupe: 'defer',
  lazy: true,
  default: () => ({ total: 0, page: 1, size: 6, items: [] }),
});

const {
  data: topicData,
  pending: topicsPending,
  error: topicsError,
  refresh: refreshTopics,
} = useAsyncData('home-topics', () => fetchTopics(), {
  dedupe: 'defer',
  lazy: true,
  default: () => [],
});

const postsRetried = ref(false);
const topicsRetried = ref(false);

const showPostsError = computed(() => Boolean(postsError.value) && !postsPending.value && postsRetried.value);
const showTopicsError = computed(() => Boolean(topicsError.value) && !topicsPending.value && topicsRetried.value);
const showPostsEmpty = computed(
  () => !postsPending.value && !postsError.value && (postData.value?.items?.length ?? 0) === 0,
);
const showTopicsEmpty = computed(
  () => !topicsPending.value && !topicsError.value && (topicData.value?.length ?? 0) === 0,
);

const latestPost = computed(() => postData.value?.items?.[0] ?? null);
const primaryTopic = computed(() => topicData.value?.[0] ?? null);

const heroTags = computed(() => {
  const tags = new Set<string>();

  for (const post of postData.value?.items ?? []) {
    for (const tag of post.tags) {
      tags.add(tag);

      if (tags.size >= 3) {
        return Array.from(tags);
      }
    }
  }

  return Array.from(tags);
});

const archiveSummary = computed(() => {
  const totalPosts = postData.value?.total ?? 0;
  const totalTopics = topicData.value?.length ?? 0;

  if (!totalPosts && !totalTopics) {
    return '保持更新中';
  }

  return `${totalPosts} 篇文章 · ${totalTopics} 个专题`;
});

watch(postsError, async (err) => {
  if (!err) {
    postsRetried.value = false;
    return;
  }

  if (postsRetried.value) return;
  postsRetried.value = true;
  await refreshPosts();
});

watch(topicsError, async (err) => {
  if (!err) {
    topicsRetried.value = false;
    return;
  }

  if (topicsRetried.value) return;
  topicsRetried.value = true;
  await refreshTopics();
});

async function retryPosts() {
  postsRetried.value = false;
  await refreshPosts();
}

async function retryTopics() {
  topicsRetried.value = false;
  await refreshTopics();
}
</script>

<template>
  <div class="page-stack">
    <section class="hero-shell">
      <div class="hero-copy">
        <p class="hero-kicker">个人写作 / AI 应用与嵌入式实践</p>
        <h1>Doopex</h1>
        <p class="hero-summary">专注 AI 应用落地、嵌入式系统调试与工程化实践。</p>
        <p class="hero-positioning">用文章记录从 Demo 到上线、从板级调试到系统交付的关键过程，偏向长期沉淀而不是即时展示。</p>

        <div class="hero-actions">
          <NuxtLink to="/posts" class="btn-primary">阅读文章</NuxtLink>
          <NuxtLink to="/projects" class="btn-ghost">查看项目</NuxtLink>
        </div>

        <div class="hero-persona" aria-label="个人定位">
          <span class="persona-chip">AI 应用工程</span>
          <span class="persona-chip">嵌入式系统</span>
          <span class="persona-chip">工程复盘</span>
        </div>

        <a href="#latest-articles" class="hero-scroll">向下浏览最新文章</a>
      </div>

      <div class="hero-visual">
        <div class="hero-glow hero-glow-large" />
        <div class="hero-glow hero-glow-medium" />
        <div class="hero-glow hero-glow-small" />

        <article class="signal-card signal-card-main">
          <span class="signal-label">最近写作</span>
          <strong>{{ latestPost?.title ?? '新的文章正在整理中' }}</strong>
          <p>{{ latestPost?.summary ?? '围绕工程复盘、调试手记与系统设计持续沉淀。' }}</p>
          <div class="signal-meta">
            <span>{{ latestPost?.date ?? '持续更新' }}</span>
            <span v-for="tag in latestPost?.tags?.slice(0, 2) ?? heroTags.slice(0, 2)" :key="tag" class="signal-pill">
              {{ tag }}
            </span>
          </div>
        </article>

        <article class="signal-card signal-card-center">
          <span class="signal-label">写作索引</span>
          <strong>围绕真实问题持续输出</strong>
          <ul class="signal-list">
            <li>工程复盘</li>
            <li>调试手记</li>
            <li>系统设计</li>
          </ul>
        </article>

        <article class="signal-card signal-card-sub">
          <span class="signal-label">长期沉淀</span>
          <strong>{{ primaryTopic?.name ?? 'AI 应用 · 嵌入式系统' }}</strong>
          <p>{{ archiveSummary }}</p>
        </article>
      </div>

      <div class="hero-footrail" aria-label="首页概览">
        <article class="rail-item">
          <span>最近更新</span>
          <strong>{{ latestPost?.title ?? '新的写作正在整理中' }}</strong>
        </article>
        <article class="rail-item">
          <span>内容沉淀</span>
          <strong>{{ archiveSummary }}</strong>
        </article>
        <article class="rail-item">
          <span>写作方式</span>
          <strong>工程复盘 / 调试笔记 / 系统设计</strong>
        </article>
      </div>
    </section>

    <div class="content-stack">
      <section id="latest-articles" class="home-section">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Latest Writing</p>
            <h2 class="section-title">最新文章</h2>
          </div>
          <NuxtLink to="/posts" class="section-link">查看全部</NuxtLink>
        </div>

        <div v-if="postsPending" class="skeleton-grid">
          <article v-for="item in 4" :key="`home-post-skeleton-${item}`" class="card skeleton-card">
            <span class="skeleton-line h-22 w-70" />
            <span class="skeleton-line" />
            <span class="skeleton-line w-55" />
            <span class="skeleton-line w-30" />
          </article>
        </div>
        <div v-else-if="postData?.items?.length" class="grid-cards">
          <PostCard v-for="post in postData?.items ?? []" :key="post.slug" :post="post" />
        </div>
        <DataState
          v-else-if="showPostsError"
          type="error"
          title="文章加载失败"
          message="请稍后重试，或检查后端服务是否可用。"
          action-text="重新加载"
          compact
          @action="retryPosts"
        />
        <DataState v-else-if="showPostsEmpty" type="empty" message="暂时还没有公开文章。" compact />
      </section>

      <section class="home-section">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Topics</p>
            <h2 class="section-title">专题方向</h2>
          </div>
        </div>

        <div v-if="topicsPending" class="topic-grid">
          <article v-for="item in 3" :key="`home-topic-skeleton-${item}`" class="card topic-card skeleton-card">
            <span class="skeleton-line h-22 w-55" />
            <span class="skeleton-line w-30" />
          </article>
        </div>
        <div v-else-if="topicData?.length" class="topic-grid">
          <NuxtLink
            v-for="topic in topicData ?? []"
            :key="topic.slug"
            :to="`/topics/${topic.slug}`"
            class="card topic-card"
          >
            <strong>{{ topic.name }}</strong>
            <span>{{ topic.count }} 篇</span>
          </NuxtLink>
        </div>
        <DataState
          v-else-if="showTopicsError"
          type="error"
          title="专题加载失败"
          message="请稍后重试，或检查后端服务是否可用。"
          action-text="重新加载"
          compact
          @action="retryTopics"
        />
        <DataState v-else-if="showTopicsEmpty" type="empty" message="暂时还没有专题分类。" compact />
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-stack {
  display: grid;
  gap: clamp(2.8rem, 6vh, 4.6rem);
}

.hero-shell {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(22rem, 32rem);
  grid-template-areas:
    'copy visual'
    'foot foot';
  gap: clamp(2rem, 5vw, 4rem) clamp(2.4rem, 5vw, 5rem);
  min-height: clamp(42rem, calc(100svh - 8rem), 50rem);
  padding: clamp(1rem, 3vh, 2rem) 0 clamp(1.8rem, 4vh, 3rem);
  align-items: center;
  isolation: isolate;
}

.hero-shell::before {
  content: '';
  position: absolute;
  inset: 4% auto auto 8%;
  width: min(42rem, 48vw);
  aspect-ratio: 1;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(70, 127, 255, 0.16), rgba(70, 127, 255, 0) 68%);
  filter: blur(14px);
  z-index: -3;
  pointer-events: none;
}

.hero-shell::after {
  content: '';
  position: absolute;
  inset: auto 4% 16% auto;
  width: min(32rem, 36vw);
  aspect-ratio: 1;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(153, 188, 255, 0.16), rgba(153, 188, 255, 0) 70%);
  filter: blur(22px);
  z-index: -3;
  pointer-events: none;
}

.hero-copy {
  grid-area: copy;
  max-width: 36rem;
  align-self: center;
}

.hero-kicker {
  margin: 0 0 1rem;
  color: var(--brand);
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(3.6rem, 7vw, 5.8rem);
  line-height: 0.94;
  letter-spacing: -0.06em;
}

.hero-summary {
  margin: 1.2rem 0 0;
  max-width: 14ch;
  color: var(--text);
  font-size: clamp(1.28rem, 2.1vw, 1.7rem);
  line-height: 1.42;
}

.hero-positioning {
  margin: 1rem 0 0;
  max-width: 34rem;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.85;
}

.hero-actions {
  display: flex;
  gap: 0.85rem;
  margin-top: 1.8rem;
}

.btn-primary,
.btn-ghost {
  min-width: 8.5rem;
  height: 3.15rem;
  padding: 0 1.4rem;
  border-radius: 14px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--brand), #3b7dff);
  color: #fff;
  box-shadow: 0 16px 32px rgba(31, 95, 224, 0.2);
}

.btn-ghost {
  border-color: rgba(17, 32, 58, 0.1);
  background: rgba(255, 255, 255, 0.56);
  color: var(--text);
  backdrop-filter: blur(10px);
}

.btn-primary:hover,
.btn-ghost:hover {
  transform: translateY(-1px);
}

.hero-persona {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1.15rem;
}

.persona-chip {
  display: inline-flex;
  align-items: center;
  min-height: 2.15rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(31, 95, 224, 0.08);
  background: rgba(255, 255, 255, 0.42);
  color: var(--text-muted);
  font-size: 0.9rem;
  backdrop-filter: blur(10px);
}

.hero-scroll {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 1.55rem;
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.96rem;
}

.hero-scroll::after {
  content: '';
  width: 0.65rem;
  height: 0.65rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translateY(-1px);
}

.hero-visual {
  grid-area: visual;
  position: relative;
  min-height: 30rem;
  width: min(100%, 32rem);
  justify-self: end;
}

.hero-visual::before {
  content: '';
  position: absolute;
  left: 48%;
  top: 10%;
  bottom: 10%;
  width: 1px;
  background: linear-gradient(180deg, rgba(31, 95, 224, 0), rgba(31, 95, 224, 0.18), rgba(31, 95, 224, 0));
  z-index: -1;
}

.hero-visual::after {
  content: '';
  position: absolute;
  inset: 16% 12% 18% 10%;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(104, 150, 255, 0.2), rgba(104, 150, 255, 0) 72%);
  filter: blur(16px);
  z-index: -2;
}

.hero-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(28px);
  opacity: 0.78;
  animation: drift 11s ease-in-out infinite;
}

.hero-glow-large {
  top: 6%;
  left: 12%;
  width: min(22rem, 34vw);
  aspect-ratio: 1;
  background: radial-gradient(circle, rgba(84, 132, 255, 0.2), rgba(84, 132, 255, 0));
}

.hero-glow-medium {
  right: 4%;
  top: 32%;
  width: min(18rem, 28vw);
  aspect-ratio: 1;
  background: radial-gradient(circle, rgba(143, 180, 255, 0.18), rgba(143, 180, 255, 0));
  animation-delay: -2.8s;
}

.hero-glow-small {
  left: 24%;
  bottom: 4%;
  width: min(14rem, 22vw);
  aspect-ratio: 1;
  background: radial-gradient(circle, rgba(31, 95, 224, 0.15), rgba(31, 95, 224, 0));
  animation-delay: -4.6s;
}

.signal-card {
  position: absolute;
  width: min(100%, 18rem);
  padding: 1.1rem 1.15rem;
  border-radius: 20px;
  border: 1px solid rgba(217, 228, 248, 0.45);
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 18px 32px rgba(22, 58, 124, 0.08);
  backdrop-filter: blur(14px);
  animation: float-card 9s ease-in-out infinite;
}

.signal-card-main {
  top: 0;
  right: 0;
}

.signal-card-center {
  top: 40%;
  left: 0;
  animation-delay: -2.6s;
}

.signal-card-sub {
  right: 8%;
  bottom: 0;
  animation-delay: -4.3s;
}

.signal-label {
  display: inline-block;
  margin-bottom: 0.7rem;
  color: var(--brand);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.signal-card strong {
  display: block;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.18rem;
  line-height: 1.35;
  letter-spacing: -0.03em;
}

.signal-card p {
  margin: 0.55rem 0 0;
  color: var(--text-muted);
  line-height: 1.72;
}

.signal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.8rem;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.signal-pill {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0 0.65rem;
  border-radius: 999px;
  background: rgba(237, 243, 255, 0.9);
  color: var(--brand-deep);
}

.signal-list {
  margin: 0.8rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.55rem;
}

.signal-list li {
  position: relative;
  padding-left: 1rem;
  color: var(--text-muted);
  line-height: 1.55;
}

.signal-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.58rem;
  width: 0.38rem;
  height: 0.38rem;
  border-radius: 999px;
  background: var(--brand);
}

.hero-footrail {
  grid-area: foot;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  padding-top: 1.35rem;
  border-top: 1px solid rgba(217, 228, 248, 0.72);
}

.rail-item {
  padding-right: 1rem;
}

.rail-item span {
  display: block;
  margin-bottom: 0.45rem;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.rail-item strong {
  font-size: 1rem;
  line-height: 1.65;
  letter-spacing: -0.01em;
}

.content-stack {
  display: grid;
  gap: 2.6rem;
}

.home-section {
  scroll-margin-top: 96px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.section-kicker {
  margin: 0 0 0.45rem;
  color: var(--brand);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-title {
  margin-bottom: 0;
}

.section-link {
  color: var(--text-muted);
  font-weight: 700;
}

.topic-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.topic-card {
  padding: 1rem 1.1rem 1.05rem;
  display: grid;
  gap: 0.35rem;
  min-height: 92px;
}

.topic-card span {
  color: var(--text-muted);
}

@keyframes drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(0, 14px, 0);
  }
}

@keyframes float-card {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(0, -10px, 0);
  }
}

@media (max-width: 1100px) {
  .hero-shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      'copy'
      'visual'
      'foot';
    min-height: auto;
  }

  .hero-copy {
    max-width: none;
  }

  .hero-summary {
    max-width: none;
  }

  .hero-visual {
    min-height: 26rem;
    width: 100%;
  }

  .hero-footrail {
    grid-template-columns: 1fr;
  }

  .topic-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .page-stack {
    gap: 2.4rem;
  }

  .hero-shell {
    padding: 0.6rem 0 2.4rem;
  }

  .hero-copy h1 {
    font-size: clamp(3rem, 20vw, 4.2rem);
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-primary,
  .btn-ghost {
    width: 100%;
  }

  .hero-visual {
    min-height: auto;
    display: grid;
    gap: 1rem;
  }

  .hero-visual::before,
  .hero-visual::after {
    display: none;
  }

  .signal-card {
    position: relative;
    width: 100%;
    top: auto;
    right: auto;
    bottom: auto;
    left: auto;
  }

  .section-heading {
    align-items: start;
    flex-direction: column;
  }

  .topic-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-glow,
  .signal-card,
  .btn-primary,
  .btn-ghost {
    animation: none;
    transition: none;
  }
}
</style>
