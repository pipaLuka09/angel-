'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { Check } from '@/components/Iconos';
import { crearGimnasio, type ResultadoGym } from '../acciones';

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton--principal" disabled={pending} style={{ fontSize: 16 }}>
      {pending ? 'CREANDO…' : 'CREAR GIMNASIO'}
    </button>
  );
}

export function FormularioGym({ baseUrl }: { baseUrl: string }) {
  const [r, accion] = useActionState<ResultadoGym, FormData>(crearGimnasio, { estado: 'inicial' });

  if (r.estado === 'listo') {
    return (
      <div style={{ maxWidth: 560, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="carta carta--acento" style={{ borderRadius: 17 }}>
          <div className="fila" style={{ gap: 8, color: 'var(--volt)' }}>
            <Check tam={18} grosor={2.6} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>{r.gym} ya está en FORJA</span>
          </div>

          <p className="apunte" style={{ margin: '12px 0 4px', color: 'var(--tinta-2)', lineHeight: 1.5 }}>
            Pásale al dueño estos datos. {r.clave ? <>La contraseña <strong style={{ color: 'var(--tinta)' }}>no se vuelve a mostrar</strong>.</> : null}
          </p>
          <dl style={{ margin: '10px 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 14px' }}>
            <dt className="rotulo rotulo--tenue" style={{ alignSelf: 'center' }}>Entrar en</dt>
            <dd className="mono" style={{ margin: 0, color: 'var(--tinta)', wordBreak: 'break-all' }}>{baseUrl}</dd>
            <dt className="rotulo rotulo--tenue" style={{ alignSelf: 'center' }}>Usuario</dt>
            <dd className="mono" style={{ margin: 0, color: 'var(--tinta)' }}>{r.correo}</dd>
            <dt className="rotulo rotulo--tenue" style={{ alignSelf: 'center' }}>Contraseña</dt>
            <dd className="mono" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: r.clave ? 'var(--volt)' : 'var(--tinta-2)' }}>
              {r.clave ?? 'la que ya usa (tenía cuenta en FORJA)'}
            </dd>
            <dt className="rotulo rotulo--tenue" style={{ alignSelf: 'center' }}>Código</dt>
            <dd className="mono" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--volt)' }}>{r.codigo}</dd>
          </dl>
        </div>

        <div className="carta" style={{ borderRadius: 17 }}>
          <span className="rotulo">Lo que sigue, del lado del gimnasio</span>
          <ol className="parrafo" style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12.5, lineHeight: 1.7 }}>
            <li>El dueño entra y abre <strong style={{ color: 'var(--tinta)' }}>Panel del gimnasio</strong>.</li>
            <li>En <strong style={{ color: 'var(--tinta)' }}>Máquinas</strong> retira las que no tiene y asigna código a las que sí.</li>
            <li>En <strong style={{ color: 'var(--tinta)' }}>Stickers</strong> imprime la hoja y graba los chips.</li>
            <li>En <strong style={{ color: 'var(--tinta)' }}>Socios</strong> comparte el link de registro o da de alta a su gente.</li>
          </ol>
        </div>

        <div className="par">
          <Link href="/admin" className="boton boton--fantasma">Ver todos los gimnasios</Link>
          <a href="/admin/nuevo" className="boton boton--fantasma">Dar de alta otro</a>
        </div>
      </div>
    );
  }

  const v = r.estado === 'error' ? r.valores : null;

  return (
    <form action={accion} style={{ maxWidth: 560, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <section className="carta" style={{ borderRadius: 17, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span className="rotulo">El gimnasio</span>
        <div>
          <label className="rotulo etiqueta" htmlFor="nombre">Nombre</label>
          <input id="nombre" name="nombre" className="campo" required defaultValue={v?.nombre} placeholder="Gym Titán" />
        </div>
        <div>
          <label className="rotulo etiqueta" htmlFor="sucursal">Sucursal (opcional)</label>
          <input id="sucursal" name="sucursal" className="campo" defaultValue={v?.sucursal} placeholder="Norte" />
        </div>
        <div>
          <label className="rotulo etiqueta" htmlFor="codigo">Código</label>
          <input
            id="codigo" name="codigo" className="campo" required minLength={2} maxLength={5}
            pattern="[A-Za-z]{2,5}" autoCapitalize="characters" autoCorrect="off"
            defaultValue={v?.codigo?.toUpperCase()} placeholder="TIT"
            style={{ textTransform: 'uppercase' }}
          />
          <p className="apunte" style={{ marginTop: 6, lineHeight: 1.45 }}>
            De 2 a 5 letras. Es el que la gente escribe para registrarse, y va al inicio de cada código de sticker.
            <strong style={{ color: 'var(--tinta-2)' }}> No se puede cambiar después</strong>, porque los stickers ya impresos lo llevan.
          </p>
        </div>
        <label className="fila" style={{ gap: 10, alignItems: 'flex-start', fontSize: 12.5, cursor: 'pointer' }}>
          <input type="checkbox" name="catalogo" defaultChecked style={{ width: 18, height: 18, accentColor: '#D7FF3E', marginTop: 1 }} />
          <span>
            Crear una máquina por cada ejercicio del catálogo
            <span className="apunte" style={{ display: 'block', marginTop: 2 }}>
              El gimnasio retira después las que no tiene. Si lo desmarcas, las agrega una por una.
            </span>
          </span>
        </label>
      </section>

      <section className="carta" style={{ borderRadius: 17, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span className="rotulo">El dueño</span>
        <div>
          <label className="rotulo etiqueta" htmlFor="duenoCorreo">Correo</label>
          <input id="duenoCorreo" name="duenoCorreo" type="email" className="campo" required
                 autoCapitalize="none" autoCorrect="off" defaultValue={v?.duenoCorreo} />
          <p className="apunte" style={{ marginTop: 6 }}>Si ya tiene cuenta en FORJA, se usa esa y conserva su contraseña.</p>
        </div>
        <div>
          <label className="rotulo etiqueta" htmlFor="duenoNombre">Nombre completo</label>
          <input id="duenoNombre" name="duenoNombre" className="campo" defaultValue={v?.duenoNombre} />
        </div>
      </section>

      {r.estado === 'error' && <p className="aviso aviso--error">{r.mensaje}</p>}

      <Boton />
    </form>
  );
}
