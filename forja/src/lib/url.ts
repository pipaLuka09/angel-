import { headers } from 'next/headers';

/**
 * La URL pública de la app. En producción sale de NEXT_PUBLIC_SITE_URL;
 * si no está, se deduce del host de la petición para que los enlaces
 * que se comparten (stickers, link de registro) sigan sirviendo en un
 * despliegue sin configurar.
 */
export async function baseUrl(): Promise<string> {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '');
  if (configurada) return configurada;

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const protocolo = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocolo}://${host}`;
}
