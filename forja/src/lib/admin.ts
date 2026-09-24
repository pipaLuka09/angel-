import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';

/**
 * La administración de la plataforma: quien opera FORJA y le vende a los
 * gimnasios. Devuelve false (en vez de redirigir) para que la página
 * pueda explicar que no hay acceso.
 */
export async function esAdminPlataforma(destino = '/admin'): Promise<boolean> {
  const supabase = await supabaseServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) redirect(`/entrar?destino=${encodeURIComponent(destino)}`);

  const { data } = await supabase.rpc('is_platform_admin');
  return data === true;
}
