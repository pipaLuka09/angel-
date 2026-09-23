-- =====================================================================
-- FORJA · 0011 — Variantes de polea y videos de técnica del catálogo
--
-- 1. Tres ejercicios nuevos que salieron de entrenar en un gimnasio real
--    con máquina multifuncional: el curl de bíceps en polea por detrás y
--    a la altura del hombro, y el crunch de abdomen en polea.
--    El curl en polea que ya existía se renombra "por delante" para que
--    las tres variantes se lean juntas en la lista.
--
-- 2. Videos genéricos de técnica en el catálogo global. Son el valor por
--    defecto para todos los gimnasios; cada gimnasio puede poner el suyo
--    por máquina desde el panel (0008) y ese le gana a este.
--
--    Cada enlace se comprobó contra el oEmbed oficial de YouTube antes de
--    cargarlo: existe, es público y se puede reproducir. Las tres
--    variantes de bíceps comparten un mismo video que explica justo esas
--    tres posiciones (hombro en flexión, neutro y extensión).
-- =====================================================================

insert into public.exercises (gym_id, slug, name, muscle_group, cues, common_mistakes) values

(null, 'curl-biceps-polea-detras', 'Curl de bíceps en polea por detrás', 'Brazo',
 '["De espaldas a la polea baja y un paso adelante, para que el cable lleve el brazo hacia atrás.",
   "Codo detrás del torso y quieto: solo se mueve el antebrazo.",
   "Sube hasta el hombro y baja lento, sintiendo el estiramiento del bíceps."]',
 '["Dejar que el codo se adelante al subir, que lo convierte en un curl normal.",
   "Mover el torso para ayudarse con el peso."]'),

(null, 'curl-biceps-polea-alta', 'Curl de bíceps en polea a la altura del hombro', 'Brazo',
 '["Polea a la altura de los hombros y brazo extendido hacia ella.",
   "Codo fijo a la altura del hombro: solo se dobla el brazo.",
   "Lleva la mano hacia la cabeza y aprieta un instante antes de volver."]',
 '["Dejar caer el codo durante la serie.",
   "Usar tanto peso que el hombro termine haciendo el trabajo."]'),

(null, 'crunch-polea', 'Curl de abdomen en polea', 'Abdomen',
 '["De rodillas frente a la polea alta, con la cuerda a los lados de la cabeza.",
   "Encoge el tronco llevando los codos hacia los muslos: se dobla la columna, no la cadera.",
   "Sube controlado sin soltar la tensión del abdomen."]',
 '["Sentarse sobre los talones y jalar con la cadera.",
   "Mover la cuerda con los brazos en vez de con el abdomen."]')

on conflict do nothing;

update public.exercises
   set name = 'Curl de bíceps en polea por delante'
 where gym_id is null and slug = 'curl-biceps-polea';

update public.exercises e
   set video_url = v.url, video_source = 'youtube'
  from (values
    ('jalon-al-pecho',           'https://www.youtube.com/shorts/bPAqG0B8_HQ'),
    ('dominadas',                'https://www.youtube.com/shorts/rn_wjhrclGw'),
    ('curl-biceps-polea',        'https://www.youtube.com/watch?v=1jNtUk9_r94'),
    ('curl-biceps-polea-detras', 'https://www.youtube.com/watch?v=1jNtUk9_r94'),
    ('curl-biceps-polea-alta',   'https://www.youtube.com/watch?v=1jNtUk9_r94'),
    ('press-banca',              'https://www.youtube.com/shorts/Sb4y8gASMNk'),
    ('press-inclinado',          'https://www.youtube.com/watch?v=a64mtMHyPfY'),
    ('extension-triceps-polea',  'https://www.youtube.com/watch?v=dRkTreltpnc'),
    ('crunch-polea',             'https://www.youtube.com/shorts/eSub1_mDP1A')
  ) as v(slug, url)
 where e.gym_id is null and e.slug = v.slug;
