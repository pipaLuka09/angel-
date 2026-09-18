export function Marca({ grande = false }: { grande?: boolean }) {
  return (
    <div className={grande ? 'marca marca--grande' : 'marca'}>
      <div className="marca__cubo" aria-hidden="true">F</div>
      <div className="marca__texto">FORJA</div>
    </div>
  );
}
