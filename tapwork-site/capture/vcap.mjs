// Frame capture on a virtual clock.
//
// Playwright's own clock API pauses the compositor too, so screenshots hang waiting
// for a frame that never commits. Instead the page keeps its real requestAnimationFrame
// (so frames keep committing and captures stay fast) but every timestamp the scenes
// read is virtual: the rAF callback argument, performance.now() and Date.now(). Time
// only moves when the capture loop says so, which makes the output deterministic and
// independent of how slowly software GL renders.
import { chromium } from 'playwright';
import fs from 'fs';

const SCENES = {
  menu:       { h: 'harness3.html',  sel: '#tw-menu-canvas',       warm: 5200 },
  resenas:    { h: 'harness2.html',  sel: '#tw-resenas-canvas',    warm: 6500 },
  // Its warm-up is a phase, not a duration: the mount pump advances the virtual
  // clock by however long the scene took to come up, so a fixed warm lands on a
  // different beat every run. Snapping to 1.4s of the 8s loop always opens mid-
  // approach and runs into the confirmation hold.
  asistencia: { h: 'harness.html',   sel: '#tw-asistencia-canvas', warm: 0, phase: 1400, cycle: 8000 },
  wifi:       { h: 'harness4.html',  sel: '#tw-wifi-canvas',       warm: 4500 },
  gym:        { h: 'harness5.html',  sel: '#tw-gym-canvas',        warm: 17000 },
  pago:       { h: 'harness6.html',  sel: '#tw-pago-canvas',       warm: 6000 },
  sticker:    { h: 'harness7.html',  sel: '#tw-sticker-canvas',    warm: 4500 },
  tarjeta:    { h: 'harness8.html',  sel: '.tj-stagebox',          warm: 3000 },
  llavero:    { h: 'harness9.html',  sel: '.lv-stagebox',          warm: 3000 },
  mascotas:   { h: 'harness10.html', sel: '.ms-stagebox',          warm: 3000 },
  acrilico:   { h: 'harness11.html', sel: '#tw-acrilico-canvas',   warm: 1200 },
};

const FPS = 24;
const SECONDS = Number(process.env.SECS || 5);
const SCALE = Number(process.env.SCALE || 2);
const only = process.argv.slice(2);

const virtualClock = () => {
  let vt = 0;
  const raf = window.requestAnimationFrame.bind(window);
  window.__advance = (ms) => { vt += ms; };
  window.__vt = () => vt;
  window.requestAnimationFrame = (cb) => raf(() => cb(vt));
  performance.now = () => vt;
  const epoch = Date.now();
  Date.now = () => epoch + vt;
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });

for (const [key, s] of Object.entries(SCENES)) {
  if (only.length && !only.includes(key)) continue;
  const dir = `vf/${key}`;
  fs.mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: SCALE });
  await page.addInitScript(virtualClock);
  const t0 = Date.now();
  try {
    await page.goto('http://localhost:8795/' + s.h, { waitUntil: 'load' });
    // The scenes mount off setTimeout retries, which the virtual clock does not drive,
    // so advance in step with real time until they report ready.
    const pump = setInterval(() => page.evaluate(() => window.__advance(40)).catch(() => {}), 40);
    await page.waitForFunction(() => window.__mounted === true, { timeout: 40000 });
    await page.evaluate(() => { const st = document.getElementById('status'); if (st) st.remove();
      document.body.style.background = 'transparent'; document.documentElement.style.background = 'transparent'; });
    await page.waitForTimeout(1500);
    clearInterval(pump);
    // Walk the animation forward to where it reads best, then start recording.
    await page.evaluate((w) => window.__advance(w), s.warm);
    if (s.phase != null) {
      await page.evaluate(({ p, cyc }) => {
        const d = (p - (window.__vt() % cyc) + cyc) % cyc;
        window.__advance(d);
      }, { p: s.phase, cyc: s.cycle });
    }

    const box = await page.evaluate((sel) => {
      const r = document.querySelector(sel).getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    }, s.sel);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

    const step = 1000 / FPS;
    const total = Math.round(FPS * SECONDS);
    for (let i = 0; i < total; i++) {
      await page.evaluate((ms) => window.__advance(ms), step);
      // Two frames: one for the scene's rAF to run on the new time, one to commit it.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { ...box, scale: SCALE } });
      fs.writeFileSync(`${dir}/${String(i).padStart(4, '0')}.png`, Buffer.from(data, 'base64'));
    }
    console.log(`${key.padEnd(11)} ${total} frames  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    console.log(`${key.padEnd(11)} FAIL ${String(e).slice(0, 120)}`);
  }
  await page.close();
}
await browser.close();
