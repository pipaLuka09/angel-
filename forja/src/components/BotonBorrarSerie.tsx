'use client';

import { useFormStatus } from 'react-dom';
import { borrarSerie } from '@/app/m/[codigo]/borrar';

function Boton({
  descripcion,
  className,
  style,
  children,
}: {
  descripcion: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-label={`Borrar ${descripcion}`}
      style={{ ...style, opacity: pending ? 0.45 : 1, cursor: 'pointer' }}
      onClick={(e) => {
        // Un toque en falso no debe costar un dato: se confirma siempre.
        if (!window.confirm(`¿Borrar ${descripcion}?`)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function BotonBorrarSerie({
  id,
  codigo,
  volver,
  descripcion,
  className,
  style,
  children,
}: {
  id: string;
  codigo: string;
  volver: string;
  descripcion: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <form action={borrarSerie} style={{ display: 'contents' }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="codigo" value={codigo} />
      <input type="hidden" name="volver" value={volver} />
      <Boton descripcion={descripcion} className={className} style={style}>
        {children}
      </Boton>
    </form>
  );
}
