'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';

/**
 * El total de socios que paga el gym. Es el denominador de "214 de 260
 * tienen cuenta"; sin él el panel no puede decir qué tan lejos está de
 * cubrir a toda la base.
 */
export async function guardarSociosDeclarados(formData: FormData) {
  const gym = await gymDelStaff();
  if (!gym) redirect('/panel');

  const n = Number(formData.get('total'));
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) {
    redirect('/panel?error=total');
  }

  const supabase = await supabaseServidor();
  // La política gyms_staff_update es la que autoriza esto.
  const { error } = await supabase
    .from('gyms')
    .update({ declared_member_count: Math.round(n) })
    .eq('id', gym.gymId);

  if (error) redirect('/panel?error=guardar');

  revalidatePath('/panel');
  redirect('/panel');
}
