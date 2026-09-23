-- Prueba del registro con aprobación. Corre después de 01_flujo.sql.
-- AJENO existe pero no es socio de ningún gimnasio: es quien se registra.
\set ON_ERROR_STOP on
\set LAURA '11111111-1111-1111-1111-111111111111'
\set AJENO '33333333-3333-3333-3333-333333333333'

-- El slug y un código de sticker se leen antes de entrar como usuario:
-- sin sesión, las políticas no dejan ver ni gyms ni stations.
select g.slug,
       (select nfc_code from public.stations where gym_id = g.id and nfc_code is not null limit 1) as sticker
  from public.gyms g limit 1 \gset

set role authenticated;

\echo '--- 1. El gimnasio se encuentra por slug, por código corto y por sticker'
select (select count(*) from public.gym_para_registro(:'slug'))      as por_slug,
       (select count(*) from public.gym_para_registro('OLM'))        as por_codigo,
       (select count(*) from public.gym_para_registro(:'sticker'))   as por_sticker,
       (select count(*) from public.gym_para_registro('no-existe'))  as inexistente;

select id as gym from public.gym_para_registro('olm') \gset

\echo '--- 2. Alguien pide acceso y queda pendiente'
set app.user_id = '33333333-3333-3333-3333-333333333333';
select public.request_membership(:'gym') as estado;

\echo '--- 3. Pendiente no da acceso a nada'
-- El id del gimnasio se pasa por una variable de sesión: dentro de un DO
-- no llegan las variables de psql, y la cuenta pendiente no puede leer
-- la tabla gyms para averiguarlo (que es justo lo que se prueba).
select set_config('prueba.gym', :'gym', false) \g /dev/null
do $$
declare n int;
begin
  select count(*) into n from public.stations;
  if n > 0 then raise exception 'FALLO: una cuenta pendiente ve % estaciones', n; end if;

  begin
    insert into public.sets (user_id, gym_id, exercise_id, weight_kg, reps)
    values ('33333333-3333-3333-3333-333333333333',
            current_setting('prueba.gym')::uuid,
            (select id from public.exercises where gym_id is null limit 1),
            50, 10);
    raise exception 'FALLO: una cuenta pendiente registró una serie';
  exception when others then
    if sqlerrm like 'FALLO%' then raise; end if;
  end;
  raise notice 'OK: una cuenta pendiente no ve máquinas ni puede registrar series';
end $$;

\echo '--- 4. Pedirlo dos veces no duplica nada'
select public.request_membership(:'gym') as estado_otra_vez;

\echo '--- 5. Recepción la ve y la aprueba'
set app.user_id = '11111111-1111-1111-1111-111111111111';
select full_name, status::text from public.gym_members(:'gym') where status = 'pending';
update public.memberships set status = 'active'
 where gym_id = :'gym' and user_id = :'AJENO';

\echo '--- 6. Ya aprobada, ve las máquinas'
set app.user_id = '33333333-3333-3333-3333-333333333333';
do $$
declare n int;
begin
  select count(*) into n from public.stations;
  if n = 0 then raise exception 'FALLO: aprobada y sigue sin ver estaciones'; end if;
  raise notice 'OK: aprobada, ya ve % estaciones', n;
end $$;
