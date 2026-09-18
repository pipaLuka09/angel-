'use server';

import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';

/** Solo aceptamos rutas internas: nadie puede colar ?destino=https://... */
function destinoSeguro(valor: FormDataEntryValue | null): string {
  const s = typeof valor === 'string' ? valor : '';
  return s.startsWith('/') && !s.startsWith('//') ? s : '/';
}

export async function entrar(formData: FormData) {
  const usuario = String(formData.get('usuario') ?? '').trim();
  const clave = String(formData.get('clave') ?? '');
  const destino = destinoSeguro(formData.get('destino'));

  if (!usuario || !clave) {
    redirect(`/entrar?error=faltan&destino=${encodeURIComponent(destino)}`);
  }

  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: usuario,
    password: clave,
  });

  if (error) {
    redirect(`/entrar?error=credenciales&destino=${encodeURIComponent(destino)}`);
  }

  redirect(destino);
}

export async function salir() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect('/entrar');
}
