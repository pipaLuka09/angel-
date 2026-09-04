# Handoff: Animación 3D de pago por NFC (acrílico del banco)

## Overview
Una escena 3D interactiva en tiempo real: un acrílico magenta de pagos con chip NFC sobre su base de acrílico translúcido en el mostrador, y un celular que se acerca, hace contacto NFC, recibe los datos de la cuenta, autoriza el pago y muestra el comprobante. Es un bucle autónomo de 15 segundos, orbitable con el mouse, y el modelo se puede exportar como OBJ+MTL o GLB.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — un prototipo que muestra la apariencia y el comportamiento previstos, no código de producción para copiar tal cual. La tarea es **recrear la escena dentro del entorno existente del sitio de la tienda** usando sus patrones y librerías establecidas.

Dicho esto: a diferencia de un mockup de UI, aquí la lógica 3D **sí es la implementación real**. La geometría, los materiales, las curvas de animación y el pintado de pantallas en `<canvas>` son three.js puro y deben portarse casi literalmente. Lo que hay que reescribir con los patrones del codebase es la **envoltura**: el montaje del canvas, el ciclo de vida del componente, el lazy-load, el HUD de texto y el responsive.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, proporciones físicas (en metros reales), tiempos de animación y contenido de pantallas son finales. Debe recrearse con precisión.

Hay **una sola parte deliberadamente pendiente**: en el arte del acrílico, el logo del banco es un **recuadro punteado con la leyenda "LOGO DEL BANCO"** — un placeholder. En producción hay que sustituirlo por el logotipo real (ver "Assets"). El resto del arte impreso (bandas, olas NFC, mano con celular, bloque de cuenta) está dibujado con primitivas de canvas y es final.

## Escena

### Layout 3D
- Mostrador `#c9c6c2` 0.340 × 0.016 × 0.170 m en `(-0.020, 0.008, 0.045)`, con filo acento rojo `#ec3013` de 0.004 m al frente en `z = 0.1305`.
- Base de acrílico translúcido: bloque 0.112 × 0.012 × 0.056 en `(-0.125, 0.024, 0.057)` y labio frontal 0.112 × 0.012 × 0.007 en `(-0.125, 0.036, 0.045)`; ambos `opacity 0.40`.
- Panel magenta de pagos 0.100 × 0.140 m, grosor 0.006, radio 0.005, bisel 0.0008; su rig está en `(-0.125, 0.100, 0.035)` con `rotation.x = -0.10`.
- Cara impresa: `PlaneGeometry` de 0.0988 × 0.1388 (el panel menos 0.0012) a `z = grosor/2 + 0.0008`.
- Celular 0.074 × 0.152 × 0.0085 m con bump de cámara 0.024 × 0.024 en `(-0.020, 0.055, -0.0055)`, animado en el aire.

### Arte del acrílico (700 × 980 px de canvas)
Fondo magenta `#e5007e`; cabecera `#a8005d` de 176 px cerrada con una franja blanca de 8 px. Arriba a la izquierda el **placeholder del logo**: recuadro punteado blanco (`setLineDash([14,10])`, 4 px) de 300 × 92 px en `(48, 44)` con la leyenda "LOGO DEL BANCO" 22 px; arriba a la derecha "PAGOS NFC" blanco 26 px. Titular "Paga aquí" blanco 62 px y "acercando tu celular" 32 px. Al centro, 4 olas NFC blancas (radio base 40, grosor 22) junto a una mano con celular dibujada a trazo blanco de 13 px (rectángulo redondeado 106 × 164 y curvas de la mano). Bloque blanco de 168 px con "CUENTA DE AHORROS" `#8a7a83` 22 px, el número de cuenta `#1a0d15` 44 px y el titular `#a8005d` 22 px. Pie centrado "SIN DIGITAR LA CUENTA · SIN QR" 24 px.

