# Handoff: Animación 3D de conexión Wi-Fi por NFC

## Overview
Una escena 3D interactiva en tiempo real que muestra una tarjeta Wi-Fi con chip NFC en su soporte acrílico sobre un escritorio, con un router al fondo, y un celular que se acerca, hace contacto NFC y se conecta a la red sin escribir la contraseña. Es un bucle autónomo de 12 segundos, orbitable con el mouse, y el modelo se puede exportar como OBJ+MTL o GLB.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — un prototipo que muestra la apariencia y el comportamiento previstos, no código de producción para copiar tal cual. La tarea es **recrear la escena dentro del entorno existente del sitio de la tienda** usando sus patrones y librerías establecidas.

Dicho esto: a diferencia de un mockup de UI, aquí la lógica 3D **sí es la implementación real**. La geometría, los materiales, las curvas de animación y el pintado de pantallas en `<canvas>` son three.js puro y deben portarse casi literalmente. Lo que hay que reescribir con los patrones del codebase es la **envoltura**: el montaje del canvas, el ciclo de vida del componente, el lazy-load, el HUD de texto y el responsive.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, proporciones físicas (en metros reales), tiempos de animación y contenido de pantallas son finales. Debe recrearse con precisión. La única parte deliberadamente esquemática es el arte impreso de la tarjeta: está dibujado con primitivas de canvas (bandas, símbolo Wi-Fi, tipografía) en lugar de usar el archivo de arte real. En producción conviene sustituirlo por la imagen real (ver "Assets").

## Escena

### Layout 3D
- Escritorio `#c9c6c2` 0.46 × 0.020 × 0.26 m con filo acento rojo al frente.
- Router al fondo a la derecha: base 0.086 × 0.014 × 0.086, cuerpo 0.078 × 0.052 × 0.026, dos antenas cilíndricas (r 0.0035, largo 0.075) inclinadas ±0.30 rad, y un LED circular (r 0.004) que se enciende al enlazar.
- Soporte acrílico translúcido en L: pie 0.094 × 0.004 × 0.062, panel 0.094 × 0.128 × 0.003 inclinado −0.12 rad, labio 0.094 × 0.010 × 0.006; `opacity 0.42`.
- Tarjeta impresa 0.086 × 0.122 m, grosor 0.0022, r 0.006, sobre el panel.
- Celular 0.074 × 0.152 × 0.0085 m con bump de cámara 0.024 × 0.024, animado en el aire.

### Arte de la tarjeta (688 × 976 px de canvas)
Cabecera tinta `#0f1c20` de 214 px con franja cian `#17c3e0` de 10 px; "WI-FI CON NFC" en cian 26 px; "Conéctate / sin contraseña" en blanco 54 px. Símbolo Wi-Fi grande (3 arcos + punto, radio base 62, grosor 30) en `#0b6d80`. "ACERCA TU CELULAR" 40 px y "a esta tarjeta y listo" en `#5c6a6e` 28 px. Recuadro cian de 6 px con la etiqueta "RED" `#5c6a6e` 24 px y el SSID en `#0f1c20` 36 px. Pie "SIN ESCRIBIR NADA · SIN QR" en `#0b6d80` 24 px. Fondo papel `#eef7f9`.

### Anillo de pulso NFC
Torus r = 0.019 / 0.0014 con material emisivo `#17c3e0`, sobre la tarjeta. `opacity` animada senoidalmente (0 → ~1) y escala 1 → 1.5, solo durante el estado de lectura.

### Pantallas del celular (560 × 1150 px)
- **Reposo**: reloj `hh:mm` blanco 132 px sobre `#0a1418`, fecha en español en mayúsculas, banda inferior "NFC activado · Wi-Fi buscando".
- **Lectura NFC**: 3 anillos cian concéntricos pulsantes, símbolo Wi-Fi blanco al centro, "Leyendo la tarjeta…" 28 px, "CONFIGURACIÓN WI-FI" 24 px, barra de progreso cian.
- **Conectando**: símbolo Wi-Fi cian cuyos arcos **crecen de 1 a 3** según el progreso, el SSID en blanco 34 px, "Conectando…" y barra de progreso.
- **Conectado**: fondo blanco, cabecera tinta con "Wi-Fi" 38 px; círculo de check verde `#1f9d55` (r 78); "¡Conectado!" 40 px y "Sin escribir la contraseña" 26 px; fila de la red activa con símbolo Wi-Fi verde, SSID 30 px, "Conectado · señal excelente" en verde 23 px y candado; tres redes vecinas en gris con candado; pie "Configurado por NFC desde la tarjeta".

