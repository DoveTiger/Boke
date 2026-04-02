<script setup lang="ts">
const route = useRoute();
const slug = computed(() => String(route.params.slug || ''));

const {
  data: posts,
  pending,
  error,
  refresh,
} = useAsyncData(
  'topic-posts',
  async () => {
    if (!slug.value) {
      return { total: 0, page: 1, size: 20, items: [] };
    }

    return fetchTopicPosts(slug.value, 1, 20);
  },
  {
    watch: [slug],
    lazy: true,
    default: () => ({ total: 0, page: 1, size: 20, items: [] }),
  },
);

const showEmpty = computed(() => !pending.value && !error.value && (posts.value?.items?.length ?? 0) === 0);
</script>

<template>
  <section class="page-section">
    <h1 class="section-title">专题：{{ slug }}</h1>

    <DataState v-if="pending" type="loading" message="加载中..." compact />
    <DataState
      v-else-if="error"
      type="error"
      title="专题文章加载失败"
      message="请稍后重试，或检查后端服务是否可用。"
      action-text="重新加载"
      compact
      @action="refresh"
    />
    <DataState v-else-if="showEmpty" type="empty" message="该专题下暂无文章。" compact />

    <div v-else class="grid-cards">
      <PostCard v-for="post in posts?.items ?? []" :key="post.slug" :post="post" />
    </div>
  </section>
</template>

<style scoped>
.page-section {
  display: grid;
  gap: 1rem;
}
</style>
