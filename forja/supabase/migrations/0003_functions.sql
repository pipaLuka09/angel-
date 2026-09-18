-- =====================================================================
-- FORJA · 0003 — Funciones que consume la app
-- =====================================================================

-- ---------------------------------------------------------------------
-- El tap del sticker. SECURITY DEFINER a propósito: si quien toca el
-- sticker todavía no es socio, igual queremos poder decirle de qué gym
-- es y mandarlo a recepción, en vez de devolver un 404 mudo.
-- is_member decide qué ve después la pantalla.
-- ---------------------------------------------------------------------
create or replace function public.station_by_code(p_code text)
returns table (
  station_id      uuid,
  gym_id          uuid,
  gym_name        text,
  gym_branch      text,
  label           text,
  zone            text,
  station_name    text,
  status          public.station_status,
  exercise_id     uuid,
  exercise_name   text,
  muscle_group    text,
  video_url       text,
  video_source    text,
  cues            jsonb,
  common_mistakes jsonb,
  is_member       boolean
)
language sql security definer stable set search_path = public
as $$
  select st.id,
         g.id,
         g.name,
         g.branch_name,
         st.label,
         st.zone,
         coalesce(st.name_override, e.name, st.label),
         st.status,
         e.id,
         e.name,
         e.muscle_group,
         e.video_url,
         e.video_source,
         coalesce(e.cues, '[]'::jsonb),
         coalesce(e.common_mistakes, '[]'::jsonb),
         public.is_member_of(g.id)
    from public.stations st
    join public.gyms g       on g.id = st.gym_id
    left join public.exercises e on e.id = st.exercise_id
   where st.nfc_code = p_code
     and st.status <> 'retired';
$$;

-- ---------------------------------------------------------------------
-- Todo lo que necesita la pantalla de la máquina, en una sola llamada:
-- última sesión, la anterior (para el delta), récord, historial y meta.
-- SECURITY INVOKER: se apoya en las políticas de `sets` y `goals`, así
-- que solo puede devolver datos de quien llama.
-- ---------------------------------------------------------------------
create or replace function public.exercise_summary(p_exercise_id uuid, p_sessions int default 8)
returns jsonb
language sql stable set search_path = public
as $$
  with mine as (
    select * from public.sets
     where user_id = auth.uid() and exercise_id = p_exercise_id
  ),
  per_session as (
    select session_date,
           max(weight_kg)            as top_weight,
           count(*)::int             as set_count,
           max(reps)::int            as top_reps,
           round(avg(feeling))::int  as feeling
      from mine
     group by session_date
  ),
  ordered as (
    select *, row_number() over (order by session_date desc) as rn
      from per_session
  )
  select jsonb_build_object(
    'last',          (select to_jsonb(o) - 'rn' from ordered o where o.rn = 1),
    'previous',      (select to_jsonb(o) - 'rn' from ordered o where o.rn = 2),
    'record',        (select max(weight_kg)     from mine),
    'first_date',    (select min(session_date)  from mine),
    'session_count', (select count(*)::int      from per_session),
    'sessions',      coalesce(
                       (select jsonb_agg(to_jsonb(o) - 'rn' order by o.session_date)
                          from ordered o where o.rn <= greatest(p_sessions, 1)),
                       '[]'::jsonb),
    'goal',          (select to_jsonb(g) from public.goals g
                       where g.user_id = auth.uid()
                         and g.exercise_id = p_exercise_id
                         and g.status = 'active'
                       limit 1)
  );
$$;

-- ---------------------------------------------------------------------
-- Fijar meta. Guarda el peso actual como punto de partida (sin eso la
-- barra de progreso no puede decir "llevas 82% del camino") y cancela
-- la meta anterior del mismo ejercicio.
-- ---------------------------------------------------------------------
create or replace function public.set_goal(
  p_exercise_id uuid,
  p_target_kg   numeric,
  p_target_date date
)
returns public.goals
language plpgsql set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_start numeric;
  v_goal  public.goals;
begin
  if v_user is null then
    raise exception 'sesión no válida' using errcode = '42501';
  end if;
  if p_target_date <= current_date then
    raise exception 'la fecha de la meta tiene que ser futura';
  end if;
  if p_target_kg is null or p_target_kg <= 0 then
    raise exception 'el peso de la meta tiene que ser mayor que cero';
  end if;

  select max(weight_kg) into v_start
    from public.sets
   where user_id = v_user and exercise_id = p_exercise_id;

  update public.goals
     set status = 'cancelled'
   where user_id = v_user and exercise_id = p_exercise_id and status = 'active';

  insert into public.goals (user_id, exercise_id, target_weight_kg, target_date, start_weight_kg)
  values (v_user, p_exercise_id, p_target_kg, p_target_date, v_start)
  returning * into v_goal;

  return v_goal;
end;
$$;

