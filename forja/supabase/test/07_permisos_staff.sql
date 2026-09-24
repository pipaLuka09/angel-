-- Prueba de 0016: recepción no puede ascenderse ni tocar el código del
-- gimnasio; el dueño sí gestiona recepción. Corre después de 01_flujo.sql.
\set ON_ERROR_STOP on
\set LAURA  '11111111-1111-1111-1111-111111111111'
\set ANDRES '22222222-2222-2222-2222-222222222222'
\set RECEP  '66666666-6666-6666-6666-666666666666'

insert into auth.users (id, email, raw_user_meta_data)
values (:'RECEP', 'recepcion@gym.test', '{"full_name":"Recepción"}');
select gym_id as gym from public.memberships where user_id = :'LAURA' limit 1 \gset
select set_config('prueba.gym', :'gym', false) \g /dev/null

set role authenticated;

\echo '--- 1. La dueña da de alta a recepción'
set app.user_id = '11111111-1111-1111-1111-111111111111';
insert into public.memberships (gym_id, user_id, role) values (:'gym', :'RECEP', 'staff');

\echo '--- 2. Recepción no puede ascenderse ni ascender a nadie'
set app.user_id = '66666666-6666-6666-6666-666666666666';
do $$
declare n int;
begin
  update public.memberships set role = 'owner'
   where user_id = '66666666-6666-6666-6666-666666666666';
  get diagnostics n = row_count;
  if n > 0 then raise exception 'FALLO DE SEGURIDAD: recepción se ascendió a dueña'; end if;

  begin
    update public.memberships set role = 'staff'
     where user_id = '22222222-2222-2222-2222-222222222222';
    get diagnostics n = row_count;
    if n > 0 then raise exception 'FALLO DE SEGURIDAD: recepción ascendió a un socio'; end if;
  exception when insufficient_privilege or check_violation then null;
    when others then if sqlerrm like 'FALLO%' then raise; end if;
  end;

  update public.memberships set status = 'paused'
   where user_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics n = row_count;
  if n > 0 then raise exception 'FALLO DE SEGURIDAD: recepción pausó a la dueña'; end if;

  raise notice 'OK: recepción no puede ascenderse, ni ascender socios, ni tocar a la dueña';
end $$;

\echo '--- 3. Recepción sí gestiona socios'
update public.memberships set status = 'paused' where user_id = :'ANDRES';
update public.memberships set status = 'active' where user_id = :'ANDRES';
do $$ begin raise notice 'OK: recepción pausa y reactiva socios'; end $$;

\echo '--- 4. Nadie del staff cambia el código del gimnasio ni su estado'
do $$
begin
  begin
    update public.gyms set code_prefix = 'xyz' where id = current_setting('prueba.gym')::uuid;
    raise exception 'FALLO DE SEGURIDAD: recepción cambió el código del gimnasio';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.gyms set status = 'suspended' where id = current_setting('prueba.gym')::uuid;
    raise exception 'FALLO DE SEGURIDAD: recepción cambió el estado del gimnasio';
  exception when insufficient_privilege then null;
  end;
  update public.gyms set name = 'Gym Olimpo', whatsapp = '+520000000000'
   where id = current_setting('prueba.gym')::uuid;
  raise notice 'OK: el staff edita nombre y WhatsApp, pero no el código ni el estado';
end $$;

\echo '--- 5. Quitar una máquina con historial conserva las series del socio'
reset role;
select count(*) as series_antes from public.sets where user_id = :'ANDRES' \gset
select station_id as estacion from public.sets
 where user_id = :'ANDRES' and station_id is not null limit 1 \gset
select set_config('prueba.estacion', :'estacion', false), set_config('prueba.series', :'series_antes', false) \g /dev/null
set role authenticated;
set app.user_id = '66666666-6666-6666-6666-666666666666';
delete from public.stations where id = :'estacion';
reset role;
do $$
declare quedan int; huerfanas int; estaciones int;
begin
  select count(*) into estaciones from public.stations where id = current_setting('prueba.estacion')::uuid;
  if estaciones > 0 then raise exception 'FALLO: recepción no pudo quitar la máquina'; end if;
  select count(*) into quedan from public.sets
   where user_id = '22222222-2222-2222-2222-222222222222';
  if quedan <> current_setting('prueba.series')::int then
    raise exception 'FALLO: se perdieron series al quitar la máquina (% de %)', quedan, current_setting('prueba.series');
  end if;
  raise notice 'OK: la máquina se quitó y las % series del socio siguen ahí', quedan;
end $$;
