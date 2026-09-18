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
| `/panel` | Panel del gimnasio: indicadores, inventario de stickers y alertas. |

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

## Lo que falta para producción

- Recuperación de acceso por WhatsApp (hoy el botón es solo visual).
- Alta de socios y asignación de códigos desde el panel, sin tocar SQL.
- Generar los stickers para imprimir (PDF con el código y el QR de respaldo).
- Campo de video editable por el gym desde el panel.
