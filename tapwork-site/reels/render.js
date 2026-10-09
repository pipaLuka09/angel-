// Render the product reels out of composer.html, one frame at a time.
//
//   node render.js menu resenas ...        (default: all eight)
//
// composer.html draws the exact frame for any t through window.renderAt(t), so
// the result does not depend on how fast this machine is. Needs Playwright and
// an ffmpeg with libx264 (FFMPEG=/ruta/a/ffmpeg if it is not on PATH), and the
// 3D clip frames in frames/<producto>/ (see README.md).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');

const FF = process.env.FFMPEG || 'ffmpeg';
const ALL = ['menu', 'resenas', 'tarjeta', 'wifi', 'pago', 'gym', 'mascotas', 'acrilico'];
const here = (...p) => path.resolve(__dirname, ...p);

(async () => {
  const ks = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
  const b = await chromium.launch();
  for (const k of ks) {
    const dir = here('.work', k);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    await p.goto('file://' + here('composer.html') + '?k=' + k);
    await p.evaluate(() => window.__ready);
    const n = Math.round((await p.evaluate(() => window.__total)) * 24);
    for (let i = 0; i < n; i++) {
      await p.evaluate(t => window.renderAt(t), i / 24);
      await p.screenshot({ path: path.join(dir, `f${String(i + 1).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
    }
    await p.close();
    fs.mkdirSync(here('1080'), { recursive: true });
    const full = here('1080', k + '.mp4');
    const ff = args => execFileSync(FF, ['-y', '-loglevel', 'error', ...args]);
    // Full size, for posting on social media.
    ff(['-framerate', '24', '-i', path.join(dir, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
        '-crf', '19', '-preset', 'slow', '-movflags', '+faststart', full]);
    // 720p for the page: a third of the weight, and a card never shows more.
    ff(['-i', full, '-vf', 'scale=720:1280', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '25',
        '-preset', 'slow', '-movflags', '+faststart', '-an', here('v', k + '.mp4')]);
    // Poster: the first product screen, so a card at rest already shows what opens.
    ff(['-ss', '9.6', '-i', full, '-frames:v', '1', '-vf', 'scale=720:1280', '-q:v', '5', here('v', k + '.jpg')]);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('listo', k, n, 'cuadros');
  }
  await b.close();
})();
