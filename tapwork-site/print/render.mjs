/* Convierte el arte de card.py en lo que se le manda a la imprenta.
 *
 * Todo sale del mismo HTML: los PDF (vectoriales, es lo que hay que preferir)
 * y los PNG a 600 dpi (por si la imprenta no acepta PDF). El guía y el mockup
 * son referencias visuales: no van a imprimir.
 *
 *   node render.mjs            -> arte + guía + mockup
 *   node render.mjs --preview  -> además deja /tmp/card_preview.png
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out');
const W = 60.0, H = 91.6;                 // mm, con sangrado
const DPI = 600;
const PX = mm => Math.round(mm / 25.4 * DPI);   // 1417 x 2164
const file = n => 'file://' + join(OUT, n);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

/* PDF: una página por cara, y el de dos páginas que es el que se envía. */
const pdfPage = await browser.newPage();
for (const [src, dst] of [['frente.html', 'tapwork-tarjeta-frente.pdf'],
                          ['reverso.html', 'tapwork-tarjeta-reverso.pdf'],
                          ['ambas.html', 'tapwork-tarjeta-nfc.pdf']]) {
  await pdfPage.goto(file(src), { waitUntil: 'networkidle' });
  await pdfPage.pdf({ path: join(OUT, dst), width: `${W}mm`, height: `${H}mm`,
                      printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log('pdf', dst);
}
await pdfPage.close();

/* PNG a 600 dpi: el viewport ya es el tamaño final en píxeles y la página se
 * amplía con `zoom`, que rehace el layout en vez de escalar un bitmap — así el
 * texto se rasteriza directo a 1417 x 2164 y no sale borroso. */
const PW = PX(W), PH = PX(H);                    // 1417 x 2164
const ZOOM = PH / (H * 96 / 25.4);               // mm -> px de pantalla
const shot = await browser.newPage({ viewport: { width: PW, height: PH }, deviceScaleFactor: 1 });
for (const [src, dst] of [['frente.html', 'tapwork-tarjeta-frente-600dpi.png'],
                          ['reverso.html', 'tapwork-tarjeta-reverso-600dpi.png']]) {
  await shot.goto(file(src), { waitUntil: 'networkidle' });
  await shot.addStyleTag({ content: `html { zoom: ${ZOOM}; }` });
  await shot.screenshot({ path: join(OUT, dst), clip: { x: 0, y: 0, width: PW, height: PH } });
  console.log('png', dst, PW + 'x' + PH);
}
if (process.argv.includes('--preview')) {
  await shot.goto(file('frente.html'), { waitUntil: 'networkidle' });
  await shot.addStyleTag({ content: `html { zoom: ${ZOOM / 3}; }` });
  await shot.screenshot({ path: '/tmp/card_preview.png',
                          clip: { x: 0, y: 0, width: Math.round(PW / 3), height: Math.round(PH / 3) } });
}
await shot.close();

/* Guía de medidas: el arte con el corte y la zona segura marcados encima. */
const guide = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const b64 = n => readFileSync(join(OUT, n)).toString('base64');
writeFileSync(join(OUT, 'guia.html'), `<!doctype html><meta charset="utf-8"><style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:1200px; height:900px; background:#F2F4F6; font:13px/1.5 system-ui,sans-serif;
  color:#2A3138; display:flex; align-items:center; justify-content:center; gap:70px; }
.piece { position:relative; }
.art { width:300px; height:458px; display:block; box-shadow:0 8px 24px rgba(0,0,0,.18); }
.trim, .safe { position:absolute; pointer-events:none; }
.trim { left:15px; top:15px; width:270px; height:428px; outline:1.5px dashed #E30613; }
.safe { left:35px; top:35px; width:230px; height:388px; outline:1.5px dashed #1E88E5; }
.cap { margin-top:14px; text-align:center; font-weight:600; letter-spacing:.06em; }
.key { position:absolute; left:50%; bottom:46px; transform:translateX(-50%);
  display:flex; gap:30px; font-size:12.5px; white-space:nowrap; }
.key i { display:inline-block; width:22px; height:0; border-top:1.5px dashed; margin-right:7px;
  vertical-align:middle; }
.k1 i { border-color:#9AA4AE; } .k2 i { border-color:#E30613; } .k3 i { border-color:#1E88E5; }
h1 { position:absolute; left:50%; top:40px; transform:translateX(-50%); font-size:15px;
  letter-spacing:.14em; font-weight:700; }
</style>
<h1>TAP WORK — TARJETA NFC · MEDIDAS</h1>
<div class="piece"><img class="art" src="data:image/png;base64,${b64('tapwork-tarjeta-frente-600dpi.png')}">
  <i class="trim"></i><i class="safe"></i><div class="cap">FRENTE</div></div>
<div class="piece"><img class="art" src="data:image/png;base64,${b64('tapwork-tarjeta-reverso-600dpi.png')}">
  <i class="trim"></i><i class="safe"></i><div class="cap">REVERSO</div></div>
<div class="key">
  <span class="k1"><i></i>Archivo con sangrado — 60 × 91.6 mm</span>
  <span class="k2"><i></i>Corte final — 54 × 85.6 mm</span>
  <span class="k3"><i></i>Zona segura — 46 × 77.6 mm</span>
</div>`);
await guide.goto(file('guia.html'), { waitUntil: 'networkidle' });
await guide.screenshot({ path: join(OUT, 'GUIA-medidas-no-imprimir.png') });
console.log('png GUIA-medidas-no-imprimir.png');
await guide.close();

/* Mockup: cómo se ve con acabado brillante. No es arte. */
const mock = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 2 });
await mock.goto(file('mockup.html'), { waitUntil: 'networkidle' });
await mock.screenshot({ path: join(OUT, 'tapwork-tarjeta-mockup.png') });
console.log('png tapwork-tarjeta-mockup.png');
await mock.close();

await browser.close();
