import { chromium } from 'playwright';
const jobs = [
  { key: 'menu',       h: 'harness3.html',  sel: '#tw-menu-canvas',       t: 6000 },
  { key: 'resenas',    h: 'harness2.html',  sel: '#tw-resenas-canvas',    t: 10000 },
  { key: 'asistencia', h: 'harness.html',   sel: '#tw-asistencia-canvas', t: 10000 },
  { key: 'wifi',       h: 'harness4.html',  sel: '#tw-wifi-canvas',       t: 7000 },
  { key: 'gym',        h: 'harness5.html',  sel: '#tw-gym-canvas',        t: 18000 },
  { key: 'pago',       h: 'harness6.html',  sel: '#tw-pago-canvas',       t: 9000 },
  { key: 'sticker',    h: 'harness7.html',  sel: '#tw-sticker-canvas',    t: 7000 },
  { key: 'tarjeta',    h: 'harness8.html',  sel: '.tj-stagebox',          t: 7000 },
  { key: 'llavero',    h: 'harness9.html',  sel: '.lv-stagebox',          t: 7000 },
  { key: 'mascotas',   h: 'harness10.html', sel: '.ms-stagebox',          t: 7000 },
];
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});
const only = process.argv.slice(2);
for (const j of jobs) {
  if (only.length && !only.includes(j.key)) continue;
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 3 });
  try {
    await page.goto('http://localhost:8795/' + j.h, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__mounted === true || window.__mountError, { timeout: 30000 });
    const err = await page.evaluate(() => window.__mountError);
    if (err) { console.log(j.key, 'MOUNT ERR', err.slice(0, 160)); await page.close(); continue; }
    await page.evaluate(() => { const s = document.getElementById('status'); if (s) s.remove();
      document.body.style.background = 'transparent'; document.documentElement.style.background = 'transparent'; });
    await page.waitForTimeout(j.t);
    const el = await page.$(j.sel);
    await el.screenshot({ path: `hires/${j.key}.png`, omitBackground: true });
    const dims = await page.evaluate((s) => {
      const c = document.querySelector(s);
      return c.tagName === 'CANVAS' ? { buffer: c.width + 'x' + c.height, css: Math.round(c.getBoundingClientRect().width) } : { css: Math.round(c.getBoundingClientRect().width) };
    }, j.sel);
    console.log(j.key, 'ok', JSON.stringify(dims));
  } catch (e) { console.log(j.key, 'FAIL', String(e).slice(0, 160)); }
  await page.close();
}
await browser.close();
