# Handoff: Animación 3D de tarjeta NFC de reseñas de Google

## Overview
Una escena 3D interactiva en tiempo real que muestra una tarjeta NFC de reseñas en su base acrílica sobre un mostrador, y un celular que se acerca, hace conexión NFC y abre la ficha de reseña de Google Maps del negocio. Es un bucle autónomo de 9 segundos, orbitable con el mouse, y el modelo se puede exportar como OBJ+MTL o GLB.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — un prototipo que muestra la apariencia y el comportamiento previstos, no código de producción para copiar tal cual. La tarea es **recrear la escena dentro del entorno existente del sitio de la tienda** usando sus patrones y librerías establecidas.

Dicho esto: a diferencia de un mockup de UI, aquí la lógica 3D **sí es la implementación real**. La geometría, los materiales, las curvas de animación y el pintado de pantallas en `<canvas>` son three.js puro y deben portarse casi literalmente. Lo que hay que reescribir con los patrones del codebase es la **envoltura**: el montaje del canvas, el ciclo de vida del componente, el lazy-load, el HUD de texto y el responsive.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, proporciones físicas (en metros reales), tiempos de animación y contenido de pantallas son finales. Debe recrearse con precisión. La única parte deliberadamente esquemática es el arte impreso de la tarjeta: está dibujado con primitivas de canvas (banda de degradado, estrellas, arcos para la "G", glifo NFC) en lugar de usar el archivo de arte real. En producción conviene sustituirlo por la imagen real (ver "Assets").

## Escena
### 2. `resenas-nfc.html` — Tarjeta NFC de reseñas de Google
- **Propósito**: mostrar la tarjeta de reseñas abriendo la ficha de Google Maps al acercar el celular.
- **Layout 3D**: mostrador 0.44 × 0.020 × 0.24 m; base acrílica oscura (0.105 × 0.012 × 0.062) con espina inclinada −0.22 rad; tarjeta 0.086 × 0.116 m, grosor 0.0032, r = 0.008.
- **Arte de la tarjeta (688 × 928 px)**: banda superior con degradado Google (`#4285f4 → #ea4335 → #fbbc05 → #34a853`) desvaneciendo a blanco; 5 estrellas `#f5a623` r = 27; "¡COMPARTE TU / EXPERIENCIA EN GOOGLE!" blanco 44 px; marca "G" construida con 4 arcos de 26 px de grosor (radio 62) más barra azul y la letra en 96 px; glifo NFC (elipse + 4 arcos + contorno de celular en mano) en `#141c2b`; "ACERCA TU CELULAR" 40 px, "(NFC)" 32 px; pie "¡TU RESEÑA NOS AYUDA A CRECER!" en `#3b5bd9` 27 px.
- **Anillo de pulso NFC**: torus r = 0.020 / 0.0016, material emisivo `#4285f4`, `opacity` animada 0 → ~1 y escala 1 → 1.5 durante la lectura.
- **Ciclo (9 s)**: 0–2.2 s acercamiento de `(0.115, 0.135, 0.185)` a `(−0.048, 0.100, 0.028)` con rotación X −0.55 → −0.22 y Y 0.45 → 0.03; 2.2–3 s lectura NFC (pantalla "Leyendo etiqueta…", círculo azul pulsante); 3–6.6 s el celular se levanta a `(0.055, 0.145, 0.115)` mostrando la ficha de reseña, con las estrellas llenándose progresivamente; 6.6–7.8 s regreso; 7.8–9 s reposo.
- **Pantalla de reseña (560 × 1150 px)**: fondo blanco; barra de estado con hora y "NFC"; tira de mapa `#e8eee6` con calles `#cfd8cd`/blanco y pin `#ea4335`; nombre del negocio en `#202124` 34 px; subtítulo `#5f6368` 22 px; "Califica tu experiencia" 26 px; 5 estrellas r = 38 (`#f5a623` llenas / `#dadce0` vacías); campo de texto con borde `#dadce0` r = 16; botón `#4285f4` r = 14 con "PUBLICAR RESEÑA" 28 px; nota "Se abrió desde una etiqueta NFC".

## Interactions & Behavior
- **Órbita**: OrbitControls con cámara auto-encuadrada; el usuario arrastra para girar y hace scroll para acercar. La animación no se interrumpe al orbitar.
- **Bucle**: el tiempo se toma de `performance.now() % 9`, así que la animación es *stateless* — no acumula deriva y se puede montar/desmontar sin resetear nada.
- **Doble alimentación del ciclo**: la función `frame(ms)` se llama tanto desde un `requestAnimationFrame` propio como desde `onBeforeRender` de la malla de la pantalla del celular. Esto es intencional: garantiza que las texturas de canvas se repinten aunque el visor gestione su propio ciclo de render. Ambas llamadas están envueltas en `try/catch` con `console.error` para que un error puntual no congele la escena. **Conservar este patrón al portar.**
- **Easing**: `easeInOutQuad` — `t < 0.5 ? 2t² : 1 − (−2t + 2)²/2`. Las posiciones se interpolan con `Vector3.lerp`, las rotaciones linealmente sobre el valor eased.
- **Micro-movimiento constante**: `rotation.z = sin(ms / 1300) × 0.02` en el celular en todos los estados, para que nunca se vea rígido.
- **Anillo NFC**: material emisivo con `opacity` animada senoidalmente (0 → ~1) y escala 1 → 1.5, solo durante el estado de lectura.
- **Texturas de pantalla**: la pantalla es un `CanvasTexture` (`colorSpace = SRGBColorSpace`, `anisotropy = 8`) usado a la vez como `map` y `emissiveMap` con `emissive 0xffffff` e `emissiveIntensity 0.95`. Se repinta cada frame y se marca `needsUpdate`.
- **Pantallas planas**: la pantalla es `PlaneGeometry`, no geometría extruida — la extrusión rompe el mapeo UV y la textura sale estirada.
- **Fuentes**: el arte de la tarjeta se repinta dentro de `document.fonts.ready.then(...)`, si no la primera pasada usa la fuente de fallback.
- **Hora real**: la escena lee `new Date()` para la barra de estado del celular.
- **HUD**: panel de texto HTML fijo arriba a la izquierda, `z-index: 10`, `pointer-events: none`, sobre el canvas. Se actualiza solo al cambiar de estado.

