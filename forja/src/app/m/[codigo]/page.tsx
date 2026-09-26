import Link from 'next/link';
import { Marca } from '@/components/Marca';
import { Cara } from '@/components/Cara';
import { Barras, Mas, Nfc, Video } from '@/components/Iconos';
import { fechaCorta, haceCuanto, peso, progresoMeta, diasHasta } from '@/lib/formato';
import { estacionDelSticker, resumenDe } from './datos';
import { NoEresSocio, SinEjercicio, StickerDesconocido } from './no-reconocido';

export default async function Maquina({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const { supabase, estacion, usuario } = await estacionDelSticker(codigo);

  if (!estacion) return <StickerDesconocido />;
  if (!estacion.is_member) return <NoEresSocio estacion={estacion} codigo={codigo} />;

  // Se registra la lectura aunque no anote nada: es lo que deja
  // distinguir un sticker despegado de una máquina que nadie usa.
  await supabase.from('scans').insert({ station_id: estacion.station_id, user_id: usuario.id });

  if (!estacion.exercise_id) return <SinEjercicio estacion={estacion} />;

  const resumen = estacion.exercise_id ? await resumenDe(supabase, estacion.exercise_id) : null;
  const ultima = resumen?.last ?? null;
  const previa = resumen?.previous ?? null;
  const meta = resumen?.goal ?? null;

  const delta = ultima && previa ? Number(ultima.top_weight) - Number(previa.top_weight) : null;
  const faltan = meta && resumen?.record !== null && resumen?.record !== undefined
    ? Number(meta.target_weight_kg) - Number(resumen.record)
    : null;
  const diasRestantes = meta ? diasHasta(meta.target_date) : null;

  return (
    <main className="pantalla">
      <header className="fila fila--entre">
        <Marca />
        <div className="fila" style={{ gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--tinta-2)', textAlign: 'right', lineHeight: 1.25 }}>
            {estacion.gym_name}
            {estacion.gym_branch && (
              <>
                <br />
                <span style={{ color: 'var(--tinta-3)' }}>{estacion.gym_branch}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="fila" style={{ gap: 7, marginTop: 22, color: 'var(--volt)' }}>
        <Nfc tam={14} />
        <span style={{ fontSize: 10.5, letterSpacing: 1.6, fontWeight: 600 }}>
          ESTACIÓN {estacion.label}
          {estacion.zone ? ` · ${estacion.zone.toUpperCase()}` : ''}
        </span>
      </div>

      <h1 className="titulo" style={{ marginTop: 8 }}>{estacion.station_name}</h1>

      {/* ---------------------- última vez ---------------------- */}
      <section className="carta" style={{ marginTop: 20 }}>
        {ultima ? (
          <>
            <div className="fila fila--entre fila--base">
              <span className="rotulo">Tu última vez</span>
              <span className="apunte">
                {haceCuanto(ultima.session_date)} · {fechaCorta(ultima.session_date)}
              </span>
            </div>

            <div className="fila" style={{ alignItems: 'flex-end', gap: 10, marginTop: 10 }}>
              {Number(ultima.top_weight) === 0 ? (
                // 0 kg en dominadas o fondos no es "cero": es peso corporal.
                <span className="numerote" style={{ fontSize: 34, color: 'var(--volt)', lineHeight: 1 }}>
                  PESO CORPORAL
                </span>
              ) : (
                <>
                  <span className="numerote" style={{ fontSize: 58, color: 'var(--volt)' }}>
                    {peso(ultima.top_weight)}
                  </span>
                  <span className="numerote" style={{ fontSize: 20, color: 'var(--tinta-2)', paddingBottom: 5 }}>KG</span>
                </>
              )}
              {delta !== null && delta !== 0 && (
                <span className="insignia insignia--volt" style={{ marginLeft: 'auto', marginBottom: 6 }}>
                  {delta > 0 ? '+' : ''}{peso(delta)} kg
                </span>
              )}
            </div>

            <div className="fila" style={{ gap: 8, marginTop: 16 }}>
              <div className="caja" style={{ flexGrow: 1 }}>
                <div className="rotulo rotulo--tenue">Series</div>
                <div className="numerote" style={{ fontSize: 21, marginTop: 2 }}>{ultima.set_count}</div>
              </div>
              <div className="caja" style={{ flexGrow: 1 }}>
                <div className="rotulo rotulo--tenue">Reps</div>
                <div className="numerote" style={{ fontSize: 21, marginTop: 2 }}>{ultima.top_reps}</div>
              </div>
              <div className="caja" style={{ flexGrow: 1 }}>
                <div className="rotulo rotulo--tenue">Sensación</div>
                <div style={{ marginTop: 3, color: 'var(--volt)' }}>
                  {ultima.feeling ? <Cara nivel={ultima.feeling} tam={20} /> : <span className="apunte">—</span>}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="rotulo">Primera vez aquí</span>
            <p className="parrafo" style={{ marginTop: 8 }}>
              Todavía no tienes nada registrado en esta máquina. Anota tu primera serie y la próxima vez
              que acerques el celular te va a estar esperando.
            </p>
          </>
        )}
      </section>

      {/* ------------------------- meta -------------------------- */}
      {meta && (
        <section className="carta" style={{ marginTop: 12, padding: '16px 18px' }}>
          <div className="fila fila--entre fila--base">
            <span className="rotulo">Tu meta</span>
            <span className="apunte">
              {fechaCorta(meta.target_date)}
              {diasRestantes !== null && diasRestantes >= 0 ? ` · quedan ${diasRestantes} días` : ' · vencida'}
            </span>
          </div>
          <div className="fila fila--base" style={{ gap: 6, marginTop: 6 }}>
            <span className="numerote" style={{ fontSize: 26 }}>{peso(meta.target_weight_kg)}</span>
            <span className="numerote" style={{ fontSize: 14, color: 'var(--tinta-2)' }}>KG</span>
            {faltan !== null && (
              <span className="apunte" style={{ marginLeft: 'auto' }}>
                {faltan > 0
                  ? <>te faltan <strong style={{ color: 'var(--tinta)' }}>{peso(faltan)} kg</strong></>
                  : <strong style={{ color: 'var(--volt)' }}>¡lograda!</strong>}
              </span>
            )}
          </div>
          <div className="barra" style={{ marginTop: 11 }}>
            <div className="barra__relleno" style={{ width: `${progresoMeta(resumen?.record ?? null, meta)}%` }} />
          </div>
        </section>
      )}

      {/* --------------------- últimas sesiones ------------------ */}
      {resumen && resumen.sessions.length > 0 && (
        <section style={{ marginTop: 14 }}>
          <div className="fila fila--entre">
            <span className="rotulo">Últimas sesiones</span>
            <Link href={`/m/${codigo}/historial`} style={{ fontSize: 11.5, fontWeight: 600 }}>Ver historial</Link>
          </div>
          <ul style={{ listStyle: 'none', margin: '9px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...resumen.sessions].reverse().slice(0, 3).map((s) => (
              <li key={s.session_date} className="fila" style={{ gap: 10, background: 'var(--carta)', borderRadius: 12, padding: '9px 12px' }}>
                <span className="apunte" style={{ width: 52 }}>{fechaCorta(s.session_date)}</span>
                <span className="numerote" style={{ fontSize: 16 }}>{peso(s.top_weight)}</span>
                <span style={{ fontSize: 11, color: 'var(--tinta-2)' }}>kg × {s.top_reps}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--tinta-3)' }}>
                  {s.feeling ? <Cara nivel={s.feeling} tam={17} /> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="crece" style={{ minHeight: 20 }} />

      <Link href={`/m/${codigo}/registrar`} className="boton boton--principal" style={{ minHeight: 58 }}>
        <Mas tam={20} grosor={2.4} />
        REGISTRAR SERIE
      </Link>

      <div className="par" style={{ marginTop: 10 }}>
        <Link href={`/m/${codigo}/tecnica`} className="boton boton--fantasma">
          <Video tam={17} color="#D7FF3E" />
          Cómo se hace
        </Link>
        <Link href={`/m/${codigo}/meta`} className="boton boton--fantasma">
          <Barras tam={17} color="#D7FF3E" />
          Mi progreso
        </Link>
      </div>
    </main>
  );
}
