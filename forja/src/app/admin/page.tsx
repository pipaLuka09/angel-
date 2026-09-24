import Link from 'next/link';
import { supabaseServidor } from '@/lib/supabase/server';
import { esAdminPlataforma } from '@/lib/admin';
import { haceCuanto } from '@/lib/formato';
import { MarcoAdmin, SinAccesoAdmin } from './MarcoAdmin';
import { BotonEstadoGym } from './BotonEstadoGym';

type GymAdmin = {
  id: string;
  name: string;
  branch_name: string | null;
  slug: string;
  code_prefix: string;
  status: 'active' | 'suspended';
  created_at: string;
  owner_email: string | null;
  members_active: number;
  members_pending: number;
  stations: number;
  sets_7d: number;
  last_activity: string | null;
};

export default async function Admin() {
  if (!(await esAdminPlataforma())) return <SinAccesoAdmin />;

  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc('admin_gyms');
  const gyms = (data as GymAdmin[] | null) ?? [];

  const activos = gyms.filter((g) => g.status === 'active');
  const socios = activos.reduce((t, g) => t + g.members_active, 0);
  const series = activos.reduce((t, g) => t + g.sets_7d, 0);

  const indicadores = [
    { rotulo: 'Gimnasios activos', valor: activos.length, nota: `${gyms.length - activos.length} suspendidos` },
    { rotulo: 'Socios con acceso', valor: socios, nota: 'en gimnasios activos' },
    { rotulo: 'Series esta semana', valor: series, nota: 'en toda la plataforma' },
  ];

  return (
    <MarcoAdmin
      titulo="Gimnasios"
      bajada="Todos los gimnasios que usan FORJA"
      acciones={
        <Link href="/admin/nuevo" className="boton boton--principal" style={{ width: 'auto', minHeight: 44, padding: '0 18px', fontSize: 15 }}>
          + DAR DE ALTA UN GIMNASIO
        </Link>
      }
    >
      <section className="indicadores" style={{ marginTop: 24 }}>
        {indicadores.map((i) => (
          <div key={i.rotulo} className="carta" style={{ borderRadius: 17, padding: '16px 18px' }}>
            <div className="rotulo rotulo--tenue">{i.rotulo}</div>
            <div className="numerote" style={{ fontSize: 30, marginTop: 7 }}>{i.valor}</div>
            <div className="apunte" style={{ marginTop: 4 }}>{i.nota}</div>
          </div>
        ))}
      </section>

      <section className="carta" style={{ marginTop: 18, borderRadius: 17, padding: '18px 20px', overflowX: 'auto' }}>
        <table className="tabla" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th>Gimnasio</th>
              <th>Código</th>
              <th>Dueño</th>
              <th className="der">Socios</th>
              <th className="der">Máquinas</th>
              <th className="der">Series 7d</th>
              <th className="der">Último uso</th>
              <th className="der">Estado</th>
            </tr>
          </thead>
          <tbody>
            {gyms.map((g) => (
              <tr key={g.id}>
                <td style={{ fontWeight: 600 }}>
                  {g.name}
                  {g.branch_name && <div className="apunte" style={{ fontSize: 10.5 }}>{g.branch_name}</div>}
                </td>
                <td className="mono" style={{ color: 'var(--volt)' }}>{g.code_prefix.toUpperCase()}</td>
                <td className="mono" style={{ wordBreak: 'break-all' }}>{g.owner_email ?? '—'}</td>
                <td className="der" style={{ fontWeight: 600 }}>
                  {g.members_active}
                  {g.members_pending > 0 && (
                    <div className="apunte" style={{ fontSize: 10.5, color: 'var(--volt)' }}>+{g.members_pending} en espera</div>
                  )}
                </td>
                <td className="der">{g.stations}</td>
                <td className="der" style={{ fontWeight: 600 }}>{g.sets_7d}</td>
                <td className="der" style={{ color: 'var(--tinta-2)' }}>
                  {g.last_activity ? haceCuanto(g.last_activity.slice(0, 10)) : 'nunca'}
                </td>
                <td className="der">
                  <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <span className={g.status === 'active' ? 'insignia insignia--volt' : 'insignia insignia--gris'}>
                      {g.status === 'active' ? 'Activo' : 'Suspendido'}
                    </span>
                    <BotonEstadoGym id={g.id} nombre={g.name} activo={g.status === 'active'} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {gyms.length === 0 && <p className="apunte" style={{ marginTop: 14 }}>Todavía no hay gimnasios.</p>}
      </section>

      <p className="apunte" style={{ marginTop: 14, lineHeight: 1.5, maxWidth: 640 }}>
        Suspender un gimnasio (por ejemplo, por falta de pago) deja a su staff y a sus socios sin acceso, sin borrar
        nada. Al reactivarlo todo vuelve como estaba. La plataforma, igual que cada gimnasio, ve cuántas series hay,
        nunca qué levanta nadie.
      </p>
    </MarcoAdmin>
  );
}
