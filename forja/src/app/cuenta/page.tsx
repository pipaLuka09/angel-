import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Atras } from '@/components/Iconos';
import { supabaseServidor } from '@/lib/supabase/server';
import { salir } from '../entrar/acciones';
import { FormularioClave } from './FormularioClave';

export default async function Cuenta() {
  const supabase = await supabaseServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) redirect('/entrar?destino=%2Fcuenta');

  const { data: perfil } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', sesion.user.id)
    .maybeSingle();

  const temporal = sesion.user.user_metadata?.clave_temporal === true;

  return (
    <main className="pantalla">
      <header className="fila" style={{ gap: 12 }}>
        <Link href="/" className="boton-icono" aria-label="Volver al inicio">
          <Atras tam={18} grosor={2.2} />
        </Link>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Inicio</span>
      </header>

      <h1 className="titulo titulo--chico" style={{ marginTop: 18 }}>Mi cuenta</h1>

      <div className="carta" style={{ marginTop: 16, padding: '14px 16px' }}>
        <div className="rotulo rotulo--tenue">Nombre</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{perfil?.full_name ?? '—'}</div>
        <div className="rotulo rotulo--tenue" style={{ marginTop: 12 }}>Usuario</div>
        <div className="mono" style={{ fontSize: 13, marginTop: 3, color: 'var(--tinta)', wordBreak: 'break-all' }}>
          {sesion.user.email}
        </div>
      </div>

      <section style={{ marginTop: 26 }}>
        <span className="rotulo">Cambiar contraseña</span>
        {temporal && (
          <p className="aviso" style={{ marginTop: 10, borderColor: 'var(--volt)' }}>
            Estás usando una contraseña que te dio recepción. Cámbiala por una tuya.
          </p>
        )}
        <FormularioClave />
      </section>

      <div className="crece" style={{ minHeight: 24 }} />

      <form action={salir}>
        <button type="submit" className="boton boton--fantasma" style={{ minHeight: 44, fontSize: 12 }}>
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
