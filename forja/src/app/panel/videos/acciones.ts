'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';

function volver(error?: string): never {
  redirect(error ? `/panel/videos?error=${encodeURIComponent(error)}` : '/panel/videos?ok=1');
}

/**
 * De dónde viene el video. Se deduce del dominio en vez de pedírselo a
 * quien lo pega: nadie quiere elegir de una lista si el enlace ya lo dice.
 */
function fuenteDe(url: URL): 'tiktok' | 'instagram' | 'youtube' | 'own' {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
  if (host === 'instagram.com' || host.endsWith('.instagram.com')) return 'instagram';
  if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') return 'youtube';
  return 'own';
}

export async function guardarVideo(formData: FormData) {
  const gym = await gymDelStaff();
  if (!gym) volver();

  const id = String(formData.get('id') ?? '');
  const crudo = String(formData.get('url') ?? '').trim();
  if (!id) volver('Falta la máquina.');

  const supabase = await supabaseServidor();

  // Vacío = quitar el video y volver al del catálogo, si lo hay.
  if (!crudo) {
    const { error } = await supabase
      .from('stations')
      .update({ video_url: null, video_source: null })
      .eq('id', id)
      .eq('gym_id', gym.gymId);
    if (error) volver(error.message);
    revalidatePath('/panel/videos');
    volver();
  }

  let url: URL;
  try {
    url = new URL(crudo);
  } catch {
    volver('Eso no parece un enlace. Tiene que empezar con https://');
  }

  if (url.protocol !== 'https:') {
    volver('El enlace tiene que ser https. Un enlace http se bloquea en el celular.');
  }

  const { error } = await supabase
    .from('stations')
    .update({ video_url: url.toString(), video_source: fuenteDe(url) })
    .eq('id', id)
    .eq('gym_id', gym.gymId);

  if (error) volver(error.message);

  revalidatePath('/panel/videos');
  revalidatePath('/panel/maquinas');
  volver();
}
