'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';
import { GRUPOS } from '@/lib/ejercicios';

function volver(error?: string): never {
  redirect(error ? `/panel/maquinas?error=${encodeURIComponent(error)}` : '/panel/maquinas');
}

/** Genera el código del sticker. La función de la base verifica permisos. */
export async function asignarCodigo(formData: FormData) {
  const gym = await gymDelStaff();
  if (!gym) volver();

  const id = String(formData.get('id') ?? '');
  if (!id) volver('Falta la máquina.');

  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc('assign_nfc_code', { p_station_id: id });
  if (error) volver(error.message);

  revalidatePath('/panel/maquinas');
  revalidatePath('/panel/stickers');
  revalidatePath('/panel');
  volver();
}

/**
 * Quita el código. Se usa cuando un sticker se pierde o alguien se lo
 * lleva: el código viejo deja de resolver de inmediato, y la máquina
 * vuelve a la lista de pendientes para imprimir uno nuevo.
 */
export async function quitarCodigo(formData: FormData) {
  const gym = await gymDelStaff();
  if (!gym) volver();

  const id = String(formData.get('id') ?? '');
  if (!id) volver('Falta la máquina.');

  const supabase = await supabaseServidor();
  const { error } = await supabase
    .from('stations')
    .update({ nfc_code: null, status: 'no_sticker', last_scan_at: null })
    .eq('id', id)
    .eq('gym_id', gym.gymId);

  if (error) volver(error.message);

  revalidatePath('/panel/maquinas');
  revalidatePath('/panel/stickers');
  revalidatePath('/panel');
  volver();
}

export async function agregarMaquina(formData: FormData) {
  const gym = await gymDelStaff();
  if (!gym) volver();

  const etiqueta = String(formData.get('etiqueta') ?? '').trim();
  const ejercicio = String(formData.get('ejercicio') ?? '');
  const zona = String(formData.get('zona') ?? '').trim();

  if (!etiqueta) volver('Ponle una etiqueta a la máquina, como "#23".');
  // Sin ejercicio el socio toca el sticker y no tiene dónde guardar la
  // serie.
  if (!ejercicio) volver('Elige qué ejercicio se hace en esta máquina.');

  const supabase = await supabaseServidor();
  const { error } = await supabase.from('stations').insert({
    gym_id: gym.gymId,
    exercise_id: ejercicio,
    label: etiqueta,
    zone: zona || null,
    status: 'no_sticker',
  });

  if (error) {
    volver(
      error.code === '23505'
        ? `Ya existe una máquina con la etiqueta ${etiqueta}.`
        : error.message,
    );
  }

  revalidatePath('/panel/maquinas');
  revalidatePath('/panel');
  volver();
}

/**
 * Quita una máquina que el gimnasio ya no tiene. El historial de los
 * socios no se pierde: sus series guardan el ejercicio y el gimnasio por
 * su cuenta, y solo sueltan la referencia a la máquina (on delete set
 * null). Lo que sí se va son las lecturas del sticker, que solo servían
 * para saber si estaba pegado.
 */
export async function quitarMaquina(formData: FormData) {
  const gym = await gymDelStaff();
  if (!gym) volver();

  const id = String(formData.get('id') ?? '');
  if (!id) volver('Falta la máquina.');

  const supabase = await supabaseServidor();
  const { error } = await supabase
    .from('stations')
    .delete()
    .eq('id', id)
    .eq('gym_id', gym.gymId);

  if (error) volver(error.message);

  revalidatePath('/panel/maquinas');
  revalidatePath('/panel/stickers');
  revalidatePath('/panel/videos');
  revalidatePath('/panel');
  volver();
}

/**
 * Corrige etiqueta, ejercicio o zona sin tocar el código: el sticker ya
 * grabado sigue funcionando. Las series que ya se registraron conservan
 * su ejercicio original (van desnormalizadas en sets.exercise_id).
 */
export async function editarMaquina(formData: FormData) {
  const gym = await gymDelStaff();
  if (!gym) volver();

  const id = String(formData.get('id') ?? '');
  const etiqueta = String(formData.get('etiqueta') ?? '').trim();
  const ejercicio = String(formData.get('ejercicio') ?? '');
  const zona = String(formData.get('zona') ?? '').trim();

  const aqui = (error: string): never =>
    redirect(`/panel/maquinas/${id}?error=${encodeURIComponent(error)}`);

  if (!id) volver('Falta la máquina.');
  if (!etiqueta) aqui('Ponle una etiqueta a la máquina, como "#23".');
  if (!ejercicio) aqui('Elige qué ejercicio se hace en esta máquina.');

  const supabase = await supabaseServidor();
  const { error } = await supabase
    .from('stations')
    .update({ label: etiqueta, exercise_id: ejercicio, zone: zona || null })
    .eq('id', id)
    .eq('gym_id', gym.gymId);

  if (error) {
    aqui(error.code === '23505' ? `Ya existe otra máquina con la etiqueta ${etiqueta}.` : error.message);
  }

  revalidatePath('/panel/maquinas');
  revalidatePath('/panel/stickers');
  revalidatePath('/panel/videos');
  revalidatePath('/panel');
  volver();
}

/**
 * Un ejercicio que no está en el catálogo. Queda solo para este gimnasio
 * (gym_id), y la política exercises_staff_write es la que autoriza.
 * Después vuelve a donde estaba con el ejercicio ya elegido.
 */
export async function crearEjercicio(formData: FormData) {
  const gym = await gymDelStaff();
  if (!gym) volver();

  const nombre = String(formData.get('nombre_ejercicio') ?? '').trim().replace(/\s+/g, ' ');
  const grupo = String(formData.get('grupo') ?? '');
  // Solo se vuelve a pantallas de máquinas: es un campo del formulario y
  // no debe poder mandar a ninguna otra parte.
  const pedido = String(formData.get('volver_a') ?? '');
  const destino = /^\/panel\/maquinas(\/[0-9a-f-]{36})?$/.test(pedido) ? pedido : '/panel/maquinas';
  const irA = (params: string): never => redirect(`${destino}?${params}`);

  if (nombre.length < 3 || nombre.length > 60) {
    irA(`error=${encodeURIComponent('El nombre del ejercicio debe tener entre 3 y 60 caracteres.')}`);
  }
  if (!(GRUPOS as readonly string[]).includes(grupo)) {
    irA(`error=${encodeURIComponent('Elige el grupo muscular.')}`);
  }

  const supabase = await supabaseServidor();

  // Evitar duplicados con el catálogo o con los que ya creó el gym: el
  // RLS solo deja ver esos dos, así que la búsqueda cubre justo lo que
  // aparece en la lista.
  const { data: iguales } = await supabase.from('exercises').select('id').ilike('name', nombre).limit(1);
  if (iguales && iguales.length > 0) {
    irA(`ejercicio=${iguales[0].id}&error=${encodeURIComponent(`"${nombre}" ya está en la lista: lo dejé elegido.`)}`);
  }

  const base = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const slug = `${base || 'ejercicio'}-${Math.random().toString(36).slice(2, 7)}`;

  const { data: creado, error } = await supabase
    .from('exercises')
    .insert({ gym_id: gym.gymId, slug, name: nombre, muscle_group: grupo })
    .select('id')
    .single();

  if (error || !creado) {
    return irA(`error=${encodeURIComponent(error?.message ?? 'No se pudo crear el ejercicio.')}`);
  }

  revalidatePath('/panel/maquinas');
  irA(`ejercicio=${creado.id}&ok=ejercicio`);
}
