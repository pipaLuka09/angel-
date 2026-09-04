# Handoff: Animación 3D de rutina de gym por NFC

## Overview
Una escena 3D interactiva en tiempo real: una máquina de prensa de pierna sobre piso de caucho, con un poste de señalética que lleva una placa NFC de la Estación 07, y un celular que se acerca, hace contacto NFC, muestra la rutina de series de hoy y pasa al video vertical de técnica (formato Reels / TikTok). Es un bucle autónomo de 16 segundos, orbitable con el mouse, y el modelo se puede exportar como OBJ+MTL o GLB.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — un prototipo que muestra la apariencia y el comportamiento previstos, no código de producción para copiar tal cual. La tarea es **recrear la escena dentro del entorno existente del sitio de la tienda** usando sus patrones y librerías establecidas.

Dicho esto: a diferencia de un mockup de UI, aquí la lógica 3D **sí es la implementación real**. La geometría, los materiales, las curvas de animación y el pintado de pantallas en `<canvas>` son three.js puro y deben portarse casi literalmente. Lo que hay que reescribir con los patrones del codebase es la **envoltura**: el montaje del canvas, el ciclo de vida del componente, el lazy-load, el HUD de texto y el responsive.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, proporciones físicas (en metros reales), tiempos de animación y contenido de pantallas son finales. Debe recrearse con precisión.

Dos partes son deliberadamente esquemáticas: la **máquina** es una abstracción geométrica de una prensa de pierna (cajas y cilindros, no un modelo CAD), y el **fotograma del video** es una sugerencia de sala de gym dibujada en canvas (degradado + silueta) en lugar de video real. Ambas se pueden sustituir en producción (ver "Assets").

## Escena

### Layout 3D
- Piso de caucho `#2f2f30` 0.60 × 0.016 × 0.42 m en `(0, 0.008, 0.02)`, con filo acento rojo `#ec3013` al frente en `z = 0.2305`.
- **Máquina** (grupo en `(-0.075, 0, -0.045)`):
  - Dos rieles base 0.026 × 0.020 × 0.230 en `x = ±0.055`, `y = 0.026`; travesaño 0.136 × 0.018 × 0.026 en `z = -0.098`.
  - Columna vertical 0.038 × 0.240 × 0.038 en `(0, 0.156, -0.086)` con tapa de cromo 0.046 × 0.010 × 0.046 en `y = 0.281`.
  - Brazo diagonal del carro 0.022 × 0.190 × 0.022 en `(0, 0.140, 0.010)`, `rotation.x = 0.62`.
  - Plataforma de pies 0.120 × 0.010 × 0.078 en `(0, 0.210, -0.028)`, `rotation.x = 0.62`.
  - Asiento 0.104 × 0.020 × 0.086 en `(0, 0.086, 0.062)`; respaldo 0.104 × 0.088 × 0.020 en `(0, 0.130, 0.104)`, `rotation.x = 0.22`.
  - Dos manijas cromadas (r 0.007, largo 0.070) en `x = ±0.062`, `y = 0.128`, `z = 0.070`, rotadas `Math.PI/2` en Z.
  - Torre de 5 discos 0.086 × 0.014 × 0.052 apilados cada 0.017 desde `y = 0.048`, en `z = -0.150`, con varilla cromada (r 0.004, largo 0.150).
- **Poste de señalética** (fuera del marco, mirando al usuario): poste 0.026 × 0.200 × 0.026 en `(-0.195, 0.100, 0.020)`, pie 0.070 × 0.012 × 0.070 en `y = 0.022`, brazo cromado 0.062 × 0.014 × 0.014 en `(-0.162, 0.070, 0.020)`.
- **Placa NFC** 0.072 × 0.072 m, grosor 0.0024, radio 0.006, bisel 0.0005; rig en `(-0.195, 0.176, 0.0355)`. Cara impresa `PlaneGeometry` 0.071 × 0.071 a `z = grosor/2 + 0.0005`.
- Celular 0.074 × 0.152 × 0.0085 m con bump de cámara 0.024 × 0.024 en `(-0.020, 0.055, -0.0055)`, animado en el aire.

