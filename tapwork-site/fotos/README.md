# Fotos y videos reales de los productos

Lo que usa la tienda (`productos.html`) en lugar del render 3D y del reel
generado. Formato 4:5.

- `menu.jpg`, `tarjeta.jpg`, `resenas.jpg`: fotos de estudio hechas a partir
  de fotos reales del producto: se recorta la pieza, se endereza, se limpia
  (dedos, reflejos) y se pone de pie sobre un fondo de estudio oscuro con
  sombra y reflejo. `herramientas/estudio.py` las arma (pide las fotos fuente y
  sus recortes sin fondo, hechos con rembg / isnet-general-use).
- `menu.mp4`, `tarjeta.mp4`: videos de venta de 14,8 s hechos con el video real
  del cliente: gancho, tres escenas con texto y cierre con la foto de estudio,
  el logo y el WhatsApp. `herramientas/video-venta.html` dibuja cada cuadro y
  `herramientas/render-venta.js` lo renderiza. Las versiones en 1080 × 1350,
  para redes, están en `../reels/1080/*-venta.mp4`.

Las fotos y videos originales están en el historial de git.
