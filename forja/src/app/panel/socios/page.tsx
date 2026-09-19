import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';
import { haceCuanto } from '@/lib/formato';
import { MarcoPanel, SinAcceso } from '../MarcoPanel';
import { FormularioAlta } from './FormularioAlta';
import { cambiarEstadoSocio } from './acciones';

type Socio = {
  user_id: string;
  full_name: string;
  email: string | null;
  member_code: string | null;
  role: 'member' | 'staff' | 'owner';
  status: 'active' | 'paused' | 'cancelled';
  joined_at: string;
  last_session: string | null;
  session_count: number;
};

const ROL: Record<Socio['role'], string> = { member: 'Socio', staff: 'Recepción', owner: 'Dueño' };

export default async function Socios() {
  const gym = await gymDelStaff('/panel/socios');
  if (!gym) return <SinAcceso />;

  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc('gym_members', { p_gym_id: gym.gymId });
  const socios = (data as Socio[] | null) ?? [];

  const activos = socios.filter((s) => s.role === 'member' && s.status === 'active');
  const nuncaUsaron = activos.filter((s) => s.session_count === 0).length;
  const dormidos = activos.filter(
    (s) => s.session_count > 0 && (s.last_session === null || diasDe(s.last_session) > 14),
  ).length;

  return (
    <MarcoPanel
      gym={gym}
      activo="socios"
      titulo="Socios"
      bajada={`${activos.length} con cuenta activa${gym.sociosDeclarados ? ` de ${gym.sociosDeclarados} que pagan` : ''}`}
    >
      <div style={{ display: 'flex', gap: 14, marginTop: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flexGrow: 1, flexBasis: 480, minWidth: 0 }}>
          {(nuncaUsaron > 0 || dormidos > 0) && (
            <p className="aviso" style={{ marginBottom: 14 }}>
              {nuncaUsaron > 0 && <>{nuncaUsaron} socios tienen cuenta pero nunca han registrado nada. </>}
              {dormidos > 0 && <>{dormidos} no registran nada desde hace más de dos semanas. </>}
              Son las llamadas de retención que valen la pena.
            </p>
          )}

          <section className="carta" style={{ borderRadius: 17, padding: '18px 20px' }}>
            <div className="fila fila--entre">
              <span className="rotulo">Todos los socios</span>
              <span className="apunte">{socios.length} cuentas</span>
            </div>

            <table className="tabla" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th className="der">Sesiones</th>
                  <th className="der">Última</th>
                  <th className="der">Estado</th>
                </tr>
              </thead>
              <tbody>
                {socios.map((s) => (
                  <tr key={s.user_id}>
                    <td style={{ fontWeight: 600 }}>
                      {s.full_name}
                      {s.role !== 'member' && (
                        <span className="insignia insignia--gris" style={{ marginLeft: 8, fontSize: 9.5 }}>
                          {ROL[s.role]}
                        </span>
                      )}
                      {s.member_code && (
                        <div className="apunte" style={{ fontSize: 10.5 }}>{s.member_code}</div>
                      )}
                    </td>
                    <td className="mono" style={{ wordBreak: 'break-all' }}>{s.email ?? '—'}</td>
                    <td className="der" style={{ fontWeight: 600 }}>{s.session_count}</td>
                    <td className="der" style={{ color: 'var(--tinta-2)' }}>
                      {s.last_session ? haceCuanto(s.last_session) : 'nunca'}
                    </td>
                    <td className="der">
                      {s.role === 'member' ? (
                        <form action={cambiarEstadoSocio} style={{ display: 'inline' }}>
                          <input type="hidden" name="userId" value={s.user_id} />
                          <input type="hidden" name="estado" value={s.status === 'active' ? 'paused' : 'active'} />
                          <button
                            type="submit"
                            className={s.status === 'active' ? 'insignia insignia--volt' : 'insignia insignia--gris'}
                            style={{ border: 0, cursor: 'pointer' }}
                            title={s.status === 'active' ? 'Pausar el acceso' : 'Reactivar el acceso'}
                          >
                            {s.status === 'active' ? 'Activo' : s.status === 'paused' ? 'Pausado' : 'Cancelado'}
                          </button>
                        </form>
                      ) : (
                        <span className="insignia insignia--gris">{ROL[s.role]}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {socios.length === 0 && (
              <p className="apunte" style={{ marginTop: 14 }}>Todavía no hay nadie dado de alta.</p>
            )}

            <p className="apunte" style={{ marginTop: 14, lineHeight: 1.5 }}>
              Aquí no aparece cuánto peso levanta nadie, y no es un pendiente: esos datos son del socio.
              El gimnasio ve <strong style={{ color: 'var(--tinta-2)' }}>si</strong> y{' '}
              <strong style={{ color: 'var(--tinta-2)' }}>cuándo</strong> entrenó, nunca qué cargó.
            </p>
          </section>
        </div>

        <div style={{ width: 340, flexGrow: 1, flexBasis: 300 }}>
          <FormularioAlta />
        </div>
      </div>
    </MarcoPanel>
  );
}

function diasDe(iso: string): number {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  const then = Date.UTC(a, m - 1, d);
  const hoy = new Date();
  const now = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  return Math.round((now - then) / 86_400_000);
}
