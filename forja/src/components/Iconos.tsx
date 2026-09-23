type Props = { tam?: number; color?: string; grosor?: number };

function Svg({ tam = 18, color = 'currentColor', grosor = 2, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Atras   = (p: Props) => <Svg {...p}><path d="M15 5l-7 7 7 7" /></Svg>;
export const Mas     = (p: Props) => <Svg {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Svg>;
export const Menos   = (p: Props) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const Check   = (p: Props) => <Svg {...p}><path d="M4 12.5l5.5 5.5L20 7" /></Svg>;
export const Flecha  = (p: Props) => <Svg {...p}><path d="M5 12h13" /><path d="M13 6l6 6-6 6" /></Svg>;
export const Barras  = (p: Props) => <Svg {...p}><path d="M4 18V9" /><path d="M10 18V5" /><path d="M16 18v-6" /><path d="M3 21h18" /></Svg>;
export const Video   = (p: Props) => <Svg {...p}><rect x="3" y="4" width="18" height="16" rx="4" /><path d="M10 9v6l5-3z" /></Svg>;
export const Alerta  = (p: Props) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16.5h.01" /></Svg>;
export const Equis   = (p: Props) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6" /><path d="M15 9l-6 6" /></Svg>;
export const Basura  = (p: Props) => (
  <Svg {...p}><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" /><path d="M9 7V4h6v3" /></Svg>
);
export const Whatsapp = (p: Props) => (
  <Svg {...p}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.7L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z" /></Svg>
);
export const Nfc = (p: Props) => (
  <Svg {...p}><path d="M5 8a12 12 0 0 1 0 8" /><path d="M9.5 6a17 17 0 0 1 0 12" /><path d="M14 4a22 22 0 0 1 0 16" /></Svg>
);
