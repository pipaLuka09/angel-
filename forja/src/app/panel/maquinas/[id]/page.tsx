import { notFound } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';
import { MarcoPanel, SinAcceso } from '../../MarcoPanel';
import { editarMaquina } from '../acciones';
import { FormularioEjercicio } from '../FormularioEjercicio';

export default async function EditarMaquina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ejercicio?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error, ejercicio: elegido, ok } = await searchParams;
  const gym = await gymDelStaff(`/panel/maquinas/${id}`);
  if (!gym) return <SinAcceso />;

  const supabase = await supabaseServidor();
  const [{ data: estacion }, { data: ejerciciosData }] = await Promise.all([
    supabase
      .from('stations')
      .select('id, label, zone, exercise_id, nfc_code')
      .eq('id', id)
      .eq('gym_id', gym.gymId)
      .neq('status', 'retired')
      .maybeSingle(),
    supabase.from('exercises').select('id, name, muscle_group').order('name'),
  ]);
  if (!estacion) notFound();

  const ejercicios = (ejerciciosData as { id: string; name: string; muscle_group: string | null }[] | null) ?? [];

  return (
    <MarcoPanel
      gym={gym}
      activo="maquinas"
      titulo={`Máquina ${estacion.label}`}
      bajada={estacion.nfc_code ? `Sticker ${estacion.nfc_code} · sigue funcionando después de editar` : 'Todavía sin sticker'}
    >
      {error && <p className="aviso aviso--error" style={{ marginTop: 20 }}>{decodeURIComponent(error)}</p>}
      {ok === 'ejercicio' && !error && (
        <p className="aviso" style={{ marginTop: 20, borderColor: 'var(--volt)', color: 'var(--volt)' }}>
          Ejercicio creado y elegido abajo. Falta darle a Guardar.
        </p>
      )}

      <section className="carta" style={{ marginTop: 24, maxWidth: 520, borderRadius: 17, padding: '18px 20px' }}>
        <form action={editarMaquina} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="hidden" name="id" value={estacion.id} />
          <div>
            <label className="rotulo etiqueta" htmlFor="etiqueta">Etiqueta</label>
            <input
              id="etiqueta" name="etiqueta" type="text" className="campo" required
              defaultValue={estacion.label} autoComplete="off"
            />
          </div>
          <div>
            <label className="rotulo etiqueta" htmlFor="ejercicio">Ejercicio</label>
            <select
              id="ejercicio" name="ejercicio" className="campo" required
              defaultValue={ejercicios.some((ej) => ej.id === elegido) ? elegido : (estacion.exercise_id ?? '')}
            >
              <option value="" disabled>Elige el ejercicio</option>
              {ejercicios.map((ej) => (
                <option key={ej.id} value={ej.id}>
                  {ej.name}{ej.muscle_group ? ` · ${ej.muscle_group}` : ''}
                </option>
              ))}
            </select>
            <p className="apunte" style={{ marginTop: 6 }}>
              Las series que ya se registraron conservan el ejercicio con el que se hicieron.
            </p>
          </div>
          <div>
            <label className="rotulo etiqueta" htmlFor="zona">Zona (opcional)</label>
            <input id="zona" name="zona" type="text" className="campo" defaultValue={estacion.zone ?? ''} autoComplete="off" />
          </div>
          <button type="submit" className="boton boton--principal" style={{ minHeight: 48, fontSize: 15 }}>
            GUARDAR
          </button>
          <a href="/panel/maquinas" className="boton boton--fantasma" style={{ minHeight: 44 }}>Cancelar</a>
        </form>
      </section>

      <div style={{ marginTop: 14, maxWidth: 520 }}>
        <FormularioEjercicio volverA={`/panel/maquinas/${estacion.id}`} />
      </div>
    </MarcoPanel>
  );
}
