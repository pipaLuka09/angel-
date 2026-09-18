-- =====================================================================
-- FORJA · 0002 — Row Level Security
--
-- Regla de privacidad del sistema: los registros de entrenamiento son
-- del socio, NO del gimnasio. El gym ve conteos agregados (vía las
-- funciones de 0003), nunca las series de una persona identificable.
-- =====================================================================

-- Helpers. Son SECURITY DEFINER para que una política sobre memberships
-- no se consulte a sí misma y entre en recursión infinita.
create or replace function public.is_member_of(p_gym_id uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.memberships
     where gym_id = p_gym_id and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.is_staff_of(p_gym_id uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.memberships
     where gym_id = p_gym_id and user_id = auth.uid()
       and status = 'active' and role in ('staff', 'owner')
  );
$$;

alter table public.gyms        enable row level security;
alter table public.profiles    enable row level security;
alter table public.memberships enable row level security;
alter table public.exercises   enable row level security;
alter table public.stations    enable row level security;
alter table public.sets        enable row level security;
alter table public.goals       enable row level security;
alter table public.scans       enable row level security;

-- --------------------------- gyms ------------------------------------
create policy gyms_read_own on public.gyms
  for select using (public.is_member_of(id));

create policy gyms_staff_update on public.gyms
  for update using (public.is_staff_of(id)) with check (public.is_staff_of(id));

-- ------------------------- profiles ----------------------------------
create policy profiles_read_self on public.profiles
  for select using (id = auth.uid());

-- Recepción necesita ver el nombre de sus socios para darlos de alta.
create policy profiles_read_by_staff on public.profiles
  for select using (
    exists (
      select 1 from public.memberships m
       where m.user_id = profiles.id and public.is_staff_of(m.gym_id)
    )
  );

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ------------------------ memberships --------------------------------
create policy memberships_read_self on public.memberships
  for select using (user_id = auth.uid());

create policy memberships_read_by_staff on public.memberships
  for select using (public.is_staff_of(gym_id));

create policy memberships_staff_write on public.memberships
  for all using (public.is_staff_of(gym_id)) with check (public.is_staff_of(gym_id));

-- ------------------------- exercises ---------------------------------
create policy exercises_read on public.exercises
  for select using (gym_id is null or public.is_member_of(gym_id));

create policy exercises_staff_write on public.exercises
  for all using (gym_id is not null and public.is_staff_of(gym_id))
  with check (gym_id is not null and public.is_staff_of(gym_id));

-- ------------------------- stations ----------------------------------
-- La resolución "código del sticker -> estación" NO pasa por aquí: la
-- hace station_by_code() en 0003, que es SECURITY DEFINER, para poder
-- decirle a alguien que no es socio "este sticker es del Gym X, pide
-- tu cuenta en recepción" en vez de un 404 sin explicación.
create policy stations_read on public.stations
  for select using (public.is_member_of(gym_id));

create policy stations_staff_write on public.stations
  for all using (public.is_staff_of(gym_id)) with check (public.is_staff_of(gym_id));

-- --------------------------- sets ------------------------------------
-- Solo el dueño. Ni el gym ni recepción leen esto directamente.
create policy sets_read_own on public.sets
  for select using (user_id = auth.uid());

create policy sets_insert_own on public.sets
  for insert with check (user_id = auth.uid() and public.is_member_of(gym_id));

create policy sets_update_own on public.sets
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy sets_delete_own on public.sets
  for delete using (user_id = auth.uid());

-- --------------------------- goals -----------------------------------
create policy goals_own on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------- scans -----------------------------------
create policy scans_insert_self on public.scans
  for insert with check (user_id = auth.uid());

create policy scans_read_by_staff on public.scans
  for select using (
    exists (
      select 1 from public.stations s
       where s.id = scans.station_id and public.is_staff_of(s.gym_id)
    )
  );
