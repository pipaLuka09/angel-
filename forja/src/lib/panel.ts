import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import { uno } from '@/lib/supabase/relacion';

export type GymDelStaff = {
  gymId: string;
  nombre: string;
  sucursal: string | null;
  prefijo: string;
  sociosDeclarados: number | null;
  rol: 'staff' | 'owner';
};

/**
 * Resuelve el gimnasio que administra quien está viendo el panel, o lo
 * saca de ahí. Todo /panel/* pasa por aquí.
 *
 * Devuelve null (en vez de redirigir) cuando hay sesión pero sin permisos
 * de administración, para que la página pueda explicarlo en vez de dejar
 * a la persona en un bucle de redirecciones.
 */
export async function gymDelStaff(destino = '/panel'): Promise<GymDelStaff | null> {
  const supabase = await supabaseServidor();

  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) redirect(`/entrar?destino=${encodeURIComponent(destino)}`);

  const { data } = await supabase
    .from('memberships')
    .select('gym_id, role, gyms(name, branch_name, code_prefix, declared_member_count)')
    .eq('status', 'active')
    .in('role', ['staff', 'owner']);

  const membresia = (data ?? [])[0];
  if (!membresia) return null;

  const gym = uno<{
    name: string;
    branch_name: string | null;
    code_prefix: string;
    declared_member_count: number | null;
  }>(membresia.gyms);

  return {
    gymId: membresia.gym_id,
    nombre: gym?.name ?? 'Gimnasio',
    sucursal: gym?.branch_name ?? null,
    prefijo: gym?.code_prefix ?? '',
    sociosDeclarados: gym?.declared_member_count ?? null,
    rol: membresia.role as 'staff' | 'owner',
  };
}

/** Contraseña temporal legible, para que recepción la pueda dictar o anotar. */
export function claveTemporal(): string {
  const consonantes = 'bcdfghjkmnpqrstvwxz';
  const vocales = 'aeiou';
  const digitos = '23456789';
  const azar = (s: string) => s[Math.floor(Math.random() * s.length)];

  let silabas = '';
  for (let i = 0; i < 3; i++) silabas += azar(consonantes) + azar(vocales);

  let numero = '';
  for (let i = 0; i < 3; i++) numero += azar(digitos);

  return `${silabas}-${numero}`;
}
