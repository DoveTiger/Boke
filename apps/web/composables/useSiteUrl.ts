export function useSiteUrl() {
  const config = useRuntimeConfig();

  const siteUrl = computed(() => {
    const raw = String(config.public.siteUrl || 'http://localhost:3000').trim();
    return raw.replace(/\/+$/, '');
  });

  function buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${siteUrl.value}${normalizedPath}`;
  }

  return {
    siteUrl,
    buildUrl,
  };
}