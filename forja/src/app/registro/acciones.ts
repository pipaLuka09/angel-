'use server';

import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type EstadoRegistro = {
  error: string | null;
  valores: { nombre: string; correo: string; gym: string };
};

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function destinoSeguro(valor: FormDataEntryValue | null): string {
  const s = typeof valor === 'string' ? valor : '';
  return s.startsWith('/') && !s.startsWith('//') ? s : '/';
}

/**
 * Registro por cuenta propia. La cuenta queda en espera hasta que el
 * gimnasio la apruebe, y mientras tanto no ve ni registra nada.
 *
 * La cuenta se crea con la clave de servicio y ya confirmada, sin correo
 * de confirmación: el SMTP gratuito de Supabase solo envía a los miembros
 * del proyecto, así que a un socio cualquiera nunca le llegaría y se
 * quedaría sin poder entrar. La aprobación del gimnasio es la que hace
 * de filtro.
 */
export async function registrar(_previo: EstadoRegistro, formData: FormData): Promise<EstadoRegistro> {
  const nombre = String(formData.get('nombre') ?? '').trim();
  const correo = String(formData.get('correo') ?? '').trim().toLowerCase();
  const clave = String(formData.get('clave') ?? '');
  const gymRef = String(formData.get('gym') ?? '').trim();
  const destino = destinoSeguro(formData.get('destino'));
  const valores = { nombre, correo, gym: gymRef };
  const fallo = (error: string): EstadoRegistro => ({ error, valores });

  // Campo trampa: invisible para una persona, los bots lo llenan.
  if (String(formData.get('sitio') ?? '')) return fallo('No se pudo crear la cuenta.');

  if (nombre.length < 3) return fallo('Escribe tu nombre completo.');
  if (!CORREO.test(correo)) return fallo('Ese correo no parece válido.');
  if (clave.length < 8) return fallo('La contraseña tiene que tener al menos 8 caracteres.');
  if (!gymRef) return fallo('Escribe el código de tu gimnasio. Te lo dan en recepción.');

  const supabase = await supabaseServidor();

  const { data: gyms } = await supabase.rpc('gym_para_registro', { p_ref: gymRef });
  const gym = (gyms as { id: string; name: string }[] | null)?.[0];
  if (!gym) return fallo('No encontramos ese gimnasio. Revisa el código con recepción.');

  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return fallo('El registro no está disponible en este momento. Pide tu cuenta en recepción.');
  }

  const { data: creado, error: errorAuth } = await admin.auth.admin.createUser({
    email: correo,
    password: clave,
    email_confirm: true,
    user_metadata: { full_name: nombre },
  });

  if (errorAuth || !creado.user) {
    const ya = (errorAuth?.message ?? '').toLowerCase().includes('already');
    if (!ya) console.error('[registro] no se pudo crear la cuenta:', errorAuth?.status, errorAuth?.message);
    return fallo(
      ya
        ? 'Ya existe una cuenta con ese correo. Entra con tu contraseña; desde ahí puedes pedir acceso a este gimnasio.'
        : 'No se pudo crear la cuenta. Intenta otra vez.',
    );
  }

  // Se inicia la sesión aquí mismo para que la persona no tenga que volver
  // a escribir lo que acaba de escribir.
  const { error: errorSesion } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
  if (errorSesion) {
    console.error('[registro] no se pudo iniciar sesión:', errorSesion.status, errorSesion.message);
    await admin.auth.admin.deleteUser(creado.user.id);
    return fallo('No se pudo crear la cuenta. Intenta otra vez.');
  }

  const { error: errorSolicitud } = await supabase.rpc('request_membership', { p_gym_id: gym.id });
  if (errorSolicitud) {
    // Sin esto quedaría una cuenta sin gimnasio y sin forma de llegar a
    // ella desde el panel.
    console.error('[registro] no se pudo pedir acceso:', errorSolicitud.message);
    await supabase.auth.signOut();
    await admin.auth.admin.deleteUser(creado.user.id);
    return fallo('No se pudo crear la cuenta. Intenta otra vez.');
  }

  redirect(destino);
}
