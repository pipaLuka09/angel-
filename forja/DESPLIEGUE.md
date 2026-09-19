# Desplegar FORJA

La app necesita una URL pública por una razón concreta: **un sticker NFC no
puede apuntar a `localhost`**. Para probar el flujo real —grabar un sticker y
acercar el celular— hace falta una URL en internet.

## Opción A — desde tu máquina, con el CLI de Vercel (la más rápida)

```bash
cd forja
npx vercel login          # una vez
npx vercel                # preview
npx vercel --prod         # producción
```

El CLI sube los archivos solo, sin necesidad de conectar GitHub con Vercel.

Después, las dos variables de entorno (en el dashboard de Vercel →
Settings → Environment Variables, o por CLI):

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
