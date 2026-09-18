import type { Meta, Sesion } from '@/lib/tipos';
import { peso } from '@/lib/formato';

const ANCHO = 318;
const ALTO = 150;
const TOPE = 14;
const MARGEN = 10;

/**
 * Progresión del peso máximo por sesión. Es una serie sola, así que no
 * lleva leyenda: el título de la tarjeta la nombra. Los únicos valores
 * etiquetados son el primero y el último; poner un número sobre cada
 * punto convierte la gráfica en una tabla mal hecha.
 *
 * El eje no arranca en cero a propósito: es una línea de evolución, no
 * barras comparando magnitudes, y a 70-100 kg un eje desde cero
 * aplastaría justo la diferencia que la persona quiere ver.
 */
export function GraficaProgreso({ sesiones, meta }: { sesiones: Sesion[]; meta: Meta | null }) {
  if (sesiones.length < 2) {
    return (
      <p className="apunte" style={{ margin: '14px 0 0' }}>
        Con dos sesiones registradas aparece aquí tu progresión.
      </p>
    );
  }

  const valores = sesiones.map((s) => Number(s.top_weight));
  const objetivo = meta ? Number(meta.target_weight_kg) : null;

  const techo = Math.ceil((Math.max(...valores, objetivo ?? 0) + 5) / 10) * 10;
  const piso = Math.floor((Math.min(...valores) - 5) / 10) * 10;
  const rango = Math.max(techo - piso, 10);

  const y = (v: number) => TOPE + ALTO - ((v - piso) / rango) * ALTO;
  const x = (i: number) => MARGEN + (i * (ANCHO - MARGEN * 2)) / (valores.length - 1);

  const puntos = valores.map((v, i) => ({ x: x(i), y: y(v) }));
  const linea = puntos.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${linea} ${(ANCHO - MARGEN).toFixed(1)},${TOPE + ALTO} ${MARGEN},${TOPE + ALTO}`;

  const rejilla: number[] = [];
  for (let v = piso + 10; v <= techo; v += 10) rejilla.push(v);

  const ultimo = puntos.length - 1;
  const metaY = objetivo !== null && objetivo <= techo ? y(objetivo) : null;

  return (
    <>
      <svg
        viewBox={`0 0 ${ANCHO} ${TOPE + ALTO}`}
        width="100%"
        style={{ display: 'block', marginTop: 12 }}
        role="img"
        aria-label={`Progresión del peso máximo por sesión, de ${peso(valores[0])} a ${peso(valores[ultimo])} kilos${objetivo ? `, con la meta en ${peso(objetivo)} kilos` : ''}.`}
      >
        {rejilla.map((v) => (
          <line key={v} x1="0" y1={y(v)} x2={ANCHO} y2={y(v)} stroke="#20242A" strokeWidth="1" />
        ))}

        {metaY !== null && (
          <>
            <line x1="0" y1={metaY} x2={ANCHO} y2={metaY} stroke="#5E7318" strokeWidth="1.5" strokeDasharray="5 5" />
            <text x="0" y={metaY - 7} fill="#8FA82A" fontSize="10" fontWeight="700" letterSpacing="1">
              META {peso(objetivo)}
            </text>
          </>
        )}

        <polygon points={area} fill="rgba(215, 255, 62, 0.09)" />
        <polyline points={linea} fill="none" stroke="#D7FF3E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {puntos.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === ultimo ? 5 : 3.5}
            fill={i === ultimo ? '#D7FF3E' : '#7E9622'}
            stroke="#14161A"
            strokeWidth="2"
          />
        ))}

        <text x={puntos[0].x + 8} y={puntos[0].y + 16} fill="#6E7681" fontSize="11" fontWeight="600">
          {peso(valores[0])}
        </text>
        <text x={puntos[ultimo].x - 8} y={puntos[ultimo].y - 12} textAnchor="end" fill="#F2F4F7" fontSize="12" fontWeight="700">
          {peso(valores[ultimo])}
        </text>
      </svg>

      {/* Alternativa en texto: la gráfica no puede ser la única forma de
          leer el dato para quien usa lector de pantalla. */}
      <details style={{ marginTop: 8 }}>
        <summary className="apunte" style={{ cursor: 'pointer' }}>Ver los datos</summary>
        <table className="tabla" style={{ marginTop: 8 }}>
          <thead>
            <tr><th>Sesión</th><th className="der">Máximo</th><th className="der">Series</th></tr>
          </thead>
          <tbody>
            {sesiones.map((s) => (
              <tr key={s.session_date}>
                <td>{s.session_date}</td>
                <td className="der">{peso(s.top_weight)} kg</td>
                <td className="der">{s.set_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
