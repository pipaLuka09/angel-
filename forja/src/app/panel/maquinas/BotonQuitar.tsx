'use client';

import { useFormStatus } from 'react-dom';
import { quitarMaquina } from './acciones';

function Boton({ etiqueta }: { etiqueta: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="insignia insignia--gris"
      style={{ border: '1px solid var(--borde)', cursor: 'pointer', opacity: pending ? 0.5 : 1 }}
      title="La máquina ya no está en el gimnasio"
      onClick={(e) => {
        if (!window.confirm(`¿Quitar la máquina ${etiqueta}? Su sticker deja de funcionar. El historial de los socios se conserva.`)) {
          e.preventDefault();
        }
      }}
    >
      {pending ? '…' : 'Quitar'}
    </button>
  );
}

export function BotonQuitar({ id, etiqueta }: { id: string; etiqueta: string }) {
  return (
    <form action={quitarMaquina} style={{ display: 'inline' }}>
      <input type="hidden" name="id" value={id} />
      <Boton etiqueta={etiqueta} />
    </form>
  );
}
