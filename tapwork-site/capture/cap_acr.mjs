import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 3 });
page.on('pageerror', e => console.log('PAGEERR:', e.message.slice(0,300)));
page.on('console', m => { if (m.type()==='error') console.log('CONSOLE:', m.text().slice(0,200)); });
await page.goto('http://localhost:8795/harness11.html', { waitUntil: 'load' });
try { await page.waitForFunction(() => window.__mounted === true, { timeout: 30000 }); }
catch(e){ console.log('NOT MOUNTED'); }
await page.evaluate(() => { document.body.style.background='transparent'; document.documentElement.style.background='transparent'; });
await page.waitForTimeout(1500);
const el = await page.$('#tw-acrilico-canvas');
await el.screenshot({ path: 'hires/acrilico.png', omitBackground: true });
const d = await page.evaluate(() => { const c=document.querySelector('#tw-acrilico-canvas'); return c.width+'x'+c.height; });
console.log('captured', d);
await browser.close();
