/**
 * PostgREST devuelve un objeto para las relaciones muchos-a-uno, pero sin
 * los tipos generados del proyecto TypeScript las infiere como arreglo.
 * Esto normaliza las dos formas en una sola.
 */
export function uno<T>(valor: unknown): T | null {
  if (!valor) return null;
  return (Array.isArray(valor) ? (valor[0] ?? null) : valor) as T | null;
}
