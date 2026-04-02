<script setup lang="ts">
import type { PostSummary } from '~/types/api';

const props = withDefaults(
  defineProps<{
    post: PostSummary;
    featured?: boolean;
  }>(),
  {
    featured: false,
  },
);

const visibleTags = computed(() => props.post.tags.slice(0, props.featured ? 4 : 3));
const restTagCount = computed(() => Math.max(props.post.tags.length - visibleTags.value.length, 0));
const eyebrow = computed(() => {
  if (props.post.pinned) return '精选文章';
  return props.post.topics[0] || '文章';
});
</script>

<template>
  <article class="card post-card" :class="{ featured }">
    <div class="top-row">
      <span class="eyebrow">{{ eyebrow }}</span>
      <time class="date">{{ post.date }}</time>
    </div>

    <div class="content">
      <NuxtLink :to="`/posts/${post.slug}`" class="title">{{ post.title }}</NuxtLink>
      <p class="summary">{{ post.summary }}</p>
    </div>

    <div class="bottom-row">
      <div class="tag-row">
        <span v-for="tag in visibleTags" :key="tag" class="pill">{{ tag }}</span>
        <span v-if="restTagCount > 0" class="pill more-pill">+{{ restTagCount }}</span>
      </div>
      <span class="read-more">继续阅读</span>
    </div>
  </article>
</template>

<style scoped>
.post-card {
  padding: 1.1rem 1.1rem 1rem;
  min-height: 190px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
}

.post-card.featured {
  min-height: 260px;
  padding: 1.35rem 1.4rem 1.25rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 249, 255, 0.92)),
    var(--surface);
}

.top-row,
.bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.content {
  min-height: 0;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 1.75rem;
  padding: 0 0.7rem;
  border-radius: 999px;
  background: rgba(237, 243, 255, 0.92);
  color: var(--brand-deep);
  font-size: 0.78rem;
  font-weight: 700;
}

.title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-weight: 700;
  font-size: 1.12rem;
  line-height: 1.45;
  letter-spacing: -0.01em;
}

.featured .title {
  font-size: clamp(1.45rem, 2vw, 1.8rem);
  line-height: 1.28;
}

.summary {
  margin: 0.65rem 0 0;
  color: var(--text-muted);
  line-height: 1.72;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.featured .summary {
  -webkit-line-clamp: 4;
  max-width: 58ch;
}

.tag-row {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.more-pill {
  background: #f0f4ff;
  color: #4f67a2;
}

.date {
  color: var(--text-muted);
  font-size: 0.84rem;
  white-space: nowrap;
}

.read-more {
  color: var(--brand-deep);
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .post-card,
  .post-card.featured {
    min-height: 0;
  }
}
</style>
