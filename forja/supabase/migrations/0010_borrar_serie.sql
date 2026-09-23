-- =====================================================================
-- FORJA · 0010 — Borrar una serie
--
-- Borrar la fila es lo fácil; lo que hay que cuidar es lo que queda:
--
-- 1. La numeración del día. Si de S1, S2, S3 se borra S2, la siguiente
--    serie saldría como otra S3 (el registro calcula "cuántas llevo + 1").
--    Se renumeran las que quedan de ese día y ese ejercicio.
--
-- 2. La meta. El trigger de 0001 la marca como lograda en cuanto una
--    serie alcanza el objetivo. Si la serie borrada era la única que lo
--    alcanzaba —típicamente un error al anotar—, la meta tiene que volver
--    a estar activa. Solo se reabre la más reciente, y solo si no hay ya
--    otra meta activa en ese ejercicio (el índice único lo impediría).
--
-- SECURITY INVOKER: las políticas de `sets` y `goals` garantizan que
-- solo se puede borrar y tocar lo propio.
-- =====================================================================

create or replace function public.delete_set(p_set_id uuid)
returns void
language plpgsql set search_path = public
as $$
declare
  v_set public.sets;
begin
  delete from public.sets
   where id = p_set_id and user_id = auth.uid()
  returning * into v_set;

  if v_set.id is null then
    raise exception 'serie no encontrada';
  end if;

  -- 1. Renumerar lo que queda de ese día.
  with orden as (
    select id, row_number() over (order by set_number, performed_at, created_at)::smallint as n
      from public.sets
     where user_id = auth.uid()
       and exercise_id = v_set.exercise_id
       and session_date = v_set.session_date
  )
  update public.sets s
     set set_number = orden.n
    from orden
   where s.id = orden.id
     and s.set_number <> orden.n;

  -- 2. Reabrir la meta si ya nada la cumple.
  update public.goals g
     set status = 'active', achieved_at = null
   where g.id = (
           select g2.id from public.goals g2
            where g2.user_id = auth.uid()
              and g2.exercise_id = v_set.exercise_id
              and g2.status = 'achieved'
            order by g2.achieved_at desc nulls last
            limit 1
         )
     and not exists (
           select 1 from public.sets s
            where s.user_id = auth.uid()
              and s.exercise_id = v_set.exercise_id
              and s.weight_kg >= g.target_weight_kg
         )
     and not exists (
           select 1 from public.goals g3
            where g3.user_id = auth.uid()
              and g3.exercise_id = v_set.exercise_id
              and g3.status = 'active'
         );
end;
$$;

revoke all on function public.delete_set(uuid) from public, anon;
grant execute on function public.delete_set(uuid) to authenticated;
