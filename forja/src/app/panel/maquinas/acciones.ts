'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';

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

  const supabase = await supabaseServidor();
  const { error } = await supabase.from('stations').insert({
    gym_id: gym.gymId,
    exercise_id: ejercicio || null,
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
