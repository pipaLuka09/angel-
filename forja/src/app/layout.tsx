import type { Metadata, Viewport } from 'next';
import { Anton, Archivo } from 'next/font/google';
import './globals.css';

const display = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--fuente-display',
  display: 'swap',
});

const cuerpo = Archivo({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--fuente-cuerpo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FORJA',
  description: 'Acerca el celular al sticker de la máquina y anota tu entrenamiento.',
};

export const viewport: Viewport = {
  themeColor: '#0A0B0D',
  // El socio abre esto con una mano, a veces con guantes: que no haga
  // zoom accidental al tocar, pero sin bloquear el zoom manual.
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${cuerpo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
