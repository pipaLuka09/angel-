# Logo — Tap Work

## La recomendación: la T que emite

`tapwork-simbolo.svg`

La T de **Tap**, con las ondas saliendo del brazo derecho. Se lee de dos formas a la vez: como
la inicial del nombre y como la señal sin contacto. Esa doble lectura es la que la hace tuya.

**Por qué esta y no las otras:**

| | Qué pasa |
|---|---|
| **A · Contactless** | Es el símbolo universal de pago sin contacto. Se entiende al instante, pero no es de nadie — y le dice "pagos" a la gente, que es solo uno de tus cinco productos |
| **C · Tipográfico** | El lockup es elegante y profesional, pero no te deja un símbolo propio. Sin símbolo no tienes foto de perfil, ni grabado en acrílico, ni sticker |
| **D · La tarjeta** | Claro y simpático, pero te encasilla: dibuja una tarjeta cuando también vendes acrílicos, stickers y un sistema de asistencia |

La T resiste las tres cosas que A, C y D no resuelven juntas: se reduce a 18px, se graba a una
tinta, y no se casa con ningún producto en particular.

## Archivos

| Archivo | Para qué |
|---|---|
| `tapwork-simbolo.svg` | El símbolo a dos colores. El principal |
| `tapwork-simbolo-1tinta.svg` | Una sola tinta (usa `currentColor`, hereda el color del contenedor). Para grabado en acrílico, sellos, bordado, fax de la vida |
| `tapwork-perfil.svg` | Foto de perfil de Instagram, círculo relleno |
| `tapwork-lockup-horizontal.svg` | Símbolo + nombre, para encabezados y firmas |
| `alt-a-contactless.svg` · `alt-c-onda.svg` · `alt-d-tarjeta.svg` | Las alternativas, por si prefieres otro camino |
| `tapwork-propuestas.png` | La lámina de presentación con todo |

## Antes de usarlo en serio

- [ ] **Convierte el texto a curvas.** `tapwork-lockup-horizontal.svg` tiene el nombre como
      `<text>` en Space Grotesk. Si quien lo abre no tiene la fuente, se ve con otra tipografía.
      En Figma o Illustrator: seleccionar el texto → "Convertir a contorno" / "Create outlines".
      El símbolo no tiene este problema: es geometría pura, no depende de ninguna fuente.
- [ ] **Exporta los PNG que vas a necesitar**: 1080×1080 para la foto de perfil, y uno con fondo
      transparente para poner sobre fotos.
- [ ] **Revisa que no exista otra marca "Tap Work"** en Ecuador antes de invertir en material
      impreso. Una búsqueda en el SENADI (senadi.gob.ec) y en redes toma diez minutos y te puede
      ahorrar reimprimir todo. Yo no pude verificarlo desde aquí.

## Colores

| Uso | Color |
|---|---|
| La T | `#12D6DF` |
| Las ondas | `#4A85F5` |
| Fondo oscuro | `#0B0F14` |
| Sobre fondo claro | el mismo símbolo, sin cambios |

**Espacio libre:** deja alrededor del símbolo al menos el ancho del brazo de la T. Apretado
contra otro elemento, pierde fuerza.

**Lo que no hay que hacer:** no lo estires, no le cambies el grosor de línea, no le pongas
sombra ni degradado, no rotes las ondas. Si necesita una variante que no está acá, pídemela.

---

## Ideas adicionales para la foto de perfil

Ocho propuestas pensadas específicamente para el círculo de Instagram, en `perfil/`.
Cada una probada a 110px (perfil) y a **38px (el tamaño real en el feed)**, que es donde
la mayoría de la gente la va a ver.

| | Idea | Veredicto |
|---|---|---|
| **G** | `g-t-negativo.svg` — la T calada sobre el círculo lleno | ⭐ **La más fuerte.** Máximo contraste del set y la única que a 38px se sigue leyendo como T y como onda |
| **I** | `i-ligadura-tw.svg` — un trazo continuo: la T baja y se vuelve W | ⭐ Las dos iniciales en un gesto. Legible y propia |
| **J** | `j-onda-sangre.svg` — las ondas llenan el círculo y se salen | ⭐ La más visible de lejos. Un poco genérica de cerca |
| **E** | `e-antena-chip.svg` — la espiral real de la antena de un tag NFC | Técnica y de nadie más, pero a 38px se vuelve un bloque |
| **F** | `f-ripple.svg` — punto y ondas concéntricas | Impecable a cualquier tamaño, pero parece diana o disco: no dice Tap Work |
| **L** | `l-t-solida.svg` — solo la inicial, sin ondas | Perfectamente legible, pero no comunica nada de NFC |
| **H** | `h-dedo.svg` — la mano haciendo el gesto | Linda a 110px, ilegible a 38px. Demasiado detalle |
| **K** | `k-acercar.svg` — doble flecha bajando hacia el punto | ⚠️ **Problema:** la doble flecha hacia abajo es el ícono universal de "descargar". Se lee mal |
