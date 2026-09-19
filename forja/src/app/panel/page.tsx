import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';
import type { Panel } from '@/lib/tipos';
import { Alerta } from '@/components/Iconos';
import { MarcoPanel, SinAcceso } from './MarcoPanel';
import { guardarSociosDeclarados } from './acciones';

function variacion(actual: number, previo: number): string {
  if (previo === 0) return actual > 0 ? 'primera semana con registros' : 'sin registros todavía';
  const pct = Math.round(((actual - previo) / previo) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}% vs. semana pasada`;
}

export default async function Resumen({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const gym = await gymDelStaff();
  if (!gym) return <SinAcceso />;

  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc('gym_dashboard', { p_gym_id: gym.gymId });
  const panel = data as Panel | null;

  if (!panel) {
    return (
      <MarcoPanel gym={gym} activo="resumen" titulo="Resumen">
        <p className="aviso" style={{ marginTop: 24 }}>
          No se pudieron leer los indicadores de este gimnasio.
        </p>
      </MarcoPanel>
    );
  }

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
    <MarcoPanel gym={gym} activo="resumen" titulo="Resumen" bajada="Últimos 7 días">
      {error && (
        <p className="aviso aviso--error" style={{ marginTop: 20 }}>
          {error === 'total' ? 'El total de socios tiene que ser un número.' : 'No se pudo guardar.'}
        </p>
      )}

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

      <div style={{ display: 'flex', gap: 14, marginTop: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <section className="carta" style={{ flexGrow: 1, flexBasis: 420, borderRadius: 17, padding: '18px 20px', minWidth: 0 }}>
          <span className="rotulo">Más usadas esta semana</span>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 13 }}>
            {panel.top_stations.length === 0 && (
              <p className="apunte" style={{ margin: 0 }}>Todavía no hay registros esta semana.</p>
            )}
            {panel.top_stations.map((e) => (
              <div key={e.label}>
                <div className="fila fila--entre" style={{ fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>
                    <span style={{ color: 'var(--tinta-3)' }}>{e.label}</span> {e.name}
                  </span>
                  <span style={{ color: 'var(--tinta-3)' }}>{e.sets}</span>
                </div>
                <div className="barra barra--fina" style={{ marginTop: 6 }}>
                  <div className="barra__relleno" style={{ width: `${Math.round((e.sets / maximo) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ width: 300, flexGrow: 1, flexBasis: 280, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section className="carta" style={{ borderRadius: 17, padding: '18px 20px' }}>
            <span className="rotulo">Requiere atención</span>
            <div style={{ marginTop: 13, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {panel.alerts.stations_without_code === 0 && panel.alerts.stations_quiet === 0 && (
                <p className="apunte" style={{ margin: 0 }}>
                  Nada pendiente. Todos los stickers respondieron esta semana.
                </p>
              )}
              {panel.alerts.stations_without_code > 0 && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, marginTop: 1, color: 'var(--tinta-2)' }}><Alerta tam={16} /></span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {panel.alerts.stations_without_code} máquinas sin sticker
                    </div>
                    <div className="apunte" style={{ marginTop: 2, lineHeight: 1.4 }}>
                      Asígnales código en Máquinas y imprímelos.
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

          <section className="carta" style={{ borderRadius: 17, padding: '18px 20px' }}>
            <span className="rotulo">Total de socios del gym</span>
            <p className="apunte" style={{ margin: '8px 0 0', lineHeight: 1.45 }}>
              Cuántas mensualidades cobras en total. Es el denominador de &ldquo;X de Y tienen cuenta&rdquo;.
            </p>
            <form action={guardarSociosDeclarados} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <label className="sr-only" htmlFor="total">Total de socios</label>
              <input
                id="total" name="total" type="number" min="0" step="1" inputMode="numeric"
                className="campo" style={{ height: 44, flexGrow: 1 }}
                defaultValue={gym.sociosDeclarados ?? ''}
                placeholder="260"
              />
              <button type="submit" className="boton boton--fantasma" style={{ width: 'auto', minHeight: 44, padding: '0 16px' }}>
                Guardar
              </button>
            </form>
          </section>
        </div>
      </div>
    </MarcoPanel>
  );
}
