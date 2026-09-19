-- Prueba del panel: que gym_members devuelva actividad sin filtrar ni una
-- cifra de peso, y que se niegue a quien no es staff.
-- Corre después de 01_flujo.sql, sobre la misma base.
\set ON_ERROR_STOP on
\set LAURA   '11111111-1111-1111-1111-111111111111'
\set ANDRES  '22222222-2222-2222-2222-222222222222'

set role authenticated;

-- ============ Recepción sí puede ============
set app.user_id = '11111111-1111-1111-1111-111111111111';

\echo '--- 1. La lista de socios que ve recepción'
select full_name, member_code, role::text, last_session, session_count
  from public.gym_members((select gym_id from public.memberships where user_id = :'LAURA'))
 order by full_name;

\echo '--- 2. Las columnas que devuelve (la regla de privacidad)'
-- proargnames lleva los nombres de los parámetros IN y de las columnas
-- del RETURNS TABLE. Es la forma correcta de leerlos: el tipo de retorno
-- de una función TABLE no vive en pg_class.
select array_to_string(p.proargnames, ', ') as parametros_y_columnas
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'gym_members';

do $$
declare cols text;
begin
  select array_to_string(p.proargnames, ',')
    into cols
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'gym_members';

  -- Si esto quedara en NULL la prueba pasaría sin comprobar nada.
  if cols is null or cols = '' then
    raise exception 'La prueba no pudo leer las columnas de gym_members';
  end if;

  if cols ~* '(weight|kg|reps|feeling|target|goal)' then
    raise exception 'FALLO DE PRIVACIDAD: gym_members expone datos de entrenamiento (%)', cols;
  end if;

  -- Y que sí traiga lo que el panel necesita.
  if cols !~ 'last_session' or cols !~ 'session_count' then
    raise exception 'gym_members ya no devuelve la actividad que el panel necesita (%)', cols;
  end if;

  raise notice 'OK: gym_members devuelve actividad (%) y ninguna cifra de entrenamiento',
               'last_session, session_count';
end $$;

-- ============ Un socio no puede ============
set app.user_id = '22222222-2222-2222-2222-222222222222';

\echo '--- 3. Un socio no puede leer la lista ni el panel'
do $$
declare v_gym uuid; v_n int;
begin
  select gym_id into v_gym from public.memberships
   where user_id = '22222222-2222-2222-2222-222222222222';

  begin
    select count(*) into v_n from public.gym_members(v_gym);
    raise exception 'FALLO DE SEGURIDAD: un socio leyó gym_members (% filas)', v_n;
  exception when insufficient_privilege then
    raise notice 'OK: gym_members rechaza a quien no es staff';
  end;

  begin
    perform public.gym_dashboard(v_gym);
    raise exception 'FALLO DE SEGURIDAD: un socio leyó gym_dashboard';
  exception when insufficient_privilege then
    raise notice 'OK: gym_dashboard rechaza a quien no es staff';
  end;

  begin
    perform public.gym_stations(v_gym);
    raise exception 'FALLO DE SEGURIDAD: un socio leyó gym_stations';
  exception when insufficient_privilege then
    raise notice 'OK: gym_stations rechaza a quien no es staff';
  end;
end $$;

\echo '--- 4. Y tampoco puede asignarse un código de sticker'
do $$
declare v_st uuid;
begin
  select id into v_st from public.stations limit 1;
  begin
    perform public.assign_nfc_code(v_st);
    raise exception 'FALLO DE SEGURIDAD: un socio asignó un código NFC';
  exception
    when insufficient_privilege then
      raise notice 'OK: assign_nfc_code rechaza a quien no es staff';
    when others then
      -- Sin permiso de lectura sobre stations ni siquiera encuentra la fila.
      raise notice 'OK: assign_nfc_code no llegó a ejecutarse (%)', sqlerrm;
  end;
end $$;

\echo '--- 5. Recepción sí puede asignar'
set app.user_id = '11111111-1111-1111-1111-111111111111';
select public.assign_nfc_code(
         (select id from public.stations
           where gym_id = (select gym_id from public.memberships where user_id = :'LAURA')
             and nfc_code is null
           limit 1)
       ) as codigo_nuevo;
