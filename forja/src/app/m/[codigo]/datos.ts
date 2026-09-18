import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import type { Estacion, ResumenEjercicio } from '@/lib/tipos';

/**
 * Resuelve el código del sticker y exige sesión. Todo lo que cuelga de
 * /m/<codigo> pasa por aquí.
 *
 * Si no hay sesión mandamos a /entrar recordando a dónde iba: así, el
 * día que se inscribe, el primer tap lo deja en la máquina correcta y
 * no en una pantalla de inicio genérica.
 */
export async function estacionDelSticker(codigo: string) {
  const supabase = await supabaseServidor();

  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) {
    redirect(`/entrar?destino=${encodeURIComponent(`/m/${codigo}`)}`);
  }

  const { data, error } = await supabase.rpc('station_by_code', { p_code: codigo });
  if (error) throw error;

  const estacion = (data as Estacion[] | null)?.[0] ?? null;
  return { supabase, estacion, usuario: sesion.user };
}

export async function resumenDe(
  supabase: Awaited<ReturnType<typeof supabaseServidor>>,
  ejercicioId: string,
): Promise<ResumenEjercicio> {
  const { data, error } = await supabase.rpc('exercise_summary', {
    p_exercise_id: ejercicioId,
    p_sessions: 8,
  });
  if (error) throw error;

  return (data as ResumenEjercicio | null) ?? {
    last: null, previous: null, record: null, first_date: null,
    session_count: 0, sessions: [], goal: null,
  };
}
