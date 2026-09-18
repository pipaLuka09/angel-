-- =====================================================================
-- FORJA · 0004 — Catálogo global de ejercicios
--
-- video_url va en NULL a propósito: no se inventan enlaces. Se llenan
-- desde el panel con los videos que tú cures (hoy TikTok/Reels, después
-- la biblioteca propia).
-- =====================================================================

insert into public.exercises (gym_id, slug, name, muscle_group, cues, common_mistakes) values

(null, 'press-banca', 'Press de banca', 'Pecho',
 '["Omóplatos juntos y hundidos contra la banca antes de bajar la barra.",
   "Baja la barra a la altura de los pezones, no al cuello.",
   "Pies firmes en el piso: el empuje empieza abajo."]',
 '["Rebotar la barra en el pecho para subirla.",
   "Despegar la cadera de la banca al empujar."]'),

(null, 'press-inclinado', 'Press inclinado con mancuernas', 'Pecho',
 '["Banca entre 30 y 45 grados: más inclinación trabaja hombro, no pecho.",
   "Codos a unos 45 grados del torso, no abiertos del todo.",
   "Baja hasta sentir estiramiento, sin que el hombro ruede adelante."]',
 '["Chocar las mancuernas arriba y perder la tensión.",
   "Inclinar tanto la banca que el trabajo se va al hombro."]'),

(null, 'aperturas-pec-deck', 'Aperturas en pec deck', 'Pecho',
 '["Ajusta el asiento para que los brazos queden a la altura del pecho.",
   "Codos ligeramente flexionados y fijos todo el recorrido.",
   "Junta pensando en acercar los codos, no las manos."]',
 '["Bajar el peso de golpe al volver.",
   "Convertirlo en un press doblando y estirando el codo."]'),

(null, 'jalon-al-pecho', 'Jalón al pecho', 'Espalda',
 '["Muslos bien trabados bajo el rodillo antes de empezar.",
   "Jala llevando los codos hacia las costillas, no las manos hacia abajo.",
   "Baja la barra al pecho alto y controla la subida."]',
 '["Pasar la barra por detrás de la nuca.",
   "Echar todo el torso hacia atrás para ayudarse con el peso."]'),

(null, 'remo-sentado', 'Remo sentado en polea', 'Espalda',
 '["Pecho arriba y espalda neutra: el torso casi no se mueve.",
   "Jala hasta el abdomen y junta los omóplatos al final.",
   "Suelta estirando los brazos sin encorvarte."]',
 '["Mecer el torso adelante y atrás para mover más peso.",
   "Encoger los hombros hacia las orejas al jalar."]'),

(null, 'remo-con-barra', 'Remo con barra', 'Espalda',
 '["Cadera atrás y torso a unos 45 grados, espalda plana.",
   "Jala la barra hacia el ombligo, pegando los codos al cuerpo.",
   "Abdomen apretado durante toda la serie."]',
 '["Redondear la espalda baja al bajar la barra.",
   "Levantar el torso cada repetición para completar el jalón."]'),

(null, 'dominadas', 'Dominadas (asistidas o libres)', 'Espalda',
 '["Arranca con los brazos estirados y los hombros activos, no colgado muerto.",
   "Sube llevando el pecho a la barra, no la barbilla.",
   "Baja controlado hasta estirar del todo."]',
 '["Impulsarse con las piernas en cada repetición.",
   "Cortar el recorrido a la mitad para sumar repeticiones."]'),

(null, 'press-militar', 'Press militar', 'Hombro',
 '["Abdomen y glúteo apretados para no arquear la espalda baja.",
   "Empuja la cabeza ligeramente adelante cuando la barra pase la frente.",
   "Termina con la barra sobre la mitad del pie, no adelante."]',
 '["Arquear la espalda baja para ayudarse.",
   "Bajar la barra solo hasta la frente y no completar el recorrido."]'),

(null, 'elevaciones-laterales', 'Elevaciones laterales', 'Hombro',
 '["Peso ligero: es un ejercicio de control, no de fuerza.",
   "Sube hasta la altura del hombro, ni un centímetro más.",
   "Codo ligeramente flexionado y guiando el movimiento."]',
 '["Impulsar con la cadera para levantar mancuernas muy pesadas.",
   "Encoger los hombros y trabajar trapecio en vez de deltoides."]'),

(null, 'sentadilla', 'Sentadilla libre', 'Pierna',
 '["Pies al ancho de los hombros, puntas ligeramente hacia afuera.",
   "Rodillas siguen la dirección de las puntas de los pies.",
   "Baja con el pecho arriba hasta que la cadera pase la rodilla si tu movilidad lo permite."]',
 '["Dejar que las rodillas se vayan hacia adentro al subir.",
   "Levantar los talones del piso en la bajada."]'),

