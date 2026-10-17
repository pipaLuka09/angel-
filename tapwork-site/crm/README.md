# CRM de clientes · Tap Work

`index.html` es la página del seguimiento de clientes. Está publicada como Artifact de Claude, con base de datos compartida en la colección `leads`, y se usa igual desde el celular y la laptop.

- **Mapa**: `machala.jpg` es una captura de OpenStreetMap a zoom 16 (© OpenStreetMap contributors). Se tomó con `herramientas/mapa-base.html` desde openstreetmap.org (centro -3.26449, -79.95101). La página convierte latitud/longitud a píxel con Web Mercator (`MAP` en el script). Si se vuelve a capturar el mapa, hay que actualizar `gx0`/`gy0`, el ancho y el alto.
- **Etapas**: Por contactar → Contactado → Demo hecha → Cotización → Por cerrar → Cliente / Perdido. Cada pin del mapa lleva el color y el número de su etapa, y un "!" cuando el próximo paso ya venció.
- **Qué decirle**: `recomendar()` toma el primer paso pendiente del "Camino al cierre" (quien decide → problema → demo → precio → duda → fecha y pago) y arma la frase con el producto y los precios oficiales de las cotizaciones (`PROD`).
- Los 50 negocios iniciales son los de la lista de Google Maps (Excel de clientes de Machala). Se cargaron a la base de datos, no están escritos en el código.
