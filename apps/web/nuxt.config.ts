export default defineNuxtConfig({
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  experimental: {
    appManifest: false,
  },

  app: {
    pageTransition: {
      name: 'page-fade',
      mode: 'out-in',
    },
    head: {
      title: 'Doopex | AI & Embedded Blog',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Technical notes on AI applications and embedded systems.' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:3000/api',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },

  compatibilityDate: '2026-04-01',
});
