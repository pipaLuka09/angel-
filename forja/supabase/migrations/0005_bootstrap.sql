-- =====================================================================
-- FORJA · 0005 — Alta de un gimnasio nuevo
--
-- Quien la ejecuta queda como 'owner' de ese gym. Crea de una vez las
-- estaciones a partir del catálogo global, todas sin sticker todavía,
-- para que el panel solo tenga que asignarles código e imprimirlos.
-- =====================================================================

create or replace function public.bootstrap_gym(
  p_name           text,
  p_branch         text,
  p_prefix         text,
  p_exercise_slugs text[] default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_gym  uuid;
  v_slug text;
  r      record;
  i      int := 0;
begin
  if v_user is null then
    raise exception 'sesión no válida' using errcode = '42501';
  end if;
  if p_prefix !~ '^[a-z]{2,5}$' then
    raise exception 'el prefijo debe ser de 2 a 5 letras minúsculas';
  end if;

  v_slug := lower(regexp_replace(
              p_name || '-' || coalesce(p_branch, ''),
              '[^a-zA-Z0-9]+', '-', 'g'))
            || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 5);
  v_slug := trim(both '-' from v_slug);

  insert into public.gyms (name, branch_name, slug, code_prefix)
  values (p_name, nullif(p_branch, ''), v_slug, p_prefix)
  returning id into v_gym;

  insert into public.memberships (gym_id, user_id, role, status)
  values (v_gym, v_user, 'owner', 'active');

  for r in
    select e.id
      from public.exercises e
     where e.gym_id is null
       and (p_exercise_slugs is null or e.slug = any (p_exercise_slugs))
     order by e.muscle_group nulls last, e.name
  loop
    i := i + 1;
    insert into public.stations (gym_id, exercise_id, label, status)
    values (v_gym, r.id, '#' || lpad(i::text, 2, '0'), 'no_sticker');
  end loop;

  return v_gym;
end;
$$;

revoke all on function public.bootstrap_gym(text, text, text, text[]) from public, anon;
grant execute on function public.bootstrap_gym(text, text, text, text[]) to authenticated;
