# Desplegar FORJA

La app necesita una URL pública por una razón concreta: **un sticker NFC no
puede apuntar a `localhost`**. Para probar el flujo real —grabar un sticker y
acercar el celular— hace falta una URL en internet.

## La configuración que está en uso

Proyecto de Vercel **`angel`**, conectado a este repositorio. Tres ajustes que
no son los de fábrica y sin los cuales no compila:

| Ajuste | Dónde | Valor |
|---|---|---|
| Root Directory | Settings → Build and Deployment | `forja` |
| Production Branch | Settings → Environments → Production | `claude/admiring-brown-l8qtuc` |
| Vercel Authentication | Settings → Deployment Protection | `Disabled` |

El Root Directory es el que más muerde: sin él Vercel busca la app en la raíz
del repositorio, donde solo está el tema de Shopify, y el despliegue termina en
un 404 que no explica nada.

Vercel Authentication viene activada de fábrica en los proyectos nuevos y hace
que la URL pida iniciar sesión en Vercel. Desde el celular de un socio en el
gimnasio, eso es un muro.

## Opción A — desde tu máquina, con el CLI de Vercel (la más rápida)

```bash
cd forja
npx vercel login          # una vez
npx vercel                # preview
npx vercel --prod         # producción
```

El CLI sube los archivos solo, sin necesidad de conectar GitHub con Vercel.

### Cuáles hacen falta de verdad

Solo dos para que la app funcione:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Las otras dos son opcionales y cada una degrada una sola cosa, nunca la app
entera:

- **`SUPABASE_SERVICE_ROLE_KEY`** — solo el alta de socios desde el panel. Sin
  ella ese formulario avisa con un mensaje claro y el resto sigue igual.
- **`NEXT_PUBLIC_SITE_URL`** — solo la hoja de stickers, para saber qué
  dirección imprimir. Sin ella usa el host desde donde abriste la página y te
  avisa de que no está configurada.

Está hecho así a propósito: ninguna variable que falte debe impedir ver la app.

### Por CLI, si prefieres

Las mismas, desde la terminal:

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
# https://xlrkqqskhuttolmsqhps.supabase.co
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# sb_publishable_w5qCfUM3oIztE5FY0CD_8A_N38QMRsQ
```

Ambas son públicas por diseño: viajan al navegador de cualquier visitante. La
seguridad no está en esconderlas, está en las políticas RLS de la base.

Tras el primer deploy hay que volver a desplegar para que el build las tome,
porque `NEXT_PUBLIC_*` se incrusta en tiempo de compilación:

```bash
npx vercel --prod --force
```

## Opción B — conectar GitHub con Vercel (deja despliegue continuo)

Hoy falla: Vercel responde *"You need to add a Login Connection to your GitHub
account first"*. Se arregla una sola vez en
[vercel.com/account/login-connections](https://vercel.com/account/login-connections),
agregando GitHub como método de conexión.

Con eso hecho, el proyecto se conecta al repo y cada push despliega solo. Si el
código sigue viviendo en `angel-`, hay que configurar:

- **Root Directory**: `forja`
- **Production Branch**: la rama donde esté el código

## Revisar la protección de despliegue

Por defecto Vercel pone **Vercel Authentication** en los proyectos nuevos, lo
que hace que la URL pida iniciar sesión en Vercel para abrirse. Para probar
desde un celular ajeno hay que desactivarla en Settings → Deployment
Protection, o la pantalla que verás será la de Vercel, no la de FORJA.

## La cuenta de administración de la plataforma

`/admin` solo lo ve quien está en la tabla `platform_admins`, y esa tabla no
se puede escribir desde la app a propósito. Para dar acceso a alguien que ya
tiene cuenta de FORJA, desde el SQL Editor de Supabase:

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'correo@ejemplo.com';
```

Y para quitárselo, `delete from public.platform_admins where user_id = ...`.
`SUPABASE_SERVICE_ROLE_KEY` tiene que estar configurada en Vercel: crear el
gimnasio crea también la cuenta del dueño.

## Grabar el sticker

Con la URL en mano, cualquier app de escritura NFC (NFC Tools, en Android o
iPhone) graba un registro de tipo **URL / URI**:

```
https://<tu-url>.vercel.app/m/olm-cwf34b     ← Prensa de piernas
https://<tu-url>.vercel.app/m/olm-xttv9q     ← Press de banca
```

Etiquetas NTAG213 bastan de sobra: la URL ocupa menos de 100 bytes y caben 144.

Al acercar el celular, iPhone (iOS 13+) y Android abren la URL sin instalar
nada. La primera vez pedirá entrar; después la sesión queda guardada ~13 meses
y el tap entra directo.
