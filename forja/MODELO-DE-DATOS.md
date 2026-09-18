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
| `bootstrap_gym(nombre, sucursal, prefijo)` | Alta de un gym nuevo: lo crea, te deja como dueño y genera sus estaciones desde el catálogo. | `DEFINER`. |

Los códigos NFC usan un alfabeto sin `l`, `i`, `o`, `0` ni `1`, para que nadie
confunda un carácter al dictarlo por teléfono, y se generan al azar (no
correlativos) para que no se puedan adivinar los de otras máquinas.

## Correr las pruebas

```bash
createdb forja
psql -d forja -f supabase/test/00_supabase_stub.sql
for f in supabase/migrations/*.sql; do psql -d forja -v ON_ERROR_STOP=1 -f "$f"; done
psql -d forja -v ON_ERROR_STOP=1 -f supabase/test/01_flujo.sql
```

El stub **no** se aplica en Supabase: allá esas piezas ya existen.
