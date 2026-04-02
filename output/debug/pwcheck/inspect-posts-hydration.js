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
  page.on('pageerror', (err) => logs.push(`[pageerror] ${err.stack || err.message}`));
  page.on('requestfailed', (req) => logs.push(`[requestfailed] ${req.method()} ${req.url()} :: ${req.failure()?.errorText}`));

  async function snap(label) {
    const state = await page.evaluate(() => {
      const main = document.querySelector('main');
      return {
        url: location.href,
        bodyClass: document.body.className,
        mainChildCount: main?.children?.length || 0,
        mainHtmlLength: main?.innerHTML?.length || 0,
        mainTextLength: (main?.innerText || '').trim().length,
        bodyTextLength: (document.body.innerText || '').trim().length,
        first200: (main?.innerHTML || '').slice(0, 200)
      };
    });
    console.log(`--- ${label} ---`);
    console.log(JSON.stringify(state, null, 2));
  }

  try {
    await page.goto('http://127.0.0.1:3001/posts', { waitUntil: 'domcontentloaded' });
    await snap('after-domcontentloaded');
    await page.waitForTimeout(100);
    await snap('after-100ms');
    await page.waitForTimeout(500);
    await snap('after-600ms');
    await page.waitForTimeout(1500);
    await snap('after-2100ms');
    console.log('--- html ---');
    console.log(await page.content());
  } finally {
    console.log('--- logs ---');
    console.log(logs.join('\n') || 'no-console-errors');
    await browser.close();
  }
})();
