import { Marca } from '@/components/Marca';
import type { Estacion } from '@/lib/tipos';
import { supabaseServidor } from '@/lib/supabase/server';
import { solicitarAcceso } from './solicitar';

export function StickerDesconocido() {
  return (
    <main className="pantalla">
      <Marca />
      <h1 className="titulo titulo--chico" style={{ marginTop: 40 }}>
        Sticker no
        <br />
        reconocido
      </h1>
      <p className="parrafo" style={{ marginTop: 14 }}>
        Este sticker no está registrado en ningún gimnasio, o la máquina se dio de baja. Avísale a
        recepción para que lo revisen.
      </p>
      <div className="crece" />
      <a className="boton boton--fantasma" href="/">Ir al inicio</a>
    </main>
  );
}

/**
 * La máquina existe y la persona es socia, pero en el panel no le
 * asignaron ejercicio: sin ejercicio no hay dónde guardar la serie.
 * Antes caía en NoEresSocio y decía "FORJA está en pausa", que no era
 * cierto.
 */
export function SinEjercicio({ estacion }: { estacion: Estacion }) {
  return (
    <main className="pantalla">
      <Marca />
      <h1 className="titulo titulo--chico" style={{ marginTop: 40 }}>
        Esta máquina
        <br />
        no tiene ejercicio
      </h1>
      <p className="parrafo" style={{ marginTop: 14 }}>
        Todavía no le asignaron un ejercicio en el panel, así que aquí no se pueden registrar series.
        Avísale a recepción: se arregla en Panel → Máquinas → Editar, y el sticker sigue sirviendo.
      </p>
      <div className="carta" style={{ marginTop: 22 }}>
        <div className="rotulo">Máquina</div>
        <p style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 600 }}>
          {estacion.label} · {estacion.gym_name}
        </p>
      </div>
      <div className="crece" />
      <a className="boton boton--fantasma" href="/">Ir al inicio</a>
    </main>
  );
}

/**
 * Alguien con sesión tocó un sticker de un gimnasio donde no tiene acceso
 * activo. Lo que ve depende de en qué punto está: sin solicitud, con la
 * solicitud en espera, con el acceso pausado, o con el gimnasio entero
 * suspendido en la plataforma.
 */
export async function NoEresSocio({ estacion, codigo }: { estacion: Estacion; codigo: string }) {
  const gym = estacion.gym_branch ? `${estacion.gym_name} · ${estacion.gym_branch}` : estacion.gym_name;

  const supabase = await supabaseServidor();
  const { data: sesion } = await supabase.auth.getUser();
  const { data: membresia } = sesion.user
    ? await supabase
        .from('memberships')
        .select('status')
        .eq('gym_id', estacion.gym_id)
        .eq('user_id', sesion.user.id)
        .maybeSingle()
    : { data: null };
  const estado = (membresia?.status as string | undefined) ?? null;

  let titulo: React.ReactNode;
  let texto: React.ReactNode;
  if (estado === 'pending') {
    titulo = <>Tu solicitud<br />está en espera</>;
    texto = <>Ya le llegó a {gym}. En cuanto recepción la apruebe, este sticker te va a llevar directo a tu historial en esta máquina.</>;
  } else if (estado === 'paused' || estado === 'cancelled') {
    titulo = <>Tu acceso<br />está pausado</>;
    texto = <>Tu cuenta en {gym} está pausada. Habla con recepción para reactivarla: tu historial sigue guardado.</>;
  } else if (estado === 'active') {
    // Membresía activa pero sin acceso: el gimnasio está suspendido en la
    // plataforma.
    titulo = <>FORJA está<br />en pausa aquí</>;
    texto = <>{gym} tiene FORJA en pausa por el momento. Tu historial sigue guardado y vuelve tal cual en cuanto se reactive.</>;
  } else {
    titulo = <>Este sticker es<br />de {estacion.gym_name}</>;
    texto = <>Tu cuenta todavía no tiene acceso a {gym}. Pídelo aquí y recepción lo aprueba.</>;
  }

  return (
    <main className="pantalla">
      <Marca />
      <h1 className="titulo titulo--chico" style={{ marginTop: 40 }}>{titulo}</h1>
      <p className="parrafo" style={{ marginTop: 14 }}>{texto}</p>
      <div className="carta" style={{ marginTop: 22 }}>
        <div className="rotulo">Máquina</div>
        <p style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 600 }}>
          {estacion.label} · {estacion.station_name}
        </p>
      </div>
      <div className="crece" />
      {estado === null && (
        <form action={solicitarAcceso} style={{ marginBottom: 10 }}>
          <input type="hidden" name="codigo" value={codigo} />
          <button type="submit" className="boton boton--principal">SOLICITAR ACCESO</button>
        </form>
      )}
      <a className="boton boton--fantasma" href="/">Ir al inicio</a>
    </main>
  );
}
