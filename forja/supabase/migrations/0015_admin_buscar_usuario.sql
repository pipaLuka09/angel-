-- =====================================================================
-- FORJA · 0015 — Buscar una cuenta por correo, para la administración
--
-- Al dar de alta un gimnasio, su dueño puede ya tener cuenta en FORJA
-- (porque es socio de otro gimnasio, o porque es quien opera la
-- plataforma). En ese caso se reutiliza en vez de fallar con "ya existe".
-- La API de Auth no busca por correo, así que se hace aquí, y solo para
-- administradores de plataforma: para cualquier otro sería un oráculo
-- para averiguar qué correos tienen cuenta.
-- =====================================================================

create or replace function public.admin_find_user(p_email text)
returns uuid
language plpgsql stable security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'no autorizado' using errcode = '42501';
  end if;
  select u.id into v_id from auth.users u where lower(u.email) = lower(trim(p_email)) limit 1;
  return v_id;
end;
$$;

revoke all on function public.admin_find_user(text) from public, anon;
grant execute on function public.admin_find_user(text) to authenticated;
