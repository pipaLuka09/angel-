# Handoff: Animación 3D de menú de restaurante por NFC

## Overview
Una escena 3D interactiva en tiempo real que muestra una tarjeta NFC de mesa en su soporte acrílico sobre una mesa de madera, y un celular que se acerca, hace conexión NFC y abre el menú digital del restaurante. Es un bucle autónomo de 11 segundos, orbitable con el mouse, y el modelo se puede exportar como OBJ+MTL o GLB.

Nota sobre el nombre del archivo: se llama `menu-qr-pedido.html` por razones históricas, pero la escena **no usa código QR** — la tarjeta lleva el símbolo NFC y la interacción es por acercamiento. Renombrar el componente a algo como `MenuNfcScene` al integrar.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — un prototipo que muestra la apariencia y el comportamiento previstos, no código de producción para copiar tal cual. La tarea es **recrear la escena dentro del entorno existente del sitio de la tienda** usando sus patrones y librerías establecidas.

Dicho esto: a diferencia de un mockup de UI, aquí la lógica 3D **sí es la implementación real**. La geometría, los materiales, las curvas de animación y el pintado de pantallas en `<canvas>` son three.js puro y deben portarse casi literalmente. Lo que hay que reescribir con los patrones del codebase es la **envoltura**: el montaje del canvas, el ciclo de vida del componente, el lazy-load, el HUD de texto y el responsive.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, proporciones físicas (en metros reales), tiempos de animación y contenido de pantallas son finales. Debe recrearse con precisión. La única parte deliberadamente esquemática es el arte impreso de la tarjeta: está dibujado con primitivas de canvas (tipografía, marco, glifo NFC, motivo de huellas) en lugar de usar el archivo de arte real. En producción conviene sustituirlo por la imagen real (ver "Assets").

## Escena
### 3. `menu-qr-pedido.html` — Menú de restaurante por NFC
- **Propósito**: mostrar la tarjeta de mesa abriendo el menú digital por NFC.
- **Layout 3D**: mesa de madera `#4a2f21` 0.48 × 0.022 × 0.26 m con filo acento; soporte acrílico translúcido en L (pie 0.098 × 0.004 × 0.070, panel 0.098 × 0.146 × 0.003 a −0.10 rad, labio 0.098 × 0.010 × 0.006), `opacity 0.42`; tarjeta impresa 0.090 × 0.140 m, grosor 0.0018.
- **Paleta de marca**: naranja `#f26722`, profundo `#d64a12`, papel `#fbd9c0`, tinta `#2b1a12`.
- **Arte de la tarjeta (700 × 1090 px)**: número de mesa "20" naranja 96 px alineado a la derecha; marca 92 px flush left; bajada "SANDWICHS & BOWLS" 30 px; marco naranja 8 px con el glifo NFC de 460 px de ancho; "Acerca tu celular (NFC)" 40 px; "y se abre el menú al instante" en `#7b6a60` 28 px; hashtag en `#d64a12` 54 px; motivo de huellas/hueso en naranja.
- **Anillo de pulso NFC**: torus r = 0.020 / 0.0014 emisivo `#f26722`, igual comportamiento que en la escena 2.
- **Ciclo (11 s)**: 0–2.2 s acercamiento de `(0.125, 0.140, 0.190)` a `(−0.050, 0.104, 0.028)`; 2.2–4 s conexión NFC (3 anillos naranjas concéntricos pulsantes, "Conectando con la mesa…", barra de progreso); 4–9.4 s el celular se levanta a `(0.050, 0.150, 0.130)` mostrando el menú, con los platillos apareciendo en cascada; 9.4–10.4 s regreso; 10.4–11 s reposo.
- **Pantalla de menú (560 × 1150 px)**: cabecera naranja de 190 px con la marca 52 px y "SANDWICHS & BOWLS · MENÚ" 22 px; filas de platillo — nombre `#2b1a12` 30 px, descripción `#7b6a60` 22 px, precio `#d64a12` 30 px alineado a la derecha, regla `#eadfd7` 3 px, paso vertical 128 px; botón inferior oscuro "VER MENÚ COMPLETO"; nota "Abierto por NFC desde la mesa".

