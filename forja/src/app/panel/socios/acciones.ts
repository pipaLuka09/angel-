'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServidor } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { claveTemporal, gymDelStaff } from '@/lib/panel';

export type ResultadoAlta =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; nombre: string; correo: string; clave: string };

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function darDeAltaSocio(
  _previo: ResultadoAlta,
  formData: FormData,
): Promise<ResultadoAlta> {
  const gym = await gymDelStaff();
  if (!gym) return { estado: 'error', mensaje: 'No administras ningún gimnasio.' };

  const nombre = String(formData.get('nombre') ?? '').trim();
  const correo = String(formData.get('correo') ?? '').trim().toLowerCase();
  const numero = String(formData.get('numero') ?? '').trim();

  if (nombre.length < 3) return { estado: 'error', mensaje: 'Escribe el nombre completo del socio.' };
  if (!CORREO.test(correo)) return { estado: 'error', mensaje: 'Ese correo no parece válido.' };

  const clave = claveTemporal();
  const admin = supabaseAdmin();

  // email_confirm en true porque la cuenta la crea recepción en persona:
  // no hay a quién mandarle un correo de confirmación, y muchos socios
  // dan un correo que casi no revisan.
  const { data: creado, error: errorAuth } = await admin.auth.admin.createUser({
    email: correo,
    password: clave,
    email_confirm: true,
    user_metadata: { full_name: nombre },
  });

  if (errorAuth || !creado.user) {
    const ya = (errorAuth?.message ?? '').toLowerCase().includes('already');
    return {
      estado: 'error',
      mensaje: ya
        ? 'Ese correo ya tiene una cuenta de FORJA. Por ahora el alta desde el panel solo crea cuentas nuevas.'
        : `No se pudo crear la cuenta: ${errorAuth?.message ?? 'error desconocido'}`,
    };
  }

  // La membresía se inserta con la sesión de recepción, para que la
  // política memberships_staff_write sea la que autorice y no la clave
  // de servicio.
  const supabase = await supabaseServidor();
  const { error: errorMembresia } = await supabase.from('memberships').insert({
    gym_id: gym.gymId,
    user_id: creado.user.id,
    role: 'member',
    status: 'active',
    member_code: numero || null,
  });

  if (errorMembresia) {
    // Sin esto quedaría una cuenta de Auth huérfana, sin gimnasio y sin
    // forma de llegar a ella desde el panel.
    await admin.auth.admin.deleteUser(creado.user.id);
    return { estado: 'error', mensaje: `No se pudo ligar al gimnasio: ${errorMembresia.message}` };
  }

  revalidatePath('/panel/socios');
  revalidatePath('/panel');
  return { estado: 'listo', nombre, correo, clave };
}

export async function cambiarEstadoSocio(formData: FormData) {
  const gym = await gymDelStaff();
  if (!gym) return;

  const userId = String(formData.get('userId') ?? '');
  const nuevo = String(formData.get('estado') ?? '');
  if (!userId || !['active', 'paused', 'cancelled'].includes(nuevo)) return;

  const supabase = await supabaseServidor();
  await supabase
    .from('memberships')
    .update({ status: nuevo })
    .eq('gym_id', gym.gymId)
    .eq('user_id', userId);

  revalidatePath('/panel/socios');
  revalidatePath('/panel');
}

/** Aprueba una solicitud de registro: la membresía pasa de pendiente a activa. */
export async function aprobarSolicitud(formData: FormData) {
  const gym = await gymDelStaff('/panel/socios');
  if (!gym) return;

  const userId = String(formData.get('userId') ?? '');
  if (!userId) return;

  const supabase = await supabaseServidor();
  await supabase
    .from('memberships')
    .update({ status: 'active' })
    .eq('gym_id', gym.gymId)
    .eq('user_id', userId)
    .eq('status', 'pending');

  revalidatePath('/panel/socios');
  revalidatePath('/panel');
}

/**
 * Rechaza una solicitud. Se borra la membresía pendiente y, si esa cuenta
 * no pertenece a ningún otro gimnasio, también la cuenta: si no, quedaría
 * huérfana y ese correo ya no podría volver a registrarse.
 */
export async function rechazarSolicitud(formData: FormData) {
  const gym = await gymDelStaff('/panel/socios');
  if (!gym) return;

  const userId = String(formData.get('userId') ?? '');
  if (!userId) return;

  const supabase = await supabaseServidor();
  const { data: borradas } = await supabase
    .from('memberships')
    .delete()
    .eq('gym_id', gym.gymId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select('id');

  if ((borradas ?? []).length > 0) {
    try {
      const admin = supabaseAdmin();
      const { count } = await admin
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if ((count ?? 0) === 0) await admin.auth.admin.deleteUser(userId);
    } catch {
      // Sin clave de servicio la cuenta queda, pero sin acceso a nada.
    }
  }

  revalidatePath('/panel/socios');
  revalidatePath('/panel');
}