### Anillo de pulso NFC
Torus r = 0.021 / 0.0015 con material emisivo `#e5007e`, en `(0, 0.006, grosor/2 + 0.005)` dentro del rig del panel. `opacity` animada senoidalmente (0 → ~1) y escala 1 → 1.5, solo durante el estado de lectura.

### Pantallas del celular (560 × 1150 px)
- **Reposo**: reloj `hh:mm` blanco 132 px sobre `#140a10`, fecha en español en mayúsculas 26 px, banda inferior `#2a1a22` con "NFC activado".
- **Lectura NFC**: 3 anillos magenta concéntricos pulsantes (radio 74 + i·46, con oscilación senoidal de ±12), "NFC" blanco 34 px al centro, "Leyendo datos de pago…" 28 px, "CUENTA DE AHORROS" 24 px y barra de progreso magenta.
- **Cuenta cargada** (`pay`): fondo blanco con cabecera magenta de 240 px — "TRANSFERIR / PAGAR", "Cuenta cargada" 42 px, "Datos recibidos por NFC". Debajo, filas separadas por reglas de 3 px `#eee2e9`: DESTINO (cuenta 36 px + titular en `#a8005d`), MONTO A PAGAR (`$ 48,90` a 76 px), DESDE ("Ahorros ····8102"). Icono de escudo `#c9b6c1` con "Confirma con tu huella". Botón magenta de 96 px que dice **PAGAR AHORA** y a partir de `k > 0.60` cambia a **AUTORIZANDO…** con fondo `#a8005d` y una barra de progreso que se llena en el 40 % restante.
- **Comprobante** (`done`): cabecera magenta de 150 px con "Comprobante" 38 px; círculo de check con aro `#f5dbe8` y tick verde `#1f9d55` (r 76); "Pago enviado" 42 px y `$ 48,90` a 62 px; cuatro filas etiqueta-valor (A / CUENTA / HORA / COMPROBANTE `NFC-77401326`) con reglas de 3 px; botón magenta "COMPARTIR COMPROBANTE".

### Ciclo (15 s)
`CYCLE = 15.0`, `T_IN = 2.2`, `T_NFC = 3.9`, `T_PAY = 9.6`, `T_DONE = 13.8`, `T_OUT = 14.5`.

- **0 – 2.2 s** acercamiento de `(0.140, 0.150, 0.020)` a `(-0.125, 0.1234, 0.0473)`, rotación X −0.55 → −0.10 y Y 0.45 → 0.01, pantalla en reposo.
- **2.2 – 3.9 s** contacto NFC: el celular queda en el punto de contacto con un empuje senoidal de 0.004 m en Z; anillo pulsando.
- **3.9 – 9.6 s** "Cuenta cargada": el celular se levanta hacia `(0.058, 0.150, 0.045)` con `e = ease(min(1, k·1.9))`, rotación X −0.10 → −0.42 y Y 0 → 0.14.
- **9.6 – 13.8 s** comprobante, con flotación senoidal de 0.004 m en Y.
- **13.8 – 14.5 s** regreso a la posición lejana.
- **14.5 – 15 s** reposo.