### Arte de la placa NFC (420 × 420 px de canvas)
Fondo tinta `#141414` con franja lima `#c8f04a` de 12 px arriba. "07" en lima 96 px a la izquierda; "PRENSA / DE PIERNA" en blanco 40 px alineado a la derecha. Al centro, 4 olas NFC lima (radio base 34, grosor 22) junto a la silueta de un celular a trazo blanco de 15 px (rectángulo redondeado 112 × 168, radio 18). Abajo, centrado, "ACERCA TU / CELULAR" en blanco 46 px.

### Anillo de pulso NFC
Torus r = 0.016 / 0.0013 con material emisivo `#c8f04a`, a `z = grosor/2 + 0.004` dentro del rig de la placa. `opacity` animada senoidalmente (0 → ~1) y escala 1 → 1.5, solo durante el estado de lectura.

### Pantallas del celular (560 × 1150 px)
- **Reposo**: reloj `hh:mm` blanco 132 px sobre `#0d0f14`, fecha en español en mayúsculas 26 px, banda inferior `#2a2827` con "NFC activado".
- **Lectura NFC**: 3 anillos lima concéntricos pulsantes (radio 70 + i·46, oscilación senoidal ±12), "NFC" blanco 34 px al centro, "Leyendo la máquina…" 28 px, "ESTACIÓN 07" 24 px y barra de progreso lima.
- **Rutina** (`exercise`): fondo blanco con cabecera tinta de 230 px — "EJERCICIO 07 · PIERNA" en lima 22 px y "Prensa de / pierna" en blanco 44 px. Debajo "TU SERIE DE HOY" 24 px y las tres series apareciendo en cascada: cuadro lima de 46 px con el número, las reps en 30 px y el peso a la derecha en `#5a5a5a`, separadas por reglas de 3 px `#e6e6e6` — `1 · 12 reps · 40 kg`, `2 · 10 reps · 50 kg`, `3 · 8 reps · 60 kg`. Nota "Descanso 90 s · Espalda pegada al respaldo". Botón rosa `#fe2c55` de 96 px con icono de play y "VER CÓMO SE HACE", y pie "Abierto por NFC desde la máquina".
- **Video** (`video`): reproductor vertical negro con degradado de sala `#1d2126 → #2c3238 → #14171a`, línea de piso y silueta de máquina en negro translúcido. Barra de estado "REELS". Icono de play grande visible solo en el primer 22 % del estado. Riel de acciones a la derecha: corazón (blanco → rosa `#fe2c55` pasado el 55 %, con el contador saltando de `4.2 k` a `4.3 k`), burbuja de comentarios con `218` y botón de compartir. Bloque de texto: `@coach.rivas` 26 px, dos líneas de indicación técnica ("pies a la altura de los hombros, no bloquees rodilla") y hashtags en lima. Barra de reproducción blanca que avanza con `k`.

### Ciclo (16 s)
`CYCLE = 16.0`, `T_IN = 2.2`, `T_NFC = 4.0`, `T_EX = 8.6`, `T_VID = 14.6`, `T_OUT = 15.4`.

- **0 – 2.2 s** acercamiento de `(0.130, 0.150, 0.215)` a `(-0.195, 0.176, 0.0475)`, rotación X −0.50 → 0 y Y 0.50 → 0, pantalla en reposo.
- **2.2 – 4.0 s** contacto NFC: el celular queda en el punto de contacto con un empuje senoidal de 0.004 m en Z; anillo pulsando.
- **4.0 – 8.6 s** rutina: el celular se levanta hacia `(0.060, 0.185, 0.140)` con `e = ease(min(1, k·2.2))`, rotación X 0 → −0.40 y Y 0 → 0.16.
- **8.6 – 14.6 s** video de técnica, con flotación senoidal de 0.005 m en Y.
- **14.6 – 15.4 s** regreso a la posición lejana.
- **15.4 – 16 s** reposo.

