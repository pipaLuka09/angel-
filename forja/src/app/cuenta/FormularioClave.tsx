'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check } from '@/components/Iconos';
import { cambiarClave, type ResultadoCambio } from './acciones';

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton--principal" disabled={pending} style={{ marginTop: 6, fontSize: 16 }}>
      {pending ? 'GUARDANDO…' : 'CAMBIAR CONTRASEÑA'}
    </button>
  );
}

export function FormularioClave() {
  const [resultado, accion] = useActionState<ResultadoCambio, FormData>(cambiarClave, { estado: 'inicial' });

  if (resultado.estado === 'listo') {
    return (
      <div className="carta carta--acento" style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ color: 'var(--volt)' }}><Check tam={18} grosor={2.6} /></span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Listo. Tu contraseña quedó cambiada.</span>
      </div>
    );
  }

  return (
    <form action={accion} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label className="rotulo etiqueta" htmlFor="actual">Contraseña actual</label>
        <input id="actual" name="actual" type="password" className="campo" required autoComplete="current-password" />
      </div>
      <div>
        <label className="rotulo etiqueta" htmlFor="nueva">Nueva contraseña</label>
        <input id="nueva" name="nueva" type="password" className="campo" required minLength={8} autoComplete="new-password" />
        <p className="apunte" style={{ marginTop: 6 }}>Mínimo 8 caracteres.</p>
      </div>
      <div>
        <label className="rotulo etiqueta" htmlFor="repetida">Repite la nueva</label>
        <input id="repetida" name="repetida" type="password" className="campo" required minLength={8} autoComplete="new-password" />
      </div>

      {resultado.estado === 'error' && <p className="aviso aviso--error">{resultado.mensaje}</p>}

      <Boton />
    </form>
  );
}
