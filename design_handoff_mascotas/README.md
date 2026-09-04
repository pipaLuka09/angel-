# Handoff: Collar NFC para mascotas — dos animaciones

## Overview
Dos escenas animadas que cuentan la misma idea desde dos ángulos, pensadas para ir una junto a la otra en la página:

1. **`collar-nfc-foto.html` — la escena.** La foto real del perro con su collar y el dije NFC; encima, el campo NFC latiendo sobre el dije, la pantalla del celular de la foto encendiéndose, y una tarjeta al lado que recorre los pasos: invitación → lectura → ficha médica → dónde vive.
2. **`collar-nfc-celular.html` — el detalle de pantalla.** Un celular grande en primer plano que muestra exactamente qué ve el usuario: pantalla bloqueada con aviso NFC → hoja "Etiqueta detectada" → ficha médica → mapa de dónde vive. A la izquierda, el texto va narrando cada paso.

Ambas son bucles autónomos, sin interacción requerida, y **no usan three.js**: son HTML + CSS + un poco de JavaScript. Eso las hace muy livianas comparadas con las escenas 3D del resto del proyecto.

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — un prototipo que muestra la apariencia y el comportamiento previstos, no código de producción para copiar tal cual. La tarea es **recrear las dos escenas dentro del entorno existente del sitio de la tienda** usando sus patrones y librerías establecidas: componentes, sistema de tokens, y el enfoque de animación que ya use el codebase.

A diferencia de las escenas 3D, aquí **todo es UI**: la estructura de la tarjeta, la maqueta del celular y las pantallas son marcado y CSS normales. Se espera que se reescriban como componentes del proyecto (React/Vue/lo que use la tienda), tomando de estos archivos los valores exactos: geometría, colores, tiempos y contenido.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, proporciones, tiempos y contenido de pantallas son finales.

Dos cosas a tener en cuenta:
- La **foto del perro** (`assets/dog-nfc.png`) es material del cliente y va incluida en el paquete. Los porcentajes de posición del campo NFC, del recorte de la pantalla del celular y de la etiqueta están **calibrados contra esta imagen exacta**. Si se cambia la foto, hay que recalibrar esos porcentajes (ver "Calibración").
- Los **datos de la mascota** (Milo, golden retriever, vacunas, microchip, dirección, responsable) son de ejemplo y deben volverse props/contenido del CMS.

---

## Escena 1 — `collar-nfc-foto.html`

### Layout
Dos columnas (`grid-template-columns: auto minmax(300px, 380px)`, `gap: 28px`, alto `100vh − 48px`, máximo 1180 px). Bajo 880 px pasa a una sola columna con la foto a máximo 520 px.

- **Columna izquierda**: la foto, en un contenedor con `aspect-ratio: 640/857` y `height: 100%`.
- **Columna derecha**: la tarjeta blanca (padding 24 px, `--shadow-md`) más la barra de progreso de 4 pasos.

### La foto y sus capas
- `.shot` — la foto a `center/cover`, con `transform-origin: 38% 62%` y `transition: transform 2.4s cubic-bezier(.4,0,.2,1)`. En reposo `scale(1.02)`; en los estados `ficha` y `mapa` sube a `scale(1.075)` — un zoom lento que acompaña la apertura de la ficha.
- `.glow` — el realce de la pantalla del celular que **ya aparece en la foto**. Es un degradado a 115° en `mix-blend-mode: screen`, recortado con `clip-path: polygon(55.0% 59.7%, 73.4% 63.9%, 74.7% 68.3%, 57.5% 69.6%)` — ese polígono es exactamente el cristal del teléfono en la imagen. Opacidad 0 en reposo, `.85` al leer, 1 en ficha y mapa.
- `.field` — el campo NFC: contenedor de tamaño cero en `left: 44.84%; top: 68.61%` (el dije del collar) con tres anillos `border: 2.5px solid var(--color-accent)`, `border-radius: 50%`, transformados con `rotate(-12deg) scaleY(.9)` para acompañar la perspectiva del dije.
- `.tagdot` — un aro blanco de `5.6%` de ancho sobre el dije, con `box-shadow` que en el estado de lectura gana un halo rojo `0 0 26px 6px rgba(236,48,19,.55)`.
- `.pin` — la etiqueta "CHIP NFC EN EL DIJE" sobre fondo tinta, con un vástago vertical de 2 px, anclada al mismo punto y con `padding-bottom: 6%`. Se desvanece al abrir la ficha.

