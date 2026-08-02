# ShopNow Tech — Tema de Shopify

Tema construido desde cero para **ShopNow** (shopnow-1548641.myshopify.com), usando las colecciones y productos reales de la tienda. Ver [`CLAUDE.md`](./CLAUDE.md) para la paleta, tipografía y estructura de secciones.

## Configuración inicial

1. **Instala Node.js** (v18 o superior) y el Shopify CLI:

   ```bash
   npm install -g @shopify/cli
   ```

2. **Conecta esta carpeta con tu tienda y sube el tema como borrador:**

   ```bash
   shopify theme push --unpublished --theme "ShopNow Tech"
   ```

   Esto te pedirá autenticarte con tu tienda de Shopify y creará un tema nuevo (sin publicar) con estos archivos.

3. **Previsualiza en vivo mientras editas:**

   ```bash
   shopify theme dev
   ```

4. **Valida el tema antes de subir cambios:**

   ```bash
   shopify theme check
   ```

## Publicar

Cuando estés conforme con la vista previa, publica el tema desde el admin de Shopify (Tienda online → Temas) o con:

```bash
shopify theme push
```

## Estructura

- `layout/theme.liquid` — layout base, fuentes y variables de color.
- `sections/` — header, footer, hero, categorías, colección destacada, producto, colección, carrito, etc.
- `templates/*.json` — arma cada plantilla a partir de esas secciones.
- `snippets/` — `product-card` y `price`, reutilizados en home, colección y buscador.
- `assets/base.css` / `assets/global.js` — estilos y JS (menú móvil, selector de variantes, cantidad).
- `config/settings_schema.json` — colores, tipografía y ancho editables desde el editor de temas.
