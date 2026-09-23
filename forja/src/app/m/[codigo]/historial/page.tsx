import Link from 'next/link';
import { Atras, Barras, Basura } from '@/components/Iconos';
import { Cara } from '@/components/Cara';
import { BotonBorrarSerie } from '@/components/BotonBorrarSerie';
import { fechaCorta, haceCuanto, peso } from '@/lib/formato';
import { estacionDelSticker } from '../datos';
import { NoEresSocio, StickerDesconocido } from '../no-reconocido';

type Serie = {
  id: string;
  session_date: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  feeling: number | null;
};

const LIMITE = 200;

export default async function Historial({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { codigo } = await params;
  const { error } = await searchParams;
  const { supabase, estacion, usuario } = await estacionDelSticker(codigo);

  if (!estacion) return <StickerDesconocido />;
  if (!estacion.is_member || !estacion.exercise_id) return <NoEresSocio estacion={estacion} />;

  const { data } = await supabase
    .from('sets')
    .select('id, session_date, set_number, weight_kg, reps, feeling')
    .eq('user_id', usuario.id)
    .eq('exercise_id', estacion.exercise_id)
    .order('session_date', { ascending: false })
    .order('set_number', { ascending: true })
    .limit(LIMITE);

  const series = (data as Serie[] | null) ?? [];

  const porDia = new Map<string, Serie[]>();
  for (const s of series) {
    if (!porDia.has(s.session_date)) porDia.set(s.session_date, []);
    porDia.get(s.session_date)!.push(s);
  }

  const volver = `/m/${codigo}/historial`;

  return (
    <main className="pantalla">
      <header className="fila" style={{ gap: 12 }}>
        <Link href={`/m/${codigo}`} className="boton-icono" aria-label="Volver a la máquina">
          <Atras tam={18} grosor={2.2} />
        </Link>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{estacion.station_name}</span>
      </header>

      <div className="fila fila--entre" style={{ marginTop: 18, alignItems: 'flex-end' }}>
        <h1 className="titulo titulo--chico">Historial</h1>
        <Link href={`/m/${codigo}/meta`} className="fila" style={{ gap: 6, fontSize: 12, fontWeight: 600, paddingBottom: 4 }}>
          <Barras tam={14} />
          Progreso
        </Link>
      </div>

      {error === 'borrar' && (
        <p className="aviso aviso--error" style={{ marginTop: 14 }}>No se pudo borrar la serie. Intenta otra vez.</p>
      )}

      {series.length === 0 ? (
        <p className="parrafo" style={{ marginTop: 16 }}>
          Todavía no tienes series registradas en este ejercicio.
        </p>
      ) : (
        <>
          <p className="apunte" style={{ marginTop: 8, lineHeight: 1.5 }}>
            Si anotaste algo por error, bórralo aquí: tu récord y tu meta se recalculan solos.
          </p>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...porDia.entries()].map(([dia, lista]) => {
              const maximo = Math.max(...lista.map((s) => Number(s.weight_kg)));
              return (
                <section key={dia} className="carta" style={{ padding: '14px 14px 6px', borderRadius: 16 }}>
                  <div className="fila fila--entre fila--base">
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{fechaCorta(dia)}</span>
                    <span className="apunte" style={{ fontSize: 11 }}>
                      {haceCuanto(dia)} · máx {maximo === 0 ? 'peso corporal' : `${peso(maximo)} kg`}
                    </span>
                  </div>

                  <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
                    {lista.map((s, i) => (
                      <li
                        key={s.id}
                        className="fila"
                        style={{ gap: 10, minHeight: 46, borderTop: i === 0 ? 'none' : '1px solid var(--borde-2)' }}
                      >
                        <span className="rotulo rotulo--tenue" style={{ width: 22 }}>S{s.set_number}</span>
                        <span className="numerote" style={{ fontSize: 17 }}>
                          {Number(s.weight_kg) === 0 ? 'PC' : peso(s.weight_kg)}
                        </span>
                        <span style={{ fontSize: 11.5, color: 'var(--tinta-2)' }}>
                          {Number(s.weight_kg) === 0 ? '' : 'kg '}× {s.reps}
                        </span>
                        <span style={{ marginLeft: 'auto', color: 'var(--tinta-3)' }}>
                          {s.feeling ? <Cara nivel={s.feeling} tam={17} /> : null}
                        </span>
                        <BotonBorrarSerie
                          id={s.id}
                          codigo={codigo}
                          volver={volver}
                          descripcion={`la serie ${s.set_number} del ${fechaCorta(dia)} (${
                            Number(s.weight_kg) === 0 ? 'peso corporal' : `${peso(s.weight_kg)} kg`
                          } × ${s.reps})`}
                          style={{
                            width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', border: 0, borderRadius: 10, color: 'var(--tinta-3)',
                          }}
                        >
                          <Basura tam={16} />
                        </BotonBorrarSerie>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          {series.length >= LIMITE && (
            <p className="apunte" style={{ marginTop: 14 }}>
              Se muestran tus últimas {LIMITE} series.
            </p>
          )}
        </>
      )}

      <div className="crece" style={{ minHeight: 20 }} />
      <Link href={`/m/${codigo}/registrar`} className="boton boton--principal" style={{ marginTop: 20 }}>
        REGISTRAR SERIE
      </Link>
    </main>
  );
}
