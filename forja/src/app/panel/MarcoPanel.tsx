import Link from 'next/link';
import { Marca } from '@/components/Marca';
import { salir } from '../entrar/acciones';
import type { GymDelStaff } from '@/lib/panel';

const NAV = [
  { clave: 'resumen',  href: '/panel',           texto: 'Resumen' },
  { clave: 'socios',   href: '/panel/socios',    texto: 'Socios' },
  { clave: 'maquinas', href: '/panel/maquinas',  texto: 'Máquinas' },
  { clave: 'videos',   href: '/panel/videos',    texto: 'Videos' },
  { clave: 'stickers', href: '/panel/stickers',  texto: 'Stickers' },
] as const;

export type ClaveNav = (typeof NAV)[number]['clave'];

export function MarcoPanel({
  gym,
  activo,
  titulo,
  bajada,
  acciones,
  children,
}: {
  gym: GymDelStaff;
  activo: ClaveNav;
  titulo: string;
  bajada?: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <aside className="panel__lateral">
        <Marca />

        <div className="carta" style={{ marginTop: 24, borderRadius: 13, padding: '11px 13px' }}>
          <div className="rotulo rotulo--tenue">Sucursal</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>
            {gym.nombre}
            {gym.sucursal ? ` · ${gym.sucursal}` : ''}
          </div>
        </div>

        <nav className="panel__nav" style={{ marginTop: 22 }}>
          {NAV.map((n) => (
            <Link key={n.clave} href={n.href} aria-current={n.clave === activo ? 'page' : undefined}>
              {n.texto}
            </Link>
          ))}
          <Link href="/">Ir a la app del socio</Link>
        </nav>

        <div className="crece" />

        <form action={salir}>
          <button type="submit" className="boton boton--fantasma" style={{ minHeight: 40, fontSize: 12 }}>
            Cerrar sesión
          </button>
        </form>
      </aside>

      <div className="panel__cuerpo">
        <div className="fila fila--entre" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 className="titulo titulo--chico" style={{ fontSize: 30 }}>{titulo}</h1>
            {bajada && <p className="apunte" style={{ margin: '5px 0 0' }}>{bajada}</p>}
          </div>
          {acciones}
        </div>
        {children}
      </div>
    </div>
  );
}

export function SinAcceso() {
  return (
    <main className="pantalla">
      <Marca />
      <h1 className="titulo titulo--chico" style={{ marginTop: 40 }}>Sin acceso</h1>
      <p className="parrafo" style={{ marginTop: 14 }}>
        Tu cuenta no tiene permisos de administración en ningún gimnasio.
      </p>
      <div className="crece" />
      <Link href="/" className="boton boton--fantasma">Ir al inicio</Link>
    </main>
  );
}
