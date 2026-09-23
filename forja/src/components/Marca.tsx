import Link from 'next/link';

/** El logo. En todas las pantallas lleva al inicio, como en cualquier app. */
export function Marca({ grande = false }: { grande?: boolean }) {
  return (
    <Link href="/" className={grande ? 'marca marca--grande' : 'marca'} aria-label="FORJA, ir al inicio">
      <span className="marca__cubo" aria-hidden="true">F</span>
      <span className="marca__texto">FORJA</span>
    </Link>
  );
}
