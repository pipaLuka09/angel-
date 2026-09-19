import { createClient } from '@supabase/supabase-js';

/**
 * Cliente con la clave de servicio. SALTA TODAS LAS POLÍTICAS RLS.
 *
 * Se usa solo para una cosa: crear la cuenta de Auth de un socio nuevo
 * desde el panel. Eso es una operación de administración que la clave
 * pública no puede hacer.
 *
 * Reglas de uso, no negociables:
 *  - Solo desde Server Actions o Route Handlers. Nunca en un componente
 *    de cliente: la clave no debe llegar al navegador jamás.
 *  - La variable se llama SUPABASE_SERVICE_ROLE_KEY, sin el prefijo
 *    NEXT_PUBLIC_, precisamente para que Next no la incruste en el
 *    bundle del cliente.
 *  - Antes de cada uso hay que verificar a mano que quien llama tiene
 *    permiso, porque aquí RLS no defiende nada.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY. El alta de socios desde el panel la necesita. ' +
        'Está en Supabase → Project Settings → API → service_role.',
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
