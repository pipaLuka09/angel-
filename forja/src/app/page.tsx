import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Marca } from '@/components/Marca';
import { Barras, Nfc } from '@/components/Iconos';
import { supabaseServidor } from '@/lib/supabase/server';
import { uno } from '@/lib/supabase/relacion';
import { haceCuanto, peso } from '@/lib/formato';
import type { MiEjercicio } from '@/lib/tipos';
import { salir } from './entrar/acciones';

/**
 * La pantalla de inicio es la lista de ejercicios del socio.
 *
 * Antes solo decía "acerca el celular al sticker", y la única forma de
 * ver cuánto levantaste era ir hasta esa máquina. Sirve frente a ella,
 * pero no para planear el entrenamiento, ni revisar en el camino, ni
 * cuando la máquina está ocupada. Salió de usar el sistema en un
 * gimnasio de verdad.
 */

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** 0 kg en dominadas o fondos no es "cero": es peso corporal. */
function Carga({ kg, grande = false }: { kg: number | null; grande?: boolean }) {
  if (kg === null) return null;
  if (Number(kg) === 0) {
    return (
      <span style={{ fontSize: grande ? 10 : 9.5, letterSpacing: 1.2, fontWeight: 700, color: 'var(--volt)' }}>
        PESO CORPORAL
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
      <span className="numerote" style={{ fontSize: grande ? 26 : 18, color: 'var(--volt)' }}>{peso(kg)}</span>
      <span className="numerote" style={{ fontSize: grande ? 12 : 10, color: 'var(--tinta-2)' }}>KG</span>
    </span>
  );
}

export default async function Inicio() {
  const supabase = await supabaseServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) redirect('/entrar');

  const [{ data: perfil }, { data: membresias }, { data: ejerciciosData }, { data: esAdmin }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', sesion.user.id).maybeSingle(),
    supabase.from('memberships').select('role, status, gyms(name, branch_name, status)'),
    supabase.rpc('my_exercises'),
    supabase.rpc('is_platform_admin'),
  ]);

  // Solo una membresía activa da acceso. Las demás se usan para explicarle
  // a la persona por qué todavía no ve nada.
  const todas = membresias ?? [];
  // Un gimnasio suspendido por la plataforma no da acceso aunque la
  // membresía siga activa: la base ya le niega todo.
  const gymActivo = (m: (typeof todas)[number]) =>
    uno<{ status: string }>(m.gyms)?.status !== 'suspended';
  const activas = todas.filter((m) => m.status === 'active' && gymActivo(m));
  const suspendida = todas.find((m) => m.status === 'active' && !gymActivo(m));
  const pendiente = todas.find((m) => m.status === 'pending');
  const pausada = todas.find((m) => m.status === 'paused' || m.status === 'cancelled');

  const esStaff = activas.some((m) => m.role === 'staff' || m.role === 'owner');
  const gym = uno<{ name: string; branch_name: string | null }>((activas[0] ?? todas[0])?.gyms);
  const nombre = perfil?.full_name?.split(' ')[0] ?? '';

  const ejercicios = (ejerciciosData as MiEjercicio[] | null) ?? [];
  const mios = ejercicios.filter((e) => e.session_count > 0);
  const resto = ejercicios.filter((e) => e.session_count === 0);

  // El resto se agrupa por zona: veinte renglones sueltos no se leen,
  // cinco grupos de cuatro sí.
  const porZona = new Map<string, MiEjercicio[]>();
  for (const e of resto) {
    const zona = e.muscle_group ?? 'Otros';
    if (!porZona.has(zona)) porZona.set(zona, []);
    porZona.get(zona)!.push(e);
  }

  return (
    <main className="pantalla">
      <header className="fila fila--entre">
        <Marca />
        {gym && (
          <span className="apunte" style={{ textAlign: 'right' }}>
            {gym.name}
            {gym.branch_name ? ` · ${gym.branch_name}` : ''}
          </span>
        )}
      </header>

      <h1 className="titulo" style={{ marginTop: 28 }}>
        {nombre ? `Hola, ${nombre}` : 'Hola'}
      </h1>

      {sesion.user.user_metadata?.clave_temporal === true && (
        <Link
          href="/cuenta"
          className="carta"
          style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, borderColor: 'var(--volt)', color: 'var(--tinta)' }}
        >
          <span style={{ flexGrow: 1, fontSize: 12.5, lineHeight: 1.45 }}>
            <strong>Estás usando una contraseña temporal.</strong>{' '}
            <span style={{ color: 'var(--tinta-2)' }}>Cámbiala por una tuya.</span>
          </span>
          <span style={{ color: 'var(--volt)' }}><Chevron /></span>
        </Link>
      )}

      {activas.length === 0 ? (
        pendiente ? (
          <div className="carta" style={{ marginTop: 20, borderColor: 'var(--volt)' }}>
            <span className="rotulo" style={{ color: 'var(--volt)' }}>Cuenta en espera</span>
            <p className="parrafo" style={{ marginTop: 8, fontSize: 13 }}>
              Tu solicitud para entrar a{' '}
              <strong style={{ color: 'var(--tinta)' }}>
                {uno<{ name: string }>(pendiente.gyms)?.name ?? 'tu gimnasio'}
              </strong>{' '}
              ya llegó. En cuanto recepción la apruebe, aquí te van a aparecer tus ejercicios. No tienes que
              hacer nada más.
            </p>
          </div>
        ) : suspendida ? (
          <p className="aviso" style={{ marginTop: 20 }}>
            {uno<{ name: string }>(suspendida.gyms)?.name ?? 'Tu gimnasio'} tiene FORJA en pausa por el
            momento. Tu historial sigue guardado y vuelve tal cual en cuanto se reactive.
          </p>
        ) : pausada ? (
          <p className="aviso" style={{ marginTop: 20 }}>
            Tu acceso a {uno<{ name: string }>(pausada.gyms)?.name ?? 'tu gimnasio'} está pausado. Habla con
            recepción para reactivarlo: tu historial sigue guardado.
          </p>
        ) : (
          <p className="aviso" style={{ marginTop: 20 }}>
            Tu cuenta todavía no está ligada a ningún gimnasio. Acerca el celular al sticker de una máquina de
            tu gimnasio para pedir acceso, o pásate por recepción.
          </p>
        )
      ) : (
        <>
          {/* ------------------- los que entrena ------------------- */}
          <section style={{ marginTop: 24 }}>
            <div className="fila fila--entre fila--base">
              <span className="rotulo">Tus ejercicios</span>
              {mios.length > 0 && <span className="apunte">{mios.length}</span>}
            </div>

            {mios.length === 0 ? (
              <p className="parrafo" style={{ marginTop: 10, fontSize: 12.5 }}>
                Todavía no registras nada. Acerca el celular al sticker de cualquier máquina, o toca una de
                las de abajo, y aquí irán apareciendo con tu último peso.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mios.map((e) => (
                  <li key={e.exercise_id}>
                    <Link
                      href={`/m/${e.nfc_code}`}
                      className="carta"
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px 14px 16px', borderRadius: 16, color: 'var(--tinta)' }}
                    >
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>{e.name}</div>
                        <div className="fila" style={{ gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                          <span className="apunte" style={{ fontSize: 11 }}>
                            {haceCuanto(e.last_session)}
                            {' · '}
                            {e.session_count} {e.session_count === 1 ? 'sesión' : 'sesiones'}
                          </span>
                          {e.goal_weight !== null && (
                            <span className="insignia insignia--volt" style={{ fontSize: 9.5, padding: '2px 7px' }}>
                              META {peso(e.goal_weight)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <Carga kg={e.last_weight} grande />
                      </div>
                      <span style={{ color: 'var(--tinta-3)', flexShrink: 0 }}><Chevron /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ------------------- todo el gimnasio ------------------ */}
          {resto.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <span className="rotulo">Todo el gimnasio</span>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[...porZona.entries()].map(([zona, lista]) => (
                  <div key={zona}>
                    <div className="rotulo rotulo--tenue" style={{ marginBottom: 6 }}>{zona}</div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, background: 'var(--carta)', borderRadius: 14, overflow: 'hidden' }}>
                      {lista.map((e, i) => (
                        <li key={e.exercise_id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--borde-2)' }}>
                          <Link
                            href={`/m/${e.nfc_code}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, padding: '0 14px', color: 'var(--tinta)' }}
                          >
                            <span style={{ flexGrow: 1, fontSize: 13 }}>{e.name}</span>
                            <span className="apunte" style={{ fontSize: 11 }}>{e.label}</span>
                            <span style={{ color: 'var(--tinta-4)' }}><Chevron /></span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* El sticker sigue siendo la vía rápida frente a la máquina. */}
      <div className="carta" style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 14 }}>
        <span style={{ color: 'var(--volt)', flexShrink: 0 }}><Nfc tam={18} /></span>
        <p className="apunte" style={{ margin: 0, fontSize: 11.5, lineHeight: 1.45 }}>
          Frente a la máquina es más rápido acercar el celular al sticker: te lleva directo, sin buscar.
        </p>
      </div>

      <div className="crece" style={{ minHeight: 20 }} />

      {esAdmin === true && (
        <Link href="/admin" className="boton boton--fantasma" style={{ marginBottom: 10, borderColor: 'var(--volt)' }}>
          Administración de FORJA
        </Link>
      )}

      {esStaff && (
        <Link href="/panel" className="boton boton--fantasma" style={{ marginBottom: 10 }}>
          <Barras tam={17} color="#D7FF3E" />
          Panel del gimnasio
        </Link>
      )}

      <div className="par">
        <Link href="/cuenta" className="boton boton--fantasma" style={{ minHeight: 44, fontSize: 12 }}>
          Mi cuenta
        </Link>
        <form action={salir} style={{ display: 'flex' }}>
          <button type="submit" className="boton boton--fantasma" style={{ minHeight: 44, fontSize: 12 }}>
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
