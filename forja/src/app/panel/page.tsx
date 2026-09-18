import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Marca } from '@/components/Marca';
import { Alerta } from '@/components/Iconos';
import { supabaseServidor } from '@/lib/supabase/server';
import { uno } from '@/lib/supabase/relacion';
import type { EstacionPanel, Panel } from '@/lib/tipos';
import { salir } from '../entrar/acciones';

function variacion(actual: number, previo: number): string {
  if (previo === 0) return actual > 0 ? 'primera semana con registros' : 'sin registros todavía';
  const pct = Math.round(((actual - previo) / previo) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}% vs. semana pasada`;
}

export default async function PanelGym() {
  const supabase = await supabaseServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) redirect('/entrar?destino=%2Fpanel');

  const { data: membresias } = await supabase
    .from('memberships')
    .select('gym_id, role, gyms(name, branch_name)')
    .eq('status', 'active')
    .in('role', ['staff', 'owner']);

  const membresia = (membresias ?? [])[0];
  if (!membresia) {
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

  const gym = uno<{ name: string; branch_name: string | null }>(membresia.gyms);

  const [{ data: panelData }, { data: estacionesData }] = await Promise.all([
    supabase.rpc('gym_dashboard', { p_gym_id: membresia.gym_id }),
    supabase.rpc('gym_stations', { p_gym_id: membresia.gym_id }),
  ]);

  const panel = panelData as Panel | null;
  const estaciones = (estacionesData as EstacionPanel[] | null) ?? [];
  if (!panel) redirect('/');

  const usoSemanal = panel.members_active > 0
    ? Math.round((panel.active_users_7d / panel.members_active) * 100)
    : 0;

  const indicadores = [
    {
      rotulo: 'Socios con cuenta',
      valor: String(panel.members_active),
      unidad: panel.members_declared ? `de ${panel.members_declared}` : 'activos',
      nota: panel.members_declared
        ? `${Math.round((panel.members_active / panel.members_declared) * 100)}% de los que pagan`
        : 'captura el total de socios para ver el porcentaje',
    },
    {
      rotulo: 'Series esta semana',
      valor: panel.sets_7d.toLocaleString('es-MX'),
      unidad: 'series',
      nota: variacion(panel.sets_7d, panel.sets_prev_7d),
    },
    {
      rotulo: 'Máquinas con sticker',
      valor: String(panel.stations_with_code),
      unidad: `de ${panel.stations_total}`,
      nota: panel.alerts.stations_without_code > 0
        ? `${panel.alerts.stations_without_code} pendientes de asignar`
        : 'todas asignadas',
    },
    {
      rotulo: 'Socios que lo usan',
      valor: String(usoSemanal),
      unidad: '%',
      nota: 'al menos una vez por semana',
    },
  ];

  const maximo = Math.max(1, ...panel.top_stations.map((e) => e.sets));

  return (
    <div className="panel">
      <aside className="panel__lateral">
        <Marca />
        <div className="carta" style={{ marginTop: 24, borderRadius: 13, padding: '11px 13px' }}>
          <div className="rotulo rotulo--tenue">Sucursal</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>
            {gym?.name ?? 'Gimnasio'}{gym?.branch_name ? ` · ${gym.branch_name}` : ''}
          </div>
        </div>
        <nav className="panel__nav" style={{ marginTop: 22 }}>
          <Link href="/panel" aria-current="page">Resumen</Link>
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
        <h1 className="titulo titulo--chico" style={{ fontSize: 30 }}>Resumen</h1>
        <p className="apunte" style={{ margin: '5px 0 0' }}>Últimos 7 días</p>

        <section className="indicadores" style={{ marginTop: 24 }}>
          {indicadores.map((i) => (
            <div key={i.rotulo} className="carta" style={{ borderRadius: 17, padding: '16px 18px' }}>
              <div className="rotulo rotulo--tenue">{i.rotulo}</div>
              <div className="fila fila--base" style={{ gap: 7, marginTop: 7 }}>
                <span className="numerote" style={{ fontSize: 30 }}>{i.valor}</span>
                <span style={{ fontSize: 11.5, color: 'var(--tinta-2)' }}>{i.unidad}</span>
              </div>
              <div className="apunte" style={{ marginTop: 4 }}>{i.nota}</div>
            </div>
          ))}
        </section>

        <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
          <section className="carta" style={{ flexGrow: 1, flexBasis: 420, borderRadius: 17, padding: '18px 20px', minWidth: 0 }}>
            <span className="rotulo">Máquinas y sus stickers</span>
            <table className="tabla" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Estación</th>
                  <th>Ejercicio</th>
                  <th>Código NFC</th>
                  <th className="der">Series 7d</th>
                  <th className="der">Estado</th>
                </tr>
              </thead>
              <tbody>
                {estaciones.map((e) => {
                  const callada = e.status === 'active' && !e.last_scan_at;
                  return (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.label}</td>
                      <td style={{ color: 'var(--tinta-2)' }}>{e.name}</td>
                      <td className="mono">{e.nfc_code ?? '— sin asignar'}</td>
                      <td className="der" style={{ fontWeight: 600 }}>{e.sets_7d}</td>
                      <td className="der">
                        <span className={e.status === 'active' && !callada ? 'insignia insignia--volt' : 'insignia insignia--gris'}>
                          {e.status === 'no_sticker' ? 'Sin sticker' : callada ? 'Sin lecturas' : 'Activa'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {estaciones.length === 0 && (
              <p className="apunte" style={{ marginTop: 14 }}>Este gimnasio todavía no tiene máquinas registradas.</p>
            )}
          </section>

          <div style={{ width: 300, flexGrow: 1, flexBasis: 280, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <section className="carta" style={{ borderRadius: 17, padding: '18px 20px' }}>
              <span className="rotulo">Requiere atención</span>
              <div style={{ marginTop: 13, display: 'flex', flexDirection: 'column', gap: 11 }}>
                {panel.alerts.stations_without_code === 0 && panel.alerts.stations_quiet === 0 && (
                  <p className="apunte" style={{ margin: 0 }}>Nada pendiente. Todos los stickers respondieron esta semana.</p>
                )}
                {panel.alerts.stations_without_code > 0 && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, marginTop: 1, color: 'var(--tinta-2)' }}><Alerta tam={16} /></span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                        {panel.alerts.stations_without_code} máquinas sin sticker
                      </div>
                      <div className="apunte" style={{ marginTop: 2, lineHeight: 1.4 }}>
                        Asígnales código e imprime el sticker.
                      </div>
                    </div>
                  </div>
                )}
                {panel.alerts.stations_quiet > 0 && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, marginTop: 1, color: 'var(--tinta-2)' }}><Alerta tam={16} /></span>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                        {panel.alerts.stations_quiet} stickers sin lecturas
                      </div>
                      <div className="apunte" style={{ marginTop: 2, lineHeight: 1.4 }}>
                        Siete días sin un solo tap: casi siempre está despegado, tapado o dañado.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="carta" style={{ flexGrow: 1, borderRadius: 17, padding: '18px 20px' }}>
              <span className="rotulo">Más usadas esta semana</span>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 13 }}>
                {panel.top_stations.length === 0 && (
                  <p className="apunte" style={{ margin: 0 }}>Todavía no hay registros esta semana.</p>
                )}
                {panel.top_stations.map((e) => (
                  <div key={e.label}>
                    <div className="fila fila--entre" style={{ fontSize: 12 }}>
                      <span style={{ fontWeight: 600 }}>{e.name}</span>
                      <span style={{ color: 'var(--tinta-3)' }}>{e.sets}</span>
                    </div>
                    <div className="barra barra--fina" style={{ marginTop: 6 }}>
                      <div className="barra__relleno" style={{ width: `${Math.round((e.sets / maximo) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
