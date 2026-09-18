import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Marca } from '@/components/Marca';
import { Barras, Nfc } from '@/components/Iconos';
import { supabaseServidor } from '@/lib/supabase/server';
import { uno } from '@/lib/supabase/relacion';
import { salir } from './entrar/acciones';

export default async function Inicio() {
  const supabase = await supabaseServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) redirect('/entrar');

  const { data: perfil } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', sesion.user.id)
    .maybeSingle();

  const { data: membresias } = await supabase
    .from('memberships')
    .select('role, gyms(name, branch_name)')
    .eq('status', 'active');

  const esStaff = (membresias ?? []).some((m) => m.role === 'staff' || m.role === 'owner');
  const gym = uno<{ name: string; branch_name: string | null }>((membresias ?? [])[0]?.gyms);
  const nombre = perfil?.full_name?.split(' ')[0] ?? '';

  return (
    <main className="pantalla">
      <header className="fila fila--entre">
        <Marca />
        {gym && (
          <span className="apunte" style={{ textAlign: 'right' }}>
            {gym.name}
            {gym.branch_name ? ` · ${gym.branch_name}` : ''}
          </span>
        )}
      </header>

      <h1 className="titulo" style={{ marginTop: 40 }}>
        {nombre ? `Hola, ${nombre}` : 'Hola'}
      </h1>

      <div className="carta" style={{ marginTop: 26, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--volt)', flexShrink: 0, marginTop: 2 }}><Nfc tam={22} /></span>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Acerca el celular al sticker</p>
          <p className="parrafo" style={{ marginTop: 6, fontSize: 12.5 }}>
            Cada máquina del gimnasio tiene uno. Al tocarlo se abre tu historial de esa máquina y puedes
            anotar la serie sin escribir nada más.
          </p>
        </div>
      </div>

      {(membresias ?? []).length === 0 && (
        <p className="aviso" style={{ marginTop: 14 }}>
          Tu cuenta todavía no está ligada a ningún gimnasio. Pásate por recepción para que te den de
          alta.
        </p>
      )}

      <div className="crece" />

      {esStaff && (
        <Link href="/panel" className="boton boton--fantasma" style={{ marginBottom: 10 }}>
          <Barras tam={17} color="#D7FF3E" />
          Panel del gimnasio
        </Link>
      )}

      <form action={salir}>
        <button type="submit" className="boton boton--fantasma" style={{ minHeight: 44, fontSize: 12 }}>
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
