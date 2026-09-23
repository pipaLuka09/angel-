'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { registrar, type EstadoRegistro } from './acciones';

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton--principal" disabled={pending} style={{ marginTop: 6 }}>
      {pending ? 'CREANDO…' : 'CREAR CUENTA'}
    </button>
  );
}

export function FormularioRegistro({
  gymConocido,
  destino,
}: {
  /** El gimnasio ya se sabe (vino en el link o en el sticker): no se pide el código. */
  gymConocido: string | null;
  destino: string;
}) {
  const [estado, accion] = useActionState<EstadoRegistro, FormData>(registrar, {
    error: null,
    valores: { nombre: '', correo: '', gym: gymConocido ?? '' },
  });

  return (
    <form action={accion} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input type="hidden" name="destino" value={destino} />
      {gymConocido && <input type="hidden" name="gym" value={gymConocido} />}

      {/* Campo trampa para bots: fuera de la vista y del tabulador. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          No llenar
          <input name="sitio" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label className="rotulo etiqueta" htmlFor="nombre">Nombre completo</label>
        <input id="nombre" name="nombre" type="text" className="campo" required
               autoComplete="name" defaultValue={estado.valores.nombre} />
      </div>

      <div>
        <label className="rotulo etiqueta" htmlFor="correo">Correo</label>
        <input id="correo" name="correo" type="email" className="campo" required
               autoComplete="email" autoCapitalize="none" autoCorrect="off"
               defaultValue={estado.valores.correo} />
        <p className="apunte" style={{ marginTop: 6 }}>Será tu usuario para entrar.</p>
      </div>

      <div>
        <label className="rotulo etiqueta" htmlFor="clave">Contraseña</label>
        <input id="clave" name="clave" type="password" className="campo" required
               minLength={8} autoComplete="new-password" />
        <p className="apunte" style={{ marginTop: 6 }}>Mínimo 8 caracteres. Solo la escribes esta vez: la sesión se queda en tu celular.</p>
      </div>

      {!gymConocido && (
        <div>
          <label className="rotulo etiqueta" htmlFor="gym">Código del gimnasio</label>
          <input id="gym" name="gym" type="text" className="campo" required
                 autoCapitalize="characters" autoCorrect="off" placeholder="OLM"
                 defaultValue={estado.valores.gym} />
          <p className="apunte" style={{ marginTop: 6 }}>Te lo dan en recepción.</p>
        </div>
      )}

      {estado.error && <p className="aviso aviso--error">{estado.error}</p>}

      <Boton />
    </form>
  );
}
