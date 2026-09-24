import { gymDelStaff } from '@/lib/panel';
import { baseUrl } from '@/lib/url';
import { MarcoPanel, SinAcceso } from '../MarcoPanel';
import { guardarAjustes } from './acciones';

const AVISOS: Record<string, { texto: string; error: boolean }> = {
  guardado: { texto: 'Listo, guardado.', error: false },
  nombre: { texto: 'El nombre debe tener entre 2 y 80 caracteres.', error: true },
  sucursal: { texto: 'La sucursal no puede pasar de 80 caracteres.', error: true },
  'solo-dueno': { texto: 'Solo el dueño del gimnasio puede cambiar estos datos.', error: true },
  error: { texto: 'No se pudo guardar. Intenta otra vez.', error: true },
};

export default async function Ajustes({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string }>;
}) {
  const { aviso } = await searchParams;
  const gym = await gymDelStaff('/panel/ajustes');
  if (!gym) return <SinAcceso />;

  const esDueno = gym.rol === 'owner';
  const mensaje = aviso ? AVISOS[aviso] : undefined;
  const linkRegistro = `${await baseUrl()}/registro?gym=${gym.slug}`;

  return (
    <MarcoPanel
      gym={gym}
      activo="ajustes"
      titulo="Ajustes"
      bajada={esDueno ? 'Datos del gimnasio' : 'Datos del gimnasio · solo el dueño puede cambiarlos'}
    >
      {mensaje && (
        <p className={mensaje.error ? 'aviso aviso--error' : 'aviso'} style={{ marginTop: 20 }}>
          {mensaje.texto}
        </p>
      )}

      <div style={{ display: 'flex', gap: 14, marginTop: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <section className="carta" style={{ flexGrow: 1, flexBasis: 380, borderRadius: 17, padding: '18px 20px', minWidth: 0 }}>
          <span className="rotulo">Cómo te ven los socios</span>
          <form action={guardarAjustes} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <fieldset disabled={!esDueno} style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="rotulo etiqueta" htmlFor="nombre">Nombre del gimnasio</label>
                <input id="nombre" name="nombre" type="text" className="campo" required maxLength={80} defaultValue={gym.nombre} />
              </div>
              <div>
                <label className="rotulo etiqueta" htmlFor="sucursal">Sucursal (opcional)</label>
                <input id="sucursal" name="sucursal" type="text" className="campo" maxLength={80} defaultValue={gym.sucursal ?? ''} placeholder="Centro" />
              </div>
              {esDueno && (
                <button type="submit" className="boton boton--principal" style={{ minHeight: 48, fontSize: 15 }}>
                  GUARDAR
                </button>
              )}
            </fieldset>
          </form>
        </section>

        <section className="carta" style={{ width: 340, flexGrow: 1, flexBasis: 300, borderRadius: 17, padding: '18px 20px' }}>
          <span className="rotulo">Datos fijos</span>
          <dl style={{ margin: '12px 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 14px' }}>
            <dt className="rotulo rotulo--tenue" style={{ alignSelf: 'center' }}>Código</dt>
            <dd className="mono" style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--volt)' }}>
              {gym.prefijo.toUpperCase()}
            </dd>
            <dt className="rotulo rotulo--tenue" style={{ alignSelf: 'center' }}>Tu rol</dt>
            <dd style={{ margin: 0, fontSize: 13 }}>{esDueno ? 'Dueño' : 'Recepción'}</dd>
            <dt className="rotulo rotulo--tenue">Registro</dt>
            <dd className="mono" style={{ margin: 0, wordBreak: 'break-all', userSelect: 'all' }}>{linkRegistro}</dd>
          </dl>
          <p className="apunte" style={{ margin: '14px 0 0', lineHeight: 1.5 }}>
            El código va impreso en cada sticker, por eso no se puede cambiar desde aquí. Si de verdad
            hace falta, escríbenos: implica reimprimir todos.
          </p>
        </section>
      </div>
    </MarcoPanel>
  );
}
