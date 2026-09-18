'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Cara } from '@/components/Cara';
import { Check, Mas, Menos } from '@/components/Iconos';
import { NOMBRE_SENSACION, peso as fmt } from '@/lib/formato';
import { guardarSerie } from './acciones';

const REPS = [6, 8, 10, 12, 15];
const PASO = 2.5;

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton--principal" disabled={pending} style={{ minHeight: 58 }}>
      <Check tam={20} grosor={2.6} />
      {pending ? 'GUARDANDO…' : 'GUARDAR SERIE'}
    </button>
  );
}

export function FormularioSerie({
  codigo,
  pesoInicial,
  repsIniciales,
  pesoAnterior,
}: {
  codigo: string;
  pesoInicial: number;
  repsIniciales: number;
  pesoAnterior: number | null;
}) {
  const [peso, setPeso] = useState(pesoInicial);
  const [reps, setReps] = useState(repsIniciales);
  const [sensacion, setSensacion] = useState(3);

  const diferencia = pesoAnterior === null ? null : peso - pesoAnterior;

  return (
    <form action={guardarSerie} style={{ display: 'contents' }}>
      <input type="hidden" name="codigo" value={codigo} />
      <input type="hidden" name="peso" value={peso} />
      <input type="hidden" name="reps" value={reps} />
      <input type="hidden" name="sensacion" value={sensacion} />

      <div className="carta" style={{ marginTop: 10, borderRadius: 22, padding: '20px 18px' }}>
        <div className="fila fila--entre">
          <button
            type="button"
            className="boton-icono"
            style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--carta-2)' }}
            onClick={() => setPeso((p) => Math.max(0, Math.round((p - PASO) * 100) / 100))}
            aria-label="Bajar peso"
          >
            <Menos tam={20} grosor={2.6} />
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
            <output className="numerote" style={{ fontSize: 62, color: 'var(--volt)' }} aria-live="polite">
              {fmt(peso)}
            </output>
            <span className="numerote" style={{ fontSize: 20, color: 'var(--tinta-2)', paddingBottom: 4 }}>KG</span>
          </div>

          <button
            type="button"
            className="boton-icono"
            style={{ width: 54, height: 54, borderRadius: 16, background: 'var(--carta-2)' }}
            onClick={() => setPeso((p) => Math.round((p + PASO) * 100) / 100)}
            aria-label="Subir peso"
          >
            <Mas tam={20} grosor={2.6} />
          </button>
        </div>

        {diferencia !== null && (
          <p style={{ margin: '16px 0 0', textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: 'var(--volt)' }}>
            {diferencia === 0
              ? 'Mismo peso que la última vez'
              : `${diferencia > 0 ? '+' : ''}${fmt(diferencia)} kg respecto a la última vez`}
          </p>
        )}
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: '20px 0 0' }}>
        <legend className="rotulo" style={{ padding: 0 }}>Repeticiones</legend>
        <div className="pastillas" style={{ marginTop: 10 }}>
          {REPS.map((r) => (
            <button
              key={r}
              type="button"
              className="pastilla"
              aria-pressed={r === reps}
              onClick={() => setReps(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset style={{ border: 0, padding: 0, margin: '22px 0 0' }}>
        <legend className="rotulo" style={{ padding: 0 }}>¿Cómo se sintió?</legend>
        <div className="caras" style={{ marginTop: 10 }}>
          {NOMBRE_SENSACION.map((nombre, i) => (
            <button
              key={nombre}
              type="button"
              className="cara-boton"
              aria-pressed={i + 1 === sensacion}
              aria-label={nombre}
              onClick={() => setSensacion(i + 1)}
            >
              <Cara nivel={i + 1} tam={28} />
            </button>
          ))}
        </div>
        <p style={{ margin: '9px 0 0', textAlign: 'center', fontSize: 12.5, fontWeight: 600 }} aria-live="polite">
          {NOMBRE_SENSACION[sensacion - 1]}
        </p>
      </fieldset>

      <div className="crece" style={{ minHeight: 24 }} />
      <Boton />
    </form>
  );
}