### La tarjeta (columna derecha)
Kicker en acento profundo 11 px + titular 30 px + regla de 2 px, y debajo un panel por estado:
- **idle** — párrafo de 15 px explicando la idea, y pie "Compatible con Android e iPhone" con un cuadro de acento de 7 px.
- **nfc** — "Leyendo el collar…" y una barra de 4 px que se llena con acento.
- **ficha** — cuatro filas etiqueta/valor separadas por reglas de 2 px que **aparecen en cascada** (Rabia · Al día, Parvovirus · Al día, Refuerzo múltiple · En 2 meses, Desparasitación · Al día; los "al día" en verde `#1f7a3d`, el pendiente en acento profundo), bloque rojo de alergias ("Pollo · Antiinflamatorios"), meta con microchip `956 0001 2288 741` y edad, y pie "Clínica San Roque".
- **mapa** — mini mapa esquemático (dos calles rotadas, dos cruces blancas, radio de 74 px y pin de acento), dirección "Av. Las Palmas 1425, Norte" 19 px, "Responsable · Ana Rivas", y dos botones: "Llamar" en acento y "Cómo llegar" en tinta.

### Ciclo (15 s)
`CYCLE = 15`, `T_NFC = 3.2`, `T_FICHA = 5.0`, `T_MAPA = 10.2`, `T_END = 14.2`.

- **0 – 3.2 s** `idle`: los anillos laten despacio (periodo 1900 ms, diámetro 30 → 126 px, opacidad hasta 0.42).
- **3.2 – 5.0 s** `nfc`: los anillos aceleran (periodo 700 ms, diámetro 34 → 182 px, opacidad hasta 0.95, borde 3 px), el dije se enciende y la barra avanza (`k · 118 %`).
- **5.0 – 10.2 s** `ficha`: la foto hace zoom, las filas aparecen en cascada (`floor(k · 4 · 2.6) + 1`).
- **10.2 – 14.2 s** `mapa`.
- **14.2 – 15 s** vuelta a `idle`.

La opacidad de los anillos se calcula como `base · (1 − u)²` con `u` la fase normalizada de cada anillo — así se apagan al expandirse.

---

## Escena 2 — `collar-nfc-celular.html`

### Layout
Dos columnas (`minmax(280px, 400px) auto`, `gap: 44px`, máximo 1120 px). Bajo 900 px pasa a una columna centrada.

- **Izquierda**: kicker + titular 38 px + regla + párrafo narrativo (con `min-height: 96px` para que el layout no salte al cambiar de texto) + barra de 4 pasos + una miniatura de 56 px recortada de la foto del perro con el nombre de la mascota.
- **Derecha**: la maqueta del celular.

### La maqueta del celular
`352 × 716 px`, cuerpo `#141312`, `border-radius: 46px`, padding 11 px, `--shadow-lg`, con un borde interior de 1 px translúcido. Pantalla `border-radius: 36px` sobre `#0b0f12`, isla dinámica de `98 × 26 px` y barra de inicio de `112 × 5 px`. Barra de estado propia de 52 px con la hora real, la etiqueta de contexto y un icono de batería dibujado con `border` + `::after`.

**Escalado**: el celular va dentro de `.devicebox` con `container-type: size`, `height: min(716px, calc(100vh − 48px))` y `aspect-ratio: 352/716`; el celular se escala con `transform: scale(calc(100cqh / 716px))` y `transform-origin: top left`. **Es CSS puro a propósito** — una versión anterior calculaba la escala en JavaScript y fallaba cuando el contenedor arrancaba con altura cero. No volver a JS para esto.

