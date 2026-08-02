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

## Notas adicionales

- El tema vive en la raíz de este proyecto (`layout/`, `templates/`, `sections/`, `snippets/`, `assets/`, `config/`, `locales/`) y se sube con `shopify theme push`.
- Validado con `shopify theme check` (sin errores).
- Los handles de colección usados en `templates/index.json` (`carga-y-energia`, `audio-y-sonido`, `accesorios-para-celular`, `accesorios-para-auto`, `hogar-y-cocina`, `privacidad-y-seguridad`, `tecnologia-y-gadgets-ia`) deben existir en la tienda; si se renombran, actualizar ese archivo.
- No edites archivos directamente en el admin de Shopify mientras trabajas aquí, para evitar conflictos al hacer `theme push`.
