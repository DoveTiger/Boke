const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', (msg) => logs.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => logs.push(`[requestfailed] ${req.method()} ${req.url()} :: ${req.failure()?.errorText}`));

  async function inspect(label) {
    await page.waitForTimeout(1200);
    const state = await page.evaluate(() => {
      const main = document.querySelector('main');
      const article = document.querySelector('article.detail');
      const textNodes = Array.from(document.querySelectorAll('body *'))
        .map((el) => (el.textContent || '').trim())
        .filter(Boolean);
      const detailTitle = article?.querySelector('h1')?.textContent?.trim() || '';
      return {
        url: location.href,
        mainTextLength: (main?.innerText || '').trim().length,
        articleExists: Boolean(article),
        detailTitle,
        errorText: textNodes.find((text) => text.includes('文章加载失败') || text.includes('请稍后重试')) || '',
        loadingText: textNodes.find((text) => text.includes('加载中')) || '',
        firstPostLink: document.querySelector('a[href^="/posts/"]')?.getAttribute('href') || '',
        pageHeading: document.querySelector('main h1')?.textContent?.trim() || ''
      };
    });
    console.log(`--- ${label} ---`);
    console.log(JSON.stringify(state, null, 2));
  }

  await page.goto('http://127.0.0.1:3001/posts', { waitUntil: 'networkidle' });
  await inspect('posts-list');

  await page.click('.post-card .title');
  await page.waitForURL(/\/posts\//, { timeout: 10000 });
  await inspect('from-post-list-to-detail');

  await page.goto('http://127.0.0.1:3001/', { waitUntil: 'networkidle' });
  await inspect('home');

  const firstHomePost = await page.locator('a[href^="/posts/"]').first();
  if (await firstHomePost.count()) {
    await firstHomePost.click();
    await page.waitForURL(/\/posts\//, { timeout: 10000 });
    await inspect('from-home-to-detail');
  } else {
    console.log('--- from-home-to-detail ---');
    console.log('No post link found on home page');
  }

  console.log('--- logs ---');
  console.log(logs.join('\n') || 'no-console-errors');

  await browser.close();
})();
