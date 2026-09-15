# Instagram NFC — kit de contenido completo

Todo el contenido para lanzar y operar la cuenta de Instagram de los productos NFC.
**Mercado: Ecuador 🇪🇨 · Moneda: USD · 30 días de contenido · 25 publicaciones + historias diarias.**

---

## Índice

| Archivo | Qué contiene | Cuándo lo usas |
|---|---|---|
| [`01-setup-cuenta.md`](01-setup-cuenta.md) | Crear la cuenta, @ sugeridos, bio, foto de perfil, highlights, configuración | **Primero.** Una sola vez, ~20 min |
| [`02-datos-tecnicos-nfc.md`](02-datos-tecnicos-nfc.md) | Hoja de verdad sobre NFC: compatibilidad real, qué no prometer nunca | **Léelo antes de publicar.** Y cada vez que improvises un copy |
| [`03-calendario-30-dias.md`](03-calendario-30-dias.md) | Qué se publica cada día, en qué formato, a qué hora | Tu tablero de control diario |
| [`04-publicaciones-feed.md`](04-publicaciones-feed.md) | 15 copys completos de carruseles y posts, con diseño lámina por lámina | Cada día de post de feed |
| [`05-guiones-reels.md`](05-guiones-reels.md) | 10 reels con guion plano por plano, texto en pantalla y copy | Cada día de reel |
| [`06-historias-y-highlights.md`](06-historias-y-highlights.md) | 8 formatos de historia, calendario semanal, las 6 destacadas | Todos los días |
| [`07-hashtags-y-respuestas.md`](07-hashtags-y-respuestas.md) | 4 sets de hashtags, 7 respuestas guardadas de DM, cómo responder comentarios | Al publicar y al contestar |
| [`plantillas/`](plantillas/) | 9 plantillas gráficas editables (feed 4:5 y vertical 9:16) + tabla de valores de marca | Al armar cada pieza |

---

## Orden de arranque (haz esto en este orden)

1. **Lee `02-datos-tecnicos-nfc.md`** y llena la lista de huecos del final (precios, envíos,
   tipo de chip). Sin esos datos, la mitad de los copys no se pueden publicar.
2. **Crea la cuenta** siguiendo `01-setup-cuenta.md`. Incluye las 6 destacadas vacías.
3. **Carga las respuestas guardadas** de `07-hashtags-y-respuestas.md` en el DM.
4. **Prepara los 5 primeros posts como borrador** en Instagram. Esto es lo que evita que el
   plan se caiga el jueves de la primera semana.
5. **Publica el día 1** (el reel P01) y sigue el calendario.

---

## Lo que tienes que llenar tú

**Precios: listos.** Aplicados desde tu hoja `Precios.xlsx`, con los escalones por cantidad
incluidos en cada copy. Lo que todavía falta:

- [ ] **Costo y tiempo de envío** (Quito / Guayaquil / resto del país)
- [ ] **Formas de pago** que aceptas
- [ ] **En cuántas horas** mandas la propuesta de diseño
- [ ] **Qué hace por dentro el sistema de asistencia** — P24 tiene huecos en las láminas 4 y 5
      (reportes, panel, exportar, horas extra, si necesita internet). Son los que deciden esa
      venta: un dueño no compra "marcar entrada", compra "dejar de pelear con las horas a fin de mes"
- [ ] **Cuánto cuestan 100 tarjetas de papel** en una imprenta de tu ciudad — para P04.
      Cotízalo de verdad; si inflas ese número y alguien que sí imprime lo ve, pierdes la cuenta
- [ ] Tipo de chip (NTAG213 / 215 / 216) y si vienen regrabables o bloqueados
- [ ] Número de WhatsApp de ventas
- [ ] Tu historia real para el post P05 (el único que no puedo escribir por ti)

Búscalos todos con:

```bash
grep -rn '\$__\|__ ' marketing/instagram-nfc/
```

### Fuera del contenido por ahora

Llaveros e imanes, sistema de gym y collar NFC no aparecen en ninguna publicación: tu hoja dice
"no sé aún" en el precio y un catálogo con huecos genera DMs que no puedes cerrar. Cuando tengas
esos precios, dímelo y los agrego.

## Lo que hice y lo que no

**Lo que hice:** todo el contenido — setup, calendario, 25 copys completos, 10 guiones de
reel, historias, hashtags, respuestas de DM, la hoja de datos técnicos para que nada de lo
publicado sea falso, y las 9 plantillas gráficas en `plantillas/`.

**Lo que no pude hacer:**

- **Crear la cuenta de Instagram.** Necesita tu teléfono y tu correo para la verificación.
  Está todo especificado en `01-setup-cuenta.md`, son ~20 minutos.
- **Publicar automáticamente.** No hay ninguna cuenta de Instagram conectada a esta sesión con
  permisos de publicación. Cuando la cuenta exista y la conectes a Meta Business Suite, puedes
  programar los 25 posts de una sola vez desde ahí.
- **Leer un catálogo de productos.** No hay tienda web por ahora, y es una decisión
  deliberada: para este volumen WhatsApp convierte mejor y no cuesta nada. Por eso el
  contenido cubre las 4 categorías de producto NFC que acordamos, todos los CTA llevan a
  WhatsApp, y los precios quedan como huecos para que los llenes tú.

**Decisiones deliberadas que vale la pena que conozcas:**

- **No hay ni un testimonio.** La destacada "Clientes" queda vacía y ningún copy afirma tener
  clientes. En un mercado chico, un testimonio inventado que alguien detecta te cuesta la
  cuenta entera. Hay instrucciones para pedir los reales desde el primer pedido.
- **Los copys admiten las desventajas de NFC.** El post P20 y la guía de comentarios reconocen
  de frente que un QR gratis sirve para muchos casos. Perder una venta diciendo la verdad
  vende las siguientes diez.
- **Nada de "funciona en todos los celulares".** Hay Android sin NFC e iPhones viejos que no
  leen etiquetas. Los copys lo dicen, porque un cliente que recibe algo que no le sirve es
  una devolución y una reseña mala.
- **Nada de regalar cosas por reseñas de Google.** Google lo prohíbe expresamente. El reel de
  la placa lo aclara dentro del propio copy.

---

## Paleta y tipografía (para las gráficas)

Este es el sistema visual de la cuenta. Salió del tema oscuro que ya existía en el proyecto,
así que si algún día armas una web, ya están alineados:

| Uso | Color |
|---|---|
| Fondo | `#0B0F14` |
| Texto | `#E7EEF6` |
| Primario | `#2F6FEB` |
| Acento / CTA | `#12D6DF` |
| Secundario | `#1B2A3A` |

**Titulares:** Space Grotesk 700 · **Texto:** Inter 400/500
(Ambas son gratis en Google Fonts y están disponibles en Canva.)

**Formato de las piezas:** 1080 × 1350 px (4:5) para posts y carruseles — ocupa más pantalla
que el cuadrado. 1080 × 1920 px (9:16) para reels e historias.

---

## Al terminar el mes

No repitas este calendario a ciegas. Entra a Estadísticas, saca los 3 posts con más **alcance**
y los 3 con más **guardados** (guardados y compartidos pesan más que los likes), y pásame esos
números junto con las preguntas que más te llegaron por DM. Con eso armo el mes 2 sobre datos
reales en vez de suposiciones.
