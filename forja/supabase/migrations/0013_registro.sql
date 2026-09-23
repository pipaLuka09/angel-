-- =====================================================================
-- FORJA · 0013 — Registro por cuenta propia, con aprobación del gimnasio
--
-- Hasta ahora las cuentas solo las creaba recepción desde el panel. Ahora
-- además cualquiera puede registrarse, pero queda en 'pending' hasta que
-- el gimnasio lo apruebe, y mientras tanto no ve ni registra nada.
-- =====================================================================

-- El prefijo del código NFC pasa a ser también el código con el que la
-- gente se registra ("el código del gimnasio es OLM"), así que no puede
-- repetirse entre gimnasios.
create unique index if not exists gyms_code_prefix_key on public.gyms (code_prefix);

-- ---------------------------------------------------------------------
-- A qué gimnasio se está registrando alguien. Acepta tres cosas, porque
-- la persona puede llegar de tres lados:
--   · el slug, desde el link de registro que comparte el gimnasio;
--   · el código corto (OLM), cuando se lo dicen en recepción;
--   · el código de un sticker, cuando tocó una máquina sin tener cuenta.
-- Callable sin sesión a propósito: la pantalla de registro es anterior a
-- tener cuenta. Solo devuelve el nombre del gimnasio, que no es secreto.
-- ---------------------------------------------------------------------
create or replace function public.gym_para_registro(p_ref text)
returns table (id uuid, name text, branch_name text)
language sql stable security definer set search_path = public
as $$
  select g.id, g.name, g.branch_name
    from public.gyms g
   where g.slug = p_ref
      or g.code_prefix = lower(trim(p_ref))
      or g.id = (select st.gym_id from public.stations st
                  where st.nfc_code = p_ref and st.status <> 'retired')
   limit 1;
$$;

revoke all on function public.gym_para_registro(text) from public;
grant execute on function public.gym_para_registro(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Pedir acceso a un gimnasio. Crea la membresía en 'pending' para quien
-- llama; si ya existe (pendiente, activa o pausada) no la toca.
-- plpgsql y no sql: así el literal 'pending' se resuelve al ejecutar, no
-- al crear la función.
-- ---------------------------------------------------------------------
create or replace function public.request_membership(p_gym_id uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_estado text;
begin
  if auth.uid() is null then
    raise exception 'sesión no válida' using errcode = '42501';
  end if;
  if not exists (select 1 from public.gyms where id = p_gym_id) then
    raise exception 'gimnasio no encontrado';
  end if;

  insert into public.memberships (gym_id, user_id, role, status)
  values (p_gym_id, auth.uid(), 'member', 'pending')
  on conflict (gym_id, user_id) do nothing;

  select status::text into v_estado
    from public.memberships
   where gym_id = p_gym_id and user_id = auth.uid();

  return v_estado;
end;
$$;

revoke all on function public.request_membership(uuid) from public, anon;
grant execute on function public.request_membership(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- El perfil lo crea el trigger de auth.users, que dispara el servidor de
-- autenticación con su propio rol. Postgres no exige EXECUTE sobre la
-- función de un trigger al dispararse, pero se concede explícitamente
-- para que no dependa de ese detalle: 0006 le quitó el permiso a
-- PUBLIC. El rol no existe fuera de Supabase, de ahí la comprobación.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    execute 'grant execute on function public.handle_new_user() to supabase_auth_admin';
  end if;
end $$;
