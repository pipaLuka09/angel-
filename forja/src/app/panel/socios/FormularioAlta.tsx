'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, Mas } from '@/components/Iconos';
import { darDeAltaSocio, type ResultadoAlta } from './acciones';

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton--principal" disabled={pending} style={{ minHeight: 48, fontSize: 15 }}>
      {pending ? 'CREANDO…' : <><Mas tam={18} grosor={2.4} /> DAR DE ALTA</>}
    </button>
  );
}

export function FormularioAlta({ puedeCrearRecepcion }: { puedeCrearRecepcion: boolean }) {
  const [resultado, accion] = useActionState<ResultadoAlta, FormData>(
    darDeAltaSocio,
    { estado: 'inicial' },
  );

  return (
    <section className="carta" style={{ borderRadius: 17, padding: '18px 20px' }}>
      <span className="rotulo">{puedeCrearRecepcion ? 'Dar de alta una cuenta' : 'Dar de alta un socio'}</span>

      {resultado.estado === 'listo' ? (
        <>
          <div
            className="carta carta--acento"
            style={{ marginTop: 14, borderRadius: 14, padding: '14px 16px' }}
          >
            <div className="fila" style={{ gap: 8, color: 'var(--volt)' }}>
              <Check tam={17} grosor={2.6} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {resultado.nombre} ya tiene cuenta{resultado.recepcion ? ' de recepción' : ''}
              </span>
            </div>
            <p className="apunte" style={{ margin: '10px 0 0', lineHeight: 1.5, color: 'var(--tinta-2)' }}>
              Anótale estos datos. La contraseña <strong style={{ color: 'var(--tinta)' }}>no se
              vuelve a mostrar</strong>: si se pierde, hay que generar una nueva.
            </p>
            <dl style={{ margin: '12px 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px' }}>
              <dt className="rotulo rotulo--tenue" style={{ alignSelf: 'center' }}>Usuario</dt>
              <dd className="mono" style={{ margin: 0, fontSize: 13, color: 'var(--tinta)' }}>{resultado.correo}</dd>
              <dt className="rotulo rotulo--tenue" style={{ alignSelf: 'center' }}>Contraseña</dt>
              <dd className="mono" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--volt)' }}>
                {resultado.clave}
              </dd>
            </dl>
          </div>

          <form action={accion} style={{ marginTop: 12 }}>
            <button type="submit" className="boton boton--fantasma" style={{ minHeight: 44 }}>
              Dar de alta a otro
            </button>
          </form>
        </>
      ) : (
        <form action={accion} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {puedeCrearRecepcion && (
            <div>
              <label className="rotulo etiqueta" htmlFor="tipo">Tipo de cuenta</label>
              <select id="tipo" name="tipo" className="campo" defaultValue="member">
                <option value="member">Socio</option>
                <option value="staff">Recepción (entra al panel)</option>
              </select>
              <p className="apunte" style={{ marginTop: 6 }}>
                Recepción da de alta y aprueba socios, pero no ve cuánto levanta nadie ni puede crear otras cuentas de recepción.
              </p>
            </div>
          )}
          <div>
            <label className="rotulo etiqueta" htmlFor="nombre">Nombre completo</label>
            <input id="nombre" name="nombre" type="text" className="campo" required autoComplete="off" />
          </div>
          <div>
            <label className="rotulo etiqueta" htmlFor="correo">Correo</label>
            <input
              id="correo" name="correo" type="email" className="campo" required
              autoComplete="off" autoCapitalize="none" autoCorrect="off"
            />
            <p className="apunte" style={{ marginTop: 6 }}>Es su usuario para entrar.</p>
          </div>
          <div>
            <label className="rotulo etiqueta" htmlFor="numero">Número de socio (opcional)</label>
            <input id="numero" name="numero" type="text" className="campo" autoComplete="off" placeholder="SOC-1041" />
          </div>

          {resultado.estado === 'error' && (
            <p className="aviso aviso--error">{resultado.mensaje}</p>
          )}

          <Boton />
        </form>
      )}
    </section>
  );
}
