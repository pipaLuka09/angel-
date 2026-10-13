# La abuelita con la tarjeta

Imagen original de Tap Work, generada con IA (Higgsfield, Nano Banana 2.1) a
partir de la foto real de la tarjeta TAP WORK. No usa nada del anuncio de
Tap1ce.

- `fondo.jpg`: la calle, los edificios y el cielo, sin ella (el hueco se
  rellenó para que pueda moverse un poco sin dejar ver el corte).
- `frente.webp`: ella con la tarjeta, sobre transparencia, del mismo tamaño
  que el fondo para que calcen.

- `plate.jpg`: la calle sin ella, sin palmeras y con el cielo limpio (sin
  nubes): lo que queda detrás de lo que se mueve.
- `masks.png` (a la mitad de tamaño): R = cielo, G = palmeras, B = número de
  palmera (para el viento).
- `cielo.png`: el cielo como transparencia, para que los aviones y las
  bandadas lejanas pasen por detrás de los edificios.

`../cielo.js` redibuja la calle con la GPU como un time-lapse de cámara fija
(nubes que pasan, palmeras con viento, luz que baja cuando una nube tapa el
sol) y hace volar las gaviotas y los aviones; `../site.css` (bloque
`bg--photo`) pone a la abuelita delante. `herramientas/placas.py` genera
`plate.jpg`, `masks.png` y `cielo.png` a partir de la foto y del recorte.
