import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Marca } from '@/components/Marca';
import { supabaseServidor } from '@/lib/supabase/server';
import { entrar } from './acciones';

const ERRORES: Record<string, string> = {
  faltan: 'Escribe tu usuario y tu contraseña.',
  credenciales: 'Usuario o contraseña incorrectos. Si no los recuerdas, pídelos en recepción.',
  sin_confirmar: 'Esta cuenta todavía no está confirmada. Avísale a recepción.',
  demasiados_intentos: 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.',
  // Las tres siguientes no son culpa de quien entra: son del despliegue.
  // Se distinguen a propósito, para no mandar a nadie a revisar su
  // contraseña cuando el problema está en la configuración.
  configuracion:
    'La app no pudo autenticarse contra Supabase. Revisa NEXT_PUBLIC_SUPABASE_ANON_KEY en el despliegue: no es tu contraseña.',
  sin_variables:
    'Faltan las variables de Supabase en el despliegue (NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY).',
  conexion: 'No se pudo contactar a Supabase. Revisa que el proyecto no esté pausado.',
  desconocido: 'No pudimos entrar y no fue por la contraseña. Revisa el registro del servidor.',
};

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; destino?: string }>;
}) {
  const { error, destino } = await searchParams;

  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect(destino && destino.startsWith('/') ? destino : '/');

  return (
    <main className="pantalla" style={{ paddingTop: 44 }}>
      <Marca grande />

      <h1 className="titulo titulo--chico" style={{ marginTop: 34 }}>
        Tu gym ya
        <br />
        te dio de alta
      </h1>
      <p className="parrafo" style={{ marginTop: 12 }}>
        Entra una sola vez. Después solo acercas el celular al sticker de cada máquina y ya estás dentro.
      </p>

      <form action={entrar} style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input type="hidden" name="destino" value={destino ?? '/'} />

        <div>
          <label className="rotulo etiqueta" htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            name="usuario"
            type="email"
            className="campo"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            required
          />
        </div>

        <div>
          <label className="rotulo etiqueta" htmlFor="clave">Contraseña</label>
          <input
            id="clave"
            name="clave"
            type="password"
            className="campo"
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="aviso aviso--error">{ERRORES[error] ?? 'No pudimos entrar. Intenta de nuevo.'}</p>}

        <div className="carta" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D7FF3E" strokeWidth="2.4"
               strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
            <path d="M4 12.5l5.5 5.5L20 7" />
          </svg>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Tu sesión se queda en este celular</p>
            <p className="apunte" style={{ margin: '3px 0 0', lineHeight: 1.45 }}>
              No vuelves a escribir la contraseña cada vez que tocas un sticker.
            </p>
          </div>
        </div>

        <button type="submit" className="boton boton--principal" style={{ marginTop: 6 }}>
          ENTRAR
        </button>
      </form>

      <div className="crece" />

      <details className="carta" style={{ marginTop: 20, padding: '14px 16px' }}>
        <summary style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>¿Olvidaste tu contraseña?</summary>
        <p className="apunte" style={{ margin: '10px 0 0', lineHeight: 1.5 }}>
          Pídele a recepción una contraseña nueva. Te la genera en un momento y tu historial no se pierde. Después
          puedes cambiarla por una tuya en <strong style={{ color: 'var(--tinta-2)' }}>Mi cuenta</strong>.
        </p>
      </details>

      <p id="ayuda" className="apunte" style={{ textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        ¿Aún no tienes cuenta?{' '}
        <Link href={`/registro?destino=${encodeURIComponent(destino ?? '/')}`} style={{ fontWeight: 600 }}>
          Créala aquí
        </Link>
        <br />
        o pídela en recepción: viene incluida con tu mensualidad.
      </p>
    </main>
  );
}