### Ciclo (12 s)
0–2.0 s acercamiento de `(0.115, 0.140, 0.200)` a `(−0.062, 0.112, −0.0218)` con rotación X −0.55 → −0.12 y Y 0.45 → 0.01 · 2.0–3.6 s contacto NFC · 3.6–5.2 s "Conectando…" mientras el celular se levanta hacia `(0.045, 0.150, 0.130)` · 5.2–10.8 s pantalla de Wi-Fi conectado, con flotación senoidal de 0.004 m · 10.8–11.6 s regreso · 11.6–12 s reposo.

## Interactions & Behavior
- **Órbita**: OrbitControls; el usuario arrastra para girar y hace scroll para acercar. La animación no se interrumpe al orbitar.
- **Cámara fija por la escena**: la escena **no** usa el auto-encuadre del visor — fija su propia cámara sobre el par tarjeta-celular (centro `(−0.030, 0.135, 0.045)`, radio 0.150, factor 1.06, dirección `(1, 0.55, 1.25)` normalizada). Sin esto la pantalla del celular queda demasiado pequeña para leerse. **Conservar este encuadre al portar.**
- **Bucle**: el tiempo se toma de `performance.now() % 12`, así que la animación es *stateless* — no acumula deriva y se puede montar/desmontar sin resetear nada.
- **Doble alimentación del ciclo**: la función `frame(ms)` se llama tanto desde un `requestAnimationFrame` propio como desde `onBeforeRender` de la malla de la pantalla del celular. Es intencional: garantiza que las texturas de canvas se repinten aunque el visor gestione su propio ciclo de render. Ambas llamadas van envueltas en `try/catch` con `console.error` para que un error puntual no congele la escena. **Conservar este patrón.**
- **Easing**: `easeInOutQuad` — `t < 0.5 ? 2t² : 1 − (−2t + 2)²/2`. Las posiciones se interpolan con `Vector3.lerp`, las rotaciones linealmente sobre el valor eased.
- **Micro-movimiento constante**: `rotation.z = sin(ms / 1300) × 0.02` en el celular en todos los estados.
- **LED del router**: apagado late suavemente (`emissiveIntensity` 0.5 + 0.3·sin(ms/700)); al enlazar sube a 1.6 fijo.
- **Texturas de pantalla**: `CanvasTexture` (`colorSpace = SRGBColorSpace`, `anisotropy = 8`) usada a la vez como `map` y `emissiveMap` con `emissive 0xffffff` e `emissiveIntensity 0.95`. Se repinta cada frame con `needsUpdate`.
- **Pantallas planas**: la pantalla es `PlaneGeometry`, no geometría extruida — la extrusión rompe el mapeo UV y la textura sale estirada.
- **Fuentes**: el arte de la tarjeta se repinta dentro de `document.fonts.ready.then(...)`, si no la primera pasada usa la fuente de fallback.
- **Hora real**: la escena lee `new Date()` para la barra de estado del celular.
- **HUD**: panel de texto HTML fijo arriba a la izquierda, `z-index: 10`, `pointer-events: none`, sobre el canvas. Se actualiza solo al cambiar de estado.

## State Management
Una sola variable de estado derivada del tiempo, sin estado mutable: `'idle' | 'nfc' | 'joining' | 'done'`. Cada estado trae un progreso normalizado `k ∈ [0,1]` que impulsa los sub-detalles (pulso del anillo, arcos de señal que crecen, barras de progreso). No hay fetching de datos: el SSID y los nombres de las redes vecinas están escritos literales — sustituirlos por props del componente al integrar.

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
| `desk_top` | `#c9c6c2` | 0.60 | 0.10 |
| `accent_red` | `#ec3013` | 0.40 | 0.05 |
| `acrylic_clear` | `#dfe3e2` | 0.14 | 0.05 (opacity 0.42) |
| `card_stock` | `#f4f3f1` | 0.42 | 0.03 |
| `router_body` | `#24262a` | 0.55 | 0.15 |
| `router_top` | `#2f3237` | 0.40 | 0.20 |
| `router_led` | `#17c3e0` emisivo | 0.30 | — |
| `phone_body` | `#1c1b1a` | 0.40 | 0.30 |
| `phone_back_glass` | `#24221f` | 0.25 | 0.40 |
| `nfc_pulse` | `#17c3e0` emisivo | 0.30 | — (opacity animada) |

