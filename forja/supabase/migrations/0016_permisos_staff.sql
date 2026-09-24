-- =====================================================================
-- FORJA · 0016 — Qué puede tocar recepción y qué solo el dueño
--
-- Con un solo gimnasio operado por quien construyó FORJA daba igual;
-- con gimnasios de terceros, no:
--
-- 1. La política de memberships dejaba a cualquier staff escribir
--    cualquier membresía de su gimnasio, con cualquier rol. Una cuenta de
--    recepción podía ascenderse a dueña. Ahora:
--      · recepción solo crea y modifica socios (role = member);
--      · el dueño además gestiona recepción (role = staff);
--      · nadie crea dueños desde la app: eso lo hace la plataforma.
--
-- 2. La política de gyms dejaba al staff actualizar cualquier columna,
--    incluido el código del gimnasio, que va impreso en cada sticker, y
--    el estado de suspensión. Ahora solo puede tocar los datos de
--    presentación, por permiso de columna.
-- =====================================================================

create or replace function public.is_owner_of(p_gym_id uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1
      from public.memberships m
      join public.gyms g on g.id = m.gym_id
     where m.gym_id = p_gym_id and m.user_id = auth.uid()
       and m.status = 'active' and m.role = 'owner'
       and g.status = 'active'
  );
$$;

revoke all on function public.is_owner_of(uuid) from public, anon;
grant execute on function public.is_owner_of(uuid) to authenticated;

drop policy if exists memberships_staff_write on public.memberships;
drop policy if exists memberships_member_write on public.memberships;
drop policy if exists memberships_owner_write on public.memberships;

-- USING aplica a la fila como está; WITH CHECK a como queda. Con las dos
-- se impide tanto tocar una fila de staff como convertir una en staff.
create policy memberships_member_write on public.memberships
  for all
  using      (public.is_staff_of(gym_id) and role = 'member')
  with check (public.is_staff_of(gym_id) and role = 'member');

create policy memberships_owner_write on public.memberships
  for all
  using      (public.is_owner_of(gym_id) and role in ('member', 'staff'))
  with check (public.is_owner_of(gym_id) and role in ('member', 'staff'));

-- Columnas que el staff puede editar del gimnasio.
revoke update on public.gyms from authenticated;
grant update (name, branch_name, whatsapp, logo_url, declared_member_count) on public.gyms to authenticated;
