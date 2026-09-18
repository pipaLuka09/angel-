import type { CookieOptions } from '@supabase/ssr';

/**
 * El socio entra UNA vez, cuando se inscribe en el gym. A partir de ahí
 * tocar el sticker tiene que dejarlo dentro sin escribir nada: nadie
 * teclea una contraseña sudado y entre series.
 *
 * Por eso la cookie de sesión dura ~13 meses. Supabase renueva el token
 * solo mientras la persona siga usando la app, así que en la práctica la
 * sesión no caduca mientras siga yendo al gimnasio.
 */
export const SESION_LARGA: CookieOptions = {
  maxAge: 60 * 60 * 24 * 400,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function entorno() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example a .env.local.',
    );
  }
  return { url, key };
}
