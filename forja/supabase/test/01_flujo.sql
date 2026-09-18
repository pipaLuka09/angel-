-- Prueba del flujo completo: alta de gym, sticker, registro de series,
-- meta, y que un tercero no pueda ver nada de otro socio.
\set ON_ERROR_STOP on
\set LAURA   '11111111-1111-1111-1111-111111111111'
\set ANDRES  '22222222-2222-2222-2222-222222222222'
\set AJENO   '33333333-3333-3333-3333-333333333333'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'LAURA',  'laura@gym.test',   '{"full_name":"Laura M."}'),
  (:'ANDRES', 'andres@socio.test','{"full_name":"Andrés R."}'),
  (:'AJENO',  'ajeno@otro.test',  '{"full_name":"Persona Ajena"}');

\echo '--- 1. El trigger creó los perfiles'
select count(*) as perfiles from public.profiles;

-- ============ Laura (recepción) da de alta el gimnasio ============
set role authenticated;
set app.user_id = '11111111-1111-1111-1111-111111111111';

select public.bootstrap_gym('Gym Olimpo', 'Centro', 'olm') as gym \gset

\echo '--- 2. Gym creado con sus estaciones'
select (select count(*) from public.stations where gym_id = :'gym'::uuid) as estaciones,
       (select count(*) from public.stations where gym_id = :'gym'::uuid and status = 'no_sticker') as sin_sticker;

select st.id as est_id, st.exercise_id as ej_id
  from public.stations st
  join public.exercises e on e.id = st.exercise_id
 where st.gym_id = :'gym'::uuid and e.slug = 'prensa-piernas' \gset

select public.assign_nfc_code(:'est_id'::uuid) as code \gset
\echo '--- 3. Código NFC asignado'
select :'code' as codigo,
       (select status::text from public.stations where id = :'est_id'::uuid) as estado;

insert into public.memberships (gym_id, user_id, role)
values (:'gym'::uuid, :'ANDRES', 'member');

-- ============ Andrés toca el sticker y entrena ============
set app.user_id = '22222222-2222-2222-2222-222222222222';

\echo '--- 4. El tap del sticker resuelve la estación'
select station_name, exercise_name, is_member, jsonb_array_length(cues) as claves
  from public.station_by_code(:'code');

insert into public.scans (station_id, user_id) values (:'est_id'::uuid, :'ANDRES');

-- session_date y performed_at se llenan juntos: en uso real los pone
-- el mismo insert, así que la prueba los mantiene coherentes.
insert into public.sets (user_id, gym_id, station_id, exercise_id, session_date, performed_at, set_number, weight_kg, reps, feeling)
values
  (:'ANDRES', :'gym'::uuid, :'est_id'::uuid, :'ej_id'::uuid, current_date - 20, now() - interval '20 days', 1, 75,   10, 2),
  (:'ANDRES', :'gym'::uuid, :'est_id'::uuid, :'ej_id'::uuid, current_date - 20, now() - interval '20 days', 2, 75,   10, 3),
  (:'ANDRES', :'gym'::uuid, :'est_id'::uuid, :'ej_id'::uuid, current_date - 12, now() - interval '12 days', 1, 80,   10, 3),
  (:'ANDRES', :'gym'::uuid, :'est_id'::uuid, :'ej_id'::uuid, current_date - 12, now() - interval '12 days', 2, 80,    8, 4),
  (:'ANDRES', :'gym'::uuid, :'est_id'::uuid, :'ej_id'::uuid, current_date -  4, now() - interval '4 days',  1, 82.5, 10, 3),
  (:'ANDRES', :'gym'::uuid, :'est_id'::uuid, :'ej_id'::uuid, current_date -  4, now() - interval '4 days',  2, 82.5, 10, 4);

\echo '--- 5. Resumen del ejercicio (lo que pinta la pantalla de la máquina)'
select jsonb_pretty(
         public.exercise_summary(:'ej_id'::uuid, 8)
         - 'sessions'
       ) as resumen;
select jsonb_array_length(public.exercise_summary(:'ej_id'::uuid, 8) -> 'sessions') as sesiones_en_grafica;

\echo '--- 6. Meta'
select target_weight_kg, target_date, start_weight_kg, status
  from public.set_goal(:'ej_id'::uuid, 100, current_date + 74);

\echo '--- 7. Al alcanzar la meta, se cierra sola'
insert into public.sets (user_id, gym_id, station_id, exercise_id, set_number, weight_kg, reps, feeling)
values (:'ANDRES', :'gym'::uuid, :'est_id'::uuid, :'ej_id'::uuid, 1, 100, 6, 5);
select status, achieved_at is not null as tiene_fecha
  from public.goals where user_id = :'ANDRES' and exercise_id = :'ej_id'::uuid;

-- ============ Un tercero no ve nada ============
set app.user_id = '33333333-3333-3333-3333-333333333333';
\echo '--- 8. Alguien sin cuenta en ese gym'
select (select count(*) from public.sets)     as series_ajenas_visibles,
       (select count(*) from public.stations) as estaciones_visibles,
       (select is_member from public.station_by_code(:'code')) as es_socio;

-- ============ El panel del gym ============
set app.user_id = '11111111-1111-1111-1111-111111111111';
\echo '--- 9. Panel del gimnasio (solo agregados)'
select jsonb_pretty(public.gym_dashboard(:'gym'::uuid) - 'top_stations') as panel;
\echo '--- 10. Y el staff sigue sin poder leer series de nadie'
select count(*) as series_visibles_para_recepcion from public.sets;
