<script setup lang="ts">
import { projects } from '~/data/projects';
</script>

<template>
  <section>
    <h1 class="section-title">项目</h1>
    <div class="grid-cards">
      <article v-for="project in projects" :key="project.name" class="card project-card">
        <h3>{{ project.name }}</h3>
        <p>{{ project.description }}</p>
        <a :href="project.url" target="_blank" rel="noreferrer">查看仓库</a>
      </article>
    </div>
  </section>
</template>

<style scoped>
.project-card {
  padding: 1rem;
}

.project-card h3 {
  margin: 0;
}

.project-card p {
  color: var(--text-muted);
  line-height: 1.65;
}

.project-card a {
  color: var(--brand-deep);
  font-weight: 600;
}
</style>