-- ---------------------------------------------------------------------
-- Panel del gym. SECURITY DEFINER y solo conteos: el staff nunca lee
-- las series de una persona identificable.
-- ---------------------------------------------------------------------
create or replace function public.gym_dashboard(p_gym_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v jsonb;
begin
  if not public.is_staff_of(p_gym_id) then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'members_active', (
      select count(*) from public.memberships
       where gym_id = p_gym_id and status = 'active' and role = 'member'),
    'members_declared', (
      select declared_member_count from public.gyms where id = p_gym_id),
    'stations_total', (
      select count(*) from public.stations
       where gym_id = p_gym_id and status <> 'retired'),
    'stations_with_code', (
      select count(*) from public.stations
       where gym_id = p_gym_id and status = 'active' and nfc_code is not null),
    'sets_7d', (
      select count(*) from public.sets
       where gym_id = p_gym_id and performed_at >= now() - interval '7 days'),
    'sets_prev_7d', (
      select count(*) from public.sets
       where gym_id = p_gym_id
         and performed_at >= now() - interval '14 days'
         and performed_at <  now() - interval '7 days'),
    'active_users_7d', (
      select count(distinct user_id) from public.sets
       where gym_id = p_gym_id and performed_at >= now() - interval '7 days'),
    'top_stations', coalesce((
      select jsonb_agg(t)
        from (
          select st.label,
                 coalesce(st.name_override, e.name, st.label) as name,
                 count(s.id)::int as sets
            from public.stations st
            left join public.exercises e on e.id = st.exercise_id
            left join public.sets s
              on s.station_id = st.id
             and s.performed_at >= now() - interval '7 days'
           where st.gym_id = p_gym_id and st.status = 'active'
           group by st.id, st.label, st.name_override, e.name
           order by count(s.id) desc, st.label
           limit 5
        ) t), '[]'::jsonb),
    'alerts', jsonb_build_object(
      'stations_without_code', (
        select count(*) from public.stations
         where gym_id = p_gym_id and status <> 'retired' and nfc_code is null),
      -- Sticker con código pero sin lecturas en 7 días: casi siempre
      -- significa despegado, tapado o dañado.
      'stations_quiet', (
        select count(*) from public.stations
         where gym_id = p_gym_id and status = 'active' and nfc_code is not null
           and (last_scan_at is null or last_scan_at < now() - interval '7 days'))
    )
  ) into v;

  return v;
end;
$$;

-- Lista de estaciones del panel, con su uso de los últimos 7 días.
create or replace function public.gym_stations(p_gym_id uuid)
returns table (
  id           uuid,
  label        text,
  name         text,
  zone         text,
  nfc_code     text,
  status       public.station_status,
  last_scan_at timestamptz,
  sets_7d      int
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_staff_of(p_gym_id) then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  return query
    select st.id,
           st.label,
           coalesce(st.name_override, e.name, st.label),
           st.zone,
           st.nfc_code,
           st.status,
           st.last_scan_at,
           (select count(*)::int from public.sets s
             where s.station_id = st.id
               and s.performed_at >= now() - interval '7 days')
      from public.stations st
      left join public.exercises e on e.id = st.exercise_id
     where st.gym_id = p_gym_id and st.status <> 'retired'
     order by st.label;
end;
$$;

-- Generar (o regenerar) el código de un sticker desde el panel.
create or replace function public.assign_nfc_code(p_station_id uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_gym    uuid;
  v_prefix text;
  v_code   text;
begin
  select gym_id into v_gym from public.stations where id = p_station_id;
  if v_gym is null then
    raise exception 'estación no encontrada';
  end if;
  if not public.is_staff_of(v_gym) then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  select code_prefix into v_prefix from public.gyms where id = v_gym;
  v_code := public.generate_nfc_code(v_prefix);

  update public.stations
     set nfc_code = v_code, status = 'active'
   where id = p_station_id;

  return v_code;
end;
$$;

-- ---------------------------------------------------------------------
-- Permisos: nada de esto se expone a visitantes sin sesión.
-- ---------------------------------------------------------------------
revoke all on function public.station_by_code(text)                    from public, anon;
revoke all on function public.exercise_summary(uuid, int)              from public, anon;
revoke all on function public.set_goal(uuid, numeric, date)            from public, anon;
revoke all on function public.gym_dashboard(uuid)                      from public, anon;
revoke all on function public.gym_stations(uuid)                       from public, anon;
revoke all on function public.assign_nfc_code(uuid)                    from public, anon;
revoke all on function public.generate_nfc_code(text)                  from public, anon;
revoke all on function public.is_member_of(uuid)                       from public, anon;
revoke all on function public.is_staff_of(uuid)                        from public, anon;

grant execute on function public.station_by_code(text)                 to authenticated;
grant execute on function public.exercise_summary(uuid, int)           to authenticated;
grant execute on function public.set_goal(uuid, numeric, date)         to authenticated;
grant execute on function public.gym_dashboard(uuid)                   to authenticated;
grant execute on function public.gym_stations(uuid)                    to authenticated;
grant execute on function public.assign_nfc_code(uuid)                 to authenticated;
grant execute on function public.is_member_of(uuid)                    to authenticated;
grant execute on function public.is_staff_of(uuid)                     to authenticated;
