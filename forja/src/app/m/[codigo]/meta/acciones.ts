'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import type { Estacion } from '@/lib/tipos';

export async function fijarMeta(formData: FormData) {
  const codigo = String(formData.get('codigo') ?? '');
  const kg = Number(formData.get('objetivo'));
  const fecha = String(formData.get('fecha') ?? '');

  if (!codigo) redirect('/');
  if (!Number.isFinite(kg) || kg <= 0 || !fecha) {
    redirect(`/m/${codigo}/meta?error=datos`);
  }

  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc('station_by_code', { p_code: codigo });
  const estacion = (data as Estacion[] | null)?.[0] ?? null;
  if (!estacion || !estacion.is_member || !estacion.exercise_id) redirect(`/m/${codigo}`);

  const { error } = await supabase.rpc('set_goal', {
    p_exercise_id: estacion.exercise_id,
    p_target_kg: kg,
    p_target_date: fecha,
  });

  if (error) {
    // El mensaje viene de la propia base (fecha pasada, peso inválido).
    redirect(`/m/${codigo}/meta?error=${encodeURIComponent(error.message.slice(0, 120))}`);
  }

  revalidatePath(`/m/${codigo}`);
  redirect(`/m/${codigo}/meta`);
}
