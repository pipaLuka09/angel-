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

- **Producto (`templates/product.json`)**:
  1. `main-product` — galería con miniaturas, selector de variantes (JS en `assets/global.js`), cantidad, agregar al carrito, descripción.

- **Colección (`templates/collection.json`)**:
  1. `main-collection` — encabezado, orden (`sort_by`), grid de productos paginado.

- **Carrito (`templates/cart.json`)**: `main-cart` — líneas editables, subtotal, checkout.
- **Página (`templates/page.json`)**: `main-page`.
- **404 (`templates/404.json`)**: `main-404`.
- **Todas las colecciones (`templates/list-collections.json`)**: `main-list-collections`.

## Interacciones dinámicas

- **Hero**: canvas de partículas tipo constelación (`data-hero-canvas` en `sections/hero.liquid`, animado en `assets/global.js`) + animación de entrada escalonada del texto. Se desactiva si el usuario tiene `prefers-reduced-motion`.
- **Scroll reveal**: cualquier elemento con clase `reveal` aparece con fade/slide al entrar en pantalla (IntersectionObserver en `assets/global.js`). Ya aplicado a encabezados de sección, tarjetas de producto/colección, beneficios y newsletter.
- **Tilt 3D**: elementos con `data-tilt` (tarjetas de producto y de colección) se inclinan siguiendo el cursor en dispositivos con mouse; se desactiva en touch.
- **Carrito AJAX**: los formularios `data-product-form` (tarjeta de producto y producto principal) se envían por `fetch` a `/cart/add.js` sin recargar la página — actualizan el contador del header (con animación), el botón muestra estado de éxito, y aparece un toast de confirmación (`[data-cart-toast]`) con link a "Ver carrito". El carrito (`/cart`) sigue siendo un formulario normal (no AJAX) por ahora.
- Todas las cadenas usadas por el JS están en `window.themeStrings` / `window.themeRoutes`, inyectadas desde `layout/theme.liquid` con claves de `locales/es.default.json`.

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
