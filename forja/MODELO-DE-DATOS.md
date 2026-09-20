# FORJA — Modelo de datos

Postgres sobre Supabase. Las migraciones están en `supabase/migrations/` y se
aplican en orden. `supabase/test/` contiene un stub de las piezas que Supabase
pone de su lado (`auth.users`, `auth.uid()`, roles) más una prueba del flujo
completo, para poder correr todo contra un Postgres normal.

## Las ocho tablas

| Tabla | Qué guarda | Nota de diseño |
|---|---|---|
| `gyms` | Una fila por sucursal. Es el cliente que paga. | `code_prefix` (`olm`) se antepone al código NFC para reconocer de un vistazo a qué gym pertenece un sticker. `declared_member_count` lo captura recepción: es el denominador de "214 de 260 socios tienen cuenta". |
| `profiles` | Extiende `auth.users`. Nombre, teléfono, unidad preferida. | Se crea sola con un trigger cuando Auth da de alta al usuario. Los pesos **siempre** se guardan en kg; `unit` solo cambia cómo se muestran. |
| `memberships` | Qué persona pertenece a qué gym y con qué permisos. | `role` = `member` / `staff` / `owner`. Es la tabla que decide todo el control de acceso. |
| `exercises` | Catálogo de ejercicios con técnica y video. | `gym_id` en NULL = catálogo global compartido (22 ejercicios sembrados). Un gym puede crear los suyos. `video_source` distingue `tiktok`/`instagram`/`youtube`/`own`: el día que grabes biblioteca propia solo cambia ese campo. |
| `stations` | **La máquina física que lleva el sticker.** | `nfc_code` es lo que va en la URL (`/m/olm-a7k2p9`). `last_scan_at` lo mantiene un trigger. |
| `sets` | Cada serie registrada. El corazón del sistema. | `weight_kg`, `reps`, `feeling` (1–5, las caritas). `gym_id` y `exercise_id` van desnormalizados a propósito: si mañana reasignan la máquina a otro ejercicio, el histórico no debe cambiar de dueño. |
| `goals` | Meta de peso por ejercicio, con fecha. | Índice único parcial: **una sola meta activa** por persona y ejercicio. `start_weight_kg` guarda desde dónde arrancó, si no la barra de progreso no puede decir "llevas 82% del camino". |
| `scans` | Cada tap del sticker, aunque no registren nada. | Es la única forma de distinguir "sticker despegado" de "máquina que nadie usa" — la alerta que le importa al gym. |

## La decisión de privacidad

**Los registros de entrenamiento son del socio, no del gimnasio.**

Las políticas de `sets` solo dejan leer `user_id = auth.uid()`. Ni recepción ni
el dueño pueden consultar las series de una persona identificable, ni siquiera
con acceso al panel. El panel se alimenta de `gym_dashboard()` y
`gym_stations()`, que son `SECURITY DEFINER` y devuelven **únicamente conteos**.

Esto está probado: el paso 10 de `supabase/test/01_flujo.sql` verifica que el
staff, dentro de su propio gym, ve `0` series.

### La precisión que hubo que hacer (migración 0007)

Para que recepción pueda hacer retención necesita ver **quién no está usando el
sistema**, y eso es información por persona. Así que la regla se precisó en vez
de estirarla a escondidas:

> El gimnasio ve **si** y **cuándo** alguien entrenó. Nunca **qué** levantó.

`gym_members()` devuelve nombre, correo, número de socio, fecha de la última
sesión y cuántas sesiones lleva — y ni una sola cifra de peso, repetición,
sensación o meta. Las políticas de `sets` y `goals` no cambiaron.

El razonamiento: que un socio venga o no al gimnasio, recepción ya lo ve entrar
por la puerta. Cuánto carga en la prensa, no — y eso es lo sensible.

Si más adelante quieres que un entrenador sí vea el detalle de sus clientes,
eso necesita una tabla de consentimiento explícito del socio, no un permiso
nuevo del staff.

## Las funciones que usa la app

