# Guía de marca y estructura del tema — ShopNow Tech

Tema construido desde cero (no descargado con `shopify theme pull`) para la tienda **ShopNow** (shopnow-1548641.myshopify.com), con estilo tech oscuro y moderno, usando las colecciones y productos reales de la tienda.

## Paleta de colores

| Uso              | Color (hex) |
|------------------|-------------|
| Primario         | `#2F6FEB`   |
| Secundario       | `#1B2A3A`   |
| Fondo            | `#0B0F14`   |
| Texto            | `#E7EEF6`   |
| Acento / CTA     | `#12D6DF`   |

Definidos también como opciones editables en `config/settings_schema.json` (sección "Colores") y con sus valores actuales en `config/settings_data.json`.

## Tipografías

| Uso              | Fuente          | Peso    |
|-------------------|----------------|---------|
| Encabezados       | Space Grotesk  | 700     |
| Cuerpo de texto   | Inter          | 400/500 |

Cargadas vía Google Fonts en `layout/theme.liquid`. Configurables en `config/settings_schema.json` (sección "Tipografía").

## Estructura de secciones por plantilla

- **Home (`templates/index.json`)**:
  1. `hero` — banner principal con CTA a `/collections/all` y a Carga y Energía.
  2. `categories` (`collection-list`) — grid con las categorías reales: Carga y Energía, Audio y Sonido, Accesorios para Celular, Accesorios para Auto, Hogar y Cocina, Privacidad y Seguridad.
  3. `featured` (`featured-collection`) — productos destacados de "Carga y Energía".
  4. `why-us` — beneficios: envío rápido, garantía, pago seguro, soporte.
  5. `tech` (`featured-collection`) — productos de "Tecnología y Gadgets IA".
  6. `newsletter` — suscripción de correo (formulario `customer` de Shopify).

- **Producto (`templates/product.json`)**: `main-product`, rediseñada como landing premium:
  1. Galería con miniaturas + **zoom con el mouse** (`data-zoom`, `gsap.quickTo` en `assets/motion.js`, solo puntero fino).
  2. Info: vendor, título, precio, **callout de garantía** (`warranty_title`/`warranty_text`), disponibilidad.
  3. **Variantes premium**: pills en vez de `<select>`; si la opción se llama "Color"/"Colour" intenta mostrar un swatch de color real (mapa de nombres comunes ES/EN en `assets/global.js` — si no reconoce el nombre, cae de vuelta a pill de texto normal, nunca inventa un color).
  4. Cantidad, agregar al carrito (AJAX), íconos reales de métodos de pago (`shop.enabled_payment_types`).
  5. Bloques `benefit` (ícono + título + texto) — 3 por defecto en `templates/product.json`.
  6. **Especificaciones**: solo se muestra si el producto tiene el metafield `product.metafields.custom.specifications` (texto multilínea, formato `Clave: Valor` por línea) — si no existe, la sección no aparece. No se inventan specs.
  7. Bloques `faq_item` (pregunta/respuesta) en acordeón nativo (`<details>`) — vacío por defecto, agrégalos desde el editor con preguntas reales.
  8. **Productos relacionados** (misma colección, hasta `related_limit`) con tarjetas premium (`snippets/product-card-related.liquid`): glassmorphism, tilt 3D, cambio de imagen al hover, badges Nuevo/Oferta (Nuevo = creado hace ≤30 días, dato real), agregar al carrito animado, scroll horizontal en móvil. Se integra al `ScrollTrigger.batch` de `assets/motion.js`.
  9. **Barra sticky de agregar al carrito** (`data-sticky-cart`): aparece al hacer scroll pasado el botón principal; su variante/precio se mantienen sincronizados con el selector de arriba (`assets/global.js` actualiza todos los `[data-variant-id]`/`[data-price]`/`[data-add-to-cart]` del documento, no solo los del formulario principal).

- **Colección (`templates/collection.json`)**:
  1. `main-collection` — encabezado, filtros por precio y disponibilidad (`collection.filters`, requiere la app gratuita "Search & Discovery" de Shopify), orden (`sort_by`), grid de productos paginado.

- **Carrito (`templates/cart.json`)**: `main-cart` — líneas editables, subtotal, checkout.
- **Página (`templates/page.json`)**: `main-page`.
- **404 (`templates/404.json`)**: `main-404`.
- **Todas las colecciones (`templates/list-collections.json`)**: `main-list-collections`.

## Interacciones dinámicas

