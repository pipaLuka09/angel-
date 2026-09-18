import Link from 'next/link';
import { Atras } from '@/components/Iconos';
import { peso } from '@/lib/formato';
import { estacionDelSticker, resumenDe } from '../datos';
import { NoEresSocio, StickerDesconocido } from '../no-reconocido';
import { FormularioSerie } from './FormularioSerie';

const ERRORES: Record<string, string> = {
  datos: 'Revisa el peso y las repeticiones.',
  guardar: 'No se pudo guardar la serie. Intenta otra vez.',
};

export default async function Registrar({
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

  const resumen = await resumenDe(supabase, estacion.exercise_id);
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: seriesDeHoy } = await supabase
    .from('sets')
    .select('set_number, weight_kg, reps')
    .eq('user_id', usuario.id)
    .eq('exercise_id', estacion.exercise_id)
    .eq('session_date', hoy)
    .order('set_number');

  const hechas = seriesDeHoy ?? [];
  const ultimoPeso = hechas.at(-1)?.weight_kg ?? resumen.last?.top_weight ?? 20;
  const ultimasReps = hechas.at(-1)?.reps ?? resumen.last?.top_reps ?? 10;

  return (
    <main className="pantalla">
      <header className="fila fila--entre">
        <Link href={`/m/${codigo}`} className="boton-icono" aria-label="Volver a la máquina">
          <Atras tam={18} grosor={2.2} />
        </Link>
        <div style={{ textAlign: 'center' }}>
          <div className="rotulo rotulo--tenue">Estación {estacion.label}</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>{estacion.station_name}</div>
        </div>
        <div style={{ width: 38 }} />
      </header>

      <div className="fila fila--entre fila--base" style={{ marginTop: 26 }}>
        <span className="rotulo">Serie {hechas.length + 1}</span>
        {resumen.last && (
          <span className="apunte">
            Última vez: {peso(resumen.last.top_weight)} kg × {resumen.last.top_reps}
          </span>
        )}
      </div>

      {error && <p className="aviso aviso--error" style={{ marginTop: 12 }}>{ERRORES[error] ?? 'Algo salió mal.'}</p>}

      <FormularioSerie
        codigo={codigo}
        pesoInicial={Number(ultimoPeso)}
        repsIniciales={Number(ultimasReps)}
        pesoAnterior={resumen.last ? Number(resumen.last.top_weight) : null}
      />

      {hechas.length > 0 && (
        <section style={{ marginTop: 22 }}>
          <span className="rotulo">Series de hoy</span>
          <div className="fila" style={{ gap: 8, marginTop: 10 }}>
            {hechas.map((s) => (
              <div key={s.set_number} className="carta" style={{ flexGrow: 1, flexBasis: 0, borderRadius: 13, padding: '10px 8px', textAlign: 'center' }}>
                <div className="rotulo rotulo--tenue">S{s.set_number}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                  {peso(s.weight_kg)} × {s.reps}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
