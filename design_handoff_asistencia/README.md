# Handoff: Animación 3D de marcado de asistencia

## Overview
Una escena 3D interactiva en tiempo real que muestra un portacredencial (con cordón) marcando entrada en un lector de control de acceso, junto a un celular en su base que muestra la hora real y la notificación de asistencia. Es un bucle autónomo de 8 segundos, orbitable con el mouse, y el modelo se puede exportar como OBJ+MTL o GLB.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — un prototipo que muestra la apariencia y el comportamiento previstos, no código de producción para copiar tal cual. La tarea es **recrear la escena dentro del entorno existente del sitio de la tienda** (React/Next.js, Vue, Shopify/Liquid, WordPress, etc.) usando sus patrones y librerías establecidas. Si el proyecto no tiene todavía un entorno definido, elegir el framework más apropiado e implementarla ahí.

Dicho esto: a diferencia de un mockup de UI, aquí la lógica 3D **sí es la implementación real**. La geometría, los materiales, las curvas de animación y el pintado de pantallas en `<canvas>` son three.js puro y deben portarse casi literalmente. Lo que hay que reescribir con los patrones del codebase es la **envoltura**: el montaje del canvas, el ciclo de vida del componente, el lazy-load, el HUD de texto y el responsive.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, proporciones físicas (en metros reales), tiempos de animación y contenido de pantallas son finales. Debe recrearse con precisión. La única parte deliberadamente esquemática es el arte impreso de la credencial: está dibujado con primitivas de canvas (barras y un barrido diagonal) en lugar de usar el archivo de arte real. En producción conviene sustituirlo por la imagen real (ver "Assets").

## Escena
### 1. `asistencia.html` — Marcado de asistencia con credencial
- **Propósito**: mostrar el portacredencial y el lector de acceso registrando una entrada.
- **Layout 3D**: mostrador (`BoxGeometry` 0.46 × 0.022 × 0.20 m) con filo rojo acento; poste del lector (0.048 × 0.130 × 0.048 m) en x = −0.08; terminal lector inclinado −0.22 rad; celular en base a la derecha (x = 0.155).
- **Terminal lector**: cuerpo 0.135 × 0.200 m, profundidad 0.038, esquinas r = 0.008, bisel 0.002; bisel claro 0.118 × 0.182; pantalla emisiva 0.104 × 0.062 m; anillo RFID (torus r = 0.030 / 0.0022) + anillo interior (0.019) + punto central; barra LED de estado 0.060 × 0.005 m.
- **Credencial**: importada de `badge-model.js` (marco de goma, inserto blanco, tarjeta impresa, pestaña, bloque deslizante blanco, cordón).
- **Ciclo (8 s)**: 0–2 s la credencial se acerca al lector (z de 0.19 → 0.062, inclinación 0 → −0.20 rad, con balanceo senoidal); 2–4.6 s contacto, pantalla "ENTRADA REGISTRADA", LED verde; 4.6–6 s se retira; 6–8 s reposo.
- **Pantalla del lector (512 × 320 px)**: reposo — fondo `#151313`, franja superior `#ec3013`, "ACERQUE SU / CREDENCIAL" en blanco 40 px, hora `hh:mm:ss` en `#8b8785` 40 px. Éxito — fondo `#12351d`, franja `#5be08a`, "ENTRADA / REGISTRADA" en `#8df0ae` 44 px, hora del marcado en blanco 84 px.
- **Pantalla del celular (512 × 1040 px)**: reloj `hh:mm` blanco 132 px sobre `#100f0f`, fecha en español (`toLocaleDateString('es-MX')`) en mayúsculas; al marcar aparece un bloque `#ec3013` con "ASISTENCIA REGISTRADA", la hora 92 px, "ENTRADA · PUERTA 1" y el nombre del portador.
- **LED**: apagado `color #4a2018 / emissive #6b1b0c / intensity 0.35`; activo `#3ddc7a / #2fbf68 / 1.4`. El anillo RFID emite `#1e6b3c` a 0.9 solo en éxito.

## Interactions & Behavior
- **Órbita**: OrbitControls con cámara auto-encuadrada; el usuario arrastra para girar y hace scroll para acercar. La animación no se interrumpe al orbitar.
- **Bucle**: el tiempo se toma de `performance.now() % 8`, así que la animación es *stateless* — no acumula deriva y se puede montar/desmontar sin resetear nada.
- **Doble alimentación del ciclo**: la función `frame(ms)` se llama tanto desde un `requestAnimationFrame` propio como desde `onBeforeRender` de la malla de la pantalla del celular. Esto es intencional: garantiza que las texturas de canvas se repinten aunque el visor gestione su propio ciclo de render. Ambas llamadas están envueltas en `try/catch` con `console.error` para que un error puntual no congele la escena. **Conservar este patrón al portar.**
- **Easing**: `easeInOutQuad` — `t < 0.5 ? 2t² : 1 − (−2t + 2)²/2`.
- **Micro-movimiento constante**: la credencial tiene balanceo senoidal en Y y Z y una deriva lateral de ±0.004 m, para que nunca se vea rígida. El balanceo se reduce al 25% durante el contacto.
- **Texturas de pantalla**: cada pantalla es un `CanvasTexture` (`colorSpace = SRGBColorSpace`, `anisotropy = 8`) usado a la vez como `map` y `emissiveMap` con `emissive 0xffffff` e `emissiveIntensity` 0.85–0.95, para que se lea como una pantalla encendida.
- **Repintado**: en reposo las pantallas se repintan 4 veces por segundo (para el reloj); en cambio de estado, de inmediato.
- **Pantallas planas**: las pantallas son `PlaneGeometry`, no geometría extruida — la extrusión rompe el mapeo UV y la textura sale estirada.
- **Fuentes**: el arte se repinta dentro de `document.fonts.ready.then(...)`, si no la primera pasada usa la fuente de fallback.
- **Hora real**: la escena lee `new Date()`, así que la hora en pantalla es la real del visitante. La hora de marcado se congela en el instante del contacto.
- **HUD**: panel de texto HTML fijo arriba a la izquierda, `z-index: 10`, `pointer-events: none`, sobre el canvas. Se actualiza 4 veces por segundo, no cada frame.

