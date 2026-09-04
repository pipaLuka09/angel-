# Handoff: Sticker NFC en tomatodo — enemy®

## Overview
Una escena 3D interactiva en tiempo real: un tomatodo de aluminio cepillado sobre el escritorio, con el sticker circular "593" **curvado sobre la pared de la botella** y un chip NFC dentro, y un celular que se acerca, hace contacto y abre el Instagram de la marca. Cuatro pasos en bucle de 18 segundos: reposo → lectura NFC → perfil de @enemy___ con el feed real desplazándose → la tienda enemyrd.com. Orbitable con el mouse, y el modelo se puede exportar como OBJ+MTL o GLB.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — un prototipo que muestra la apariencia y el comportamiento previstos, no código de producción para copiar tal cual. La tarea es **recrear la escena dentro del entorno existente del sitio de la tienda** usando sus patrones y librerías establecidas.

Dicho esto: a diferencia de un mockup de UI, aquí la lógica 3D **sí es la implementación real**. La geometría, los materiales, las curvas de animación y el pintado de texturas en `<canvas>` son three.js puro y deben portarse casi literalmente. Lo que hay que reescribir con los patrones del codebase es la **envoltura**: el montaje del canvas, el ciclo de vida del componente, el lazy-load, el HUD de texto y el responsive.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, proporciones físicas (en metros reales), tiempos de animación y contenido de pantallas son finales.

Dos consideraciones:
- El **sticker** es una recreación del sticker real del cliente, dibujada en canvas: disco oscuro con filo holográfico, "593" en serif plateada, "FROM THE MIDDLE OF THE EARTH", *Ecuador* en script y "POWERED BY ENEMY COMPANY™".
- Las **dos imágenes** (feed y avatar) son material del cliente, recortadas de su Instagram. Los contadores (317 publicaciones, 47,1 k seguidores) son de ejemplo; el resto del contenido de @enemy___ es real.

## Escena

### Layout 3D (metros reales)
- Escritorio `#c9c6c2` 0.320 × 0.016 × 0.180 m en `(0.014, 0.008, 0.020)`, con filo acento rojo `#ec3013` de 0.004 m al frente en `z = 0.1105`.
- **Tomatodo** (grupo en `(-0.062, 0.016, 0.004)`), `BR = 0.0385`, `BH = 0.212`:
  - Pared: cilindro r 0.0385 / 0.0379, alto 0.212, 64 segmentos, `openEnded: false`, centrado en `y = BH/2`.
  - Base: cilindro r 0.0379 / 0.0362, alto 0.006, en `y = 0.003`.
  - Hombro: cilindro r 0.0231 → 0.0385, alto 0.030, en `y = BH + 0.015`.
  - Cuello cromado: r 0.0212 / 0.0223, alto 0.016, en `y = BH + 0.038`.
  - Tapa negra: r 0.0231, alto 0.028, en `y = BH + 0.060`, con disco superior de 0.004 en `y = BH + 0.076`.
  - Asa: torus r 0.0130 / 0.0030 en `(0, BH + 0.080, -0.0116)`, `rotation.x = 0.28`.
- **El sticker** — lo más particular de la escena: no es un plano pegado, es un **arco de cilindro**. `CylinderGeometry(BR + 0.0008, BR + 0.0008, 0.062, 48, 1, true, -θ/2, θ)` con `θ = 0.062 / BR` — el arco cubre exactamente el ancho del sticker sobre la superficie curva. Va en `y = 0.128` dentro de un rig rotado `rotation.y = 0.62` para que quede orientado al usuario. Material con `side: THREE.DoubleSide`, `transparent: true` y la textura también como `emissiveMap` (intensidad 0.30).
- Celular 0.074 × 0.152 × 0.0085 m con bump de cámara 0.024 × 0.024 en `(-0.020, 0.055, -0.0055)`, animado en el aire.

**La normal del sticker** se calcula una vez y se reutiliza para todo lo que debe alinearse con él:
```js
const NORMAL = new THREE.Vector3(Math.sin(0.62), 0, Math.cos(0.62));
const STICK_C = new THREE.Vector3(bottle.x + NORMAL.x * BR, 0.016 + 0.128, bottle.z + NORMAL.z * BR);
```
El marcador de chip, el anillo de pulso y el punto de contacto del celular se derivan de ahí con `addScaledVector(NORMAL, …)` y `lookAt`. Al portar, conservar ese patrón — es lo que mantiene todo perpendicular a la pared curva.

