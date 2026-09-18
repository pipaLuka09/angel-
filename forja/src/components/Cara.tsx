/**
 * Las 5 caritas de sensación. Se dibujan como SVG y no como emoji para
 * que se vean iguales en todos los celulares y sean parte del diseño,
 * no de la tipografía del sistema operativo.
 * 1 = muy fácil … 5 = al límite.
 */
const BOCAS = [
  'M7.8 13.2c1.1 1.9 2.5 2.8 4.2 2.8s3.1-.9 4.2-2.8',
  'M8.5 14.5c.9.9 2.1 1.4 3.5 1.4s2.6-.5 3.5-1.4',
  'M9 15h6',
  'M8.5 16.4c.9-.9 2.1-1.4 3.5-1.4s2.6.5 3.5 1.4',
  'M7.8 17.2c1.1-1.9 2.5-2.8 4.2-2.8s3.1.9 4.2 2.8',
];

export function Cara({ nivel, tam = 24 }: { nivel: number; tam?: number }) {
  const boca = BOCAS[Math.min(Math.max(Math.round(nivel), 1), 5) - 1];
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01" />
      <path d="M15 10h.01" />
      <path d={boca} />
    </svg>
  );
}