## State Management
Una sola variable de estado derivada del tiempo, sin estado mutable: `'idle' | 'reading' | 'review'`. Cada estado trae un progreso normalizado `k ∈ [0,1]` que impulsa los sub-detalles (pulso del anillo, círculo pulsante en pantalla, estrellas que se van llenando). No hay fetching de datos: el nombre del negocio, la categoría y el horario están escritos literales — sustituirlos por props o datos reales al integrar.

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
| `card_edge` | `#f4f3f1` | 0.35 | 0.05 |
| `stand_dark` | `#2a2827` | 0.55 | 0.15 |
| `counter_top` | `#c9c6c2` | 0.60 | 0.10 |
| `accent_red` | `#ec3013` | 0.40 | 0.05 |
| `phone_body` | `#1c1b1a` | 0.40 | 0.30 |
| `phone_back_glass` | `#24221f` | 0.25 | 0.40 |
| `nfc_pulse` | `#4285f4` emisivo | 0.30 | — (opacity animada) |

### Paleta de pantalla (Google)
Azul `#4285f4`, rojo `#ea4335`, amarillo `#fbbc05`, verde `#34a853`, estrella `#f5a623`, texto `#202124`, secundario `#5f6368`, borde `#dadce0`, mapa `#e8eee6` con calles `#cfd8cd`, pantalla apagada `#0d0f14`.

### Escala física (metros — importante mantenerla para que la iluminación se vea bien)
Celular 0.074 × 0.152 × 0.0085 · pantalla del celular 0.067 × 0.142 · tarjeta 0.086 × 0.116 × 0.0032 · base acrílica 0.105 × 0.012 × 0.062 · mostrador 0.44 × 0.020 × 0.24.

### Tiempos
Ciclo de 9.0 s — contacto NFC a los 2.2 s, fin de la lectura a los 3.0 s, ficha de reseña visible hasta 6.6 s, retirada completa a los 7.8 s, reposo hasta 9.0 s.

## Assets
- **three.js 0.184.0** desde unpkg con import map y hashes de integridad (three, OrbitControls, OBJExporter, GLTFExporter). Al integrar, instalar `three` como dependencia del proyecto en vez de cargar desde CDN.
- **`three-d-stage.js`** — componente web incluido en el paquete: renderer, iluminación de estudio, sombra de suelo, OrbitControls, cámara auto-encuadrada y barra de exportación OBJ/GLB. Es el andamio; en un codebase con react-three-fiber conviene reemplazarlo por `<Canvas>` + `<OrbitControls>` y conservar solo los valores de iluminación.
- **Sin imágenes externas.** Todo el arte impreso se dibuja en `<canvas>` en tiempo de ejecución. **Recomendación para producción**: sustituir `paintCard()` por una textura cargada del arte real (`TextureLoader`, PNG a 2048 px de lado largo, `colorSpace = SRGBColorSpace`) — es más fiel y más barato en CPU.
- **Logotipo de Google**: la marca "G" y los colores de la banda están reconstruidos con primitivas de canvas. Si la tarjeta que vendes lleva el logotipo real, usa el archivo oficial y respeta los lineamientos de marca de Google.
- **Iconos**: si se añade UI alrededor, usar Lucide (https://lucide.dev), conforme al sistema de diseño.
- **Tipografía**: Archivo (Google Fonts) para el HUD; el texto pintado en canvas también la pide con fallback `sans-serif`.

## Files
| Archivo | Qué contiene |
| --- | --- |
| `resenas-nfc.html` | La escena — tarjeta NFC de reseñas de Google |
| `three-d-stage.js` | Andamio del visor 3D (renderer, luces, controles, exportadores) |

`resenas-nfc.html` es autónomo: abrirlo en un navegador muestra la escena completa. La lógica vive en el `<script type="module">` al final del archivo, en este orden: materiales → geometría → funciones de pintado de canvas → línea de tiempo (`frame`).

## Notas de integración para la tienda
1. **Peso**: three.js son ~600 KB minificado. Cargar la escena con lazy-load / dynamic import y solo cuando el contenedor entra en viewport (`IntersectionObserver`).
2. **Pausar fuera de pantalla**: detener el `requestAnimationFrame` cuando la escena no es visible o la pestaña está oculta (`document.hidden`). En móvil, ahorra batería de forma notoria.
3. **Fallback**: si WebGL no está disponible, mostrar un video o un PNG de la escena. Conviene grabar un MP4 corto en bucle como respaldo (y como versión ligera para móviles).
4. **Responsive**: el visor se auto-encuadra, pero en anchos menores a ~480 px conviene subir el FOV o acercar el target para que el celular no quede diminuto. El HUD debería colapsar a una línea o esconderse.
5. **Contenido real**: reemplazar el nombre del negocio en la ficha de reseña y el arte de la tarjeta por datos reales o por props del componente.
6. **Accesibilidad**: respetar `prefers-reduced-motion` — con la preferencia activa, renderizar un frame estático del estado de ficha de reseña abierta, sin bucle.
