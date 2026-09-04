# Handoff: Llavero NFC — Döber

## Overview
Una escena animada de un llavero completo — argolla partida, dos llaves y la pieza impresa en 3D como dije — con un chip NFC oculto dentro de la pieza, y un celular que se acerca, hace contacto y abre el Instagram del negocio. Cuatro pasos en bucle de 18 segundos: reposo → lectura NFC → perfil de @dober_ec con el feed real desplazándose → reel del pedido. A la izquierda, un texto que narra cada paso.

**No usa three.js**: es HTML + CSS + JavaScript. El llavero está construido con cajas y degradados CSS; la pieza impresa, el feed y el reel son recortes de fotos reales.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — un prototipo que muestra la apariencia y el comportamiento previstos, no código de producción para copiar tal cual. La tarea es **recrear la escena dentro del entorno existente del sitio de la tienda** usando sus patrones y librerías establecidas.

Todo aquí es UI: la maqueta del llavero, el celular y sus pantallas son marcado y CSS normales. Se espera reescribirlos como componentes del proyecto, tomando de este archivo los valores exactos: geometría, colores, tiempos y contenido.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, proporciones, tiempos y contenido son finales.

Tres consideraciones:
- Las **tres imágenes** son material del cliente, recortadas de sus fotos y su captura de Instagram. Van incluidas en el paquete.
- El **llavero metálico** (argolla, llaves, capuchón, vástago) está dibujado con CSS — cajas con degradados lineales y sombras. Es una abstracción convincente a este tamaño, no un render. Si existe una foto del llavero real armado, conviene sustituirlo (ver "Assets").
- Los **contadores** (412 publicaciones, 18,4 k seguidores, 2.184 likes, 148 comentarios, 396 compartidos) son de ejemplo; el resto del contenido de @dober_ec es real.

## Escena

### Layout
Dos columnas (`grid-template-columns: minmax(250px, 360px) auto`, `gap: 32px`, alto `100vh − 48px`, máximo 1180 px). Bajo 850 px pasa a una sola columna centrada, con la columna de texto a máximo 420 px.

- **Izquierda**: kicker 11 px en acento profundo + titular 38 px + regla de 2 px + párrafo narrativo (`min-height: 100px` para que el layout no salte al cambiar de texto) + barra de 4 pasos + una miniatura de 52 px recortada de la pieza con `@dober_ec` y la bajada.
- **Derecha**: el escenario, `600 × 716 px`, con fondo `radial-gradient(120% 90% at 26% 44%, #1c1a19, #0f0e0e 58%, #080808)` y una regla de acento de 2 px al pie.

**Escalado**: el escenario va dentro de `.stagebox` con `container-type: size`, `height: min(716px, calc(100vh − 48px))` y `aspect-ratio: 600/716`; el contenido se escala con `transform: scale(calc(100cqh / 716px))` y `transform-origin: top left`. **Es CSS puro a propósito** — una versión anterior calculaba la escala en JavaScript y fallaba cuando el contenedor arrancaba con altura cero. No volver a JS para esto.

### El llavero — geometría por bandas
Esta es la parte delicada del archivo. Todas las piezas están posicionadas en absoluto dentro de `.chain` (`left: 26px; top: 214px; 250 × 452 px`) y **ocupan bandas verticales que no se cruzan**. Un intento anterior con las piezas superpuestas dejaba las llaves atravesando la silueta recortada de la pieza impresa. Al portar, mantener las bandas:

| Banda (y, relativa a `.chain`) | Pieza |
| --- | --- |
| 0 – 62 | Argolla partida: círculo de 62 px, `border: 5px solid #c6cace`, con un `::after` de 16 × 5 px rotado −24° que simula la apertura |
| 6 – 140 (hacia **arriba**) | Las dos llaves: cabeza de 28 px con degradado y ojo negro de 10 px, hoja de 11 × 112 px con degradado de tres paradas y dos dientes de 6 × 8 px. `transform-origin: 14px 14px`; la de acero rotada 206°, la de latón 158°. Salen hacia arriba desde la argolla |
| 44 – 92 | Capuchón: aro de 18 px (`border: 4px`) + caja de 26 × 16 px |
| 74 – 100 | Vástago de 8 × 26 px con degradado vertical de tres paradas |
| 96 – 396 | La pieza impresa: `186 × 300 px` con la foto a `50% 46%/104%` y una **máscara radial** (`closest-side at 50% 46%, #000 68%, rgba(0,0,0,.5) 88%, transparent 100%`) que funde el fondo de la foto con el del escenario. Sombra elíptica en `y = 378` |

