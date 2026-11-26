// Solo esta pieza se anuncia: el `label` una vez; el esqueleto va oculto.
export function LoadingRegion({ loading, label, children, skeleton }) {
  if (!loading) return children;

  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {skeleton}
    </div>
  );
}
