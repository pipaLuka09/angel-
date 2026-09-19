-- =====================================================================
-- FORJA · 0007 — Lo que necesita el panel del gimnasio
--
-- Precisión sobre la regla de privacidad de 0002:
--
--   El gimnasio ve SI y CUÁNDO alguien entrenó. Nunca QUÉ levantó.
--
-- Recepción necesita saber quién no está usando el sistema para poder
-- hacer retención, y que un socio venga o no al gimnasio ya lo ven
-- entrar por la puerta. Cuánto carga en la prensa, no: los pesos, las
-- repeticiones, las sensaciones y las metas siguen siendo solo del
-- socio, y las políticas de `sets` y `goals` no cambian.
--
-- Por eso esta función devuelve fecha de última sesión y número de
-- sesiones, y ni una sola cifra de peso.
-- =====================================================================

create or replace function public.gym_members(p_gym_id uuid)
returns table (
  user_id        uuid,
  full_name      text,
  email          text,
  member_code    text,
  role           public.member_role,
  status         public.member_status,
  joined_at      date,
  last_session   date,
  session_count  int
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_staff_of(p_gym_id) then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  return query
    select m.user_id,
           p.full_name,
           u.email::text,
           m.member_code,
           m.role,
           m.status,
           m.joined_at,
           (select max(s.session_date)
              from public.sets s
             where s.user_id = m.user_id and s.gym_id = p_gym_id),
           (select count(distinct s.session_date)::int
              from public.sets s
             where s.user_id = m.user_id and s.gym_id = p_gym_id)
      from public.memberships m
      join public.profiles p on p.id = m.user_id
      left join auth.users u on u.id = m.user_id
     where m.gym_id = p_gym_id
     order by (m.role <> 'member'), p.full_name;
end;
$$;

revoke all on function public.gym_members(uuid) from public, anon;
grant execute on function public.gym_members(uuid) to authenticated;
