'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { nuevaClaveSocio, type ResultadoClave } from './acciones';

function Boton({ nombre }: { nombre: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="insignia insignia--gris"
      style={{ border: 0, cursor: 'pointer', opacity: pending ? 0.5 : 1 }}
      onClick={(e) => {
        // La contraseña anterior deja de servir: se confirma siempre.
        if (!window.confirm(`¿Generar una contraseña nueva para ${nombre}? La que tiene ahora deja de funcionar.`)) {
          e.preventDefault();
        }
      }}
    >
      {pending ? 'Generando…' : 'Nueva contraseña'}
    </button>
  );
}

export function BotonNuevaClave({ userId, nombre }: { userId: string; nombre: string }) {
  const [resultado, accion] = useActionState<ResultadoClave, FormData>(nuevaClaveSocio, { estado: 'inicial' });

  if (resultado.estado === 'listo') {
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--volt)', userSelect: 'all' }}>
          {resultado.clave}
        </span>
        <span className="apunte" style={{ fontSize: 10 }}>Dísela ahora: no se vuelve a mostrar</span>
      </span>
    );
  }

  return (
    <form action={accion} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <input type="hidden" name="userId" value={userId} />
      <Boton nombre={nombre} />
      {resultado.estado === 'error' && (
        <span style={{ fontSize: 10.5, color: '#F0C8C8', maxWidth: 200, textAlign: 'right' }}>{resultado.mensaje}</span>
      )}
    </form>
  );
}
