# Plantillas gráficas

Los archivos `.dc.html` son la **fuente** de las plantillas; `canvas.json` define cómo se
acomodan en el lienzo. El archivo `plantillas-instagram-nfc.html` que genera el proceso pesa
~2 MB y no se versiona (está en `.gitignore`) — se regenera desde estas fuentes.

## Las 9 plantillas

**Feed · 1080 × 1350 px (4:5)**

| Archivo | Para qué |
|---|---|
| `Main.dc.html` | Portada de carrusel — la lámina 1 de P02, P04, P07, P09, P16 |
| `LaminaInterior.dc.html` | Lámina interior con ícono, titular y texto — el cuerpo de cualquier carrusel |
| `PreguntaRespuesta.dc.html` | Pregunta/respuesta — P16 completo |
| `Comparacion.dc.html` | Dos columnas enfrentadas — P04 (papel vs. NFC) |
| `LaminaCierre.dc.html` | Última lámina con CTA — cierra todos los carruseles |
| `FotoDeProducto.dc.html` | Marco para foto real con degradado y titular — P05, P15, P20 |

**Vertical · 1080 × 1920 px (9:16)**

| Archivo | Para qué |
|---|---|
| `PortadaReel.dc.html` | Portada/carátula de reel |
| `HistoriaEncuesta.dc.html` | Historia con pregunta (el sticker de encuesta se pone en Instagram) |
| `PortadaDestacada.dc.html` | Las 6 portadas de destacadas en un solo artboard |

## Cosas que hay que saber al usarlas

- **Zona segura vertical:** el contenido de las plantillas 9:16 está entre los 280 px de arriba
  y los 400 px de abajo, porque Instagram tapa esas franjas con su propia interfaz (nombre,
  botones, caption). No subas texto por encima de ese margen.
- **Las 6 destacadas están en un solo artboard.** Cambia cuál se muestra con el control `cover`
  (funciona / tarjetas / resenas / llaveros / clientes / envios) y exporta una por una.
  Instagram recorta el **círculo del centro**, así que el nombre que sale abajo en la plantilla
  no se va a ver — ese se escribe como título de la destacada en la app.
- **El control `accent`** cambia el color de acento en todas las plantillas a la vez
  (`#12D6DF` turquesa, `#2F6FEB` azul, `#E7EEF6` blanco). Útil para diferenciar series de posts.
- **Los `$__`** son los mismos huecos de precio del resto del kit. Llénalos antes de exportar.
- **Al exportar PNG, las tipografías caen al sistema** (Space Grotesk e Inter se cargan desde
  Google Fonts y la exportación no las alcanza a incrustar). Los titulares se ven parecidos pero
  no idénticos. Si necesitas el tipo exacto en el PNG, la ruta segura es rearmar la pieza en
  Canva con las mismas fuentes — para eso está la tabla de valores de abajo.

## Valores de marca (tomados del tema de la tienda)

| Token | Valor |
|---|---|
| Fondo | `#0B0F14` |
| Superficie (tarjetas) | `#111820` |
| Borde | `#1E2A38` |
| Texto | `#E7EEF6` |
| Texto secundario | `#93A5B9` |
| Primario | `#2F6FEB` |
| Acento | `#12D6DF` |
| Degradado de fondo | `linear-gradient(135deg, #0B0F14 0%, #101B2C 55%, #0B0F14 100%)` |

| Elemento | Especificación |
|---|---|
| Titular | Space Grotesk 700, `letter-spacing: -0.02em`, `line-height: 1.02` |
| Texto | Inter 400/500, `line-height: 1.4` |
| Etiqueta / eyebrow | Inter 600, mayúsculas, `letter-spacing: 0.12em`, color acento |
| Radio de tarjeta | 24 px (12 px en el tema web, escalado ×2 para 1080 px) |
| Pills / botones | `border-radius: 999px` |
| Sombra de acento | `0 20px 45px -25px rgba(18, 214, 223, 0.55)` |

## Regenerar el lienzo

Desde esta carpeta, con el skill `design` cargado:

```bash
node "<base>/seed-canvas.mjs" --template "<base>/payload.template.html" \
  --out plantillas-instagram-nfc.html --title "Plantillas Instagram NFC" \
  --artboard Main.dc.html --artboard LaminaInterior.dc.html \
  --artboard PreguntaRespuesta.dc.html --artboard Comparacion.dc.html \
  --artboard LaminaCierre.dc.html --artboard FotoDeProducto.dc.html \
  --artboard PortadaReel.dc.html --artboard HistoriaEncuesta.dc.html \
  --artboard PortadaDestacada.dc.html --canvas canvas.json
```
