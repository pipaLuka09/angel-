'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';

function volver(aviso: string): never {
  redirect(`/panel/ajustes?aviso=${aviso}`);
}

/**
 * Nombre y sucursal tal como los ven los socios en la app. El código del
 * gimnasio no se edita aquí: va impreso en cada sticker y cambiarlo los
 * dejaría a todos inservibles. La base solo permite estas columnas.
 */
export async function guardarAjustes(formData: FormData) {
  const gym = await gymDelStaff('/panel/ajustes');
  if (!gym) redirect('/panel/ajustes');
  if (gym.rol !== 'owner') volver('solo-dueno');

  const nombre = String(formData.get('nombre') ?? '').trim();
  const sucursal = String(formData.get('sucursal') ?? '').trim();

  if (nombre.length < 2 || nombre.length > 80) volver('nombre');
  if (sucursal.length > 80) volver('sucursal');

  const supabase = await supabaseServidor();
  const { error } = await supabase
    .from('gyms')
    .update({ name: nombre, branch_name: sucursal || null })
    .eq('id', gym.gymId);

  if (error) volver('error');

  revalidatePath('/', 'layout');
  volver('guardado');
}
