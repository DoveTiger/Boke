<script setup lang="ts">
</script>

<template>
  <div class="app-shell">
    <SiteHeader />
    <main class="site-main">
      <NuxtPage :page-key="(route) => route.fullPath" />
    </main>
  </div>
</template>
