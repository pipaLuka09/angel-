-- =====================================================================
-- FORJA · 0009 — La lista de ejercicios del socio
--
-- Hasta ahora la única forma de ver cuánto levantaste era tocar el
-- sticker de esa máquina. Sirve estando en el gimnasio y frente a ella,
-- pero no para planear el entrenamiento, ni para revisar en el camino,
-- ni cuando la máquina está ocupada.
--
-- Devuelve un renglón por ejercicio disponible en los gimnasios donde la
-- persona es socia, con su propio historial al lado.
--
-- SECURITY INVOKER a propósito: se apoya en las políticas de `sets`,
-- `goals` y `stations`, así que no puede devolver datos de nadie más.
-- =====================================================================

create or replace function public.my_exercises()
returns table (
  exercise_id   uuid,
  name          text,
  muscle_group  text,
  nfc_code      text,
  label         text,
  gym_name      text,
  last_session  date,
  last_weight   numeric,
  best_weight   numeric,
  session_count int,
  goal_weight   numeric,
  goal_date     date
)
language sql stable set search_path = public
as $$
  with estaciones as (
    -- Una estación por ejercicio. Si el gimnasio tiene dos máquinas del
    -- mismo ejercicio, la lista enlaza a la primera por etiqueta; desde
    -- ahí el socio puede ir a la otra tocando su sticker.
    select distinct on (st.exercise_id)
           st.exercise_id, st.nfc_code, st.label, g.name as gym_name
      from public.stations st
      join public.gyms g on g.id = st.gym_id
     where st.status = 'active'
       and st.nfc_code is not null
       and st.exercise_id is not null
     order by st.exercise_id, st.label
  ),
  historial as (
    select s.exercise_id,
           max(s.session_date)                as last_session,
           max(s.weight_kg)                   as best_weight,
           count(distinct s.session_date)::int as session_count
      from public.sets s
     where s.user_id = auth.uid()
     group by s.exercise_id
  )
  select e.id,
         e.name,
         e.muscle_group,
         est.nfc_code,
         est.label,
         est.gym_name,
         h.last_session,
         (select max(s2.weight_kg)
            from public.sets s2
           where s2.user_id = auth.uid()
             and s2.exercise_id = e.id
             and s2.session_date = h.last_session),
         h.best_weight,
         coalesce(h.session_count, 0),
         g.target_weight_kg,
         g.target_date
    from estaciones est
    join public.exercises e on e.id = est.exercise_id
    left join historial h on h.exercise_id = e.id
    left join public.goals g
           on g.user_id = auth.uid()
          and g.exercise_id = e.id
          and g.status = 'active'
   order by h.last_session desc nulls last, e.muscle_group nulls last, e.name;
$$;

revoke all on function public.my_exercises() from public, anon;
grant execute on function public.my_exercises() to authenticated;
