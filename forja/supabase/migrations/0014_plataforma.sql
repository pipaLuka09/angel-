-- =====================================================================
-- FORJA · 0014 — La plataforma: varios gimnasios, un operador
--
-- Hasta aquí FORJA ya separaba los datos por gimnasio, pero no había
-- quién los administrara desde arriba: crear un gimnasio era correr SQL,
-- y cualquier usuario con sesión podía llamar a bootstrap_gym y quedar
-- como dueño de uno nuevo.
--
-- 1. Administradores de plataforma: quien opera FORJA y le vende a los
--    gimnasios. Son los únicos que pueden crear o suspender gimnasios.
-- 2. Suspensión: un gimnasio suspendido (por ejemplo, por falta de pago)
--    deja sin acceso a su staff y a sus socios, sin borrar nada. Al
--    reactivarlo todo vuelve como estaba.
-- =====================================================================

create table if not exists public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Sin políticas a propósito: nadie la lee directo, solo las funciones.
alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

-- ---------------------------------------------------------------------
-- Estado del gimnasio.
-- ---------------------------------------------------------------------
alter table public.gyms
  add column if not exists status       text not null default 'active',
  add column if not exists suspended_at timestamptz,
  add column if not exists notes        text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'gyms_status_check') then
    alter table public.gyms add constraint gyms_status_check check (status in ('active', 'suspended'));
  end if;
end $$;

-- is_member_of e is_staff_of ahora exigen además que el gimnasio esté
-- activo. Como TODAS las políticas de datos pasan por ellas, suspender
-- un gimnasio corta su acceso de un solo golpe, sin tocar ninguna
-- política.
create or replace function public.is_member_of(p_gym_id uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1
      from public.memberships m
      join public.gyms g on g.id = m.gym_id
     where m.gym_id = p_gym_id and m.user_id = auth.uid()
       and m.status = 'active' and g.status = 'active'
  );
$$;

create or replace function public.is_staff_of(p_gym_id uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1
      from public.memberships m
      join public.gyms g on g.id = m.gym_id
     where m.gym_id = p_gym_id and m.user_id = auth.uid()
       and m.status = 'active' and m.role in ('staff', 'owner')
       and g.status = 'active'
  );
$$;

-- Leer la fila del gimnasio (nombre, sucursal, estado) no puede depender
-- de que esté activo: justo cuando está suspendido o la cuenta está en
-- espera es cuando la app tiene que poder decir "tu gimnasio X...".
-- Basta con tener cualquier membresía ahí. No hay nada sensible en esa fila.
create or replace function public.belongs_to_gym(p_gym_id uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.memberships
     where gym_id = p_gym_id and user_id = auth.uid()
  );
$$;

revoke all on function public.belongs_to_gym(uuid) from public, anon;
grant execute on function public.belongs_to_gym(uuid) to authenticated;

drop policy if exists gyms_read_own on public.gyms;
create policy gyms_read_own on public.gyms
  for select using (public.belongs_to_gym(id));

