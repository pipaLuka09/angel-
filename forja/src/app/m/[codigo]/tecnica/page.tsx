import Link from 'next/link';
import { Atras, Equis, Video } from '@/components/Iconos';
import { estacionDelSticker } from '../datos';
import { NoEresSocio, StickerDesconocido } from '../no-reconocido';

const FUENTE: Record<string, string> = {
  tiktok: 'Ver en TikTok',
  instagram: 'Ver en Instagram',
  youtube: 'Ver en YouTube',
  own: 'Ver el video',
};

export default async function Tecnica({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const { estacion } = await estacionDelSticker(codigo);

  if (!estacion) return <StickerDesconocido />;
  if (!estacion.is_member) return <NoEresSocio estacion={estacion} />;

  const claves = estacion.cues ?? [];
  const errores = estacion.common_mistakes ?? [];

  return (
    <main className="pantalla">
      <header className="fila" style={{ gap: 12 }}>
        <Link href={`/m/${codigo}`} className="boton-icono" aria-label="Volver a la máquina">
          <Atras tam={18} grosor={2.2} />
        </Link>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{estacion.station_name}</span>
      </header>

      <h1 className="titulo titulo--chico" style={{ marginTop: 20 }}>Cómo se hace</h1>

      {estacion.video_url ? (
        <a
          href={estacion.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="carta"
          style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 130, color: 'var(--tinta)' }}
        >
          <span style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--volt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#0A0B0D" aria-hidden="true"><path d="M9 6.5v11l9-5.5z" /></svg>
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>
            {FUENTE[estacion.video_source ?? 'own'] ?? 'Ver el video'}
          </span>
        </a>
      ) : (
        <div className="carta" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Video tam={20} color="#6E7681" />
          <span className="apunte" style={{ lineHeight: 1.45 }}>
            Todavía no hay video para este ejercicio. Tu gimnasio lo agrega desde el panel.
          </span>
        </div>
      )}

      {claves.length > 0 && (
        <section style={{ marginTop: 20 }}>
          <span className="rotulo">Las claves</span>
          <ol style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {claves.map((clave, i) => (
              <li key={clave} className="carta" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderRadius: 14, padding: '12px 14px' }}>
                <span className="numerote" style={{ fontSize: 18, color: 'var(--volt)', width: 16, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>{clave}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {errores.length > 0 && (
        <section style={{ marginTop: 18 }}>
          <span className="rotulo">Errores comunes</span>
          <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {errores.map((e) => (
              <li key={e} className="carta" style={{ display: 'flex', gap: 11, alignItems: 'flex-start', borderRadius: 14, padding: '11px 14px' }}>
                <span style={{ flexShrink: 0, marginTop: 1, color: 'var(--tinta-2)' }}><Equis tam={16} /></span>
                <span style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--tinta-2)' }}>{e}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="crece" style={{ minHeight: 24 }} />
      <Link href={`/m/${codigo}/registrar`} className="boton boton--principal">REGISTRAR SERIE</Link>
    </main>
  );
}
