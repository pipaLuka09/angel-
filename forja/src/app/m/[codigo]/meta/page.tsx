import Link from 'next/link';
import { GraficaProgreso } from '@/components/GraficaProgreso';
import { Atras, Flecha } from '@/components/Iconos';
import { diasHasta, fechaCorta, fechaLarga, peso, progresoMeta } from '@/lib/formato';
import { estacionDelSticker, resumenDe } from '../datos';
import { NoEresSocio, StickerDesconocido } from '../no-reconocido';
import { fijarMeta } from './acciones';

function enTresMeses(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 3);
  return d.toISOString().slice(0, 10);
}

export default async function MetaPagina({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { codigo } = await params;
  const { error } = await searchParams;
  const { supabase, estacion } = await estacionDelSticker(codigo);

  if (!estacion) return <StickerDesconocido />;
  if (!estacion.is_member || !estacion.exercise_id) return <NoEresSocio estacion={estacion} codigo={codigo} />;

  const resumen = await resumenDe(supabase, estacion.exercise_id);
  const meta = resumen.goal;
  const record = resumen.record !== null ? Number(resumen.record) : null;
  const faltan = meta && record !== null ? Number(meta.target_weight_kg) - record : null;
  const dias = meta ? diasHasta(meta.target_date) : null;

  const primera = resumen.sessions[0];
  const mejora = primera && record !== null ? record - Number(primera.top_weight) : null;

  return (
    <main className="pantalla">
      <header className="fila" style={{ gap: 12 }}>
        <Link href={`/m/${codigo}`} className="boton-icono" aria-label="Volver a la máquina">
          <Atras tam={18} grosor={2.2} />
        </Link>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{estacion.station_name}</span>
      </header>

      <h1 className="titulo titulo--chico" style={{ marginTop: 18 }}>
        {meta ? 'Tu meta' : 'Tu progreso'}
      </h1>

      {meta ? (
        <section className="carta" style={{ marginTop: 14, padding: '16px 18px' }}>
          <div className="fila" style={{ alignItems: 'flex-end', gap: 8 }}>
            <span className="numerote" style={{ fontSize: 40, color: 'var(--volt)' }}>{peso(record)}</span>
            <span style={{ marginBottom: 4, color: 'var(--tinta-3)' }}><Flecha tam={18} grosor={2.4} /></span>
            <span className="numerote" style={{ fontSize: 40 }}>{peso(meta.target_weight_kg)}</span>
            <span className="numerote" style={{ fontSize: 16, color: 'var(--tinta-2)', paddingBottom: 3 }}>KG</span>
          </div>
          <div className="barra" style={{ marginTop: 13 }}>
            <div className="barra__relleno" style={{ width: `${progresoMeta(record, meta)}%` }} />
          </div>
          <div className="fila fila--entre" style={{ marginTop: 10, fontSize: 11.5, color: 'var(--tinta-2)' }}>
            <span>
              {faltan !== null && faltan > 0
                ? <>Te faltan <strong style={{ color: 'var(--tinta)' }}>{peso(faltan)} kg</strong></>
                : <strong style={{ color: 'var(--volt)' }}>Meta alcanzada</strong>}
            </span>
            <span>
              {dias !== null && dias >= 0
                ? <>Quedan <strong style={{ color: 'var(--tinta)' }}>{dias} días</strong></>
                : <>Venció el {fechaCorta(meta.target_date)}</>}
            </span>
          </div>
        </section>
      ) : (
        <p className="parrafo" style={{ marginTop: 14 }}>
          Todavía no tienes una meta en este ejercicio. Ponte una abajo: tener una fecha es lo que hace
          que vuelvas.
        </p>
      )}

      <section className="carta" style={{ marginTop: 14, padding: 16 }}>
        <div className="fila fila--entre fila--base">
          <span className="rotulo">Peso máximo por sesión</span>
          <span className="apunte">kg</span>
        </div>
        <GraficaProgreso sesiones={resumen.sessions} meta={meta} />
      </section>

      <div className="fila" style={{ gap: 8, marginTop: 14, alignItems: 'stretch' }}>
        <div className="carta" style={{ flexGrow: 1, flexBasis: 0, borderRadius: 15, padding: '12px 11px' }}>
          <div className="rotulo rotulo--tenue">Tu récord</div>
          <div className="numerote" style={{ fontSize: 23, marginTop: 4, color: 'var(--volt)' }}>{peso(record)}</div>
          <div className="apunte" style={{ marginTop: 1 }}>kg</div>
        </div>
        <div className="carta" style={{ flexGrow: 1, flexBasis: 0, borderRadius: 15, padding: '12px 11px' }}>
          <div className="rotulo rotulo--tenue">Mejora</div>
          <div className="numerote" style={{ fontSize: 23, marginTop: 4 }}>
            {mejora === null ? '—' : `${mejora > 0 ? '+' : ''}${peso(mejora)}`}
          </div>
          <div className="apunte" style={{ marginTop: 1 }}>kg desde {fechaCorta(primera?.session_date)}</div>
        </div>
        <div className="carta" style={{ flexGrow: 1, flexBasis: 0, borderRadius: 15, padding: '12px 11px' }}>
          <div className="rotulo rotulo--tenue">Sesiones</div>
          <div className="numerote" style={{ fontSize: 23, marginTop: 4 }}>{resumen.session_count}</div>
          <div className="apunte" style={{ marginTop: 1 }}>en este ejercicio</div>
        </div>
      </div>

      <div className="crece" style={{ minHeight: 20 }} />

      {error && <p className="aviso aviso--error" style={{ marginBottom: 12 }}>{decodeURIComponent(error)}</p>}

      <details className="carta" style={{ padding: '14px 16px' }}>
        <summary style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {meta ? 'Cambiar mi meta' : 'Ponerme una meta'}
        </summary>

        <form action={fijarMeta} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="hidden" name="codigo" value={codigo} />

          <div>
            <label className="rotulo etiqueta" htmlFor="objetivo">Peso objetivo (kg)</label>
            <input
              id="objetivo" name="objetivo" type="number" className="campo"
              min="1" max="1000" step="0.5" inputMode="decimal"
              defaultValue={meta ? Number(meta.target_weight_kg) : record ? Math.ceil(record * 1.2) : 50}
              required
            />
          </div>

          <div>
            <label className="rotulo etiqueta" htmlFor="fecha">¿Para cuándo?</label>
            <input
              id="fecha" name="fecha" type="date" className="campo"
              defaultValue={meta ? meta.target_date : enTresMeses()}
              required
            />
            {meta && <p className="apunte" style={{ marginTop: 6 }}>Ahora: {fechaLarga(meta.target_date)}</p>}
          </div>

          <button type="submit" className="boton boton--principal" style={{ fontSize: 16 }}>
            GUARDAR META
          </button>
        </form>
      </details>
    </main>
  );
}