## Interactions & Behavior
- **Órbita**: OrbitControls con cámara auto-encuadrada; el usuario arrastra para girar y hace scroll para acercar. La animación no se interrumpe al orbitar.
- **Bucle**: el tiempo se toma de `performance.now() % 11`, así que la animación es *stateless* — no acumula deriva y se puede montar/desmontar sin resetear nada.
- **Doble alimentación del ciclo**: la función `frame(ms)` se llama tanto desde un `requestAnimationFrame` propio como desde `onBeforeRender` de la malla de la pantalla del celular. Esto es intencional: garantiza que las texturas de canvas se repinten aunque el visor gestione su propio ciclo de render. Ambas llamadas están envueltas en `try/catch` con `console.error` para que un error puntual no congele la escena. **Conservar este patrón al portar.**
- **Easing**: `easeInOutQuad` — `t < 0.5 ? 2t² : 1 − (−2t + 2)²/2`. Las posiciones se interpolan con `Vector3.lerp`, las rotaciones linealmente sobre el valor eased.
- **Micro-movimiento constante**: `rotation.z = sin(ms / 1300) × 0.02` en el celular en todos los estados, para que nunca se vea rígido.
- **Anillo NFC en la tarjeta**: material emisivo naranja con `opacity` animada senoidalmente (0 → ~1) y escala 1 → 1.5, solo durante el estado de conexión.
- **Cascada del menú**: los platillos no aparecen de golpe — la cantidad visible se deriva de `k` (`ceil(k × total × 1.4)`), así que entran uno a uno mientras el celular se levanta.
- **Soporte acrílico**: material translúcido (`transparent: true, opacity: 0.42`, roughness 0.15) — es lo que le da la lectura de acrílico real; no sustituirlo por un color plano.
- **Texturas de pantalla**: la pantalla es un `CanvasTexture` (`colorSpace = SRGBColorSpace`, `anisotropy = 8`) usado a la vez como `map` y `emissiveMap` con `emissive 0xffffff` e `emissiveIntensity 0.95`. Se repinta cada frame y se marca `needsUpdate`.
- **Pantallas planas**: la pantalla es `PlaneGeometry`, no geometría extruida — la extrusión rompe el mapeo UV y la textura sale estirada.
- **Fuentes**: el arte de la tarjeta se repinta dentro de `document.fonts.ready.then(...)`, si no la primera pasada usa la fuente de fallback.
- **Hora real**: la escena lee `new Date()` para la barra de estado del celular.
- **HUD**: panel de texto HTML fijo arriba a la izquierda, `z-index: 10`, `pointer-events: none`, sobre el canvas. Se actualiza solo al cambiar de estado.

## State Management
Una sola variable de estado derivada del tiempo, sin estado mutable: `'idle' | 'nfc' | 'menu'`. Cada estado trae un progreso normalizado `k ∈ [0,1]` que impulsa los sub-detalles (pulso del anillo, anillos concéntricos y barra de progreso en pantalla, cascada de platillos). No hay fetching de datos: el contenido del menú está en un array literal (`MENU`, con nombre / descripción / precio por platillo) y el número de mesa está escrito literal — sustituirlos por los datos reales del catálogo o por props al integrar.

## Design Tokens

### Sistema (Modernist) — usados en el HUD y los filos de acento
| Token | Valor |
| --- | --- |
| `--color-bg` | `#f3f2f2` |
| `--color-text` | `#201e1d` |
| `--color-accent` | `#ec3013` |
| `--color-accent-700` | acento profundo (texto sobre fondo claro) |
| `--font-heading` / `--font-body` | Archivo |
| radio | `0px` en todo el sistema |
| reglas | 2px, `--color-divider` |

### Materiales 3D (`MeshStandardMaterial`)
| Nombre | Color | Roughness | Metalness |
| --- | --- | --- | --- |
| `acrylic_clear` | `#dfe3e2` | 0.15 | 0.05 (opacity 0.42) |
| `card_stock` | `#f7dcc5` | 0.55 | 0.0 |
| `table_walnut` | `#4a2f21` | 0.55 | 0.05 |
| `accent_red` | `#ec3013` | 0.40 | 0.05 |
| `phone_body` | `#1c1b1a` | 0.40 | 0.30 |
| `phone_back_glass` | `#24221f` | 0.25 | 0.40 |
| `nfc_pulse` | `#f26722` emisivo | 0.30 | — (opacity animada) |