### Las cuatro vistas
- **Bloqueo** — degradado `#16202a → #0a0f13 → #080a0c`, reloj 76 px con la hora real, fecha en español, y un aviso translúcido con el glifo NFC (SVG de tres arcos + rectángulo) que dice "NFC activado · Acerca la parte superior del teléfono al dije".
- **Etiqueta detectada** — backdrop oscuro con `backdrop-filter: blur(2px)` y una hoja blanca que **sube desde abajo** (`transform: translateY(102%)` → `none`, `.55s cubic-bezier(.22,1,.28,1)`) con manija, tres anillos de acento pulsando alrededor de un disco tinta con "NFC", titular "Etiqueta detectada", "Leyendo el collar de Milo…" y barra de progreso.
- **Ficha médica** — cabecera de 196 px con la foto del perro (`32% 24%/210%`) y un degradado oscuro encima, píldora de acento "FICHA ABIERTA POR NFC", nombre "Milo" 32 px y "Golden Retriever · 4 años · 28 kg". Debajo: sección "VACUNAS Y CONTROL" con las cuatro filas en cascada, bloque rojo de alergias, meta con microchip y clínica, y un botón fijo abajo "Dónde vive →".
- **Dónde vive** — barra de navegación con flecha, mapa de 262 px (calles, radio, pin de acento de 22 px), dirección 21 px, responsable, y dos botones: "Llamar" en acento y "Cómo llegar" en tinta.

### Ciclo (16 s)
`CYCLE = 16`, `T_NFC = 3.4`, `T_FICHA = 5.6`, `T_MAPA = 11.2`, `T_END = 15.2`. Los anillos de la hoja tienen periodo 780 ms y diámetro 40 → 156 px. Las filas de vacunas aparecen con `floor(k · 4 · 2.8) + 1`. Al cambiar de estado, el texto de la izquierda (kicker, titular y párrafo) cambia con él.

---

## Interactions & Behavior (ambas)
- **Sin interacción requerida**: son bucles autónomos. No hay clicks ni hover; los "botones" son parte de la ilustración.
- **Bucle stateless**: el estado se deriva de `performance.now() / 1000 % CYCLE` dentro de un `requestAnimationFrame`. No acumula deriva y se puede montar/desmontar sin resetear nada.
- **`setState` con guarda**: solo toca el DOM cuando el estado realmente cambia (`if (s === last) return`) — el resto del frame solo actualiza anillos y barras. Conservar ese patrón al portar; evita repintados innecesarios.
- **Hora real**: ambas leen `new Date()` y rellenan todas las barras de estado y el reloj con `hh:mm` y la fecha en español (`toLocaleDateString('es-MX', { weekday, day, month })`).
- **`prefers-reduced-motion`**: ya está implementado. Con la preferencia activa se salta el bucle y se renderiza un estado estático (la ficha médica), con todas las transiciones desactivadas por CSS. **Conservarlo.**
- **Los estados se manejan por atributo**: `data-state` en el contenedor (`idle | nfc | ficha | mapa` en la escena 1; `lock | nfc | ficha | mapa` en la 2), y el CSS reacciona con selectores `[data-state="..."]`. Es el enganche natural para portarlo a un framework: un solo estado y clases derivadas.

## State Management
Una sola variable de estado derivada del tiempo, más un progreso normalizado `k ∈ [0,1]` por estado que impulsa los sub-detalles (anillos, barras, cascada de filas). Sin fetching: todos los datos de la mascota están escritos literales en el marcado — sustituirlos por props del componente al integrar.

## Design Tokens
Ambos archivos enlazan la hoja del sistema de diseño (Modernist) y consumen sus variables. Al integrar, reemplazar ese `<link>` por los tokens del proyecto. Valores usados:

| Token | Valor |
| --- | --- |
| `--color-bg` | `#f3f2f2` |
| `--color-text` | `#201e1d` |
| `--color-accent` | `#ec3013` |
| `--color-accent-700` | acento profundo (texto sobre fondo claro) |
| `--color-divider` | gris de las reglas de 2 px |
| `--color-neutral-200` | `#e3e1e0` aprox. (barras vacías) |
| `--font-heading` / `--font-body` | Archivo |
| radio | `0px` en todo el sistema (la única excepción son los radios del chasis del celular, que son físicos) |
| `--shadow-md` / `--shadow-lg` | elevación de la tarjeta y del celular |

