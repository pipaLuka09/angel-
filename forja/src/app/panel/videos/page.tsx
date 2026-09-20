import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';
import type { EstacionPanel } from '@/lib/tipos';
import { Check, Video } from '@/components/Iconos';
import { MarcoPanel, SinAcceso } from '../MarcoPanel';
import { guardarVideo } from './acciones';

const FUENTE: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  own: 'Propio',
};

export default async function Videos({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const gym = await gymDelStaff('/panel/videos');
  if (!gym) return <SinAcceso />;

  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc('gym_stations', { p_gym_id: gym.gymId });
  const estaciones = (data as EstacionPanel[] | null) ?? [];
  const conVideo = estaciones.filter((e) => e.video_url).length;

  return (
    <MarcoPanel
      gym={gym}
      activo="videos"
      titulo="Videos"
      bajada={`${conVideo} de ${estaciones.length} máquinas tienen video de técnica`}
    >
      {error && <p className="aviso aviso--error" style={{ marginTop: 20 }}>{decodeURIComponent(error)}</p>}
      {ok && !error && (
        <p className="aviso" style={{ marginTop: 20, borderColor: 'var(--volt)', color: 'var(--volt)' }}>
          Guardado.
        </p>
      )}

      <section className="carta" style={{ marginTop: 22, borderRadius: 17, padding: '18px 20px' }}>
        <span className="rotulo">Cómo conseguir el enlace</span>
        <ol className="parrafo" style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6 }}>
          <li>Abre TikTok o Instagram y busca el ejercicio por su nombre.</li>
          <li>
            Cuando encuentres uno donde la técnica se vea bien, dale a <strong style={{ color: 'var(--tinta)' }}>Compartir</strong> →{' '}
            <strong style={{ color: 'var(--tinta)' }}>Copiar enlace</strong>.
          </li>
          <li>Pégalo aquí abajo, en la máquina que corresponda, y guarda.</li>
        </ol>
        <p className="apunte" style={{ margin: '12px 0 0', lineHeight: 1.5 }}>
          Elige videos <strong style={{ color: 'var(--tinta-2)' }}>cortos y sin música a todo volumen</strong>: quien
          los va a ver está de pie frente a la máquina, no en su sofá. Y pruébalos tocándolos tú desde el celular
          antes de dejarlos: los enlaces de redes se rompen cuando alguien borra su video.
        </p>
      </section>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {estaciones.map((e) => (
          <form
            key={e.id}
            action={guardarVideo}
            className="carta"
            style={{ borderRadius: 15, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}
          >
            <input type="hidden" name="id" value={e.id} />

            <div style={{ width: 210, flexShrink: 0, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                <span style={{ color: 'var(--tinta-3)' }}>{e.label}</span> {e.name}
              </div>
              {e.video_url ? (
                <a
                  href={e.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="apunte"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, color: 'var(--volt)' }}
                >
                  <Video tam={13} />
                  Probar el actual ({FUENTE[e.video_source ?? 'own']})
                </a>
              ) : (
                <div className="apunte" style={{ marginTop: 4 }}>Sin video</div>
              )}
            </div>

            <label className="sr-only" htmlFor={`url-${e.id}`}>
              Enlace del video para {e.name}
            </label>
            <input
              id={`url-${e.id}`}
              name="url"
              type="url"
              className="campo"
              style={{ flexGrow: 1, flexBasis: 260, height: 44, minWidth: 0 }}
              defaultValue={e.video_url ?? ''}
              placeholder="https://www.tiktok.com/@alguien/video/..."
              autoComplete="off"
              spellCheck={false}
            />

            <button
              type="submit"
              className="boton boton--fantasma"
              style={{ width: 'auto', minHeight: 44, padding: '0 16px', flexShrink: 0 }}
            >
              <Check tam={16} color="#D7FF3E" grosor={2.4} />
              Guardar
            </button>
          </form>
        ))}
      </div>

      <p className="apunte" style={{ marginTop: 18, lineHeight: 1.5, maxWidth: 620 }}>
        El video queda ligado a <strong style={{ color: 'var(--tinta-2)' }}>esta máquina</strong>, no al ejercicio en
        general. Así dos prensas de marcas distintas pueden llevar videos distintos, y lo que pongas aquí no le cambia
        el contenido a ningún otro gimnasio. Deja el campo vacío y guarda para quitarlo.
      </p>
    </MarcoPanel>
  );
}