## Interactions & Behavior
- **Órbita**: OrbitControls; el usuario arrastra para girar y hace scroll para acercar. La animación no se interrumpe al orbitar.
- **Cámara fija por la escena**: la escena **no** usa el auto-encuadre del visor — fija su propia cámara sobre el par acrílico-celular (centro `(-0.03, 0.135, 0.045)`, radio 0.15, factor 1.06, dirección `(1, 0.55, 1.25)` normalizada; `near = dist/100`, `far = dist·100`). Sin esto la pantalla del celular queda demasiado pequeña para leerse. **Conservar este encuadre al portar.**
- **Bucle**: el tiempo se toma de `performance.now() % 15`, así que la animación es *stateless* — no acumula deriva y se puede montar/desmontar sin resetear nada.
- **Doble alimentación del ciclo**: la función `frame(ms)` se llama tanto desde un `requestAnimationFrame` propio como desde `onBeforeRender` de la malla de la pantalla del celular. Es intencional: garantiza que las texturas de canvas se repinten aunque el visor gestione su propio ciclo de render. Ambas llamadas van envueltas en `try/catch` con `console.error` para que un error puntual no congele la escena. **Conservar este patrón.**
- **Easing**: `easeInOutQuad` — `t < 0.5 ? 2t² : 1 − (−2t + 2)²/2`. Las posiciones se interpolan con `Vector3.lerp`, las rotaciones linealmente sobre el valor eased.
- **Micro-movimiento constante**: `rotation.z = sin(ms / 1300) × 0.02` en el celular en todos los estados.
- **Texturas de pantalla**: `CanvasTexture` (`colorSpace = SRGBColorSpace`, `anisotropy = 8`) usada a la vez como `map` y `emissiveMap` con `emissive 0xffffff` e `emissiveIntensity 0.95`. Se repinta cada frame con `needsUpdate`.
- **Pantallas planas**: la pantalla del celular y la cara del acrílico son `PlaneGeometry`, no geometría extruida — la extrusión rompe el mapeo UV y la textura sale estirada.
- **Fuentes**: el arte del acrílico se repinta dentro de `document.fonts.ready.then(...)`, si no la primera pasada usa la fuente de fallback.
- **Hora real**: la escena lee `new Date()` para la barra de estado, la fecha del reposo y la fila HORA del comprobante.
- **HUD**: panel de texto HTML fijo arriba a la izquierda, `z-index: 10`, `pointer-events: none`, sobre el canvas. Muestra Paso / Cuenta / Monto y se actualiza solo al cambiar de estado (la cuenta aparece recién en `pay`, el monto también).

## State Management
Una sola variable de estado derivada del tiempo, sin estado mutable: `'idle' | 'nfc' | 'pay' | 'done'`. Cada estado trae un progreso normalizado `k ∈ [0,1]` que impulsa los sub-detalles (pulso del anillo, barras de progreso, el cambio de PAGAR AHORA a AUTORIZANDO…). No hay fetching de datos: número de cuenta (`2100 4487 91`), titular (`XPRINT SOLUCIONES S.A.`), monto (`48,90`) y número de comprobante están escritos literales al inicio del script — sustituirlos por props del componente al integrar.

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
| `counter_top` | `#c9c6c2` | 0.60 | 0.10 |
| `accent_red` | `#ec3013` | 0.40 | 0.05 |
| `acrylic_clear` / `acrylic_base` | `#e7dfe4` | 0.14 | 0.05 (opacity 0.40) |
| `panel_stock` | `#f6eef3` | 0.42 | 0.03 |
| `phone_body` | `#1c1b1a` | 0.40 | 0.30 |
| `phone_back_glass` | `#24221f` | 0.25 | 0.40 |
| `nfc_pulse` | `#e5007e` emisivo (1.2) | 0.30 | — (opacity animada) |

### Paleta de marca (magenta del banco)
Magenta `#e5007e`, profundo `#a8005d`, oscuro `#5c0033`, tinta `#1a0d15`, papel `#fdf4f9`, atenuado `#8a7a83`, éxito `#1f9d55`. Reglas de las pantallas `#eee2e9`, fondo de pantalla apagada `#140a10`, banda de la pantalla apagada `#2a1a22`, aro del check `#f5dbe8`, escudo `#c9b6c1`.

### Escala física (metros — importante mantenerla para que la iluminación se vea bien)
Celular 0.074 × 0.152 × 0.0085 · pantalla del celular 0.067 × 0.142 · panel 0.100 × 0.140 × 0.006 · cara impresa 0.0988 × 0.1388 · base de acrílico 0.112 × 0.012 × 0.056 + labio 0.112 × 0.012 × 0.007 · mostrador 0.340 × 0.016 × 0.170.