(null, 'sentadilla-smith', 'Sentadilla en multipower', 'Pierna',
 '["Pies un poco adelante de la cadera: la barra va fija, tú no.",
   "Baja controlado hasta unos 90 grados de rodilla.",
   "Empuja con todo el pie, no solo con la punta."]',
 '["Poner los pies debajo de la barra y cargar la rodilla de más.",
   "Bloquear la rodilla de golpe al terminar cada repetición."]'),

(null, 'prensa-piernas', 'Prensa de piernas', 'Pierna',
 '["Espalda baja pegada al respaldo durante todo el recorrido.",
   "Baja hasta unos 90 grados de rodilla, sin que se despegue la cadera.",
   "Empuja con el talón completo, no con la punta del pie."]',
 '["Estirar la rodilla de golpe hasta bloquearla al final del empuje.",
   "Bajar tanto que la espalda baja se despega del respaldo."]'),

(null, 'extension-cuadriceps', 'Extensión de cuádriceps', 'Pierna',
 '["Ajusta el respaldo para que la rodilla quede alineada con el eje de la máquina.",
   "Sube hasta estirar casi del todo y aguanta un instante arriba.",
   "Baja controlado, sin dejar caer el peso."]',
 '["Usar impulso levantando la cadera del asiento.",
   "Soltar el peso de golpe en la bajada."]'),

(null, 'curl-femoral', 'Curl femoral tumbado', 'Pierna',
 '["Cadera pegada a la banca todo el recorrido.",
   "Flexiona llevando el talón al glúteo sin levantar la pelvis.",
   "Baja lento: la parte negativa es la que más trabaja."]',
 '["Levantar la cadera para completar la flexión.",
   "Cortar el recorrido y quedarse a medio camino."]'),

(null, 'peso-muerto', 'Peso muerto', 'Espalda y pierna',
 '["Barra pegada a la espinilla antes de empezar a jalar.",
   "Espalda plana y pecho arriba: la cadera y las rodillas suben juntas.",
   "Termina de pie, apretando glúteo, sin echarte hacia atrás."]',
 '["Redondear la espalda baja al despegar la barra del piso.",
   "Separar la barra del cuerpo durante la subida."]'),

(null, 'elevacion-gemelos', 'Elevación de gemelos', 'Pierna',
 '["Recorrido completo: baja hasta estirar y sube hasta la punta del pie.",
   "Aguanta un segundo arriba en cada repetición.",
   "Rodilla estirada si buscas el gemelo, flexionada para el sóleo."]',
 '["Rebotar rápido sin recorrido completo.",
   "Apoyar solo la punta del pie y perder estabilidad."]'),

(null, 'curl-biceps-barra', 'Curl de bíceps con barra', 'Brazo',
 '["Codos pegados a las costillas y quietos todo el recorrido.",
   "Sube sin mover el hombro hacia adelante.",
   "Baja controlado hasta estirar el brazo."]',
 '["Mecer la espalda para subir la barra.",
   "Adelantar los codos y convertirlo en un remo."]'),

(null, 'curl-biceps-polea', 'Curl de bíceps en polea', 'Brazo',
 '["De pie, un paso adelante de la polea para mantener tensión abajo.",
   "Codos fijos al costado del cuerpo.",
   "Aprieta arriba un instante antes de bajar."]',
 '["Dejar que la polea jale el brazo de regreso sin control.",
   "Echar el torso atrás para ayudarse en las últimas repeticiones."]'),

(null, 'extension-triceps-polea', 'Extensión de tríceps en polea', 'Brazo',
 '["Codos pegados al cuerpo y quietos: solo se mueve el antebrazo.",
   "Estira del todo abajo y aprieta un instante.",
   "Torso ligeramente inclinado y firme."]',
 '["Abrir los codos hacia afuera al empujar.",
   "Usar el peso del cuerpo para bajar la barra."]'),

(null, 'press-frances', 'Press francés', 'Brazo',
 '["Codos apuntando al techo y fijos durante todo el recorrido.",
   "Baja la barra hacia la frente o un poco atrás de la cabeza.",
   "Sube estirando sin mover los hombros."]',
 '["Abrir los codos hacia los lados al subir.",
   "Bajar tan rápido que la barra golpee la frente."]'),

(null, 'hip-thrust', 'Hip thrust', 'Glúteo',
 '["Banca a la altura del borde inferior del omóplato.",
   "Barbilla metida y mirada al frente durante todo el recorrido.",
   "Aprieta el glúteo arriba hasta que el torso quede paralelo al piso."]',
 '["Arquear la espalda baja en vez de extender la cadera.",
   "Subir empujando con la punta del pie en lugar del talón."]'),

(null, 'abductores', 'Máquina de abductores', 'Glúteo',
 '["Espalda pegada al respaldo y abdomen firme.",
   "Abre de forma controlada hasta el final del recorrido.",
   "Vuelve despacio, sin dejar que el peso te cierre las piernas."]',
 '["Echar el torso adelante para poder mover más peso.",
   "Soltar el retorno de golpe."]')

on conflict do nothing;
