<template>
  <header class="header">
    <div class="inner">
      <NuxtLink to="/" class="brand">Doopex</NuxtLink>

      <nav class="nav" aria-label="主导航">
        <NuxtLink to="/">首页</NuxtLink>
        <NuxtLink to="/posts">文章</NuxtLink>
        <NuxtLink to="/projects">项目</NuxtLink>
        <NuxtLink to="/about">关于</NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(217, 228, 248, 0.8);
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.92), rgba(244, 247, 251, 0.82));
  backdrop-filter: blur(14px);
}

.inner {
  width: min(var(--container), calc(100% - 3rem));
  margin: 0 auto;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: inline-flex;
  align-items: baseline;
  gap: 0.7rem;
  font-size: 1.85rem;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.brand::after {
  content: 'Journal';
  color: var(--text-muted);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem;
  border: 1px solid rgba(217, 228, 248, 0.72);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.46);
  box-shadow: 0 12px 28px rgba(22, 58, 124, 0.05);
  backdrop-filter: blur(12px);
}

.nav a {
  height: 2.4rem;
  padding: 0 0.95rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.96rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.nav a:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.74);
  transform: translateY(-1px);
}

.nav a.router-link-active {
  color: var(--brand-deep);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 18px rgba(31, 95, 224, 0.08);
}

@media (max-width: 760px) {
  .inner {
    width: calc(100% - 1.4rem);
    height: 66px;
  }

  .brand {
    gap: 0.45rem;
    font-size: 1.34rem;
  }

  .brand::after {
    display: none;
  }

  .nav {
    gap: 0.15rem;
    padding: 0.18rem;
  }

  .nav a {
    height: 2.15rem;
    padding: 0 0.68rem;
    font-size: 0.88rem;
  }
}
</style>