### Paleta de marca del restaurante
Naranja `#f26722`, profundo `#d64a12`, papel `#fbd9c0`, tinta `#2b1a12`, regla `#eadfd7`, secundario `#7b6a60`, pantalla apagada `#0d0f14`, texto secundario en pantalla `#9aa0a6`.

### Escala física (metros — importante mantenerla para que la iluminación se vea bien)
Celular 0.074 × 0.152 × 0.0085 · pantalla del celular 0.067 × 0.142 · tarjeta 0.090 × 0.140 × 0.0018 · soporte acrílico: pie 0.098 × 0.004 × 0.070, panel 0.098 × 0.146 × 0.003 a −0.10 rad, labio 0.098 × 0.010 × 0.006 · mesa 0.48 × 0.022 × 0.26.

### Tiempos
Ciclo de 11.0 s — contacto NFC a los 2.2 s, fin de la conexión a los 4.0 s, menú visible hasta 9.4 s, retirada completa a los 10.4 s, reposo hasta 11.0 s.

## Assets
- **three.js 0.184.0** desde unpkg con import map y hashes de integridad (three, OrbitControls, OBJExporter, GLTFExporter). Al integrar, instalar `three` como dependencia del proyecto en vez de cargar desde CDN.
- **`three-d-stage.js`** — componente web incluido en el paquete: renderer, iluminación de estudio, sombra de suelo, OrbitControls, cámara auto-encuadrada y barra de exportación OBJ/GLB. Es el andamio; en un codebase con react-three-fiber conviene reemplazarlo por `<Canvas>` + `<OrbitControls>` y conservar solo los valores de iluminación.
- **Sin imágenes externas.** Todo el arte impreso se dibuja en `<canvas>` en tiempo de ejecución. **Recomendación para producción**: sustituir `paintCard()` por una textura cargada del arte real del cliente (`TextureLoader`, PNG a 2048 px de lado largo, `colorSpace = SRGBColorSpace`) — es más fiel y más barato en CPU. Idealmente el arte de la tarjeta debería ser un parámetro del componente, para poder mostrar la tarjeta de cualquier cliente.
- **Marca del ejemplo**: el nombre, el hashtag y el motivo gráfico son de un restaurante de ejemplo. Sustituirlos por marca genérica o por la del cliente que se esté mostrando.
- **Iconos**: si se añade UI alrededor, usar Lucide (https://lucide.dev), conforme al sistema de diseño.
- **Tipografía**: Archivo (Google Fonts) para el HUD; el texto pintado en canvas también la pide con fallback `sans-serif`.

## Files
| Archivo | Qué contiene |
| --- | --- |
| `menu-qr-pedido.html` | La escena — menú de restaurante abierto por NFC |
| `three-d-stage.js` | Andamio del visor 3D (renderer, luces, controles, exportadores) |

`menu-qr-pedido.html` es autónomo: abrirlo en un navegador muestra la escena completa. La lógica vive en el `<script type="module">` al final del archivo, en este orden: materiales → geometría → funciones de pintado de canvas → línea de tiempo (`frame`).

## Escena hermana
Existe una variante, `pedido-nfc.html`, idéntica a esta más un cuarto paso donde el cliente arma el pedido y lo envía desde el celular (ciclo de 15 s). Si se van a integrar las dos, conviene construir **un solo componente** con una prop que active o no el paso de pedido, en vez de duplicar la escena.

## Notas de integración para la tienda
1. **Peso**: three.js son ~600 KB minificado. Cargar la escena con lazy-load / dynamic import y solo cuando el contenedor entra en viewport (`IntersectionObserver`).
2. **Pausar fuera de pantalla**: detener el `requestAnimationFrame` cuando la escena no es visible o la pestaña está oculta (`document.hidden`). En móvil, ahorra batería de forma notoria.
3. **Fallback**: si WebGL no está disponible, mostrar un video o un PNG de la escena. Conviene grabar un MP4 corto en bucle como respaldo (y como versión ligera para móviles).
4. **Responsive**: el visor se auto-encuadra, pero en anchos menores a ~480 px conviene subir el FOV o acercar el target para que el celular no quede diminuto. El HUD debería colapsar a una línea o esconderse.
5. **Contenido real**: reemplazar el array `MENU`, el número de mesa, la marca y el arte de la tarjeta por props del componente.
6. **Accesibilidad**: respetar `prefers-reduced-motion` — con la preferencia activa, renderizar un frame estático del estado de menú abierto, sin bucle.