### El chip y el campo NFC
- `.chip` — círculo de 58 px con `border: 2px dashed rgba(255,255,255,.42)` y la palabra "NFC", en `left: 96px; top: 262px` (la base del cuello de la pieza, fuera de la cara). En el estado de lectura el borde pasa a acento y gana `box-shadow: 0 0 26px 8px rgba(236,48,19,.45)`. **La idea es que el chip va oculto dentro de la pieza**, no pegado encima — de ahí el trazo punteado.
- `.field` — contenedor de tamaño cero en `left: 151px; top: 505px` (coordenadas del escenario, no de `.chain`) con tres anillos `border: 2.5px solid var(--color-accent)`, `z-index: 10` para que salgan **por encima del celular**.
- `.pin` — etiqueta "CHIP NFC DENTRO DE LA PIEZA" en blanco sobre tinta con vástago de 2 px, debajo de la pieza (`top: 620px`). Se desvanece en cuanto sale del estado de reposo.

### El celular
`296 × 606 px` dentro del escenario (`left: 290px; top: 48px`), cuerpo `#131211`, `border-radius: 40px`, padding 10 px, sombra `0 40px 60px -22px rgba(0,0,0,.8)`, borde interior de 1 px translúcido. Pantalla `border-radius: 31px`, isla dinámica de `86 × 23 px`, barra de inicio de `98 × 4 px`. Barra de estado de 46 px con hora real, etiqueta de contexto e icono de batería dibujado con `border` + `::after`.

**Coreografía** (todo con `transition: transform 1.25s cubic-bezier(.4,0,.2,1)`):
- reposo: `translate(30px, 52px) rotate(8deg) scale(.86)`
- lectura: `translate(-8px, 74px) rotate(-7deg) scale(.84)` — se acerca pero **se detiene a 30 px de la pieza**, para que el llavero siga a la vista
- perfil y reel: `translate(0, 0) rotate(0) scale(1)` — al frente y recto

### Las cuatro pantallas
- **Bloqueo** — degradado `#1d1a19 → #0d0c0c → #080808`, reloj 64 px con la hora real, fecha en español, y un aviso translúcido con el glifo NFC (SVG de arcos + rectángulo): "NFC activado · Acerca el celular al llavero".
- **Llavero detectado** — backdrop `rgba(6,6,8,.62)` y una hoja blanca que **sube desde abajo** (`translateY(102%)` → `none`, `.55s cubic-bezier(.22,1,.28,1)`): manija, tres anillos de acento pulsando alrededor de un disco tinta con "NFC", titular "Llavero detectado", "Abriendo instagram.com/dober_ec…" y barra de progreso.
- **Perfil** — fondo `#0a0a0a`. Cabecera con flecha, `dober_ec` y "···". Avatar de 66 px recortado de la pieza con doble aro (`0 0 0 2px #0a0a0a, 0 0 0 4px #e8531f`). Contadores 412 / 18,4 k / 286. Bio "Döber · Sánduches y bowls", "Pulled pork, bowls y choclo Döber. Guayaquil." y `#FielAlSabor` en naranja. Tres acciones: **Seguir** en naranja `#e8531f` (que pasa a **Siguiendo** en gris al 55 % del estado), **Mensaje**, y un botón de icono de 38 px con el SVG de compartir — las tres con `flex: 1 1 0; min-width: 0` para que no se desborden. Barra de pestañas con cuatro iconos SVG (cuadrícula activa, reels, etiquetados, guardados). Y el **feed real**: una cuadrícula 3 × 4 generada en JS a partir de un solo PNG, con `background-size: 300% 400%` y `background-position` calculado por celda, cada celda a `padding-top: 125%` (formato retrato de Instagram) y un marcador de reel en la esquina. Se desplaza con `transform: translateY(...)`.
- **Reel** — la foto del post a `cover` con un degradado en tres tramos encima, píldora naranja "REEL · @DOBER_EC", riel derecho con corazón / burbuja / avión (SVG) y sus contadores, bloque de texto con `@dober_ec` y la descripción, y barra de reproducción blanca que avanza con `k`.