### Arte del sticker (640 × 640 px de canvas)
Fondo transparente. Disco con degradado radial `#4a4d52 → #26282c → #121316` (r = R − 18). **Filo holográfico**: seis arcos de 20 px de grosor con degradados lineales entre `#9ef0d2 → #d9c9ff → #ffd9a8 → #a8e6ff → #ffc7e6 → #c9ffd8`, dibujados a r = R − 11. Encima, centrado: "593" en Cormorant Garamond 224 px con degradado plateado vertical (`#ffffff → #cfd4d8 → #83888d`), "FROM THE MIDDLE OF THE EARTH" 32 px, *Ecuador* en Pinyon Script 104 px con degradado plateado, "POWERED BY ENEMY COMPANY™" 22 px, y tres arcos blancos de 6 px como glifo NFC al pie.

### Aluminio cepillado procedural
Canvas de 1024 × 256, base `#20343a`, 12 000 trazos **horizontales** finos (`lineWidth 0.35–0.85`, alfa 0.030–0.035) más una banda de realce vertical (`linear-gradient` a lo ancho, pico de 0.16 al 30 %) que simula el único reflejo suave que capta la pared. `RepeatWrapping` con `repeat.set(1, 4)`. Una versión anterior con menos trazos y más alfa leía como franjas gruesas.

### Anillo de pulso NFC
Torus r = 0.026 / 0.0012 con material emisivo `#ec3013`, más un marcador de chip (torus r 0.0135), ambos en el centro del sticker y orientados con la normal. `opacity` animada senoidalmente y escala 1 → 1.5, visible solo durante la lectura; el marcador se mantiene tenue (0.26) el resto del tiempo.

### Pantallas del celular (560 × 1150 px)
- **Reposo**: reloj `hh:mm` 132 px sobre `#0c0c0e`, fecha en español en mayúsculas, y un recuadro con borde translúcido: "NFC ACTIVADO · Acerca el celular al sticker".
- **Lectura NFC**: hoja blanca en la mitad inferior con manija, tres anillos de acento pulsando alrededor de un disco tinta con "NFC", "Sticker detectado" 38 px, "Abriendo instagram.com/enemy___…" y barra de progreso.
- **Perfil**: fondo negro, `enemy___` 34 px, avatar circular de r 48 sobre fondo blanco con aro rosa `#f0397a`, contadores 317 / 47,1 k / 3, bio "enemy®" + "Ropa (marca)" + "Santo Domingo – Santiago" + "Worldwide Shipping" + `www.enemyrd.com` en azul `#7cb0ff`, botón **SEGUIR** en azul `#3f5bf6` que pasa a **SIGUIENDO** gris al 55 % del estado, botón MENSAJE, y el **feed real** dibujado desde un solo PNG a ancho completo, con scroll que arranca en `k > 0.3` y un degradado de desvanecido al pie.
- **Tienda** (`tienda`): fondo blanco con barra de dirección `www.enemyrd.com`, cabecera oscura de 250 px con "enemy®" 52 px, "WORLDWIDE SHIPPING" y el avatar recortado en círculo, y debajo cuatro filas de catálogo que **aparecen en cascada** (Camisetas · NUEVO, Gorras · RESTOCK, Lentes · CÁPSULA, Summer essentials · 0026) separadas por reglas de 4 px, más un botón tinta "VER LA TIENDA".

### Ciclo (18 s)
`CYCLE = 18.0`, `T_IN = 2.6`, `T_NFC = 4.6`, `T_PERFIL = 11.4`, `T_TIENDA = 16.2`, `T_OUT = 17.2`.

- **0 – 2.6 s** acercamiento de `(0.152, 0.204, 0.118)` al punto de contacto, rotación X −0.30 → −0.44 y Y −0.30 → 0.62, pantalla en reposo.
- **2.6 – 4.6 s** contacto NFC: el celular apoya su **borde superior** sobre el sticker (`TAP = centro + normal · 0.034`, con `y += 0.090` — ahí está la antena NFC real de un teléfono, y así el sticker queda a la vista en lugar de tapado). Empuje senoidal de 0.005 m a lo largo de la normal; anillo pulsando.
- **4.6 – 11.4 s** perfil: el celular se levanta hacia `(0.112, 0.136, 0.080)` con `e = ease(min(1, k·2.2))`, rotación X −0.16 → −0.34 y Y 0.62 → −0.34; el feed se desplaza.
- **11.4 – 16.2 s** tienda, con flotación senoidal de 0.004 m en Y.
- **16.2 – 17.2 s** regreso a la posición lejana.
- **17.2 – 18 s** reposo.

