# FORJA

Registro de entrenamiento por stickers NFC en gimnasios.

Cada máquina del gym lleva pegado un sticker. El socio acerca el celular,
se abre `/m/<codigo>` y ve **su** último peso en **esa** máquina, su meta y
cómo se hace el ejercicio. Anota la serie en dos toques y se va.

No hay app que instalar: el sticker guarda una URL y el celular la abre
solo (iPhone desde iOS 13, Android nativo).

## Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **Supabase** — Postgres + Auth, con toda la seguridad en políticas RLS
- Sin framework de CSS: tokens de marca en `src/app/globals.css`
- Tipografías Anton (títulos y números) + Archivo (texto), auto-hospedadas
  por `next/font`

## Arrancar

```bash
cp .env.example .env.local     # y llena las claves de tu proyecto Supabase
npm install
npm run dev
```

Las migraciones están en `supabase/migrations/`, en orden. Se aplican con
el CLI de Supabase (`supabase db push`) o pegándolas en el SQL Editor.

Ver **[MODELO-DE-DATOS.md](./MODELO-DE-DATOS.md)** para el esquema y la
decisión de privacidad.

## Pantallas

| Ruta | Qué es |
|---|---|
| `/entrar` | El login que pasa **una sola vez**, al inscribirse. |
| `/registro` | Crear cuenta por cuenta propia. Queda **en espera** hasta que el gimnasio la apruebe. |
| `/cuenta` | Mi cuenta: datos y cambiar contraseña. |
| `/` | Inicio: recuerda que hay que acercar el celular a un sticker. |
| `/m/[codigo]` | **La pantalla del tap.** Último peso, meta, últimas sesiones. |
| `/m/[codigo]/registrar` | Anotar la serie: peso, reps y carita. |
| `/m/[codigo]/tecnica` | Video, las claves y los errores comunes. |
| `/m/[codigo]/meta` | Progresión, récord y fijar la meta. |
| `/panel` | Resumen del gimnasio: indicadores, máquinas más usadas y alertas. |
| `/panel/socios` | Alta de socios, quién usa el sistema y quién no, pausar accesos. |
| `/panel/maquinas` | Agregar máquinas, asignar e invalidar códigos de sticker. |
| `/panel/stickers` | Hoja de stickers lista para imprimir, con QR de respaldo. |

## La sesión larga

El socio no vuelve a escribir su contraseña: nadie teclea entre series,
sudado y con una mano. El login pasa una vez y la cookie dura ~13 meses
(`src/lib/supabase/cookies.ts`), renovándose sola en cada navegación desde
`src/middleware.ts`.

Si alguien toca un sticker sin sesión, `/m/<codigo>` lo manda a `/entrar`
recordando a dónde iba: al entrar aterriza en la máquina correcta, no en
una pantalla genérica.

## Vender FORJA a un gimnasio

FORJA es multi-gimnasio: cada gym ve solo lo suyo (lo garantizan las políticas
RLS de la base, no la app). Hay tres niveles de cuenta:

| Quién | Qué hace | Dónde |
|---|---|---|
| **Administración de FORJA** (tú) | Crea gimnasios, les da su cuenta de dueño, los suspende si no pagan. | `/admin` |
| **Dueño del gimnasio** | Todo el panel, más: crear cuentas de recepción, restablecer sus contraseñas y cambiar nombre/sucursal. | `/panel` |
| **Recepción** | Da de alta, aprueba y pausa socios; máquinas, videos y stickers. No puede crear otras cuentas de staff ni tocar al dueño. | `/panel` |

El flujo al cerrar una venta:

1. Entras con tu cuenta de administración y vas a **Administración de FORJA →
   Nuevo gimnasio**.
2. Llenas nombre, sucursal, un **código corto** de 2 a 5 letras (`olm`, va
   impreso en cada sticker y no se cambia después) y el correo del dueño.
   Con la casilla del catálogo marcada, el gym arranca con una máquina por cada
   ejercicio del catálogo, todas sin sticker.
3. La pantalla te da el usuario y una contraseña temporal del dueño. Se la
   pasas; al entrar se le pide cambiarla.
4. El dueño entra a `/panel`: ajusta sus máquinas, imprime stickers, crea la
   cuenta de recepción y comparte el link de registro con sus socios.

**Suspender** (desde `/admin`) corta el acceso de todo el gimnasio al instante —
panel, socios y stickers— sin borrar nada. Cada quien ve un mensaje de que el
servicio está en pausa. **Reactivar** lo deja exactamente como estaba.

Pendiente del lado del negocio, no del código: cobro (hoy se lleva fuera de la
app, y la suspensión es la palanca), contrato y aviso de privacidad con cada
gimnasio.

## El panel

Todo lo que el gimnasio necesita hacer a diario está ahí, sin tocar SQL:

- **Socios**: dos formas de sumar gente. Recepción puede dar de alta (crea la
  cuenta y devuelve una contraseña temporal para dictarla), o compartir el
  link de registro para que cada quien cree la suya y luego **aprobarla o
  rechazarla**. Además: quién nunca ha registrado nada, quién dejó de venir,
  y pausar el acceso de quien no renovó.
- **Máquinas**: agregarlas, asignarles código de sticker, **invalidar** el de
  un sticker perdido o despegado — deja de funcionar al instante y la máquina
  vuelve a pendientes — y **quitar** las que el gym ya no tiene. En ningún caso
  se pierde el historial de nadie: cada serie guarda su ejercicio aparte.
- **Stickers**: hoja lista para imprimir. Cada etiqueta lleva el número de
  estación, el ejercicio, un QR y la dirección en texto. El QR no es adorno: es
  el respaldo para cuando el chip falla o el celular no lee NFC.
- **Ajustes**: nombre y sucursal tal como los ven los socios (solo el dueño),
  el código del gimnasio y el link de registro.

El alta de socios es lo único que necesita `SUPABASE_SERVICE_ROLE_KEY`, porque
crear cuentas de Auth es una operación de administración. Sin esa variable el
resto del panel funciona igual y solo ese formulario avisa que falta.

## Contraseñas olvidadas

No hay correo de recuperación: el SMTP gratuito de Supabase solo envía a los
miembros del proyecto, así que a un socio nunca le llegaría. En su lugar:

- Recepción genera una **contraseña nueva** desde Panel → Socios, sin tocar el
  historial. Solo sobre socios: recepción no puede restablecer la de otro
  miembro del staff ni la del dueño, porque eso permitiría entrar con sus
  permisos. El dueño sí puede con las de recepción.
- Si el que olvida la contraseña es el dueño, se la restableces tú desde el
  panel de Supabase (Authentication → Users).
- El socio la cambia por una suya en **Mi cuenta**. Mientras use una contraseña
  que le dio recepción, el inicio se lo recuerda.

Con un proveedor de correo propio (Resend, SendGrid…) configurado en Supabase
se podría agregar el "olvidé mi contraseña" por correo.

## Lo que falta para producción

- Ligar a un gimnasio a alguien que ya tenga cuenta de FORJA de otro gym.
- Campo de video por ejercicio, editable por el gym desde el panel.
- Cobro dentro de la app (hoy se cobra por fuera y se suspende a mano).
- Que un dueño con varias sucursales las vea todas desde un mismo panel (hoy
  el panel toma la primera).
