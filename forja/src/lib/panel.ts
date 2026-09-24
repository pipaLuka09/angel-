import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import { uno } from '@/lib/supabase/relacion';

export type GymDelStaff = {
  gymId: string;
  nombre: string;
  sucursal: string | null;
  prefijo: string;
  slug: string;
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
    .select('gym_id, role, gyms(name, branch_name, slug, code_prefix, declared_member_count, status)')
    .eq('status', 'active')
    .in('role', ['staff', 'owner']);

  // Un gimnasio suspendido por la plataforma no cuenta: la base ya le
  // niega todo (is_staff_of), así que mostrarle el panel solo daría
  // pantallas vacías y errores. SinAcceso explica qué pasó.
  const membresia = (data ?? []).find(
    (m) => uno<{ status: string }>(m.gyms)?.status === 'active',
  );
  if (!membresia) return null;

  const gym = uno<{
    name: string;
    branch_name: string | null;
    slug: string;
    code_prefix: string;
    declared_member_count: number | null;
  }>(membresia.gyms);

  return {
    gymId: membresia.gym_id,
    nombre: gym?.name ?? 'Gimnasio',
    sucursal: gym?.branch_name ?? null,
    prefijo: gym?.code_prefix ?? '',
    slug: gym?.slug ?? '',
    sociosDeclarados: gym?.declared_member_count ?? null,
    rol: membresia.role as 'staff' | 'owner',
  };
}

/**
 * Nombre del gimnasio suspendido al que pertenece quien está viendo, si
 * lo hay. Sirve para decirle por qué no puede entrar en vez de un
 * genérico "sin acceso".
 */
export async function gymSuspendido(): Promise<string | null> {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from('memberships')
    .select('gyms(name, status)')
    .eq('status', 'active');

  for (const m of data ?? []) {
    const g = uno<{ name: string; status: string }>(m.gyms);
    if (g?.status === 'suspended') return g.name;
  }
  return null;
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
