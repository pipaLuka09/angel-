import { Marca } from '@/components/Marca';
import type { Estacion } from '@/lib/tipos';

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

export function NoEresSocio({ estacion }: { estacion: Estacion }) {
  const gym = estacion.gym_branch ? `${estacion.gym_name} · ${estacion.gym_branch}` : estacion.gym_name;
  return (
    <main className="pantalla">
      <Marca />
      <h1 className="titulo titulo--chico" style={{ marginTop: 40 }}>
        Este sticker es
        <br />
        de {estacion.gym_name}
      </h1>
      <p className="parrafo" style={{ marginTop: 14 }}>
        Tu cuenta no está dada de alta en {gym}, así que todavía no puedes registrar aquí.
        Pásate por recepción: el alta viene incluida con la mensualidad.
      </p>
      <div className="carta" style={{ marginTop: 22 }}>
        <div className="rotulo">Máquina</div>
        <p style={{ margin: '6px 0 0', fontSize: 15, fontWeight: 600 }}>
          {estacion.label} · {estacion.station_name}
        </p>
      </div>
      <div className="crece" />
      <a className="boton boton--fantasma" href="/">Ir al inicio</a>
    </main>
  );
}
