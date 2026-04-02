const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const logs = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('Hydration') || text.includes('mismatch')) {
      logs.push(`[console:${msg.type()}] ${text}`);
    }
  });
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => logs.push(`[requestfailed] ${req.method()} ${req.url()} :: ${req.failure()?.errorText}`));

  async function inspect(url) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      const main = document.querySelector('main');
      const textNodes = Array.from(document.querySelectorAll('body *')).map((el) => (el.textContent || '').trim()).filter(Boolean);
      return {
        url: location.href,
        heading: document.querySelector('main h1, main h2')?.textContent?.trim() || '',
        mainTextLength: (main?.innerText || '').trim().length,
        errorText: textNodes.find((text) => text.includes('加载失败') || text.includes('请稍后重试')) || ''
      };
    });
    console.log(JSON.stringify(state));
  }

  for (const url of [
    'http://127.0.0.1:3001/posts/ai-app-engineering',
    'http://127.0.0.1:3001/tags/ai',
    'http://127.0.0.1:3001/topics/ai-ying-yong'
  ]) {
    await inspect(url);
  }

  console.log('LOGS=' + JSON.stringify(logs));
  await browser.close();
})();
