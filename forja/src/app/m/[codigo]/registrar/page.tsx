import Link from 'next/link';
import { Atras } from '@/components/Iconos';
import { peso } from '@/lib/formato';
import { estacionDelSticker, resumenDe } from '../datos';
import { NoEresSocio, SinEjercicio, StickerDesconocido } from '../no-reconocido';
import { FormularioSerie } from './FormularioSerie';
import { BotonBorrarSerie } from '@/components/BotonBorrarSerie';
import { Basura } from '@/components/Iconos';

const ERRORES: Record<string, string> = {
  datos: 'Revisa el peso y las repeticiones.',
  guardar: 'No se pudo guardar la serie. Intenta otra vez.',
  borrar: 'No se pudo borrar la serie. Intenta otra vez.',
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
  if (!estacion.is_member) return <NoEresSocio estacion={estacion} codigo={codigo} />;
  if (!estacion.exercise_id) return <SinEjercicio estacion={estacion} />;

  const resumen = await resumenDe(supabase, estacion.exercise_id);
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: seriesDeHoy } = await supabase
    .from('sets')
    .select('id, set_number, weight_kg, reps')
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
          <div className="fila fila--entre fila--base">
            <span className="rotulo">Series de hoy</span>
            <span className="apunte" style={{ fontSize: 10.5 }}>Toca una para borrarla</span>
          </div>
          {/* Grilla y no fila: con seis o siete series una fila se aprieta. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))', gap: 8, marginTop: 10 }}>
            {hechas.map((s) => (
              <BotonBorrarSerie
                key={s.id}
                id={s.id}
                codigo={codigo}
                volver={`/m/${codigo}/registrar`}
                descripcion={`la serie ${s.set_number} (${peso(s.weight_kg)} kg × ${s.reps})`}
                className="carta"
                style={{ borderRadius: 13, padding: '10px 8px', textAlign: 'center', minHeight: 56, color: 'var(--tinta)', position: 'relative' }}
              >
                <span style={{ position: 'absolute', top: 6, right: 6, color: 'var(--tinta-4)' }}>
                  <Basura tam={11} grosor={2} />
                </span>
                <span className="rotulo rotulo--tenue" style={{ display: 'block' }}>S{s.set_number}</span>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, marginTop: 3 }}>
                  {Number(s.weight_kg) === 0 ? 'PC' : peso(s.weight_kg)} × {s.reps}
                </span>
              </BotonBorrarSerie>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
