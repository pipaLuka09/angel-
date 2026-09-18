import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SESION_LARGA, entorno } from './cookies';

export async function supabaseServidor() {
  const { url, key } = entorno();
  const almacen = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(aEscribir) {
        try {
          for (const { name, value, options } of aEscribir) {
            almacen.set(name, value, { ...options, ...SESION_LARGA });
          }
        } catch {
          // Se llamó desde un Server Component, donde no se pueden
          // escribir cookies. El middleware ya refrescó la sesión.
        }
      },
    },
  });
}
