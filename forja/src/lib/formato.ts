import type { Meta } from './tipos';

/** Los pesos se guardan siempre en kg. 82.50 se muestra como "82.5". */
export function peso(kg: number | string | null | undefined): string {
  if (kg === null || kg === undefined) return '—';
  const n = typeof kg === 'string' ? Number(kg) : kg;
  if (!Number.isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "2026-09-14" -> "14 sep". Se parte a mano para no depender de la zona horaria. */
export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return '—';
  return `${d} ${MESES[m - 1]}`;
}

export function fechaLarga(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return '—';
  return `${d} de ${['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][m - 1]} de ${a}`;
}

function hoyUTC(): Date {
  const h = new Date();
  return new Date(Date.UTC(h.getUTCFullYear(), h.getUTCMonth(), h.getUTCDate()));
}

function comoFecha(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

export function diasDesde(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.round((hoyUTC().getTime() - comoFecha(iso).getTime()) / 86_400_000);
}

export function diasHasta(iso: string | null | undefined): number | null {
  const d = diasDesde(iso);
  return d === null ? null : -d;
}

/** "hoy", "ayer", "hace 4 días". */
export function haceCuanto(iso: string | null | undefined): string {
  const d = diasDesde(iso);
  if (d === null) return '';
  if (d <= 0) return 'hoy';
  if (d === 1) return 'ayer';
  return `hace ${d} días`;
}

export const NOMBRE_SENSACION = ['Muy fácil', 'Fácil', 'Normal', 'Duro', 'Al límite'] as const;

/**
 * Progreso hacia la meta. Si sabemos desde dónde arrancó, se mide sobre
 * ese tramo; si no (meta fijada sin historial), sobre el total.
 */
export function progresoMeta(actual: number | null, meta: Meta): number {
  const hoy = actual ?? 0;
  const inicio = meta.start_weight_kg ?? 0;
  const objetivo = Number(meta.target_weight_kg);
  if (objetivo <= inicio) return 100;
  const avance = ((hoy - inicio) / (objetivo - inicio)) * 100;
  return Math.max(0, Math.min(100, Math.round(avance)));
}
