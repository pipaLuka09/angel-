'use server';

import { revalidatePath } from 'next/cache';
import { supabaseServidor } from '@/lib/supabase/server';

export type ResultadoCambio =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo' };

export async function cambiarClave(_previo: ResultadoCambio, formData: FormData): Promise<ResultadoCambio> {
  const actual = String(formData.get('actual') ?? '');
  const nueva = String(formData.get('nueva') ?? '');
  const repetida = String(formData.get('repetida') ?? '');

  if (nueva.length < 8) return { estado: 'error', mensaje: 'La nueva contraseña tiene que tener al menos 8 caracteres.' };
  if (nueva !== repetida) return { estado: 'error', mensaje: 'Las dos contraseñas nuevas no coinciden.' };
  if (nueva === actual) return { estado: 'error', mensaje: 'La nueva contraseña es igual a la actual.' };

  const supabase = await supabaseServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user?.email) return { estado: 'error', mensaje: 'Tu sesión expiró. Vuelve a entrar.' };

  // Se pide la contraseña actual aunque haya sesión: si alguien deja el
  // celular desbloqueado, otra persona no debe poder quedarse con la cuenta.
  const { error: errorActual } = await supabase.auth.signInWithPassword({
    email: sesion.user.email,
    password: actual,
  });
  if (errorActual) return { estado: 'error', mensaje: 'La contraseña actual no es correcta.' };

  const { error } = await supabase.auth.updateUser({
    password: nueva,
    data: { clave_temporal: false },
  });

  if (error) {
    console.error('[cambiarClave]', error.status, error.message);
    const debil = (error as { code?: string }).code === 'weak_password';
    return {
      estado: 'error',
      mensaje: debil ? 'Esa contraseña es demasiado débil. Prueba con una más larga.' : 'No se pudo cambiar la contraseña. Intenta otra vez.',
    };
  }

  revalidatePath('/');
  revalidatePath('/cuenta');
  return { estado: 'listo' };
}
