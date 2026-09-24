'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServidor } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { esAdminPlataforma } from '@/lib/admin';
import { claveTemporal } from '@/lib/panel';

/** Suspender o reactivar un gimnasio. La función de la base verifica el permiso. */
export async function cambiarEstadoGym(formData: FormData) {
  if (!(await esAdminPlataforma())) return;
  const id = String(formData.get('id') ?? '');
  const estado = String(formData.get('estado') ?? '');
  if (!id || !['active', 'suspended'].includes(estado)) return;

  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc('admin_set_gym_status', { p_gym_id: id, p_status: estado });
  if (error) console.error('[cambiarEstadoGym]', error.message);
  revalidatePath('/admin');
}

export type ResultadoGym =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje: string; valores: Record<string, string> }
  | {
      estado: 'listo';
      gym: string;
      codigo: string;
      correo: string;
      clave: string | null; // null: el dueño ya tenía cuenta y entra con la suya
    };

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Dar de alta un gimnasio con su dueño, de una sola vez: la cuenta del
 * dueño (o la que ya tenía), el gimnasio, sus máquinas del catálogo y la
 * membresía de dueño.
 */
export async function crearGimnasio(_previo: ResultadoGym, formData: FormData): Promise<ResultadoGym> {
  const valores = {
    nombre: String(formData.get('nombre') ?? '').trim(),
    sucursal: String(formData.get('sucursal') ?? '').trim(),
    codigo: String(formData.get('codigo') ?? '').trim().toLowerCase(),
    duenoNombre: String(formData.get('duenoNombre') ?? '').trim(),
    duenoCorreo: String(formData.get('duenoCorreo') ?? '').trim().toLowerCase(),
  };
  const catalogo = formData.get('catalogo') === 'on';
  const fallo = (mensaje: string): ResultadoGym => ({ estado: 'error', mensaje, valores });

  if (!(await esAdminPlataforma())) return fallo('No tienes permiso para crear gimnasios.');

  if (valores.nombre.length < 2) return fallo('Escribe el nombre del gimnasio.');
  if (!/^[a-z]{2,5}$/.test(valores.codigo)) {
    return fallo('El código debe tener de 2 a 5 letras, sin números ni acentos. Por ejemplo: OLM.');
  }
  if (!CORREO.test(valores.duenoCorreo)) return fallo('El correo del dueño no parece válido.');

  const supabase = await supabaseServidor();

  let admin;
  try {
    admin = supabaseAdmin();
  } catch {
    return fallo('Falta la clave de servicio en el despliegue.');
  }

  // ¿El dueño ya tiene cuenta? Entonces se reutiliza.
  const { data: existente } = await supabase.rpc('admin_find_user', { p_email: valores.duenoCorreo });
  let ownerId = (existente as string | null) ?? null;
  let clave: string | null = null;
  let creadaAhora = false;

  if (!ownerId) {
    if (valores.duenoNombre.length < 3) return fallo('Escribe el nombre completo del dueño.');
    clave = claveTemporal();
    const { data: creado, error } = await admin.auth.admin.createUser({
      email: valores.duenoCorreo,
      password: clave,
      email_confirm: true,
      user_metadata: { full_name: valores.duenoNombre, clave_temporal: true },
    });
    if (error || !creado.user) {
      console.error('[crearGimnasio] cuenta del dueño:', error?.message);
      return fallo('No se pudo crear la cuenta del dueño. Intenta otra vez.');
    }
    ownerId = creado.user.id;
    creadaAhora = true;
  }

  const { error: errorGym } = await supabase.rpc('admin_create_gym', {
    p_name: valores.nombre,
    p_branch: valores.sucursal,
    p_prefix: valores.codigo,
    p_owner: ownerId,
    p_with_catalog: catalogo,
  });

  if (errorGym) {
    // Sin gimnasio, la cuenta recién creada quedaría huérfana.
    if (creadaAhora && ownerId) await admin.auth.admin.deleteUser(ownerId);
    return fallo(errorGym.message.charAt(0).toUpperCase() + errorGym.message.slice(1) + '.');
  }

  revalidatePath('/admin');
  return {
    estado: 'listo',
    gym: valores.sucursal ? `${valores.nombre} · ${valores.sucursal}` : valores.nombre,
    codigo: valores.codigo.toUpperCase(),
    correo: valores.duenoCorreo,
    clave,
  };
}
