'use client';

import { useFormStatus } from 'react-dom';
import { cambiarEstadoGym } from './acciones';

function Boton({ suspender, nombre }: { suspender: boolean; nombre: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="insignia insignia--gris"
      style={{ border: '1px solid var(--borde)', cursor: 'pointer', opacity: pending ? 0.5 : 1 }}
      onClick={(e) => {
        const pregunta = suspender
          ? `¿Suspender ${nombre}? Su staff y sus socios se quedan sin acceso hasta que lo reactives. No se borra nada.`
          : `¿Reactivar ${nombre}?`;
        if (!window.confirm(pregunta)) e.preventDefault();
      }}
    >
      {pending ? '…' : suspender ? 'Suspender' : 'Reactivar'}
    </button>
  );
}

export function BotonEstadoGym({ id, nombre, activo }: { id: string; nombre: string; activo: boolean }) {
  return (
    <form action={cambiarEstadoGym} style={{ display: 'inline' }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={activo ? 'suspended' : 'active'} />
      <Boton suspender={activo} nombre={nombre} />
    </form>
  );
}
