'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import type { Estacion } from '@/lib/tipos';

/**
 * Pedir acceso al gimnasio de un sticker, para alguien que ya tiene
 * cuenta (de otro gimnasio, o que se la rechazaron y volvió). El gimnasio
 * se saca del sticker en el servidor: no se confía en un id del cliente.
 */
export async function solicitarAcceso(formData: FormData) {
  const codigo = String(formData.get('codigo') ?? '');
  if (!codigo) redirect('/');

  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc('station_by_code', { p_code: codigo });
  const estacion = (data as Estacion[] | null)?.[0] ?? null;
  if (!estacion) redirect('/');

  await supabase.rpc('request_membership', { p_gym_id: estacion.gym_id });

  revalidatePath(`/m/${codigo}`);
  revalidatePath('/');
  redirect(`/m/${codigo}`);
}
