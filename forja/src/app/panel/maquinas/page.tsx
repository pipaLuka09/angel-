import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';
import { haceCuanto } from '@/lib/formato';
import type { EstacionPanel } from '@/lib/tipos';
import { MarcoPanel, SinAcceso } from '../MarcoPanel';
import { agregarMaquina, asignarCodigo, quitarCodigo } from './acciones';
import { BotonQuitar } from './BotonQuitar';

export default async function Maquinas({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const gym = await gymDelStaff('/panel/maquinas');
  if (!gym) return <SinAcceso />;

  const supabase = await supabaseServidor();
  const [{ data: estacionesData }, { data: ejerciciosData }] = await Promise.all([
    supabase.rpc('gym_stations', { p_gym_id: gym.gymId }),
    supabase.from('exercises').select('id, name, muscle_group').order('name'),
  ]);

  const estaciones = (estacionesData as EstacionPanel[] | null) ?? [];
  const ejercicios = (ejerciciosData as { id: string; name: string; muscle_group: string | null }[] | null) ?? [];

  const sinCodigo = estaciones.filter((e) => !e.nfc_code).length;
  const calladas = estaciones.filter((e) => e.nfc_code && !e.last_scan_at).length;

  return (
    <MarcoPanel
      gym={gym}
      activo="maquinas"
      titulo="Máquinas"
      bajada={`${estaciones.length} estaciones · ${estaciones.length - sinCodigo} con sticker`}
      acciones={
        <a href="/panel/stickers" className="boton boton--fantasma" style={{ width: 'auto', minHeight: 42, padding: '0 16px' }}>
          Imprimir stickers
        </a>
      }
    >
      {error && <p className="aviso aviso--error" style={{ marginTop: 20 }}>{decodeURIComponent(error)}</p>}

      <div style={{ display: 'flex', gap: 14, marginTop: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <section className="carta" style={{ flexGrow: 1, flexBasis: 520, borderRadius: 17, padding: '18px 20px', minWidth: 0 }}>
          <div className="fila fila--entre">
            <span className="rotulo">Estaciones y sus stickers</span>
            {calladas > 0 && (
              <span className="apunte">{calladas} sin lecturas todavía</span>
            )}
          </div>

          <table className="tabla" style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Estación</th>
                <th>Ejercicio</th>
                <th>Código NFC</th>
                <th className="der">Series 7d</th>
                <th className="der">Último tap</th>
                <th className="der">Sticker</th>
                <th className="der" />
              </tr>
            </thead>
            <tbody>
              {estaciones.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 600 }}>{e.label}</td>
                  <td style={{ color: 'var(--tinta-2)' }}>
                    {e.name}
                    {e.zone && <div className="apunte" style={{ fontSize: 10.5 }}>{e.zone}</div>}
                  </td>
                  <td className="mono">{e.nfc_code ?? '—'}</td>
                  <td className="der" style={{ fontWeight: 600 }}>{e.sets_7d}</td>
                  <td className="der" style={{ color: 'var(--tinta-2)' }}>
                    {e.nfc_code ? (e.last_scan_at ? haceCuanto(e.last_scan_at.slice(0, 10)) : 'nunca') : ''}
                  </td>
                  <td className="der">
                    {e.nfc_code ? (
                      <form action={quitarCodigo} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          type="submit"
                          className="insignia insignia--gris"
                          style={{ border: 0, cursor: 'pointer' }}
                          title="Invalidar este código (sticker perdido o dañado)"
                        >
                          Invalidar
                        </button>
                      </form>
                    ) : (
                      <form action={asignarCodigo} style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={e.id} />
                        <button type="submit" className="insignia insignia--volt" style={{ border: 0, cursor: 'pointer' }}>
                          Asignar código
                        </button>
                      </form>
                    )}
                  </td>
                  <td className="der" style={{ paddingLeft: 8 }}>
                    <BotonQuitar id={e.id} etiqueta={e.label} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {estaciones.length === 0 && (
            <p className="apunte" style={{ marginTop: 14 }}>Este gimnasio todavía no tiene máquinas.</p>
          )}
        </section>

        <div style={{ width: 320, flexGrow: 1, flexBasis: 280, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section className="carta" style={{ borderRadius: 17, padding: '18px 20px' }}>
            <span className="rotulo">Agregar una máquina</span>
            <form action={agregarMaquina} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="rotulo etiqueta" htmlFor="etiqueta">Etiqueta</label>
                <input
                  id="etiqueta" name="etiqueta" type="text" className="campo" required
                  placeholder="#23" autoComplete="off"
                />
                <p className="apunte" style={{ marginTop: 6 }}>Como esté rotulada en el gym.</p>
              </div>
              <div>
                <label className="rotulo etiqueta" htmlFor="ejercicio">Ejercicio</label>
                <select id="ejercicio" name="ejercicio" className="campo" defaultValue="">
                  <option value="">— sin asignar —</option>
                  {ejercicios.map((ej) => (
                    <option key={ej.id} value={ej.id}>
                      {ej.name}{ej.muscle_group ? ` · ${ej.muscle_group}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="rotulo etiqueta" htmlFor="zona">Zona (opcional)</label>
                <input id="zona" name="zona" type="text" className="campo" placeholder="Piernas" autoComplete="off" />
              </div>
              <button type="submit" className="boton boton--principal" style={{ minHeight: 48, fontSize: 15 }}>
                AGREGAR
              </button>
            </form>
          </section>

          <section className="carta" style={{ borderRadius: 17, padding: '18px 20px' }}>
            <span className="rotulo">Sobre invalidar</span>
            <p className="apunte" style={{ margin: '8px 0 0', lineHeight: 1.5 }}>
              Si un sticker se despega o se lo llevan, invalida su código: deja de funcionar al
              instante y la máquina vuelve a la lista de pendientes para imprimir uno nuevo. El
              historial de los socios no se pierde.
            </p>
            <p className="apunte" style={{ margin: '8px 0 0', lineHeight: 1.5 }}>
              Si la máquina ya no está en el gimnasio, quítala. Tampoco se pierde nada del historial:
              cada serie guarda su ejercicio aparte de la máquina.
            </p>
          </section>
        </div>
      </div>
    </MarcoPanel>
  );
}
