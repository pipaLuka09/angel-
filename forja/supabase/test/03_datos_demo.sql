-- =====================================================================
-- FORJA · Datos de demostración
--
-- Crea un gimnasio con historial para poder recorrer la app sin tener
-- que registrar todo a mano. Se ejecuta sobre un proyecto de Supabase
-- real (no sobre el stub de pruebas), desde el SQL Editor.
--
-- Contraseña de las tres cuentas: ForjaDemo2026
-- BÓRRALAS antes de usar esto con un gimnasio de verdad.
-- =====================================================================

do $$
declare
  v_gym    uuid;
  v_laura  uuid := gen_random_uuid();
  v_andres uuid := gen_random_uuid();
  v_maria  uuid := gen_random_uuid();
  v_prensa uuid;
  v_banca  uuid;
  v_ej_prensa uuid;
  v_ej_banca  uuid;
  r record;
  i int := 0;
begin
  -- ---------- usuarios ----------
  --
  -- OJO CON LAS COLUMNAS DE TOKENS.
  --
  -- El servidor de autenticación de Supabase está escrito en Go y lee
  -- confirmation_token, recovery_token, email_change_token_new,
  -- email_change_token_current, email_change, phone_change,
  -- phone_change_token y reauthentication_token como texto que NO
  -- admite nulos.
  --
  -- Si se insertan en NULL, el usuario queda aparentemente bien —la
  -- contraseña incluso verifica con crypt()— pero cualquier intento de
  -- iniciar sesión revienta con un 500 antes de comparar nada. El
  -- síntoma no apunta al problema por ningún lado.
  --
  -- Por eso van en cadena vacía, que es lo que pone Supabase cuando
  -- crea un usuario a través de su propia API.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current, email_change,
    phone_change, phone_change_token, reauthentication_token
  )
  select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
         u.email, extensions.crypt('ForjaDemo2026', extensions.gen_salt('bf')),
         now(), now(), now(),
         '{"provider":"email","providers":["email"]}'::jsonb,
         jsonb_build_object('full_name', u.nombre),
         '', '', '', '', '', '', '', ''
    from (values
      (v_laura,  'laura@forja.test',  'Laura Méndez'),
      (v_andres, 'andres@forja.test', 'Andrés Ríos'),
      (v_maria,  'maria@forja.test',  'María Cano')
    ) as u(id, email, nombre);

  insert into auth.identities (id, user_id, provider_id, identity_data, provider,
                               last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text,
         jsonb_build_object('sub', u.id::text, 'email', u.email,
                            'email_verified', true, 'phone_verified', false),
         'email', now(), now(), now()
    from auth.users u
   where u.id in (v_laura, v_andres, v_maria);

  -- ---------- gimnasio ----------
  insert into public.gyms (name, branch_name, slug, code_prefix, declared_member_count)
  values ('Gym Olimpo', 'Centro', 'gym-olimpo-centro-demo', 'olm', 260)
  returning id into v_gym;

  insert into public.memberships (gym_id, user_id, role, member_code, joined_at) values
    (v_gym, v_laura,  'owner',  'STAFF-01', current_date - 400),
    (v_gym, v_andres, 'member', 'SOC-1041', current_date - 120),
    (v_gym, v_maria,  'member', 'SOC-1088', current_date - 60);

  -- ---------- estaciones ----------
  for r in select e.id, e.muscle_group from public.exercises e
            where e.gym_id is null order by e.muscle_group nulls last, e.name
  loop
    i := i + 1;
    insert into public.stations (gym_id, exercise_id, label, zone, status)
    values (v_gym, r.id, '#' || lpad(i::text, 2, '0'), r.muscle_group, 'no_sticker');
  end loop;

  -- Código a casi todas: las que quedan sin él alimentan la alerta del
  -- panel, que es parte de lo que hay que poder enseñar.
  update public.stations s
     set nfc_code = public.generate_nfc_code('olm'), status = 'active'
   where s.gym_id = v_gym
     and s.label not in ('#19', '#21', '#22');

  select st.id, st.exercise_id into v_prensa, v_ej_prensa
    from public.stations st join public.exercises e on e.id = st.exercise_id
   where st.gym_id = v_gym and e.slug = 'prensa-piernas';

  select st.id, st.exercise_id into v_banca, v_ej_banca
    from public.stations st join public.exercises e on e.id = st.exercise_id
   where st.gym_id = v_gym and e.slug = 'press-banca';

  -- ---------- historial ----------
  insert into public.sets (user_id, gym_id, station_id, exercise_id, session_date,
                           performed_at, set_number, weight_kg, reps, feeling)
  select v_andres, v_gym, v_prensa, v_ej_prensa,
         current_date - d.dias, now() - (d.dias || ' days')::interval,
         s.n, d.kg, d.reps, d.feel
    from (values
      (32, 70.0, 10, 2), (25, 72.5, 10, 3), (18, 75.0, 10, 3),
      (12, 77.5, 10, 4), (7, 80.0, 10, 3), (3, 82.5, 10, 4)
    ) as d(dias, kg, reps, feel)
   cross join (values (1),(2),(3),(4)) as s(n);

  insert into public.sets (user_id, gym_id, station_id, exercise_id, session_date,
                           performed_at, set_number, weight_kg, reps, feeling)
  select v_andres, v_gym, v_banca, v_ej_banca,
         current_date - d.dias, now() - (d.dias || ' days')::interval,
         s.n, d.kg, 8, d.feel
    from (values (20, 50.0, 3), (13, 52.5, 4), (6, 55.0, 4)) as d(dias, kg, feel)
   cross join (values (1),(2),(3)) as s(n);

  insert into public.goals (user_id, exercise_id, target_weight_kg, target_date, start_weight_kg)
  values (v_andres, v_ej_prensa, 100, current_date + 74, 70);

  insert into public.sets (user_id, gym_id, station_id, exercise_id, session_date,
                           performed_at, set_number, weight_kg, reps, feeling)
  select v_maria, v_gym, v_prensa, v_ej_prensa,
         current_date - d.dias, now() - (d.dias || ' days')::interval,
         s.n, d.kg, 12, 3
    from (values (9, 45.0), (4, 47.5), (1, 50.0)) as d(dias, kg)
   cross join (values (1),(2),(3)) as s(n);

  -- ---------- lecturas ----------
  -- Todas menos la #17, que queda como el caso de "sticker despegado".
  insert into public.scans (station_id, user_id, scanned_at)
  select st.id, v_andres, now() - (random() * 5 || ' days')::interval
    from public.stations st
   where st.gym_id = v_gym and st.nfc_code is not null and st.label <> '#17';
end $$;

-- Los códigos que hay que grabar en los stickers.
select st.label, e.name as ejercicio, st.nfc_code
  from public.stations st
  left join public.exercises e on e.id = st.exercise_id
 where st.nfc_code is not null
 order by st.label;
