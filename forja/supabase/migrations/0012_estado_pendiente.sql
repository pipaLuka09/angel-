-- =====================================================================
-- FORJA · 0012 — Estado "pendiente" para las membresías
--
-- Va sola en su propia migración porque Postgres no deja usar un valor
-- nuevo de un enum en la misma transacción que lo agrega, y 0013 lo usa.
--
-- Una membresía pendiente no da acceso a nada: is_member_of() e
-- is_staff_of() exigen status = 'active', y todas las políticas pasan
-- por ellas. No hay que tocar ninguna.
-- =====================================================================

alter type public.member_status add value if not exists 'pending';
