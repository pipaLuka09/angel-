'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServidor } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { claveTemporal, gymDelStaff } from '@/lib/panel';

export type ResultadoAlta =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; nombre: string; correo: string; clave: string; recepcion: boolean };

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
  // Solo el dueño crea cuentas de recepción. La política
  // memberships_owner_write lo exige de todas formas; esto es para dar un
  // mensaje claro en vez de un error de la base.
  const recepcion = formData.get('tipo') === 'staff';
  if (recepcion && gym.rol !== 'owner') {
    return { estado: 'error', mensaje: 'Solo el dueño del gimnasio puede crear cuentas de recepción.' };
  }

  if (nombre.length < 3) return { estado: 'error', mensaje: 'Escribe el nombre completo.' };
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
    // La contraseña la eligió el sistema, no la persona: al entrar se le
    // sugiere cambiarla.
    user_metadata: { full_name: nombre, clave_temporal: true },
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

  // La membresía se inserta con la sesión de quien da de alta, para que
  // sean las políticas de memberships las que autoricen y no la clave de
  // servicio.
  const supabase = await supabaseServidor();
  const { error: errorMembresia } = await supabase.from('memberships').insert({
    gym_id: gym.gymId,
    user_id: creado.user.id,
    role: recepcion ? 'staff' : 'member',
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
  return { estado: 'listo', nombre, correo, clave, recepcion };
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

export type ResultadoClave =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; clave: string };

/**
 * Recuperar el acceso de un socio que olvidó su contraseña: recepción le
 * genera una nueva y se la dicta. No hay correo de recuperación porque el
 * SMTP gratuito de Supabase solo envía a los miembros del proyecto.
 *
 * Recepción solo sobre socios (role = member) de su mismo gimnasio: si
 * pudiera restablecer la contraseña del dueño o de otro miembro del
 * staff, podría entrar con sus permisos. El dueño además sobre recepción.
 * La del dueño no se toca desde aquí: la restablece la plataforma.
 */
export async function nuevaClaveSocio(
  _previo: ResultadoClave,
  formData: FormData,
): Promise<ResultadoClave> {
  const gym = await gymDelStaff('/panel/socios');
  if (!gym) return { estado: 'error', mensaje: 'No administras ningún gimnasio.' };

  const userId = String(formData.get('userId') ?? '');
  if (!userId) return { estado: 'error', mensaje: 'Falta el socio.' };

  // La comprobación se hace con la sesión de recepción, así que RLS
  // también la respalda: solo ve membresías de su propio gimnasio.
  const supabase = await supabaseServidor();
  const { data: membresia } = await supabase
    .from('memberships')
    .select('role')
    .eq('gym_id', gym.gymId)
    .eq('user_id', userId)
    .maybeSingle();

  const permitido =
    membresia?.role === 'member' || (membresia?.role === 'staff' && gym.rol === 'owner');
  if (!permitido) {
    return { estado: 'error', mensaje: 'No puedes restablecer la contraseña de esta cuenta.' };
  }

  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return { estado: 'error', mensaje: 'Falta la clave de servicio en el despliegue.' };
  }

  // Se leen los metadatos para no perder el nombre: el update los reemplaza.
  const { data: actual, error: errorLeer } = await admin.auth.admin.getUserById(userId);
  if (errorLeer || !actual.user) {
    return { estado: 'error', mensaje: 'No se encontró la cuenta.' };
  }

  const clave = claveTemporal();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: clave,
    user_metadata: { ...(actual.user.user_metadata ?? {}), clave_temporal: true },
  });

  if (error) {
    console.error('[nuevaClaveSocio]', error.status, error.message);
    return { estado: 'error', mensaje: 'No se pudo cambiar la contraseña. Intenta otra vez.' };
  }

  return { estado: 'listo', clave };
}
