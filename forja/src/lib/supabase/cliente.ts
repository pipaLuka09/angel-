'use client';

import { createBrowserClient } from '@supabase/ssr';
import { entorno } from './cookies';

export function supabaseNavegador() {
  const { url, key } = entorno();
  return createBrowserClient(url, key);
}
