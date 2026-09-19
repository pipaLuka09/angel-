-- =====================================================================
-- FORJA · 0006 — Cerrar las funciones de trigger
--
-- El linter de seguridad de Supabase detectó que handle_new_user,
-- close_reached_goal y touch_station_scan quedaban expuestas como
-- /rest/v1/rpc/<nombre> y, siendo SECURITY DEFINER, llamables incluso
-- sin sesión.
--
-- En la práctica no son explotables (dependen de NEW, así que fallan
-- fuera de un trigger), pero no tienen ninguna razón para ser llamables:
-- solo las invoca Postgres desde sus propios triggers, que corren con
-- los privilegios del dueño y no pasan por estos permisos.
--
-- Con esto no queda ninguna función alcanzable por el rol `anon`.
-- =====================================================================

revoke all on function public.handle_new_user()     from public, anon, authenticated;
revoke all on function public.close_reached_goal()  from public, anon, authenticated;
revoke all on function public.touch_station_scan()  from public, anon, authenticated;
