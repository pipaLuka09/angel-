-- Piezas que Supabase ya trae en su plataforma y que aquí hay que
-- imitar para poder correr las migraciones contra un Postgres pelón.
-- Este archivo NO se aplica en Supabase; es solo para las pruebas.

-- Los roles viven a nivel de cluster, no de base de datos.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

create schema if not exists auth;

create table auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text unique,
  raw_user_meta_data  jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- En Supabase esto sale del JWT. Aquí lo movemos con una variable de
-- sesión para poder probar las políticas como distintos usuarios.
create or replace function auth.uid()
returns uuid
language sql stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

-- Supabase concede esto de fábrica; sin ello auth.uid() no se puede
-- llamar desde una función SECURITY INVOKER ejecutada por el socio.
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant select on auth.users to service_role;