## Interactions & Behavior
- **Órbita**: OrbitControls; el usuario arrastra para girar y hace scroll para acercar. La animación no se interrumpe al orbitar.
- **Cámara fija por la escena**: la escena **no** usa el auto-encuadre del visor — fija su propia cámara sobre el par botella-celular (centro `(0.018, 0.140, 0.030)`, radio 0.226, factor 1.04, dirección `(0.86, 0.34, 1)` normalizada; `near = dist/100`, `far = dist·100`). Sin esto la pantalla del celular queda demasiado pequeña para leerse. **Conservarlo al portar.**
- **Bucle**: el tiempo se toma de `performance.now() % 18`, así que la animación es *stateless* — no acumula deriva y se puede montar/desmontar sin resetear nada.
- **Doble alimentación del ciclo**: la función `frame(ms)` se llama tanto desde un `requestAnimationFrame` propio como desde `onBeforeRender` de la malla de la pantalla del celular. Es intencional: garantiza que las texturas de canvas se repinten aunque el visor gestione su propio ciclo de render. Ambas llamadas van envueltas en `try/catch` con `console.error` para que un error puntual no congele la escena. **Conservar este patrón.**
- **Easing**: `easeInOutQuad` — `t < 0.5 ? 2t² : 1 − (−2t + 2)²/2`. Las posiciones se interpolan con `Vector3.lerp`, las rotaciones linealmente sobre el valor eased.
- **Micro-movimiento constante**: `rotation.z = sin(ms / 1400) × 0.02` en el celular en todos los estados.
- **Texturas de pantalla**: `CanvasTexture` (`colorSpace = SRGBColorSpace`, `anisotropy = 8`) usada a la vez como `map` y `emissiveMap` con `emissive 0xffffff` e `emissiveIntensity 0.95`. Se repinta cada frame con `needsUpdate`.
- **Pantalla plana, sticker curvo**: la pantalla del celular es `PlaneGeometry` (la extrusión rompe el mapeo UV); el sticker en cambio **debe** ser el arco de cilindro — un plano sobre una superficie curva se despega en los bordes y delata el truco.
- **Carga tolerante de imágenes**: `loadImg()` resuelve a `null` en caso de error y cada uso comprueba antes de dibujar. Si falta un PNG, la escena sigue corriendo en lugar de romperse.
- **Fuentes**: el arte del sticker se repinta dentro de `document.fonts.ready.then(...)` — sin eso, la primera pasada usa la fuente de fallback y el "593" pierde la serif.
- **Hora real**: la escena lee `new Date()` para la barra de estado y la fecha del reposo.
- **HUD**: panel de texto HTML fijo arriba a la izquierda, `z-index: 10`, `pointer-events: none`, sobre el canvas. Muestra Paso / Cuenta / Destino y se actualiza solo al cambiar de estado.

## State Management
Una sola variable de estado derivada del tiempo, sin estado mutable: `'idle' | 'nfc' | 'perfil' | 'tienda'`. Cada estado trae un progreso normalizado `k ∈ [0,1]` que impulsa los sub-detalles (pulso del anillo, barra de lectura, scroll del feed, el cambio de Seguir a Siguiendo, la cascada del catálogo). No hay fetching: el usuario (`@enemy___`), la bio, los contadores y las categorías de la tienda están escritos literales al inicio del script — sustituirlos por props del componente al integrar.

## Design Tokens

### Sistema (Modernist) — usados en el HUD y el filo del escritorio
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
| `bottle_wall` | blanco + mapa cepillado `#20343a` | 0.30 | 0.34 |
| `bottle_collar` | `#b9bec2` | 0.28 | 0.60 |
| `bottle_cap` | `#1d1e20` | 0.62 | 0.08 |
| `cap_loop` | `#2a2c2f` | 0.70 | 0.06 |
| `desk_top` | `#c9c6c2` | 0.60 | 0.10 |
| `sticker_593` | textura canvas (transparente, doble cara) | 0.28 | 0.06 |
| `phone_body` | `#1c1b1a` | 0.40 | 0.30 |
| `phone_back_glass` | `#24221f` | 0.25 | 0.40 |
| `nfc_pulse` | `#ec3013` emisivo (1.2) | 0.30 | — (opacity animada) |

### Paleta de pantalla
Acento `#ec3013`, tinta `#201e1d`, atenuado `#8d8580`, azul de Instagram `#3f5bf6`, aro del avatar `#f0397a`, enlace `#7cb0ff`, reposo `#0c0c0e`. Holográficos del sticker: `#9ef0d2`, `#d9c9ff`, `#ffd9a8`, `#a8e6ff`, `#ffc7e6`, `#c9ffd8`.

### Escala física (metros — importante mantenerla para que la iluminación se vea bien)
Celular 0.074 × 0.152 × 0.0085 · pantalla del celular 0.067 × 0.142 · botella r 0.0385, alto 0.212 (con tapa y asa llega a ~0.295) · sticker 0.062 m de ancho de arco · escritorio 0.320 × 0.016 × 0.180.

### Tiempos
Ciclo de 18.0 s — contacto NFC a los 2.6 s, fin de la lectura a los 4.6 s, perfil hasta 11.4 s, tienda hasta 16.2 s, retirada completa a los 17.2 s, reposo hasta 18.0 s.

