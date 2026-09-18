// Capture the part of each scene the ad clips deliberately cut.
//
// advideos.py picks the steadiest window of a scene, which is always the payoff:
// the menu already open, the wi-fi already joined. That reads well as an ad and
// says nothing about how the thing works. These clips are the opposite choice —
// they start before the phone moves and run until the content is on screen, so
// you see the approach, the read and the result in one shot.
//
// Every scene names its own phases (T_IN / T_NEAR / T_LECT, then T_NFC, then the
// content state), so the window is picked from those rather than guessed: open
// about a second before the approach, close about two seconds into the content.
import { chromium } from 'playwright';
import fs from 'fs';

const SCENES = {
  menu:       { h: 'harness3.html',  sel: '#tw-menu-canvas',       cycle: 11000, phase: 1200, secs: 5.0 },
  resenas:    { h: 'harness2.html',  sel: '#tw-resenas-canvas',    cycle:  9000, phase: 1200, secs: 5.0 },
  asistencia: { h: 'harness.html',   sel: '#tw-asistencia-canvas', cycle:  8000, phase:  200, secs: 4.8 },
  wifi:       { h: 'harness4.html',  sel: '#tw-wifi-canvas',       cycle: 12000, phase: 1000, secs: 5.8 },
  gym:        { h: 'harness5.html',  sel: '#tw-gym-canvas',        cycle: 16000, phase: 1200, secs: 5.5 },
  pago:       { h: 'harness6.html',  sel: '#tw-pago-canvas',       cycle: 15000, phase: 1200, secs: 5.5 },
  sticker:    { h: 'harness7.html',  sel: '#tw-sticker-canvas',    cycle: 18000, phase: 1400, secs: 5.8 },
  tarjeta:    { h: 'harness8.html',  sel: '.tj-stagebox',          cycle: 17000, phase: 2200, secs: 6.0 },
  llavero:    { h: 'harness9.html',  sel: '.lv-stagebox',          cycle: 18000, phase: 2000, secs: 6.0 },
  mascotas:   { h: 'harness10.html', sel: '.ms-stagebox',          cycle: 16000, phase: 2000, secs: 5.5 },
  // acrilico renders once and never animates, so there is nothing to capture.
};

const FPS = Number(process.env.FPS || 20);
// The harness already renders the canvas at 3x its CSS size, so sampling the
// screenshot at 3 captures what the scene actually drew rather than a third of
// it. It costs almost nothing: the per-scene time is dominated by the mount, not
// by the frames.
const SCALE = Number(process.env.SCALE || 3);
const only = process.argv.slice(2);

// Same virtual clock as vcap.mjs: real rAF keeps committing frames, but every
// timestamp the scene reads is one we control, so output does not depend on how
// slowly software GL renders.
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
  const dir = `vd/${key}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: SCALE });
  await page.addInitScript(virtualClock);
  const t0 = Date.now();
  try {
    await page.goto('http://localhost:8795/' + s.h, { waitUntil: 'load' });
    // Scenes mount off setTimeout retries, which the virtual clock does not drive.
    const pump = setInterval(() => page.evaluate(() => window.__advance(40)).catch(() => {}), 40);
    await page.waitForFunction(() => window.__mounted === true, { timeout: 40000 });
    await page.evaluate(() => { const st = document.getElementById('status'); if (st) st.remove();
      document.body.style.background = 'transparent'; document.documentElement.style.background = 'transparent'; });
    await page.waitForTimeout(1500);
    clearInterval(pump);
    // The pump advanced the clock by however long the mount took, so land on the
    // wanted phase rather than on a fixed offset from an unknown starting point.
    await page.evaluate(({ p, cyc }) => {
      const d = (p - (window.__vt() % cyc) + cyc) % cyc;
      window.__advance(d);
    }, { p: s.phase, cyc: s.cycle });

    const box = await page.evaluate((sel) => {
      const r = document.querySelector(sel).getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    }, s.sel);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

    const step = 1000 / FPS;
    const total = Math.round(FPS * s.secs);
    for (let i = 0; i < total; i++) {
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { ...box, scale: SCALE } });
      fs.writeFileSync(`${dir}/${String(i).padStart(4, '0')}.png`, Buffer.from(data, 'base64'));
      await page.evaluate((ms) => window.__advance(ms), step);
      // One frame for the scene's rAF to run on the new time, one to commit it.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
    console.log(`${key.padEnd(11)} ${total} frames  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    console.log(`${key.padEnd(11)} FAIL ${String(e).slice(0, 140)}`);
  }
  await page.close();
}
await browser.close();