| Función | Para qué | Seguridad |
|---|---|---|
| `station_by_code(codigo)` | El tap del sticker. Resuelve código → estación + ejercicio + técnica. | `DEFINER` a propósito: si quien toca el sticker todavía no es socio, queremos poder decirle de qué gym es y mandarlo a recepción, en vez de un 404 mudo. Devuelve `is_member` para que la pantalla decida qué mostrar. |
| `exercise_summary(ejercicio)` | Todo lo que pinta la pantalla de la máquina en una sola llamada: última sesión, la anterior (para el delta), récord, historial y meta. | `INVOKER`: se apoya en las políticas de `sets`, solo puede devolver datos de quien llama. |
| `set_goal(ejercicio, kg, fecha)` | Fija la meta, guarda el peso de partida y cancela la anterior. | `INVOKER`. |
| `gym_dashboard(gym)` | Los indicadores del panel. | `DEFINER` + verifica `is_staff_of`. Solo agregados. |
| `gym_stations(gym)` | Inventario de máquinas con su uso de 7 días. | `DEFINER` + verifica `is_staff_of`. |
| `assign_nfc_code(estacion)` | Genera el código del sticker desde el panel. | `DEFINER` + verifica `is_staff_of`. |
| `gym_members(gym)` | La lista de socios del panel: actividad, nunca pesos. | `DEFINER` + verifica `is_staff_of`. |
| `bootstrap_gym(nombre, sucursal, prefijo)` | Alta de un gym nuevo: lo crea, te deja como dueño y genera sus estaciones desde el catálogo. | `DEFINER`. |

Los códigos NFC usan un alfabeto sin `l`, `i`, `o`, `0` ni `1`, para que nadie
confunda un carácter al dictarlo por teléfono, y se generan al azar (no
correlativos) para que no se puedan adivinar los de otras máquinas.

## Permisos de las funciones

Todas las funciones llevan `revoke ... from anon` explícito: nada de esto es
alcanzable sin sesión. El linter de seguridad de Supabase confirmó que, tras
`0006`, **no queda ninguna función ejecutable por el rol `anon`**.

Las que sí puede llamar un usuario con sesión son la API de la app, y cada una
se defiende por dentro: `gym_dashboard`, `gym_stations` y `assign_nfc_code`
verifican `is_staff_of` antes de devolver o cambiar algo; `exercise_summary` y
`set_goal` solo ven lo del propio `auth.uid()`; `is_member_of` e `is_staff_of`
solo responden sobre quien llama.

**Pendiente antes de producción:** `bootstrap_gym` la puede llamar cualquier
usuario con sesión, lo que significa que cualquiera podría crear un gimnasio y
quedar como su dueño. Para el MVP es la vía de alta; cuando haya gyms reales
hay que restringirla (a una lista de invitaciones, o sacarla de la API y
dejarla solo para el admin).

## Correr las pruebas

```bash
createdb forja
psql -d forja -f supabase/test/00_supabase_stub.sql
for f in supabase/migrations/*.sql; do psql -d forja -v ON_ERROR_STOP=1 -f "$f"; done
psql -d forja -v ON_ERROR_STOP=1 -f supabase/test/01_flujo.sql
psql -d forja -v ON_ERROR_STOP=1 -f supabase/test/02_panel.sql
```

El stub **no** se aplica en Supabase: allá esas piezas ya existen.

- `01_flujo.sql` — alta de gym, sticker, registro de series, meta cerrándose
  sola al alcanzarse, y aislamiento entre socios.
- `02_panel.sql` — que `gym_members` devuelva actividad y **ninguna** cifra de
  entrenamiento, y que las funciones del panel rechacen a quien no es staff.
- `03_datos_demo.sql` — un gimnasio con historial, para recorrer la app sin
  registrar todo a mano. Este sí se ejecuta contra un Supabase real.

### Si creas usuarios con SQL, cuidado con los tokens

Insertar en `auth.users` a mano parece funcionar: el usuario aparece, y la
contraseña incluso verifica con `crypt()`. Pero si `confirmation_token`,
`recovery_token`, `email_change_token_new`, `email_change_token_current`,
`email_change`, `phone_change`, `phone_change_token` o
`reauthentication_token` quedan en `NULL`, **cualquier intento de iniciar
sesión falla con un 500** antes de comparar nada.

El servidor de autenticación de Supabase está escrito en Go y lee esas
columnas como texto que no admite nulos. El síntoma —un 500 genérico— no
apunta al problema por ningún lado, y lo natural es sospechar de la
contraseña, que es justo lo único que está bien.

Van en cadena vacía, que es lo que pone Supabase cuando crea un usuario por su
propia API. `03_datos_demo.sql` ya lo hace así.

La comprobación de privacidad de `02_panel.sql` lee los nombres de las columnas
de `gym_members` desde `pg_proc.proargnames` y falla si aparece alguna que huela
a peso, repetición, sensación o meta. Está verificada por mutación: agregando a
propósito una columna `max_weight_kg` a la función, la prueba falla; quitándola,
pasa. Una comprobación que no se puede hacer fallar no está comprobando nada.
