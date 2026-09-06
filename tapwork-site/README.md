# Tap Work — sitio de productos NFC

Página de marketing de Tap Work: hero en video, capítulos de scroll con los 12
productos NFC, "cómo funciona" y contacto. Se publica como un solo `.html`
autocontenido (imágenes, fuentes y video van embebidos como `data:` URI).

## Cómo se arma

    python3 build.py        # template.html + img1080/ + refvideo/ -> tapwork-nfc.html

`build.py` no genera imágenes: lee las que ya están en `img1080/`.

## De dónde salen las imágenes de producto

Las escenas 3D viven en `capture/NfcLab.dc.html` (proyecto de Claude Design con
las 12 escenas: 8 en three.js y 3 hechas solo con CSS).

1. `python3 capture/extract_component.py` saca el `<script>` del `.dc.html` a
   `nfclab_component.js`, que es lo que cargan los harnesses.
2. Se levanta un servidor local sobre `capture/` (por ejemplo
   `python3 -m http.server 8795`) y se corre `node capture/capture_hires.mjs`
   (opcionalmente con los nombres de las escenas a recapturar). Sale un PNG con
   fondo transparente por escena, a 1320 px, en `capture/hires/`.
   `capture/harness11.html` + `capture/cap_acr.mjs` son la escena del acrílico
   reutilizado, que no vive en el `.dc.html`.

   Los `capture/harness*.html` fuerzan `setPixelRatio(3)` con un Proxy sobre
   `THREE`, porque las escenas topan el ratio en 2 y si no las capturas salen a
   media resolución.

   Ojo con el tiempo de captura (`t` en `capture_hires.mjs`): las animaciones
   avanzan por cuadro, no por reloj, así que a resolución de captura van mucho
   más lento y el momento bueno cae bastante después que en una vista normal.
3. `python3 grade.py` convierte esos PNG en los `img1080/*.webp` cuadrados que
   usa el sitio: recorta al producto, empareja la exposición contra la mediana
   del set y los apoya sobre el fondo oscuro del sitio.

`img1080/dober.webp` es una foto real del cliente, no sale de este pipeline.

## Luz de las escenas 3D

Las siete escenas de three.js del `.dc.html` comparten el método `_studioRig`:
un cuarto de estudio generado al vuelo (paredes en degradado + tres softboxes)
que pasa por `PMREMGenerator` para servir de mapa de entorno, más una luz
principal con sombra, relleno, contraluz y hemisférica.

Detalle importante: las escenas están modeladas a escala real (un gafete mide
0.08 × 0.11 = 8 × 11 cm), así que la cámara de sombras no puede tener medidas
fijas. `_studioRig` mide la escena durante los primeros cuadros y ajusta la
posición de la luz, el frustum de la sombra y el `normalBias` al tamaño real de
lo que hay dentro; después se congela para que la sombra no tiemble cuando
arranca la animación.

## Pendiente

- Faltan los enlaces de Instagram / TikTok / Facebook (hoy dicen "pendiente").
- Las tres escenas hechas con CSS (tarjeta, llavero, mascotas) no pasan por
  `_studioRig`; traen su propia iluminación y su propio fondo.
