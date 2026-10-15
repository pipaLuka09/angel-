// Saca las piezas de piezas.html a PNG a 300 dpi (con fondo transparente).
//   node render-piezas.js        ->  pieza-viejo.png, pieza-sticker.png, pieza-forja.png
const {chromium} = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  for (const k of ['viejo', 'sticker', 'forja']) {
    const p = await b.newPage({viewport: {width: 600, height: 800}, deviceScaleFactor: 300 / 96});
    await p.goto('file://' + path.join(__dirname, 'piezas.html?p=' + k));
    await p.evaluate(() => window.__ready);
    await (await p.$('#' + k)).screenshot({path: path.join(__dirname, `pieza-${k}.png`), omitBackground: true});
    await p.close();
  }
  await b.close();
})();