## State Management
Una sola variable de estado derivada del tiempo, sin estado mutable: `'idle' | 'ok'`. El único valor persistido es `markedAt` (hora del contacto), fijado en la transición a `'ok'`. No hay fetching de datos: el nombre del portador y la puerta están escritos literales — sustituirlos por props o datos reales al integrar.

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
| `rubber_black` | `#1b1a1a` | 0.82 | 0.05 |
| `webbing_black` | `#131313` | 0.95 | 0.0 |
| `plastic_white` | `#e9e8e6` | 0.45 | 0.05 |
| `print_red` | `#ec3013` | 0.35 | 0.05 |
| `print_dark` | `#201e1d` | 0.40 | 0.05 |
| `print_white` | `#f3f2f2` | 0.40 | 0.02 |
| `terminal_case` | `#2a2827` | 0.55 | 0.15 |
| `terminal_bezel` | `#dedbd8` | 0.50 | 0.10 |
| `counter_top` / `stand` | `#c9c6c2` | 0.60 | 0.10 |
| `phone_body` | `#1c1b1a` | 0.40 | 0.30 |

### Paleta de pantalla
Fondo apagado `#100f0f` / `#151313`, texto secundario `#8b8785`, éxito `#12351d` fondo / `#5be08a` franja / `#8df0ae` texto, acento `#ec3013`.

### Escala física (metros — importante mantenerla para que la iluminación se vea bien)
Celular 0.074 × 0.152 × 0.008 · pantalla del celular 0.067 × 0.140 · credencial 0.080 × 0.110 × 0.007 · tarjeta impresa 0.062 × 0.092 · cordón 0.019 de ancho, 0.105 de largo visible · lector 0.135 × 0.200 × 0.038 · mostrador 0.46 × 0.022 × 0.20.

### Tiempos
Ciclo de 8.0 s — contacto a los 2.0 s, fin del estado de éxito a los 4.6 s, retirada completa a los 6.0 s, reposo hasta 8.0 s.

## Assets
- **three.js 0.184.0** desde unpkg con import map y hashes de integridad (three, OrbitControls, OBJExporter, GLTFExporter). Al integrar, instalar `three` como dependencia del proyecto en vez de cargar desde CDN.
- **`three-d-stage.js`** — componente web incluido en el paquete: renderer, iluminación de estudio, sombra de suelo, OrbitControls, cámara auto-encuadrada y barra de exportación OBJ/GLB. Es el andamio; en un codebase con react-three-fiber conviene reemplazarlo por `<Canvas>` + `<OrbitControls>` y conservar solo los valores de iluminación.
- **`badge-model.js`** — el modelo de la credencial como función pura `buildBadge(THREE)` que devuelve un `THREE.Group` de mallas nombradas. Portable tal cual.
- **`badge.html`** — visor aislado del modelo, útil como referencia y para exportar el OBJ/GLB.
- **Sin imágenes externas.** Todo el arte impreso se dibuja en `<canvas>` en tiempo de ejecución. **Recomendación para producción**: sustituir el arte de la tarjeta por una textura cargada del archivo real (`TextureLoader`, PNG a 2048 px de lado largo, `colorSpace = SRGBColorSpace`) — es más fiel y más barato en CPU.
- **Iconos**: si se añade UI alrededor, usar Lucide (https://lucide.dev), conforme al sistema de diseño.
- **Tipografía**: Archivo (Google Fonts) para el HUD; el texto pintado en canvas también la pide con fallback `sans-serif`.

## Files
| Archivo | Qué contiene |
| --- | --- |
| `asistencia.html` | La escena — marcado de asistencia con credencial |
| `badge-model.js` | Constructor del modelo de la credencial, usado por la escena |
| `badge.html` | Visor aislado del modelo (referencia / exportación OBJ-GLB) |
| `three-d-stage.js` | Andamio del visor 3D (renderer, luces, controles, exportadores) |

`asistencia.html` es autónomo: abrirlo en un navegador muestra la escena completa. La lógica vive en el `<script type="module">` al final del archivo, en este orden: materiales → geometría → funciones de pintado de canvas → línea de tiempo (`frame`).

## Notas de integración para la tienda
1. **Peso**: three.js son ~600 KB minificado. Cargar la escena con lazy-load / dynamic import y solo cuando el contenedor entra en viewport (`IntersectionObserver`).
2. **Pausar fuera de pantalla**: detener el `requestAnimationFrame` cuando la escena no es visible o la pestaña está oculta (`document.hidden`). En móvil, ahorra batería de forma notoria.
3. **Fallback**: si WebGL no está disponible, mostrar un video o un PNG de la escena. Conviene grabar un MP4 corto en bucle como respaldo (y como versión ligera para móviles).
4. **Responsive**: el visor se auto-encuadra, pero en anchos menores a ~480 px conviene subir el FOV o acercar el target para que la credencial no quede diminuta. El HUD debería colapsar a una línea o esconderse.
5. **Contenido real**: reemplazar el nombre del portador, la puerta y el arte de la credencial por datos reales o por props del componente.
6. **Accesibilidad**: respetar `prefers-reduced-motion` — con la preferencia activa, renderizar un frame estático del estado "ENTRADA REGISTRADA" sin bucle.
