import { GRUPOS } from '@/lib/ejercicios';
import { crearEjercicio } from './acciones';

/**
 * "¿No está en la lista?": crea un ejercicio propio del gimnasio y vuelve
 * a la pantalla de origen con él ya elegido.
 */
export function FormularioEjercicio({ volverA }: { volverA: string }) {
  return (
    <details className="carta" style={{ borderRadius: 17, padding: '14px 20px' }}>
      <summary className="rotulo" style={{ cursor: 'pointer', padding: '4px 0' }}>
        ¿El ejercicio no está en la lista?
      </summary>
      <form action={crearEjercicio} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="hidden" name="volver_a" value={volverA} />
        <div>
          <label className="rotulo etiqueta" htmlFor="nombre_ejercicio">Nombre del ejercicio</label>
          <input
            id="nombre_ejercicio" name="nombre_ejercicio" type="text" className="campo" required
            minLength={3} maxLength={60} placeholder="Remo en máquina" autoComplete="off"
          />
        </div>
        <div>
          <label className="rotulo etiqueta" htmlFor="grupo">Grupo muscular</label>
          <select id="grupo" name="grupo" className="campo" required defaultValue="">
            <option value="" disabled>Elige el grupo</option>
            {GRUPOS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <button type="submit" className="boton boton--fantasma" style={{ minHeight: 46 }}>
          CREAR EJERCICIO
        </button>
        <p className="apunte" style={{ margin: 0, lineHeight: 1.5 }}>
          Queda solo para este gimnasio. El video de técnica se le pone por máquina, en Panel → Videos.
        </p>
      </form>
    </details>
  );
}
