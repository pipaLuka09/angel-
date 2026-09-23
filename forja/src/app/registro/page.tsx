import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Marca } from '@/components/Marca';
import { supabaseServidor } from '@/lib/supabase/server';
import { FormularioRegistro } from './FormularioRegistro';

type GymRegistro = { id: string; name: string; branch_name: string | null };

export default async function Registro({
  searchParams,
}: {
  searchParams: Promise<{ gym?: string; destino?: string }>;
}) {
  const { gym, destino } = await searchParams;
  const destinoSeguro = destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : '/';

  const supabase = await supabaseServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (sesion.user) redirect(destinoSeguro);

  // El gimnasio se deduce de donde venga la persona: del link de registro
  // (?gym=) o del sticker que tocó sin tener cuenta (?destino=/m/<codigo>).
  const desdeSticker = destinoSeguro.match(/^\/m\/([^/?#]+)/)?.[1] ?? null;
  const ref = gym ?? desdeSticker;

  let gymInfo: GymRegistro | null = null;
  if (ref) {
    const { data } = await supabase.rpc('gym_para_registro', { p_ref: ref });
    gymInfo = (data as GymRegistro[] | null)?.[0] ?? null;
  }

  return (
    <main className="pantalla" style={{ paddingTop: 44 }}>
      <Marca grande />

      <h1 className="titulo titulo--chico" style={{ marginTop: 34 }}>Crea tu cuenta</h1>
      <p className="parrafo" style={{ marginTop: 12 }}>
        Tu gimnasio la aprueba y listo: después solo acercas el celular al sticker de cada máquina.
      </p>

      {gymInfo && (
        <div className="carta" style={{ marginTop: 20, padding: '12px 16px' }}>
          <div className="rotulo rotulo--tenue">Te vas a registrar en</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
            {gymInfo.name}
            {gymInfo.branch_name ? ` · ${gymInfo.branch_name}` : ''}
          </div>
        </div>
      )}

      <FormularioRegistro gymConocido={gymInfo && ref ? ref : null} destino={destinoSeguro} />

      <div className="crece" />

      <p className="apunte" style={{ textAlign: 'center', marginTop: 24, lineHeight: 1.5 }}>
        ¿Ya tienes cuenta?{' '}
        <Link href={`/entrar?destino=${encodeURIComponent(destinoSeguro)}`} style={{ fontWeight: 600 }}>
          Entra aquí
        </Link>
      </p>
    </main>
  );
}