### Tiempos
Ciclo de 15.0 s — contacto NFC a los 2.2 s, fin de la lectura a los 3.9 s, pantalla de pago hasta 9.6 s, comprobante hasta 13.8 s, retirada completa a los 14.5 s, reposo hasta 15.0 s.

## Assets
- **three.js 0.184.0** desde unpkg con import map y hashes de integridad (three, OrbitControls, OBJExporter, GLTFExporter). Al integrar, instalar `three` como dependencia del proyecto en vez de cargar desde CDN.
- **`three-d-stage.js`** — componente web incluido en el paquete: renderer, iluminación de estudio, sombra de suelo, OrbitControls y una barra de exportación OBJ/GLB. Es el andamio; en un codebase con react-three-fiber conviene reemplazarlo por `<Canvas>` + `<OrbitControls>` y conservar solo los valores de iluminación **y el encuadre de cámara descrito arriba**.
- **Sin imágenes externas.** Todo el arte impreso y todas las pantallas del celular se dibujan en `<canvas>` en tiempo de ejecución — no hay PNG ni JPG que copiar, y por eso la animación se ve idéntica en cualquier entorno.
- **Logo del banco (lo único que falta)**: reemplazar el recuadro punteado de `paintPanel()` por el logotipo real. Cargarlo como imagen y dibujarlo en el mismo rectángulo (`x 48, y 44, 300 × 92 px` del canvas de 700 × 980), o mejor: sustituir todo `paintPanel()` por una textura del arte final del acrílico (`TextureLoader`, PNG a 2048 px de lado largo, `colorSpace = SRGBColorSpace`) — es más fiel y más barato en CPU. Idealmente el arte del acrílico debería ser un parámetro del componente.
- **Iconos**: si se añade UI alrededor, usar Lucide (https://lucide.dev), conforme al sistema de diseño.
- **Tipografía**: Archivo (Google Fonts) para el HUD; el texto pintado en canvas también la pide con fallback `sans-serif`.

## Files
| Archivo | Qué contiene |
| --- | --- |
| `pago-nfc.html` | La escena — pago por NFC desde el acrílico del banco |
| `three-d-stage.js` | Andamio del visor 3D (renderer, luces, controles, exportadores) |

`pago-nfc.html` es autónomo: abrirlo en un navegador muestra la escena completa. La lógica vive en el `<script type="module">` al final del archivo, en este orden: constantes de marca y datos → helpers de geometría y canvas → materiales → geometría → encuadre de cámara → `paintPanel()` → `paintPhone()` → línea de tiempo (`frame`) → arranque del bucle.

## Notas de integración para la tienda
1. **Peso**: three.js son ~600 KB minificado. Cargar la escena con lazy-load / dynamic import y solo cuando el contenedor entra en viewport (`IntersectionObserver`).
2. **Pausar fuera de pantalla**: detener el `requestAnimationFrame` cuando la escena no es visible o la pestaña está oculta (`document.hidden`). En móvil, ahorra batería de forma notoria.
3. **Fallback**: si WebGL no está disponible, mostrar un video o un PNG de la escena. Conviene grabar un MP4 corto en bucle como respaldo (y como versión ligera para móviles).
4. **Responsive**: en anchos menores a ~480 px conviene acercar el target o subir el FOV para que el celular no quede diminuto. El HUD debería colapsar a una línea o esconderse.
5. **Contenido real**: reemplazar cuenta, titular, monto, número de comprobante y el logo del banco por props del componente.
6. **Datos sensibles**: la cuenta y el titular que trae el prototipo son de ejemplo. Al usar datos reales, tratarlos como contenido configurable y no dejarlos escritos en el bundle.
7. **Accesibilidad**: respetar `prefers-reduced-motion` — con la preferencia activa, renderizar un frame estático del estado "Pago enviado", sin bucle.
