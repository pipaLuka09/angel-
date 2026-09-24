import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';
import { haceCuanto } from '@/lib/formato';
import { MarcoPanel, SinAcceso } from '../MarcoPanel';
import { FormularioAlta } from './FormularioAlta';
import { BotonNuevaClave } from './BotonNuevaClave';
import { aprobarSolicitud, rechazarSolicitud } from './acciones';
import { BotonEstado } from './BotonEstado';
import { baseUrl } from '@/lib/url';

type Socio = {
  user_id: string;
  full_name: string;
  email: string | null;
  member_code: string | null;
  role: 'member' | 'staff' | 'owner';
  status: 'active' | 'paused' | 'cancelled' | 'pending';
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
  const todos = (data as Socio[] | null) ?? [];
  const pendientes = todos.filter((s) => s.status === 'pending');
  const socios = todos.filter((s) => s.status !== 'pending');
  const linkRegistro = `${await baseUrl()}/registro?gym=${gym.slug}`;

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
          {pendientes.length > 0 && (
            <section className="carta" style={{ borderRadius: 17, padding: '18px 20px', marginBottom: 14, borderColor: 'var(--volt)' }}>
              <div className="fila fila--entre">
                <span className="rotulo" style={{ color: 'var(--volt)' }}>Solicitudes para entrar</span>
                <span className="insignia insignia--volt">{pendientes.length}</span>
              </div>
              <p className="apunte" style={{ margin: '6px 0 0', lineHeight: 1.45 }}>
                Se registraron solos. Hasta que las apruebes no ven ni registran nada.
              </p>
              <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
                {pendientes.map((p, i) => (
                  <li key={p.user_id} className="fila" style={{ gap: 10, flexWrap: 'wrap', padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid var(--borde-2)' }}>
                    <div style={{ flexGrow: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.full_name}</div>
                      <div className="mono" style={{ wordBreak: 'break-all' }}>{p.email ?? '—'}</div>
                      <div className="apunte" style={{ fontSize: 10.5 }}>Se registró {haceCuanto(p.joined_at)}</div>
                    </div>
                    <form action={rechazarSolicitud}>
                      <input type="hidden" name="userId" value={p.user_id} />
                      <button type="submit" className="boton boton--fantasma" style={{ width: 'auto', minHeight: 44, padding: '0 14px' }}>
                        Rechazar
                      </button>
                    </form>
                    <form action={aprobarSolicitud}>
                      <input type="hidden" name="userId" value={p.user_id} />
                      <button type="submit" className="boton boton--principal" style={{ width: 'auto', minHeight: 44, padding: '0 18px', fontSize: 14 }}>
                        APROBAR
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          )}

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
                  <th className="der">Acceso</th>
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
                      {s.role === 'member' || (s.role === 'staff' && gym.rol === 'owner') ? (
                        // Solo un letrero: tocarlo no hace nada. Pausar es un
                        // botón aparte que pide confirmación, porque antes el
                        // letrero pausaba con un toque y era fácil hacerlo sin querer.
                        <span className={s.status === 'active' ? 'insignia insignia--volt' : 'insignia insignia--gris'}>
                          {s.status === 'active' ? 'Activo' : s.status === 'paused' ? 'Pausado' : 'Cancelado'}
                        </span>
                      ) : (
                        <span className="insignia insignia--gris">{ROL[s.role]}</span>
                      )}
                    </td>
                    <td className="der" style={{ paddingLeft: 10 }}>
                      {/* El dueño gestiona también a recepción; recepción solo a los socios. */}
                      {(s.role === 'member' || (s.role === 'staff' && gym.rol === 'owner')) && (
                        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'flex-start', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <BotonNuevaClave userId={s.user_id} nombre={s.full_name} />
                          <BotonEstado userId={s.user_id} nombre={s.full_name} activo={s.status === 'active'} />
                        </span>
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

        <div style={{ width: 340, flexGrow: 1, flexBasis: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section className="carta" style={{ borderRadius: 17, padding: '18px 20px' }}>
            <span className="rotulo">Que se registren solos</span>
            <p className="apunte" style={{ margin: '8px 0 0', lineHeight: 1.5 }}>
              Comparte este link por WhatsApp o pégalo en recepción. Quien se registre te aparece arriba para aprobarlo.
            </p>
            <p className="mono" style={{ margin: '10px 0 0', padding: '10px 12px', background: 'var(--carta-2)', borderRadius: 10, wordBreak: 'break-all', color: 'var(--tinta)', userSelect: 'all' }}>
              {linkRegistro}
            </p>
            <p className="apunte" style={{ margin: '10px 0 0', lineHeight: 1.5 }}>
              Si alguien entra sin el link, le pide el código del gimnasio:{' '}
              <strong className="mono" style={{ color: 'var(--volt)', fontSize: 13 }}>{gym.prefijo.toUpperCase()}</strong>
            </p>
          </section>
          <FormularioAlta puedeCrearRecepcion={gym.rol === 'owner'} />
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
