'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import type { Estacion } from '@/lib/tipos';

export async function guardarSerie(formData: FormData) {
  const codigo = String(formData.get('codigo') ?? '');
  const kg = Number(formData.get('peso'));
  const reps = Number(formData.get('reps'));
  const sensacion = Number(formData.get('sensacion'));

  if (!codigo || !Number.isFinite(kg) || !Number.isFinite(reps)) {
    redirect(`/m/${codigo}/registrar?error=datos`);
  }

  const supabase = await supabaseServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) redirect(`/entrar?destino=${encodeURIComponent(`/m/${codigo}`)}`);

  const { data } = await supabase.rpc('station_by_code', { p_code: codigo });
  const estacion = (data as Estacion[] | null)?.[0] ?? null;
  if (!estacion || !estacion.is_member || !estacion.exercise_id) {
    redirect(`/m/${codigo}`);
  }

  // El número de serie se calcula aquí y no en el cliente: si la persona
  // abre la pantalla en dos pestañas, el servidor sigue siendo la única
  // fuente de verdad sobre cuántas series lleva hoy.
  const hoy = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from('sets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', sesion.user.id)
    .eq('exercise_id', estacion.exercise_id)
    .eq('session_date', hoy);

  const { error } = await supabase.from('sets').insert({
    user_id: sesion.user.id,
    gym_id: estacion.gym_id,
    station_id: estacion.station_id,
    exercise_id: estacion.exercise_id,
    session_date: hoy,
    set_number: Math.min((count ?? 0) + 1, 20),
    weight_kg: Math.max(0, Math.min(kg, 1000)),
    reps: Math.max(1, Math.min(Math.round(reps), 200)),
    feeling: sensacion >= 1 && sensacion <= 5 ? sensacion : null,
  });

  if (error) {
    redirect(`/m/${codigo}/registrar?error=guardar`);
  }

  revalidatePath(`/m/${codigo}`);
  redirect(`/m/${codigo}`);
}
