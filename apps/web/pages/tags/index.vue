<script setup lang="ts">
const {
  data: tags,
  pending,
  error,
  refresh,
} = useAsyncData('tag-list', () => fetchTags(), {
  lazy: true,
  default: () => [],
});

const showEmpty = computed(() => !pending.value && !error.value && (tags.value?.length ?? 0) === 0);
</script>

<template>
  <section>
    <h1 class="section-title">标签</h1>

    <DataState v-if="pending" type="loading" message="加载中..." compact />
    <DataState
      v-else-if="error"
      type="error"
      title="标签加载失败"
      message="请稍后重试，或检查后端服务是否可用。"
      action-text="重新加载"
      compact
      @action="refresh"
    />
    <DataState v-else-if="showEmpty" type="empty" message="暂时还没有可用标签。" compact />

    <div v-else class="tag-list">
      <NuxtLink v-for="tag in tags ?? []" :key="tag.slug" :to="`/tags/${tag.slug}`" class="card tag-item">
        <strong>{{ tag.name }}</strong>
        <span>{{ tag.count }} 篇</span>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.tag-list {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.tag-item {
  padding: 0.9rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-item span {
  color: var(--text-muted);
  font-size: 0.92rem;
}

@media (max-width: 980px) {
  .tag-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .tag-list {
    grid-template-columns: 1fr;
  }
}
</style>