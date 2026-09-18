-- =====================================================================
-- FORJA · 0001 — Esquema base
-- Sistema de registro de entrenamiento por stickers NFC en gimnasios.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Gimnasios. Una fila = una sucursal (el cliente que paga).
-- ---------------------------------------------------------------------
create table public.gyms (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  branch_name            text,
  slug                   text not null unique,
  -- Prefijo corto que se antepone al código NFC ("olm" -> "olm-a7k2p9").
  -- Sirve para reconocer de un vistazo a qué gym pertenece un sticker.
  code_prefix            text not null check (code_prefix ~ '^[a-z]{2,5}$'),
  whatsapp               text,
  logo_url               text,
  -- Cuántos socios paga el gym en total. Lo captura recepción; es el
  -- denominador de "X de Y socios tienen cuenta" en el panel.
  declared_member_count  integer check (declared_member_count >= 0),
  created_at             timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Perfiles. Extiende auth.users (Supabase Auth guarda ahí la contraseña).
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text,
  -- El sistema guarda siempre en kg; esto solo cambia cómo se muestra.
  unit        text not null default 'kg' check (unit in ('kg', 'lb')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Membresías: qué persona pertenece a qué gym y con qué permisos.
-- ---------------------------------------------------------------------
create type public.member_role   as enum ('member', 'staff', 'owner');
create type public.member_status as enum ('active', 'paused', 'cancelled');

create table public.memberships (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references public.gyms(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         public.member_role   not null default 'member',
  status       public.member_status not null default 'active',
  -- Número de socio que ya maneje el gym en su sistema de cobro.
  member_code  text,
  joined_at    date not null default current_date,
  created_at   timestamptz not null default now(),
  unique (gym_id, user_id)
);

create index memberships_user_active_idx on public.memberships (user_id) where status = 'active';
create index memberships_gym_idx         on public.memberships (gym_id, status);

-- ---------------------------------------------------------------------
-- Ejercicios. gym_id NULL = catálogo global que comparten todos los gyms.
-- Un gym puede además crear los suyos.
-- ---------------------------------------------------------------------
create table public.exercises (
  id               uuid primary key default gen_random_uuid(),
  gym_id           uuid references public.gyms(id) on delete cascade,
  slug             text not null,
  name             text not null,
  muscle_group     text,
  -- Enlace al video de técnica. Hoy apunta a TikTok/Reels; el día que
  -- grabemos biblioteca propia solo cambia video_source a 'own'.
  video_url        text,
  video_source     text check (video_source in ('tiktok', 'instagram', 'youtube', 'own')),
  -- ["Espalda baja pegada al respaldo", ...]
  cues             jsonb not null default '[]'::jsonb,
  common_mistakes  jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now()
);

create unique index exercises_global_slug_key on public.exercises (slug)         where gym_id is null;
create unique index exercises_gym_slug_key    on public.exercises (gym_id, slug) where gym_id is not null;

-- ---------------------------------------------------------------------
-- Estaciones: la máquina física que lleva pegado el sticker.
-- El sticker guarda la URL /m/<nfc_code>.
-- ---------------------------------------------------------------------
create type public.station_status as enum ('active', 'no_sticker', 'retired');

create table public.stations (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms(id) on delete cascade,
  exercise_id   uuid references public.exercises(id) on delete set null,
  -- Lo que está rotulado en el gym: "#02".
  label         text not null,
  -- Si esta máquina se llama distinto al ejercicio del catálogo.
  name_override text,
  zone          text,
  nfc_code      text unique,
  status        public.station_status not null default 'no_sticker',
  -- Lo actualiza un trigger en cada lectura. Es la señal de "sticker vivo".
  last_scan_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (gym_id, label)
);

create index stations_gym_idx on public.stations (gym_id, status);

-- ---------------------------------------------------------------------
-- Series registradas. El corazón del sistema.
-- gym_id y exercise_id van desnormalizados a propósito: un registro
-- histórico no debe cambiar de dueño si mañana reasignan la máquina.
-- ---------------------------------------------------------------------
create table public.sets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id)  on delete cascade,
  gym_id        uuid not null references public.gyms(id)      on delete cascade,
  station_id    uuid references public.stations(id)           on delete set null,
  exercise_id   uuid not null references public.exercises(id) on delete cascade,
  session_date  date     not null default current_date,
  set_number    smallint not null default 1 check (set_number between 1 and 20),
  weight_kg     numeric(6,2) not null check (weight_kg >= 0 and weight_kg <= 1000),
  reps          smallint not null check (reps between 1 and 200),
  -- Las 5 caritas: 1 muy fácil … 5 al límite.
  feeling       smallint check (feeling between 1 and 5),
  note          text check (char_length(note) <= 500),
  performed_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index sets_user_exercise_idx on public.sets (user_id, exercise_id, performed_at desc);
create index sets_user_date_idx     on public.sets (user_id, session_date desc);
create index sets_station_idx       on public.sets (station_id, performed_at desc);
create index sets_gym_idx           on public.sets (gym_id, performed_at desc);

-- ---------------------------------------------------------------------
-- Metas: una activa por ejercicio y por persona.
-- ---------------------------------------------------------------------
create type public.goal_status as enum ('active', 'achieved', 'expired', 'cancelled');

create table public.goals (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id)  on delete cascade,
  exercise_id       uuid not null references public.exercises(id) on delete cascade,
  target_weight_kg  numeric(6,2) not null check (target_weight_kg > 0),
  target_date       date not null,
  -- Peso al momento de fijar la meta: sin esto la barra de progreso
  -- no puede decir "llevas 82% del camino", solo "te faltan 17.5 kg".
  start_weight_kg   numeric(6,2),
  status            public.goal_status not null default 'active',
  achieved_at       timestamptz,
  created_at        timestamptz not null default now()
);

create unique index goals_one_active_per_exercise
  on public.goals (user_id, exercise_id) where status = 'active';

-- ---------------------------------------------------------------------
-- Lecturas del sticker. Se registra el tap aunque la persona no anote
-- nada: es la única forma de distinguir "sticker despegado" de
-- "máquina que nadie usa".
-- ---------------------------------------------------------------------
create table public.scans (
  id          bigint generated always as identity primary key,
  station_id  uuid not null references public.stations(id)  on delete cascade,
  user_id     uuid references public.profiles(id)           on delete set null,
  scanned_at  timestamptz not null default now()
);

create index scans_station_idx on public.scans (station_id, scanned_at desc);

-- =====================================================================
-- Triggers
-- =====================================================================

-- Crear el perfil automáticamente al crear el usuario en Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Marcar la meta como lograda en cuanto una serie la alcanza.
create or replace function public.close_reached_goal()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.goals
     set status = 'achieved', achieved_at = now()
   where user_id     = new.user_id
     and exercise_id = new.exercise_id
     and status      = 'active'
     and new.weight_kg >= target_weight_kg;
  return new;
end;
$$;

create trigger sets_close_reached_goal
  after insert on public.sets
  for each row execute function public.close_reached_goal();

-- Mantener stations.last_scan_at al día.
create or replace function public.touch_station_scan()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.stations
     set last_scan_at = new.scanned_at
   where id = new.station_id;
  return new;
end;
$$;

create trigger scans_touch_station
  after insert on public.scans
  for each row execute function public.touch_station_scan();

-- Generador de códigos NFC. Alfabeto sin l/i/o/0/1 para que nadie
-- confunda un carácter al dictarlo por teléfono.
create or replace function public.generate_nfc_code(p_prefix text default '')
returns text
language plpgsql set search_path = public
as $$
declare
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  code text;
  i    int;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    if coalesce(p_prefix, '') <> '' then
      code := p_prefix || '-' || code;
    end if;
    exit when not exists (select 1 from public.stations where nfc_code = code);
  end loop;
  return code;
end;
$$;
