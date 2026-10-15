// Renderiza toque.html cuadro por cuadro (24 fps) y arma los videos con ffmpeg.
//   node render-toque.js pago wifi resenas acrilico menu tarjeta gym
// Salen: ../<k>.mp4 (1080x1350, tienda), ../../reels/v/<k>.mp4 (720x1280,
// carrusel del inicio) con su póster .jpg (el cuadro con la pantalla abierta).
// El menú, la tarjeta y FORJA solo van en el carrusel: la tienda tiene los videos reales
// del menú y de la tarjeta, y
// FORJA tiene su propia página. Antes hay que correr acrilicos.py (arma las fotos de fondo).
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs'), {execFileSync} = require('child_process');
const FF = process.env.FFMPEG || 'ffmpeg';
const INFO = JSON.parse(fs.readFileSync(path.join(__dirname, 'acrilicos.json'), 'utf8'));
const SIZES = [
  {w: 1080, h: 1350, out: k => path.join(__dirname, '..', k), crf: 21, poster: false},  // el póster de la tienda es la foto
  {w: 720, h: 1280, out: k => path.join(__dirname, '..', '..', 'reels', 'v', k), crf: 24, poster: true},
];
const POSTER = 5.2;
const SOLO_CARRUSEL = new Set(['menu', 'tarjeta', 'gym']);
(async () => {
  const b = await chromium.launch();
  for (const k of process.argv.slice(2)) for (const S of SIZES) {
    if (SOLO_CARRUSEL.has(k) && S.w === 1080) continue;
    const dir = path.join(__dirname, 'rf', `${k}-${S.w}`);
    fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
    const p = await b.newPage({viewport: {width: S.w, height: S.h}});
    await p.addInitScript(i => { window.__INFO = i; }, INFO);
    await p.goto('file://' + path.join(__dirname, `toque.html?k=${k}&w=${S.w}&h=${S.h}`));
    await p.evaluate(() => window.__ready);
    const n = Math.round(await p.evaluate(() => window.__total) * 24);
    for (let i = 0; i < n; i++) {
      await p.evaluate(t => renderAt(t), i / 24);
      await p.screenshot({path: path.join(dir, `f${String(i + 1).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92});
    }
    if (S.poster) {
      await p.evaluate(t => renderAt(t), POSTER + (INFO[k].delay || 0));
      await p.screenshot({path: S.out(k) + '.jpg', type: 'jpeg', quality: 86});
    }
    await p.close();
    execFileSync(FF, ['-y', '-loglevel', 'error', '-framerate', '24', '-i', path.join(dir, 'f%04d.jpg'),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(S.crf), '-preset', 'slow', '-movflags', '+faststart', S.out(k) + '.mp4']);
    fs.rmSync(dir, {recursive: true, force: true});
    console.log('listo', k, S.w + 'x' + S.h, n, 'cuadros');
  }
  await b.close();
})();
