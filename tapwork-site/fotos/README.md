# Fotos y videos reales de los productos

Lo que usa la tienda (`productos.html`) en lugar del render 3D y del reel
generado. Formato 4:5.

- `menu.jpg`, `tarjeta.jpg`, `resenas.jpg`: fotos de estudio hechas a partir
  de fotos reales del producto: se recorta la pieza, se endereza, se limpia
  (dedos, reflejos) y se pone de pie sobre un fondo de estudio oscuro con
  sombra y reflejo. `herramientas/estudio.py` las arma (pide las fotos fuente y
  sus recortes sin fondo, hechos con rembg / isnet-general-use).
- `pago.jpg`, `wifi.jpg`: todavía no hay foto real; son el render 3D sobre el
  mismo fondo de estudio, para que la tienda se vea pareja.
- `menu.mp4`, `tarjeta.mp4`: videos de venta de 14,8 s hechos con el video real
  del cliente: gancho, tres escenas con texto y cierre con la foto de estudio,
  el logo y el WhatsApp. `herramientas/video-venta.html` dibuja cada cuadro y
  `herramientas/render-venta.js` lo renderiza.
- `resenas.mp4`, `pago.mp4`, `wifi.mp4`: el mismo formato de venta, pero sin
  toma real todavía: la foto del acrílico (reseñas), la animación 3D del toque
  y las pantallas del celular sin textos (`herramientas/pantallas.js` las saca
  de `../reels/composer.html`). Cuando haya video real, se rehacen como los del
  menú y la tarjeta. Las versiones en 1080 × 1350,
  para redes, están en `../reels/1080/*-venta.mp4`.

Las fotos y videos originales están en el historial de git.
