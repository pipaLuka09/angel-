# angel- — Tema de Shopify

Flujo de trabajo para editar el tema de esta tienda usando Shopify CLI y Claude Code.

## Configuración inicial

1. **Instala Node.js** (v18 o superior) y el Shopify CLI:

   ```bash
   npm install -g @shopify/cli
   ```

2. **Descarga el tema actual** desde la carpeta del proyecto:

   ```bash
   shopify theme pull
   ```

   Esto te pedirá autenticarte con tu tienda de Shopify y descargará los archivos (`layout/`, `templates/`, `sections/`, `snippets/`, `assets/`, `config/`, `locales/`) en esta carpeta.

3. **Abre la carpeta en la terminal y ejecuta:**

   ```bash
   claude
   ```

4. **Ten a mano antes de pedir cambios de diseño:**
   - Paleta de colores de la marca
   - Tipografías definidas
   - Estructura de secciones ya definida (qué secciones va en cada plantilla)

   Consulta y completa [`CLAUDE.md`](./CLAUDE.md) con estos datos para que Claude Code los use como referencia consistente en cada sesión.

## Subir cambios a la tienda

```bash
shopify theme push
```

O usa `shopify theme dev` para previsualizar los cambios en un tema de desarrollo antes de publicarlos.