### Ciclo (18 s)
`CYCLE = 18`, `T_LECT = 3.4`, `T_PERFIL = 5.8`, `T_REEL = 12.6`, `T_END = 17.0`.

- **0 – 3.4 s** `acerca`: los anillos laten despacio (periodo 1900 ms, diámetro 46 → 170 px, opacidad hasta 0.42, borde 2 px).
- **3.4 – 5.8 s** `lectura`: los anillos aceleran (periodo 700 ms, diámetro 56 → 246 px, opacidad hasta 0.95, borde 3 px), el chip se enciende, el celular se acerca y la barra avanza (`k · 132 %`).
- **5.8 – 12.6 s** `perfil`: tras una pausa en la cabecera (el scroll arranca en `k > 0.28`), el feed se desplaza 300 px; a `k > 0.55` el botón pasa a "Siguiendo".
- **12.6 – 17.0 s** `reel`: la barra de reproducción avanza.
- **17.0 – 18 s** vuelta a `acerca`.

La opacidad de los anillos se calcula como `base · (1 − u)²` con `u` la fase normalizada de cada anillo — así se apagan al expandirse. Los anillos de la hoja del celular tienen periodo 780 ms y diámetro 38 → 142 px.

## Interactions & Behavior
- **Sin interacción requerida**: es un bucle autónomo. No hay clicks ni hover; los "botones" son parte de la ilustración.
- **Bucle stateless**: el estado se deriva de `performance.now() / 1000 % 18` dentro de un `requestAnimationFrame`. No acumula deriva y se puede montar/desmontar sin resetear nada.
- **`setState` con guarda**: solo toca el DOM cuando el estado realmente cambia (`if (s === last) return`); el resto del frame solo actualiza anillos, barras y scroll. Conservar ese patrón al portar.
- **Estados por atributo**: `data-state` en el escenario (`acerca | lectura | perfil | reel`) y el CSS reacciona con selectores `[data-state="..."]`. Es el enganche natural para portarlo a un framework.
- **Feed generado en JS**: la cuadrícula 3 × 4 se construye en un bucle al arrancar, calculando `backgroundPosition` por celda (`col · 50%`, `row · 100/3 %`) y marcando como reel los índices `[2,3,5,6,8,10]`. Al integrar con datos reales, sustituir por una lista de posts y un `<img>` por celda.
- **Hora real**: lee `new Date()` y rellena todas las barras de estado, el reloj y la fecha en español (`toLocaleDateString('es-MX', { weekday, day, month })`).
- **`prefers-reduced-motion`**: ya está implementado. Con la preferencia activa se salta el bucle y se renderiza el estado del perfil, con todas las transiciones desactivadas por CSS. **Conservarlo.**

## State Management
Una sola variable de estado derivada del tiempo, más un progreso normalizado `k ∈ [0,1]` por estado que impulsa los sub-detalles (anillos, barra de lectura, scroll del feed, el cambio de Seguir a Siguiendo, la barra del reel). Sin fetching: bio, contadores y textos están escritos literales en el marcado — sustituirlos por props del componente al integrar.

## Design Tokens
El archivo enlaza la hoja del sistema de diseño (Modernist) y consume sus variables. Al integrar, reemplazar ese `<link>` por los tokens del proyecto. Valores usados:

| Token | Valor |
| --- | --- |
| `--color-bg` | `#f3f2f2` |
| `--color-text` | `#201e1d` |
| `--color-accent` | `#ec3013` |
| `--color-accent-700` | acento profundo (texto sobre fondo claro) |
| `--color-divider` | gris de las reglas de 2 px |
| `--color-neutral-200` | `#ddd9d7` aprox. (pasos vacíos) |
| `--font-heading` / `--font-body` | Archivo |
| radio | `0px` en todo el sistema (las excepciones son los radios físicos: chasis del celular, argolla, aros) |

Colores literales fuera del sistema: naranja de la marca `#e8531f` (y `#ff7a3d` para el hashtag), escenario `#1c1a19 / #0f0e0e / #080808`, chasis del celular `#131211`, pantalla `#0b0b0d`, perfil `#0a0a0a` con acciones `#1f1f21` y separador `#1e1e21`, metales `#c6cace / #d3d7da / #8d9196` (acero) y `#e2c583 / #a07f36 / #e9d091` (latón), texto secundario `#6f6a67` / `#8d8580`.

## Calibración (importante si se cambian las imágenes)
Los recortes están medidos contra los PNG incluidos:

| Qué | Valor | Qué señala |
| --- | --- | --- |
| `.fob` | `50% 46%/104%` + máscara radial `closest-side at 50% 46%` | la pieza impresa centrada, con el fondo fundido |
| `.ctx u` y `.ig-av` | `50% 34%/150%` | recorte de la cabeza para miniatura y avatar |
| `.ig-grid i` | `background-size: 300% 400%` | la cuadrícula 3 × 4 dentro de un solo PNG |
| `.reel` | `50% 46%/cover` | el fotograma del reel |
| `.chip` | `left: 96px; top: 262px` (58 px) | la base del cuello de la pieza |
| `.field` | `left: 151px; top: 505px` | el mismo punto, en coordenadas del escenario |

Si se cambia la foto de la pieza, recalibrar `.fob`, `.chip` y `.field`. Si se cambia la captura del feed, mantener la grilla en 3 × 4 o ajustar `background-size` y el bucle generador.

## Assets
- **`assets/dober-fob.png`** — la pieza impresa (cabeza de dóberman), recortada de la foto del cliente. Se usa tres veces: el dije del llavero, la miniatura del texto y el avatar del perfil.
- **`assets/dober-feed.png`** — la cuadrícula 3 × 4 del feed real de @dober_ec, recortada de la captura del cliente.
- **`assets/dober-reel.png`** — un post del feed, usado como fotograma del reel.
- **Sin three.js ni WebGL** — no hay que instalar dependencias.
- **Foto del llavero real (mejora opcional)**: el metal está dibujado con CSS. Si el cliente fotografía el llavero armado sobre fondo oscuro, se puede sustituir todo el bloque `.chain` por la foto y conservar el chip, el campo NFC y toda la animación intactos. Sería la mejora de fidelidad más grande del paquete.
- **Video real (mejora opcional)**: el reel es una imagen fija. Se puede montar un `<video>` (silenciado, `loop`, `playsinline`) detrás del riel de acciones.
- **Iconos**: los del perfil y el reel están como SVG inline. Si se añade UI alrededor, usar Lucide (https://lucide.dev), conforme al sistema de diseño.
- **Tipografía**: Archivo (Google Fonts), vía la hoja del sistema de diseño.

## Files
| Archivo | Qué contiene |
| --- | --- |
| `llavero-dober-nfc.html` | La escena — llavero con chip NFC que abre Instagram |
| `assets/dober-fob.png` | La pieza impresa (dije, miniatura y avatar) |
| `assets/dober-feed.png` | El feed real de @dober_ec (cuadrícula 3 × 4) |
| `assets/dober-reel.png` | El fotograma del reel |

`llavero-dober-nfc.html` es autónomo: abrirlo en un navegador muestra la escena completa. La lógica vive en el `<script>` al final del archivo, en este orden: referencias al DOM → generación del feed → textos por estado → hora real → constantes del ciclo → `setState` → `frame` → arranque (con la rama de `prefers-reduced-motion`).

## Notas de integración para la tienda
1. **Peso**: prácticamente nulo (tres imágenes + CSS). No hace falta lazy-load del código, pero sí de las imágenes (`loading="lazy"` fuera del primer viewport) y servirlas en WebP/AVIF con `width`/`height` explícitos.
2. **Pausar fuera de pantalla**: cortar el `requestAnimationFrame` cuando el contenedor no es visible (`IntersectionObserver`) o la pestaña está oculta (`document.hidden`).
3. **Respetar las bandas del llavero**: si se reacomoda la maqueta, verificar que ninguna pieza entre en la banda de la pieza impresa (y 96–396). El solape es lo que rompía la versión anterior.
4. **Contenido real**: usuario, bio, contadores, posts del feed y texto del reel deberían ser props. Lo ideal es una escena reutilizable que reciba `{ handle, bio, stats, posts, reel }` y sirva para cualquier cliente que compre el llavero.
5. **Enlace real**: el destino del chip es `instagram.com/dober_ec`. En producción, el chip NFC debería apuntar a una URL propia con redirección, para poder cambiar el destino sin reprogramar los llaveros y para medir toques.
6. **Accesibilidad**: `prefers-reduced-motion` ya está resuelto. Añadir `alt` descriptivo a las imágenes reales y marcar las capas decorativas (anillos, metal, degradados) como `aria-hidden`.