- **Motion layer premium (`assets/motion.js`)**: GSAP + ScrollTrigger + Lenis + SplitType, vendorizadas (auto-hospedadas) en `assets/gsap.min.js`, `assets/scroll-trigger.min.js`, `assets/lenis.min.js`, `assets/split-type.min.js` — cargadas con `defer` desde `layout/theme.liquid`, en ese orden. No usan CDN externo (evita una conexión extra y problemas de CSP).
  - **Lenis**: smooth scroll solo en dispositivos con mouse/trackpad (`hover:hover and pointer:fine`); en touch se deja el scroll nativo (mejor rendimiento y sensación en móvil).
  - **SplitType**: separa en palabras el `hero__heading` y los títulos de sección (`.section__heading`, `.newsletter__heading`, `.collection-header h1`, `.product-info__title`), animados palabra por palabra con GSAP.
  - **ScrollTrigger reveals**: reemplazan el IntersectionObserver anterior. Cualquier elemento con clase `reveal` anima fade + subida + escala + blur al entrar en pantalla. Las tarjetas de grid (`.product-card`, `.collection-card`, `.why-us-item`) usan `ScrollTrigger.batch` para revelarse en oleada según lo que entra a la vez en pantalla.
  - **Tilt 3D**: `[data-tilt]` (tarjetas) ahora usa `gsap.quickTo` para una inclinación 3D con inercia suave, en vez del cálculo manual anterior.
  - **Botones magnéticos**: cualquier `.btn` seguido el cursor dentro de su área (`gsap.quickTo` sobre x/y) en dispositivos con mouse.
  - **Parallax**: la imagen de fondo del hero (`[data-hero-parallax]`) se mueve más lento que el scroll (`ScrollTrigger` con `scrub`).
  - **Fallback de seguridad**: si GSAP/ScrollTrigger no cargan (bloqueo de red, etc.) o el usuario tiene `prefers-reduced-motion`, todo el contenido se muestra instantáneamente — nunca queda oculto por error. El CSS solo oculta estos elementos cuando `<html>` tiene la clase `js` (agregada por un script inline en el `<head>`, antes de que se pinte la página, para evitar parpadeos); sin JS, el contenido siempre es visible.
  - Se evaluó **VanillaTilt** y **Three.js/Spline** y se descartaron a propósito: el tilt custom con GSAP ya cubre lo mismo sin una librería extra, y no se pidió ningún objeto 3D real que justifique el peso de Three.js/Spline.
  - Tamaño agregado (gzip aprox.): GSAP ~28 KB, ScrollTrigger ~18 KB, Lenis ~5 KB, SplitType ~4 KB — cargados con `defer`, sin bloquear el render.
- **Canvas de partículas del hero**: se mantiene igual que antes (`data-hero-canvas`, lógica en `assets/global.js`), independiente del motion layer.
- **Carrito AJAX + drawer**: los formularios `data-product-form` se envían por `fetch` a `/cart/add.js`; al agregar un producto se abre el **drawer del carrito** (`snippets/cart-drawer.liquid`, lógica en `assets/global.js`) en vez de recargar o ir a `/cart`. El drawer se llena con `fetch` a `/cart.js` y actualiza cantidades/elimina líneas con `/cart/change.js` (`routes.cart_change_url`), todo sin recargar. El ícono del carrito en el header (`data-cart-drawer-toggle`) abre el drawer; `/cart` (`main-cart.liquid`) sigue existiendo como fallback si JS está desactivado o se navega directo. El toast (`[data-cart-toast]`) ahora solo se usa para errores (ej. producto agotado).
- Todas las cadenas usadas por el JS están en `window.themeStrings` / `window.themeRoutes`, inyectadas desde `layout/theme.liquid` con claves de `locales/es.default.json`.

## SEO

- **`layout/theme.liquid`**: meta description con fallback automático (usa `page_description`; si está vacío, cae a la descripción del producto/colección/tienda), Open Graph, Twitter Cards, y JSON-LD de `Organization` + `WebSite` (con `SearchAction` para el buscador). El `canonical` de una colección con filtros activos apunta a la URL base de la colección (evita contenido duplicado por combinaciones de filtros).
- **Producto (`main-product.liquid`)**: JSON-LD `Product` (precio, disponibilidad, marca, SKU) + breadcrumbs visibles y `BreadcrumbList` (Inicio → Colección → Producto).
- **Colección (`main-collection.liquid`)**: breadcrumbs visibles y `BreadcrumbList` (Inicio → Colección).
- **Logo/Favicon**: se agregaron como settings reales (`settings.logo`, `settings.favicon` en `config/settings_schema.json`) — antes se referenciaban en el código pero no existían como opción editable, así que nunca se mostraban. El logo también se usa como imagen de respaldo para Open Graph si una página no tiene imagen propia.
- **Sitemap**: `/sitemap.xml` lo genera y sirve Shopify automáticamente a nivel de plataforma — no es editable desde el tema, por eso no se creó ningún archivo para esto.
- **URLs**: la estructura (`/products/`, `/collections/`, etc.) la controla Shopify; no es configurable desde el tema.

## Confianza y prueba social

- **Badges en producto**: fila de insignias (envío, garantía, pago seguro) debajo del botón de agregar al carrito en `sections/main-product.liquid`, editables desde el theme editor.
- **Reseñas reales**: `main-product.liquid` incluye un block `@app` — cuando instales una app de reseñas (Judge.me, Loox, etc.), se agrega ahí visualmente desde el editor de temas. No se fabricaron reseñas falsas.
- **Testimonios**: `sections/testimonials.liquid` existe y está lista para usarse, pero **no está agregada a `templates/index.json` todavía** — a propósito, para no mostrar reseñas de ejemplo como si fueran reales. Cuando tengas 3+ reseñas reales de clientes (WhatsApp, Instagram, etc.), agrégala desde el editor de temas ("Agregar sección" en el home) y llena los bloques con las citas reales.
- **Pago seguro**: íconos reales de los métodos de pago habilitados en la tienda (`shop.enabled_payment_types`) en el footer y en el resumen del carrito, junto a un mensaje de "pago seguro" antes del botón de checkout.

## Notas adicionales

- El tema vive en la raíz de este proyecto (`layout/`, `templates/`, `sections/`, `snippets/`, `assets/`, `config/`, `locales/`) y se sube con `shopify theme push`.
- Validado con `shopify theme check` (sin errores).
- Los handles de colección usados en `templates/index.json` (`carga-y-energia`, `audio-y-sonido`, `accesorios-para-celular`, `accesorios-para-auto`, `hogar-y-cocina`, `privacidad-y-seguridad`, `tecnologia-y-gadgets-ia`) deben existir en la tienda; si se renombran, actualizar ese archivo.
- No edites archivos directamente en el admin de Shopify mientras trabajas aquí, para evitar conflictos al hacer `theme push`.
