import { createRequire } from 'node:module';
const { webkit } = createRequire(import.meta.url)('playwright');
(async () => {
  const browser = await webkit.launch({ headless: true });
  try {
    for (const width of [375, 390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 844 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:3219', { waitUntil: 'networkidle' });
      await page.getByRole('heading', { name: '推奨抗菌薬候補', exact: true }).waitFor();
      const metrics = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, font: getComputedStyle(document.querySelector('.recommendation-focus > strong')).fontSize }));
      if (metrics.scroll > metrics.width) throw Error('Horizontal overflow at ' + width);
      await page.getByText('臨床的重症度', { exact: false }).locator('select').selectOption('nonsevere');
      await page.getByRole('button', { name: '収縮期血圧低下', exact: true }).click();
      await page.getByText('重症度入力とRed Flag・敗血症情報が不整合です。', { exact: false }).waitFor();
      if (errors.length) throw Error(errors.join('\n'));
      console.log(JSON.stringify({ width, metrics, errors }));
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