## Interactions & Behavior
- **Órbita**: OrbitControls; el usuario arrastra para girar y hace scroll para acercar. La animación no se interrumpe al orbitar.
- **Cámara fija por la escena**: la escena **no** usa el auto-encuadre del visor — fija su propia cámara sobre el par placa-celular (centro `(-0.062, 0.185, 0.096)`, radio 0.165, factor 1.06, dirección `(1, 0.55, 1.25)` normalizada; `near = dist/100`, `far = dist·100`). Sin esto la pantalla del celular queda demasiado pequeña para leerse. **Conservar este encuadre al portar.**
- **Bucle**: el tiempo se toma de `performance.now() % 16`, así que la animación es *stateless* — no acumula deriva y se puede montar/desmontar sin resetear nada.
- **Doble alimentación del ciclo**: la función `frame(ms)` se llama tanto desde un `requestAnimationFrame` propio como desde `onBeforeRender` de la malla de la pantalla del celular. Es intencional: garantiza que las texturas de canvas se repinten aunque el visor gestione su propio ciclo de render. Ambas llamadas van envueltas en `try/catch` con `console.error` para que un error puntual no congele la escena. **Conservar este patrón.**
- **Easing**: `easeInOutQuad` — `t < 0.5 ? 2t² : 1 − (−2t + 2)²/2`. Las posiciones se interpolan con `Vector3.lerp`, las rotaciones linealmente sobre el valor eased.
- **Micro-movimiento constante**: `rotation.z = sin(ms / 1300) × 0.02` en el celular en todos los estados.
- **Texturas de pantalla**: `CanvasTexture` (`colorSpace = SRGBColorSpace`, `anisotropy = 8`) usada a la vez como `map` y `emissiveMap` con `emissive 0xffffff` e `emissiveIntensity 0.95`. Se repinta cada frame con `needsUpdate`.
- **Pantallas planas**: la pantalla del celular y la cara de la placa son `PlaneGeometry`, no geometría extruida — la extrusión rompe el mapeo UV y la textura sale estirada.
- **Fuentes**: el arte de la placa se repinta dentro de `document.fonts.ready.then(...)`, si no la primera pasada usa la fuente de fallback.
- **Hora real**: la escena lee `new Date()` para la barra de estado y la fecha del reposo.
- **HUD**: panel de texto HTML fijo arriba a la izquierda, `z-index: 10`, `pointer-events: none`, sobre el canvas. Muestra Paso / Rutina / Video y se actualiza solo al cambiar de estado (la rutina aparece recién en `exercise`, el video en `video`).

## State Management
Una sola variable de estado derivada del tiempo, sin estado mutable: `'idle' | 'nfc' | 'exercise' | 'video'`. Cada estado trae un progreso normalizado `k ∈ [0,1]` que impulsa los sub-detalles (pulso del anillo, barra de progreso, la aparición en cascada de las series, el like del video, la barra de reproducción). No hay fetching de datos: el array `SETS` (`[['1','12 reps','40 kg'], ['2','10 reps','50 kg'], ['3','8 reps','60 kg']]`), el nombre de la estación, el del coach y los contadores están escritos literales — sustituirlos por props del componente al integrar. La rutina real vendría del backend por número de estación.

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
| `machine_steel` | `#3a3a3c` | 0.42 | 0.55 |
| `machine_chrome` | `#b9bcc0` | 0.18 | 0.85 |
| `machine_pad` | `#1b1b1c` | 0.72 | 0.05 |
| `weight_plate` | `#2a2a2c` | 0.55 | 0.30 |
| `rubber_floor` | `#2f2f30` | 0.92 | 0.02 |
| `accent_red` | `#ec3013` | 0.40 | 0.05 |
| `nfc_tag_body` | `#f4f3f1` | 0.40 | 0.05 |
| `phone_body` | `#1c1b1a` | 0.40 | 0.30 |
| `phone_back_glass` | `#24221f` | 0.25 | 0.40 |
| `nfc_pulse` | `#c8f04a` emisivo (1.2) | 0.30 | — (opacity animada) |

### Paleta de pantalla
Lima `#c8f04a`, tinta `#141414`, medio `#2a2a2a`, atenuado `#8a8a8a`, rosa de video `#fe2c55`, Instagram `#e1306c`. Reglas de las pantallas `#e6e6e6`, texto secundario `#5a5a5a`, fondo de pantalla apagada `#0d0f14`, banda de la pantalla apagada `#2a2827`, fondo del reproductor `#1d2126 / #2c3238 / #14171a`.