### Paleta de pantalla
Cian `#17c3e0`, profundo `#0b6d80`, tinta `#0f1c20`, papel `#eef7f9`, secundario `#8a9296`, éxito `#1f9d55`, texto atenuado `#5c6a6e`, bordes `#e2e8e9`, redes inactivas `#b6c0c3`, pantalla apagada `#0a1418`.

### Escala física (metros — importante mantenerla para que la iluminación se vea bien)
Celular 0.074 × 0.152 × 0.0085 · pantalla del celular 0.067 × 0.142 · tarjeta 0.086 × 0.122 × 0.0022 · soporte acrílico: pie 0.094 × 0.004 × 0.062, panel 0.094 × 0.128 × 0.003 a −0.12 rad · router 0.086 × 0.066 × 0.086 · escritorio 0.46 × 0.020 × 0.26.

### Tiempos
Ciclo de 12.0 s — contacto NFC a los 2.0 s, fin de la lectura a los 3.6 s, fin de "Conectando…" a los 5.2 s, pantalla conectada hasta 10.8 s, retirada completa a los 11.6 s, reposo hasta 12.0 s.

## Assets
- **three.js 0.184.0** desde unpkg con import map y hashes de integridad (three, OrbitControls, OBJExporter, GLTFExporter). Al integrar, instalar `three` como dependencia del proyecto en vez de cargar desde CDN.
- **`three-d-stage.js`** — componente web incluido en el paquete: renderer, iluminación de estudio, sombra de suelo, OrbitControls y una barra de exportación OBJ/GLB. Es el andamio; en un codebase con react-three-fiber conviene reemplazarlo por `<Canvas>` + `<OrbitControls>` y conservar solo los valores de iluminación **y el encuadre de cámara descrito arriba**.
- **Sin imágenes externas.** Todo el arte impreso se dibuja en `<canvas>` en tiempo de ejecución. **Recomendación para producción**: sustituir `paintCard()` por una textura cargada del arte real (`TextureLoader`, PNG a 2048 px de lado largo, `colorSpace = SRGBColorSpace`) — es más fiel y más barato en CPU. Idealmente el arte de la tarjeta debería ser un parámetro del componente.
- **Iconos**: si se añade UI alrededor, usar Lucide (https://lucide.dev), conforme al sistema de diseño.
- **Tipografía**: Archivo (Google Fonts) para el HUD; el texto pintado en canvas también la pide con fallback `sans-serif`.

## Files
| Archivo | Qué contiene |
| --- | --- |
| `wifi-nfc.html` | La escena — conexión Wi-Fi por NFC |
| `three-d-stage.js` | Andamio del visor 3D (renderer, luces, controles, exportadores) |

`wifi-nfc.html` es autónomo: abrirlo en un navegador muestra la escena completa. La lógica vive en el `<script type="module">` al final del archivo, en este orden: materiales → geometría → funciones de pintado de canvas → línea de tiempo (`frame`) → encuadre de cámara.

## Notas de integración para la tienda
1. **Peso**: three.js son ~600 KB minificado. Cargar la escena con lazy-load / dynamic import y solo cuando el contenedor entra en viewport (`IntersectionObserver`).
2. **Pausar fuera de pantalla**: detener el `requestAnimationFrame` cuando la escena no es visible o la pestaña está oculta (`document.hidden`). En móvil, ahorra batería de forma notoria.
3. **Fallback**: si WebGL no está disponible, mostrar un video o un PNG de la escena. Conviene grabar un MP4 corto en bucle como respaldo (y como versión ligera para móviles).
4. **Responsive**: en anchos menores a ~480 px conviene acercar el target o subir el FOV para que el celular no quede diminuto. El HUD debería colapsar a una línea o esconderse.
5. **Contenido real**: reemplazar el SSID, los nombres de las redes vecinas y el arte de la tarjeta por props del componente.
6. **Accesibilidad**: respetar `prefers-reduced-motion` — con la preferencia activa, renderizar un frame estático del estado "¡Conectado!", sin bucle.
