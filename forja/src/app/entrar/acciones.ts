'use server';

import { redirect } from 'next/navigation';
import type { AuthError } from '@supabase/supabase-js';
import { supabaseServidor } from '@/lib/supabase/server';

/** Solo aceptamos rutas internas: nadie puede colar ?destino=https://... */
function destinoSeguro(valor: FormDataEntryValue | null): string {
  const s = typeof valor === 'string' ? valor : '';
  return s.startsWith('/') && !s.startsWith('//') ? s : '/';
}

/**
 * Traduce el fallo de Supabase a una causa concreta.
 *
 * Antes todo caía en "usuario o contraseña incorrectos", incluida una
 * clave de API mal configurada. Eso manda a la persona a revisar su
 * contraseña cuando el problema está en el despliegue, y es de los
 * errores que más tiempo hacen perder: el mensaje apunta al lugar
 * equivocado con toda seguridad.
 */
function causaDe(error: AuthError): string {
  const codigo = (error as { code?: string }).code ?? '';
  const mensaje = error.message.toLowerCase();

  if (codigo === 'invalid_credentials' || mensaje.includes('invalid login credentials')) {
    return 'credenciales';
  }
  if (codigo === 'email_not_confirmed') return 'sin_confirmar';
  if (error.status === 401 || mensaje.includes('api key') || mensaje.includes('apikey')) {
    return 'configuracion';
  }
  if (codigo === 'over_request_rate_limit' || error.status === 429) return 'demasiados_intentos';
  if (mensaje.includes('fetch') || mensaje.includes('network') || mensaje.includes('timeout')) {
    return 'conexion';
  }
  return 'desconocido';
}

export async function entrar(formData: FormData) {
  const usuario = String(formData.get('usuario') ?? '').trim();
  const clave = String(formData.get('clave') ?? '');
  const destino = destinoSeguro(formData.get('destino'));
  const volver = (causa: string) =>
    redirect(`/entrar?error=${causa}&destino=${encodeURIComponent(destino)}`);

  if (!usuario || !clave) volver('faltan');

  let supabase;
  try {
    supabase = await supabaseServidor();
  } catch {
    // entorno() lanza cuando faltan las variables de Supabase.
    volver('sin_variables');
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: usuario,
    password: clave,
  });

  if (error) {
    // Queda en el registro del servidor con el detalle completo; a la
    // pantalla solo va la categoría.
    console.error('[entrar] fallo de autenticación:', error.status, error.message);
    volver(causaDe(error));
  }

  redirect(destino);
}

export async function salir() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect('/entrar');
}