-- ---------------------------------------------------------------------
-- Cerrar bootstrap_gym: ya no la puede usar cualquiera.
-- ---------------------------------------------------------------------
create or replace function public.bootstrap_gym(
  p_name           text,
  p_branch         text,
  p_prefix         text,
  p_exercise_slugs text[] default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'solo la administración de FORJA puede crear gimnasios' using errcode = '42501';
  end if;
  return public.admin_create_gym(p_name, p_branch, p_prefix, auth.uid(), true);
end;
$$;

-- ---------------------------------------------------------------------
-- Crear un gimnasio con su dueño. La cuenta del dueño la crea la app
-- antes (hace falta la API de Auth); aquí se liga como owner.
-- ---------------------------------------------------------------------
create or replace function public.admin_create_gym(
  p_name         text,
  p_branch       text,
  p_prefix       text,
  p_owner        uuid,
  p_with_catalog boolean default true
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_gym  uuid;
  v_slug text;
  r      record;
  i      int := 0;
begin
  if not public.is_platform_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'falta el nombre del gimnasio';
  end if;
  if p_prefix !~ '^[a-z]{2,5}$' then
    raise exception 'el código debe ser de 2 a 5 letras, sin números ni acentos';
  end if;
  if exists (select 1 from public.gyms where code_prefix = p_prefix) then
    raise exception 'el código % ya lo usa otro gimnasio', upper(p_prefix);
  end if;

  v_slug := trim(both '-' from lower(regexp_replace(
              p_name || '-' || coalesce(p_branch, ''), '[^a-zA-Z0-9]+', '-', 'g')))
            || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 5);

  insert into public.gyms (name, branch_name, slug, code_prefix)
  values (trim(p_name), nullif(trim(p_branch), ''), v_slug, p_prefix)
  returning id into v_gym;

  if p_owner is not null then
    insert into public.memberships (gym_id, user_id, role, status)
    values (v_gym, p_owner, 'owner', 'active')
    on conflict (gym_id, user_id) do update set role = 'owner', status = 'active';
  end if;

  if p_with_catalog then
    for r in
      select e.id, e.muscle_group from public.exercises e
       where e.gym_id is null
       order by e.muscle_group nulls last, e.name
    loop
      i := i + 1;
      insert into public.stations (gym_id, exercise_id, label, zone, status)
      values (v_gym, r.id, '#' || lpad(i::text, 2, '0'), r.muscle_group, 'no_sticker');
    end loop;
  end if;

  return v_gym;
end;
$$;

-- ---------------------------------------------------------------------
-- Suspender / reactivar.
-- ---------------------------------------------------------------------
create or replace function public.admin_set_gym_status(p_gym_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'estado inválido';
  end if;
  update public.gyms
     set status = p_status,
         suspended_at = case when p_status = 'suspended' then now() else null end
   where id = p_gym_id;
end;
$$;

-- ---------------------------------------------------------------------
-- La vista de la plataforma: todos los gimnasios con sus números.
-- Solo conteos, como el panel de cada gym: tampoco la plataforma ve lo
-- que levanta nadie.
-- ---------------------------------------------------------------------
create or replace function public.admin_gyms()
returns table (
  id              uuid,
  name            text,
  branch_name     text,
  slug            text,
  code_prefix     text,
  status          text,
  created_at      timestamptz,
  owner_email     text,
  members_active  int,
  members_pending int,
  stations        int,
  sets_7d         int,
  last_activity   timestamptz
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  return query
    select g.id, g.name, g.branch_name, g.slug, g.code_prefix, g.status, g.created_at,
           (select u.email::text from public.memberships m join auth.users u on u.id = m.user_id
             where m.gym_id = g.id and m.role = 'owner' order by m.created_at limit 1),
           (select count(*)::int from public.memberships m
             where m.gym_id = g.id and m.role = 'member' and m.status = 'active'),
           (select count(*)::int from public.memberships m
             where m.gym_id = g.id and m.status = 'pending'),
           (select count(*)::int from public.stations s
             where s.gym_id = g.id and s.status <> 'retired'),
           (select count(*)::int from public.sets s
             where s.gym_id = g.id and s.performed_at >= now() - interval '7 days'),
           (select max(s.performed_at) from public.sets s where s.gym_id = g.id)
      from public.gyms g
     order by g.created_at desc;
end;
$$;

revoke all on function public.admin_create_gym(text, text, text, uuid, boolean) from public, anon;
revoke all on function public.admin_set_gym_status(uuid, text)                  from public, anon;
revoke all on function public.admin_gyms()                                      from public, anon;
grant execute on function public.admin_create_gym(text, text, text, uuid, boolean) to authenticated;
grant execute on function public.admin_set_gym_status(uuid, text)                  to authenticated;
grant execute on function public.admin_gyms()                                      to authenticated;
