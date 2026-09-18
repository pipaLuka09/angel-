import { redirect } from 'next/navigation';
import { Marca } from '@/components/Marca';
import { Whatsapp } from '@/components/Iconos';
import { supabaseServidor } from '@/lib/supabase/server';
import { entrar } from './acciones';

const ERRORES: Record<string, string> = {
  faltan: 'Escribe tu usuario y tu contraseña.',
  credenciales: 'Usuario o contraseña incorrectos. Si no los recuerdas, pídelos en recepción.',
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

      <a className="boton boton--fantasma" href="#ayuda" style={{ marginTop: 20 }}>
        <Whatsapp tam={17} color="#D7FF3E" />
        Recuperar mi acceso por WhatsApp
      </a>

      <p id="ayuda" className="apunte" style={{ textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        ¿Aún no tienes cuenta? Pídela en recepción:
        <br />
        viene incluida con tu mensualidad.
      </p>
    </main>
  );
}
