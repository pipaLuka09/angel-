-- Prueba de delete_set: renumeración del día, meta que se reabre, y que
-- nadie pueda borrar series ajenas. Corre después de 01_flujo.sql.
\set ON_ERROR_STOP on
\set ANDRES '22222222-2222-2222-2222-222222222222'
\set AJENO  '33333333-3333-3333-3333-333333333333'

set role authenticated;
set app.user_id = '22222222-2222-2222-2222-222222222222';

select exercise_id as ej, station_id as est, gym_id as gym
  from public.sets where user_id = :'ANDRES' limit 1 \gset

-- Un día con tres series, la segunda anotada por error con 120 kg.
insert into public.sets (user_id, gym_id, station_id, exercise_id, session_date, set_number, weight_kg, reps)
values (:'ANDRES', :'gym', :'est', :'ej', current_date + 1, 1,  85, 10),
       (:'ANDRES', :'gym', :'est', :'ej', current_date + 1, 2, 120, 10),
       (:'ANDRES', :'gym', :'est', :'ej', current_date + 1, 3,  85, 10);

-- Meta nueva de 110: la serie de 120 la cierra al instante... pero la
-- meta se fija después, así que la cerramos con otra serie de 120.
update public.goals set status = 'cancelled' where user_id = :'ANDRES' and exercise_id = :'ej' and status = 'active';
insert into public.goals (user_id, exercise_id, target_weight_kg, target_date, start_weight_kg)
values (:'ANDRES', :'ej', 110, current_date + 60, 85);
update public.goals set status = 'achieved', achieved_at = now()
 where user_id = :'ANDRES' and exercise_id = :'ej' and status = 'active';

\echo '--- 1. Un tercero no puede borrarla'
set app.user_id = '33333333-3333-3333-3333-333333333333';
do $$
begin
  perform public.delete_set((select id from public.sets where weight_kg = 120 limit 1));
  raise exception 'FALLO DE SEGURIDAD: se borró una serie ajena';
exception when others then
  if sqlerrm like 'FALLO%' then raise; end if;
  raise notice 'OK: una serie ajena no se puede borrar (%)', sqlerrm;
end $$;

\echo '--- 2. El dueño borra la serie de 120'
set app.user_id = '22222222-2222-2222-2222-222222222222';
select public.delete_set(
  (select id from public.sets
    where user_id = :'ANDRES' and session_date = current_date + 1 and weight_kg = 120)
);

do $$
declare nums text; estado text;
begin
  select string_agg(set_number::text, ',' order by set_number) into nums
    from public.sets
   where user_id = '22222222-2222-2222-2222-222222222222' and session_date = current_date + 1;
  if nums <> '1,2' then
    raise exception 'FALLO: la numeración quedó en % y debía ser 1,2', nums;
  end if;
  raise notice 'OK: las series del día quedaron renumeradas (%)', nums;

  select status::text into estado from public.goals
   where user_id = '22222222-2222-2222-2222-222222222222'
     and target_weight_kg = 110
   order by created_at desc limit 1;
  if estado <> 'active' then
    raise exception 'FALLO: la meta quedó como % y debía volver a active', estado;
  end if;
  raise notice 'OK: la meta volvió a estar activa porque ya ninguna serie la cumple';
end $$;
