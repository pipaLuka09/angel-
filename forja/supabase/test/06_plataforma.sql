-- Prueba de la plataforma: quién puede crear gimnasios, y que suspender
-- uno corte el acceso sin borrar nada. Corre después de 01_flujo.sql.
\set ON_ERROR_STOP on
\set LAURA  '11111111-1111-1111-1111-111111111111'
\set ANDRES '22222222-2222-2222-2222-222222222222'
\set ADMIN  '44444444-4444-4444-4444-444444444444'
\set DUENO  '55555555-5555-5555-5555-555555555555'

-- La cuenta de administración ya la creó 01_flujo.sql.
insert into auth.users (id, email, raw_user_meta_data)
values (:'DUENO', 'duena@gymnuevo.test', '{"full_name":"Dueña Gym Nuevo"}');

select gym_id as olimpo from public.memberships where user_id = :'LAURA' limit 1 \gset
select set_config('prueba.olimpo', :'olimpo', false) \g /dev/null

set role authenticated;

\echo '--- 1. La dueña de un gimnasio NO puede crear otro'
set app.user_id = '11111111-1111-1111-1111-111111111111';
do $$
begin
  begin
    perform public.bootstrap_gym('Gym Pirata', 'Centro', 'pir');
    raise exception 'FALLO DE SEGURIDAD: una dueña creó un gimnasio con bootstrap_gym';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_create_gym('Gym Pirata', 'Centro', 'pir', auth.uid(), true);
    raise exception 'FALLO DE SEGURIDAD: una dueña creó un gimnasio con admin_create_gym';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.admin_gyms();
    raise exception 'FALLO DE SEGURIDAD: una dueña leyó la lista de todos los gimnasios';
  exception when insufficient_privilege then null;
  end;
  raise notice 'OK: solo la administración de la plataforma crea y lista gimnasios';
end $$;

\echo '--- 2. La administración crea un gimnasio con su dueña'
set app.user_id = '44444444-4444-4444-4444-444444444444';
select public.admin_create_gym('Gym Nuevo', 'Norte', 'nvo', :'DUENO', true) as nuevo \gset

do $$
declare n int;
begin
  begin
    perform public.admin_create_gym('Otro', null, 'nvo', null, false);
    raise exception 'FALLO: se aceptó un código repetido';
  exception when others then
    if sqlerrm like 'FALLO%' then raise; end if;
  end;
  raise notice 'OK: un código de gimnasio no se puede repetir';
end $$;

select name, code_prefix, owner_email, stations, members_active
  from public.admin_gyms() order by created_at;

\echo '--- 3. La dueña del gimnasio nuevo lo administra, y no ve el otro'
set app.user_id = '55555555-5555-5555-5555-555555555555';
do $$
declare n int; m int;
begin
  select count(*) into n from public.stations;
  select count(*) into m from public.stations where gym_id = current_setting('prueba.olimpo')::uuid;
  if n = 0 then raise exception 'FALLO: la dueña nueva no ve sus máquinas'; end if;
  if m > 0 then raise exception 'FALLO DE AISLAMIENTO: ve % máquinas del otro gimnasio', m; end if;
  raise notice 'OK: ve sus % máquinas y ninguna del otro gimnasio', n;
end $$;

\echo '--- 4. Suspender el gimnasio corta el acceso a todos'
set app.user_id = '44444444-4444-4444-4444-444444444444';
select public.admin_set_gym_status(current_setting('prueba.olimpo')::uuid, 'suspended');

set app.user_id = '22222222-2222-2222-2222-222222222222';
do $$
declare n int; nombre text;
begin
  select count(*) into n from public.stations;
  if n > 0 then raise exception 'FALLO: un socio de un gimnasio suspendido ve % máquinas', n; end if;
  select g.name into nombre from public.gyms g where g.id = current_setting('prueba.olimpo')::uuid;
  if nombre is null then raise exception 'FALLO: el socio ya no puede ni leer el nombre de su gimnasio'; end if;
  raise notice 'OK: socio sin acceso, pero la app todavía puede decirle que % está suspendido', nombre;
end $$;

set app.user_id = '11111111-1111-1111-1111-111111111111';
do $$
begin
  perform public.gym_dashboard(current_setting('prueba.olimpo')::uuid);
  raise exception 'FALLO: el staff de un gimnasio suspendido abrió el panel';
exception when insufficient_privilege then
  raise notice 'OK: el staff de un gimnasio suspendido tampoco entra al panel';
end $$;

\echo '--- 5. Reactivarlo lo devuelve todo'
set app.user_id = '44444444-4444-4444-4444-444444444444';
select public.admin_set_gym_status(current_setting('prueba.olimpo')::uuid, 'active');

set app.user_id = '22222222-2222-2222-2222-222222222222';
do $$
declare n int; s int;
begin
  select count(*) into n from public.stations;
  select count(*) into s from public.sets where user_id = auth.uid();
  if n = 0 then raise exception 'FALLO: reactivado y el socio sigue sin ver máquinas'; end if;
  raise notice 'OK: reactivado, el socio vuelve a ver sus % máquinas y sus % series', n, s;
end $$;
