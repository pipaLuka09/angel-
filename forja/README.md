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

## Dar de alta un gimnasio

Con una sesión iniciada, desde el SQL Editor:

```sql
select public.bootstrap_gym('Gym Olimpo', 'Centro', 'olm');
```

Crea el gym, te deja como dueño y genera una estación por cada ejercicio
del catálogo global, todas sin sticker. Después, por cada máquina:

```sql
select public.assign_nfc_code('<id de la estación>');
```

Devuelve el código (`olm-a7k2p9`). El sticker se graba con
`<NEXT_PUBLIC_SITE_URL>/m/olm-a7k2p9`.

## El panel

Todo lo que el gimnasio necesita hacer a diario está ahí, sin tocar SQL:

- **Socios**: dar de alta (crea la cuenta y devuelve una contraseña temporal
  para dictarla en recepción), ver quién nunca ha registrado nada, quién dejó
  de venir, y pausar el acceso de quien no renovó.
- **Máquinas**: agregarlas, asignarles código de sticker, e **invalidar** el de
  un sticker perdido o despegado — deja de funcionar al instante y la máquina
  vuelve a pendientes, sin perder el historial de nadie.
- **Stickers**: hoja lista para imprimir. Cada etiqueta lleva el número de
  estación, el ejercicio, un QR y la dirección en texto. El QR no es adorno: es
  el respaldo para cuando el chip falla o el celular no lee NFC.

El alta de socios es lo único que necesita `SUPABASE_SERVICE_ROLE_KEY`, porque
crear cuentas de Auth es una operación de administración. Sin esa variable el
resto del panel funciona igual y solo ese formulario avisa que falta.

## Lo que falta para producción

- Recuperación de acceso por WhatsApp (hoy el botón es solo visual).
- Ligar a un gimnasio a alguien que ya tenga cuenta de FORJA de otro gym.
- Regenerar la contraseña de un socio desde el panel.
- Campo de video por ejercicio, editable por el gym desde el panel.
- Restringir `bootstrap_gym`: hoy cualquier usuario con sesión puede crear un
  gimnasio y quedar como su dueño.
