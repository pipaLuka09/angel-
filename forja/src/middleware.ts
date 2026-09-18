import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SESION_LARGA, entorno } from '@/lib/supabase/cookies';

/**
 * Refresca el token en cada navegación y reescribe la cookie con la
 * duración larga. Sin esto la sesión caducaría a los pocos días y el
 * socio tendría que volver a escribir su contraseña frente a la máquina.
 */
export async function middleware(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const { url, key } = entorno();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(aEscribir) {
        for (const { name, value } of aEscribir) {
          request.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of aEscribir) {
          respuesta.cookies.set(name, value, { ...options, ...SESION_LARGA });
        }
      },
    },
  });

  await supabase.auth.getUser();
  return respuesta;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|woff2)$).*)'],
};
