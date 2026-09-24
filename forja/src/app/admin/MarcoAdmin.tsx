import Link from 'next/link';
import { Marca } from '@/components/Marca';
import { salir } from '../entrar/acciones';

export function MarcoAdmin({
  titulo,
  bajada,
  acciones,
  children,
}: {
  titulo: string;
  bajada?: string;
  acciones?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <aside className="panel__lateral">
        <Marca />
        <div className="carta" style={{ marginTop: 24, borderRadius: 13, padding: '11px 13px', borderColor: 'var(--volt)' }}>
          <div className="rotulo rotulo--tenue">Administración</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>Plataforma FORJA</div>
        </div>
        <nav className="panel__nav" style={{ marginTop: 22 }}>
          <Link href="/admin">Gimnasios</Link>
          <Link href="/admin/nuevo">Dar de alta un gimnasio</Link>
          <Link href="/">Ir a la app</Link>
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

export function SinAccesoAdmin() {
  return (
    <main className="pantalla">
      <Marca />
      <h1 className="titulo titulo--chico" style={{ marginTop: 40 }}>Sin acceso</h1>
      <p className="parrafo" style={{ marginTop: 14 }}>
        Esta sección es solo para la administración de la plataforma FORJA.
      </p>
      <div className="crece" />
      <Link href="/" className="boton boton--fantasma">Ir al inicio</Link>
    </main>
  );
}