## Assets
- **three.js 0.184.0** desde unpkg con import map y hashes de integridad (three, OrbitControls, OBJExporter, GLTFExporter). Al integrar, instalar `three` como dependencia del proyecto en vez de cargar desde CDN.
- **`three-d-stage.js`** — componente web incluido en el paquete: renderer, iluminación de estudio, sombra de suelo, OrbitControls y una barra de exportación OBJ/GLB. Es el andamio; en un codebase con react-three-fiber conviene reemplazarlo por `<Canvas>` + `<OrbitControls>` y conservar solo los valores de iluminación **y el encuadre de cámara descrito arriba**. (A diferencia de la escena del imán de refri, esta sí usa la iluminación por defecto del andamio: el sujeto está cerca del origen, que es para lo que está calibrada.)
- **`assets/enemy-feed.png`** — el feed real de @enemy___, recortado de la captura del cliente.
- **`assets/enemy-avatar.png`** — el logo/avatar de la marca.
- **Fuentes Cormorant Garamond y Pinyon Script** (Google Fonts) — la serif del "593" y el script de *Ecuador*. Van cargadas con `<link>` en el head; al integrar, sumarlas al pipeline de fuentes del proyecto.
- **Arte real del sticker (mejora opcional)**: el sticker está dibujado en canvas. Si el cliente tiene el archivo de imprenta, sustituir `paintSticker()` por una textura del PNG real (`TextureLoader`, 2048 px de lado, `colorSpace = SRGBColorSpace`) — es más fiel y más barato en CPU. Idealmente el arte debería ser un parámetro del componente.
- **Tomatodo real (mejora opcional)**: si existe un GLB de la botella, sustituir el grupo `bottle` y mantener el arco del sticker, el chip y toda la animación intactos.
- **Iconos**: si se añade UI HTML alrededor, usar Lucide (https://lucide.dev), conforme al sistema de diseño.
- **Tipografía**: Archivo (Google Fonts) para el HUD; el texto pintado en canvas también la pide con fallback `sans-serif`.

## Files
| Archivo | Qué contiene |
| --- | --- |
| `tomatodo-sticker-3d.html` | La escena — sticker NFC en el tomatodo que abre Instagram |
| `three-d-stage.js` | Andamio del visor 3D (renderer, luces, controles, exportadores) |
| `assets/enemy-feed.png` | El feed real de @enemy___ |
| `assets/enemy-avatar.png` | El avatar de la marca |

`tomatodo-sticker-3d.html` es autónomo: abrirlo en un navegador muestra la escena completa. La lógica vive en el `<script type="module">` al final del archivo, en este orden: constantes y carga de imágenes → helpers de geometría y canvas → aluminio cepillado → materiales → geometría (escritorio, botella, sticker, chip, celular) → `paintSticker()` → `paintPhone()` → línea de tiempo (`frame`) → arranque del bucle → encuadre de cámara.

## Notas de integración para la tienda
1. **Peso**: three.js son ~600 KB minificado. Cargar la escena con lazy-load / dynamic import y solo cuando el contenedor entra en viewport (`IntersectionObserver`).
2. **Pausar fuera de pantalla**: detener el `requestAnimationFrame` cuando la escena no es visible o la pestaña está oculta (`document.hidden`). En móvil, ahorra batería de forma notoria.
3. **El sticker debe seguir siendo un arco**: si se cambia el diámetro de la botella o el tamaño del sticker, recalcular `θ = ancho / BR`. Aplanarlo a un `PlaneGeometry` es el error que delata la escena.
4. **Un sticker, muchos soportes**: la misma pieza sirve para cuarto, carro, laptop o casco. Lo más útil es parametrizar el soporte (botella, superficie plana, tubo) y reutilizar el sticker, el chip y la animación.
5. **Fallback**: si WebGL no está disponible, mostrar un video o un PNG de la escena. Conviene grabar un MP4 corto en bucle como respaldo (y como versión ligera para móviles).
6. **Responsive**: en anchos menores a ~480 px conviene acercar el target o subir el FOV para que el celular no quede diminuto. El HUD debería colapsar a una línea o esconderse.
7. **Contenido real**: usuario, bio, contadores, posts del feed y las categorías de la tienda deberían ser props — idealmente una escena reutilizable que reciba la marca y pinte su propio sticker.
8. **Enlace real**: el destino del chip es `instagram.com/enemy___`. En producción, el chip NFC debería apuntar a una URL propia con redirección, para poder cambiar el destino sin reimprimir los stickers y para medir toques.
9. **Accesibilidad**: respetar `prefers-reduced-motion` — con la preferencia activa, renderizar un frame estático del estado "Perfil abierto", sin bucle.
