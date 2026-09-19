import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { supabaseServidor } from '@/lib/supabase/server';
import { gymDelStaff } from '@/lib/panel';
import type { EstacionPanel } from '@/lib/tipos';
import { MarcoPanel, SinAcceso } from '../MarcoPanel';

/**
 * La URL que se graba en el chip. En producción sale de
 * NEXT_PUBLIC_SITE_URL; si no está, se deduce del host de la petición
 * para que la hoja siga sirviendo en un preview sin configurar nada.
 */
async function baseUrl(): Promise<string> {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '');
  if (configurada) return configurada;

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const protocolo = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocolo}://${host}`;
}

export default async function Stickers() {
  const gym = await gymDelStaff('/panel/stickers');
  if (!gym) return <SinAcceso />;

  const supabase = await supabaseServidor();
  const { data } = await supabase.rpc('gym_stations', { p_gym_id: gym.gymId });
  const todas = (data as EstacionPanel[] | null) ?? [];
  const conCodigo = todas.filter((e) => e.nfc_code);
  const sinCodigo = todas.filter((e) => !e.nfc_code);

  const base = await baseUrl();

  const stickers = await Promise.all(
    conCodigo.map(async (e) => ({
      ...e,
      url: `${base}/m/${e.nfc_code}`,
      qr: await QRCode.toString(`${base}/m/${e.nfc_code}`, {
        type: 'svg',
        margin: 0,
        errorCorrectionLevel: 'M',
        color: { dark: '#0A0B0DFF', light: '#FFFFFFFF' },
      }),
    })),
  );

  return (
    <MarcoPanel
      gym={gym}
      activo="stickers"
      titulo="Stickers"
      bajada={`${stickers.length} listos para imprimir`}
      acciones={
        <a
          href="/panel/maquinas"
          className="boton boton--fantasma no-imprimir"
          style={{ width: 'auto', minHeight: 42, padding: '0 16px' }}
        >
          Asignar códigos
        </a>
      }
    >
      <section className="carta no-imprimir" style={{ marginTop: 22, borderRadius: 17, padding: '18px 20px' }}>
        <span className="rotulo">Cómo se usa esta hoja</span>
        <ol className="parrafo" style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6 }}>
          <li>
            Imprímela (Ctrl/Cmd + P). Solo salen los stickers: el panel no se va al papel.
          </li>
          <li>
            Pega cada etiqueta en su máquina y encima, o al lado, el chip NFC.
          </li>
          <li>
            Graba el chip con cualquier app de escritura NFC, con un registro de tipo{' '}
            <strong style={{ color: 'var(--tinta)' }}>URL</strong>: la dirección está debajo de cada QR.
          </li>
        </ol>
        <p className="apunte" style={{ margin: '12px 0 0', lineHeight: 1.5 }}>
          El QR no es decoración: es el respaldo para cuando el chip falla, se despega, o el celular
          de alguien no lee NFC. Lleva la misma dirección.
        </p>
        {!process.env.NEXT_PUBLIC_SITE_URL && (
          <p className="aviso" style={{ marginTop: 14 }}>
            <strong style={{ color: 'var(--tinta)' }}>Antes de imprimir de verdad:</strong> falta
            configurar <span className="mono">NEXT_PUBLIC_SITE_URL</span>. Ahora se está usando{' '}
            <span className="mono">{base}</span>, que es de donde abriste esta página. Si esa no es la
            dirección definitiva, los stickers quedarán apuntando al lugar equivocado.
          </p>
        )}
      </section>

      {sinCodigo.length > 0 && (
        <p className="aviso no-imprimir" style={{ marginTop: 14 }}>
          {sinCodigo.length} máquinas todavía no tienen código, así que no aparecen aquí:{' '}
          {sinCodigo.map((e) => e.label).join(', ')}. Asígnaselo en Máquinas.
        </p>
      )}

      {stickers.length === 0 ? (
        <p className="aviso no-imprimir" style={{ marginTop: 14 }}>
          Ninguna máquina tiene código asignado todavía. Empieza en Máquinas.
        </p>
      ) : (
        <div className="hoja-stickers">
          {stickers.map((e) => (
            <article key={e.id} className="sticker">
              <div className="sticker__marca">FORJA</div>
              <div className="sticker__barra" />
              <div className="sticker__estacion">{e.label}</div>
              <div className="sticker__ejercicio">{e.name}</div>
              <div className="sticker__qr" dangerouslySetInnerHTML={{ __html: e.qr }} />
              <div className="sticker__codigo">{e.url.replace(/^https?:\/\//, '')}</div>
              <div className="sticker__pie">Acerca tu celular o escanea el código</div>
            </article>
          ))}
        </div>
      )}
    </MarcoPanel>
  );
}