### Escala física (metros — importante mantenerla para que la iluminación se vea bien)
Celular 0.074 × 0.152 × 0.0085 · pantalla del celular 0.067 × 0.142 · placa NFC 0.072 × 0.072 × 0.0024 · poste 0.026 × 0.200 × 0.026 · columna de la máquina 0.038 × 0.240 × 0.038 · piso 0.60 × 0.016 × 0.42.

### Tiempos
Ciclo de 16.0 s — contacto NFC a los 2.2 s, fin de la lectura a los 4.0 s, rutina hasta 8.6 s, video hasta 14.6 s, retirada completa a los 15.4 s, reposo hasta 16.0 s.

## Assets
- **three.js 0.184.0** desde unpkg con import map y hashes de integridad (three, OrbitControls, OBJExporter, GLTFExporter). Al integrar, instalar `three` como dependencia del proyecto en vez de cargar desde CDN.
- **`three-d-stage.js`** — componente web incluido en el paquete: renderer, iluminación de estudio, sombra de suelo, OrbitControls y una barra de exportación OBJ/GLB. Es el andamio; en un codebase con react-three-fiber conviene reemplazarlo por `<Canvas>` + `<OrbitControls>` y conservar solo los valores de iluminación **y el encuadre de cámara descrito arriba**.
- **Sin imágenes externas.** Todo el arte impreso y todas las pantallas del celular se dibujan en `<canvas>` en tiempo de ejecución — no hay PNG ni JPG que copiar, y por eso la animación se ve idéntica en cualquier entorno.
- **Video real (mejora opcional)**: el fotograma del reproductor está dibujado en canvas. Para producción se puede montar un `<video>` real como `VideoTexture` en la malla de la pantalla durante el estado `video` (silenciado, `loop`, `playsinline`), conservando el riel de acciones dibujado encima. También sirve un PNG del primer fotograma real del reel.
- **Máquina real (mejora opcional)**: si existe un modelo GLB de la máquina, sustituir el grupo `machine` por el GLB y mantener el poste, la placa y toda la animación intactos.
- **Iconos**: los del riel de video (corazón, burbuja, compartir) están dibujados a mano en canvas. Si se añade UI HTML alrededor, usar Lucide (https://lucide.dev), conforme al sistema de diseño.
- **Tipografía**: Archivo (Google Fonts) para el HUD; el texto pintado en canvas también la pide con fallback `sans-serif`.

## Files
| Archivo | Qué contiene |
| --- | --- |
| `gym-nfc.html` | La escena — rutina de gym y video de técnica por NFC |
| `three-d-stage.js` | Andamio del visor 3D (renderer, luces, controles, exportadores) |

`gym-nfc.html` es autónomo: abrirlo en un navegador muestra la escena completa. La lógica vive en el `<script type="module">` al final del archivo, en este orden: constantes de paleta → helpers de geometría y canvas → materiales → geometría (piso, máquina, poste, placa, celular) → encuadre de cámara → `paintTag()` → iconos y `paintPhone()` → línea de tiempo (`frame`) → arranque del bucle.

## Notas de integración para la tienda
1. **Peso**: three.js son ~600 KB minificado. Cargar la escena con lazy-load / dynamic import y solo cuando el contenedor entra en viewport (`IntersectionObserver`).
2. **Pausar fuera de pantalla**: detener el `requestAnimationFrame` cuando la escena no es visible o la pestaña está oculta (`document.hidden`). En móvil, ahorra batería de forma notoria.
3. **Fallback**: si WebGL no está disponible, mostrar un video o un PNG de la escena. Conviene grabar un MP4 corto en bucle como respaldo (y como versión ligera para móviles).
4. **Responsive**: en anchos menores a ~480 px conviene acercar el target o subir el FOV para que el celular no quede diminuto. El HUD debería colapsar a una línea o esconderse.
5. **Contenido real**: número de estación, nombre del ejercicio, series/reps/peso, cuenta del coach y enlace del reel deberían ser props del componente — idealmente una escena reutilizable que reciba la estación y pinte su propia placa.
6. **Accesibilidad**: respetar `prefers-reduced-motion` — con la preferencia activa, renderizar un frame estático del estado "Rutina en pantalla", sin bucle y sin autoplay de video.
