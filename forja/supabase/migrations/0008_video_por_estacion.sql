-- =====================================================================
-- FORJA · 0008 — Video por estación
--
-- El catálogo de ejercicios (gym_id null) es compartido por todos los
-- gimnasios, así que un gym NO puede editarlo: cambiaría el contenido
-- de los demás. Las políticas de 0002 ya lo impiden a propósito.
--
-- Pero cada gimnasio sí quiere poner su propio video: el suyo grabado,
-- o el de TikTok que su entrenador eligió. Como las estaciones sí son
-- suyas, el video cuelga de la estación y le gana al del catálogo.
--
-- De paso resuelve un caso real: dos máquinas del mismo ejercicio pero
-- de marcas distintas, donde la técnica cambia lo suficiente como para
-- querer videos distintos.
-- =====================================================================

alter table public.stations
  add column if not exists video_url    text,
  add column if not exists video_source text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.stations'::regclass and conname = 'stations_video_source_check'
  ) then
    alter table public.stations
      add constraint stations_video_source_check
      check (video_source in ('tiktok', 'instagram', 'youtube', 'own'));
  end if;
end $$;

-- station_by_code ahora prefiere el video de la estación.
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
  select st.id, g.id, g.name, g.branch_name, st.label, st.zone,
         coalesce(st.name_override, e.name, st.label),
         st.status, e.id, e.name, e.muscle_group,
         coalesce(st.video_url, e.video_url),
         case when st.video_url is not null then st.video_source else e.video_source end,
         coalesce(e.cues, '[]'::jsonb), coalesce(e.common_mistakes, '[]'::jsonb),
         public.is_member_of(g.id)
    from public.stations st
    join public.gyms g on g.id = st.gym_id
    left join public.exercises e on e.id = st.exercise_id
   where st.nfc_code = p_code and st.status <> 'retired';
$$;

-- gym_stations devuelve el video para poder listarlo en el panel.
-- Hay que soltarla antes: cambiar las columnas de un RETURNS TABLE
-- cambia el tipo de retorno, y CREATE OR REPLACE no lo permite.
drop function if exists public.gym_stations(uuid);

create function public.gym_stations(p_gym_id uuid)
returns table (
  id           uuid,
  label        text,
  name         text,
  zone         text,
  nfc_code     text,
  status       public.station_status,
  last_scan_at timestamptz,
  sets_7d      int,
  video_url    text,
  video_source text
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_staff_of(p_gym_id) then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  return query
    select st.id, st.label,
           coalesce(st.name_override, e.name, st.label),
           st.zone, st.nfc_code, st.status, st.last_scan_at,
           (select count(*)::int from public.sets s
             where s.station_id = st.id
               and s.performed_at >= now() - interval '7 days'),
           coalesce(st.video_url, e.video_url),
           case when st.video_url is not null then st.video_source else e.video_source end
      from public.stations st
      left join public.exercises e on e.id = st.exercise_id
     where st.gym_id = p_gym_id and st.status <> 'retired'
     order by st.label;
end;
$$;

revoke all on function public.gym_stations(uuid) from public, anon;
grant execute on function public.gym_stations(uuid) to authenticated;