Colores literales fuera del sistema: verde de "al día" `#1f7a3d`, texto secundario `#6f6a67` / `#8d8580` / `#4a4644`, cristal del celular `#0b0f12`, chasis `#141312`, mapa `#e8eee6` con calles `#cfd8cd` y radio `rgba(27,127,138,.5)`.

## Calibración (importante si se cambia la foto)
En `collar-nfc-foto.html` estos valores están medidos contra `assets/dog-nfc.png` (640 × 857 px):

| Qué | Valor | Qué señala |
| --- | --- | --- |
| `.field`, `.tagdot`, `.pin` | `left: 44.84%; top: 68.61%` | el centro del dije del collar |
| `.tagdot` | `width: 5.6%` | el diámetro del dije |
| rotación de anillos y aro | `rotate(-12deg) scaleY(.92)` | la inclinación del dije en la foto |
| `.glow` | `clip-path: polygon(55.0% 59.7%, 73.4% 63.9%, 74.7% 68.3%, 57.5% 69.6%)` | el cristal del celular que ya está en la foto |
| `.shot` | `transform-origin: 38% 62%` | el punto del zoom |
| `.hero` (escena 2) | `background-position: 32% 24%; size: 210%` | el recorte de la cabeza para la cabecera |
| `.ctx u` (escena 2) | `30% 26%; 230%` | el recorte de la miniatura |

## Assets
- **`assets/dog-nfc.png`** — la foto del perro con el collar. Incluida en el paquete. Es material del cliente; confirmado por él que tiene derecho de uso. Servirla optimizada (WebP/AVIF con fallback) y con `width`/`height` explícitos para evitar salto de layout.
- **Sin three.js ni WebGL** — a diferencia de las otras escenas del proyecto, estas dos son HTML/CSS/JS puro. No hay que instalar dependencias.
- **Iconos**: los de las dos escenas están como SVG inline (glifo NFC, flecha de navegación). Si se añade UI alrededor, usar Lucide (https://lucide.dev), conforme al sistema de diseño.
- **Tipografía**: Archivo (Google Fonts), vía la hoja del sistema de diseño.

## Files
| Archivo | Qué contiene |
| --- | --- |
| `collar-nfc-foto.html` | Escena 1 — la foto real con la animación encima y la tarjeta de pasos |
| `collar-nfc-celular.html` | Escena 2 — el celular en primer plano con las cuatro pantallas |
| `assets/dog-nfc.png` | La foto del perro con el collar y el dije NFC |

Cada HTML es autónomo: abrirlo en un navegador muestra la escena completa. La lógica vive en el `<script>` al final del archivo, en este orden: referencias al DOM → textos por estado → hora real → constantes del ciclo → `setState` → `frame` → arranque (con la rama de `prefers-reduced-motion`).

## Notas de integración para la tienda
1. **Van juntas**: la escena 1 es el "qué es" y la 2 el "qué ves". Funcionan mejor una tras otra en la misma sección; también sirven como par de pestañas ("Escena" / "En el celular").
2. **Peso**: prácticamente nulo (una imagen + CSS). No hace falta lazy-load del código, pero sí de la imagen (`loading="lazy"` fuera del primer viewport).
3. **Pausar fuera de pantalla**: cortar el `requestAnimationFrame` cuando el contenedor no es visible (`IntersectionObserver`) o la pestaña está oculta (`document.hidden`).
4. **Contenido real**: nombre, raza, edad, peso, vacunas, alergias, microchip, clínica, dirección y responsable deben venir de props o del CMS. La ficha real vendría del backend según el chip leído.
5. **Datos sensibles**: la dirección de casa y el teléfono del responsable son datos personales. En producción, decidir qué se muestra sin autenticación — lo habitual es mostrar solo "cómo contactar" y no la dirección exacta hasta que el dueño la habilite.
6. **Si cambia la foto**: recalibrar los porcentajes de la tabla de "Calibración". Es el único trabajo manual del paquete.
7. **Accesibilidad**: `prefers-reduced-motion` ya está resuelto. Añadir además `alt` descriptivo a la foto y marcar las capas decorativas (anillos, brillo, mapa) como `aria-hidden`.
