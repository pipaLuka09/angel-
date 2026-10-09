# Reels de producto

Un video vertical de 17,6 s por producto, con la misma estructura que el promo de
asistencia: la pregunta que el dueño reconoce, el toque (el clip 3D de `ads/`),
las dos pantallas que se abren y el cierre con el WhatsApp.

- `composer.html` dibuja el cuadro exacto de cualquier segundo
  (`window.renderAt(t)`); `?k=menu` elige el producto. Los guiones de los ocho
  están en el objeto `P` adentro.
- `render.js` recorre los cuadros a 24 fps con Playwright y arma con ffmpeg:
  `1080/<producto>.mp4` (1080×1920, para redes) y `v/<producto>.mp4` + `.jpg`
  (720p y póster, lo que usa la página).
- `v/asistencia.mp4` es el promo original de asistencia recodificado a 720p, no
  sale de aquí.

Antes de renderizar hay que sacar los cuadros de los clips 3D:

    for p in menu resenas tarjeta wifi pago gym mascotas acrilico; do
      mkdir -p frames/$p && ffmpeg -i ../ads/${p}_reel.mp4 -q:v 3 frames/$p/f%04d.jpg
    done
    node render.js

Los nombres que salen en pantalla (Tania Sánchez, Milo, Prensa de pierna) son
los mismos demos que ya usan los clips y el sitio. No hay precios ni datos de
clientes reales.

La página que usa estos videos la arma `../buildreels.py`.
