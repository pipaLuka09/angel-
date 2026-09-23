'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';

/** Solo se vuelve a pantallas de máquina: nadie puede colar otro destino. */
function volverSeguro(valor: FormDataEntryValue | null): string {
  const s = typeof valor === 'string' ? valor : '';
  return s.startsWith('/m/') && !s.includes('//') ? s : '/';
}

export async function borrarSerie(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const codigo = String(formData.get('codigo') ?? '');
  const volver = volverSeguro(formData.get('volver'));

  if (!id) redirect(volver);

  const supabase = await supabaseServidor();
  // delete_set renumera las series del día y reabre la meta si esta era
  // la única serie que la cumplía. Las políticas RLS impiden tocar series
  // ajenas: con un id de otra persona simplemente no encuentra nada.
  const { error } = await supabase.rpc('delete_set', { p_set_id: id });

  const destino = error
    ? `${volver}${volver.includes('?') ? '&' : '?'}error=borrar`
    : volver;

  if (codigo) {
    revalidatePath(`/m/${codigo}`);
    revalidatePath(`/m/${codigo}/registrar`);
    revalidatePath(`/m/${codigo}/historial`);
    revalidatePath(`/m/${codigo}/meta`);
  }
  revalidatePath('/');
  redirect(destino);
}
