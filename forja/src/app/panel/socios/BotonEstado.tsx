'use client';

import { useFormStatus } from 'react-dom';
import { cambiarEstadoSocio } from './acciones';

function Boton({ pausar, nombre }: { pausar: boolean; nombre: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="insignia insignia--gris"
      style={{ border: '1px solid var(--borde)', cursor: 'pointer', opacity: pending ? 0.5 : 1 }}
      onClick={(e) => {
        // Pausar deja a la persona sin acceso: nunca con un solo toque.
        const pregunta = pausar
          ? `¿Pausar el acceso de ${nombre}? Va a poder entrar, pero no verá sus ejercicios hasta que lo reactives.`
          : `¿Reactivar el acceso de ${nombre}?`;
        if (!window.confirm(pregunta)) e.preventDefault();
      }}
    >
      {pending ? '…' : pausar ? 'Pausar' : 'Reactivar'}
    </button>
  );
}

export function BotonEstado({ userId, nombre, activo }: { userId: string; nombre: string; activo: boolean }) {
  return (
    <form action={cambiarEstadoSocio} style={{ display: 'inline' }}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="estado" value={activo ? 'paused' : 'active'} />
      <Boton pausar={activo} nombre={nombre} />
    </form>
  );
}
