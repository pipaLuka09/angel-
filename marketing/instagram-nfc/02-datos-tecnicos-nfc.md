# Hoja de datos reales de NFC (fuente de verdad para los copys)

Esta hoja existe por una razón: **ningún copy de este kit puede afirmar algo que no esté aquí.**
Si un cliente te reclama en comentarios, todo lo que publicaste tiene que ser cierto.

## Cómo funciona (explicación honesta)

- NFC = *Near Field Communication*. Comunicación por radio a **muy corta distancia: entre 1 y 4 cm**.
  No es Bluetooth, no es wifi, no rastrea, no tiene ubicación.
- El chip del tag es **pasivo: no tiene batería y nunca se le acaba**. Se enciende con la energía
  del campo magnético que emite el celular al acercarse. Por eso no se carga, no se apaga y
  no tiene "vida útil" en años de uso normal.
- El chip **no ejecuta nada** en el celular. Solo guarda un dato (normalmente un link) y el
  celular decide qué hacer con él. Por eso es seguro: no puede instalar apps ni acceder a datos.

## Compatibilidad (lo más preguntado — di esto exacto)

**iPhone**
- iPhone **XS, XR y posteriores** (2018 en adelante): leen el tag **solo con acercarlo**, sin abrir
  ninguna app y con el teléfono desbloqueado. Sale una notificación arriba, se toca y listo.
- iPhone **7, 8 y X**: sí leen NFC, pero hay que usar el **Lector de etiquetas NFC** que se agrega
  desde el Centro de Control (Ajustes → Centro de Control). Requiere iOS 14 o superior.
- iPhone **6s y anteriores**: **no leen** tags NFC. (Su NFC es solo para Apple Pay.)

**Android**
- La gran mayoría de gama media y alta desde ~2014 tienen NFC y leen el tag al acercarlo.
- **Algunos modelos de gama baja no traen NFC.** Nunca prometas "funciona en todos los Android".
- Cómo verificar: Ajustes → buscar "NFC". Si aparece la opción, el celular sirve. Si no aparece, no.

> **Regla de copy:** la frase segura es *"funciona en iPhone desde el XS y en la mayoría de Android"*.
> La frase prohibida es *"funciona en cualquier celular"*.

## Capacidad de los chips (según el tipo que vendas — confirma cuál es el tuyo)

| Chip | Memoria útil | Alcanza para |
|---|---|---|
| NTAG213 | 144 bytes | Un link corto, un contacto básico |
| NTAG215 | 504 bytes | Contacto completo, varios links. **El más usado en tarjetas.** |
| NTAG216 | 888 bytes | Contacto completo + texto largo |

## Reprogramable

- Los tags se pueden **regrabar cuantas veces quieras** con una app gratuita (NFC Tools, en Android
  y iPhone), **siempre que no estén bloqueados**.
- Si un tag se bloquea (write-lock), queda de solo lectura **para siempre**. Es irreversible.
- **Antes de publicar:** confirma si tus tags salen bloqueados o desbloqueados de fábrica y ajusta
  los copys que dicen "lo cambias las veces que quieras".

## Lo que NO se debe prometer nunca

- ❌ "Funciona en todos los celulares" → falso, hay Android sin NFC.
- ❌ "Reemplaza tu tarjeta de crédito" / "sirve para pagar" → falso, no es un tag de pago.
- ❌ "Se lee a distancia" → falso, son 1–4 cm, hay que tocar.
- ❌ "Rastrea a tus clientes" → falso y además un problema legal de privacidad.
- ❌ "Sube tu negocio en Google" → la placa **facilita dejar la reseña**, no manipula el ranking.
  Y ojo: **Google prohíbe incentivar reseñas con premios o descuentos.** Pedirla está bien;
  pagarla, no. Que ningún copy sugiera regalar algo a cambio de una reseña.

## Huecos que tienes que llenar tú antes de publicar

- [ ] Precio de cada producto (los copys tienen `$__`)
- [ ] Costo y tiempo de envío en Ecuador (los copys tienen `__`)
- [ ] Tipo de chip que vendes (NTAG213 / 215 / 216)
- [ ] ¿Tus tags vienen bloqueados o regrabables?
- [ ] ¿El diseño de la tarjeta es personalizado o estándar?
- [ ] Número de WhatsApp de ventas
