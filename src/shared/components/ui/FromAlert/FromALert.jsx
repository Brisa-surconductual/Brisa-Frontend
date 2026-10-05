export function FormAlert({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--danger-50, #fef2f2)] border border-[var(--danger-200, #fecaca)] p-3 text-[13px] font-medium text-[var(--danger-700, #b91c1c)] flex items-center gap-2 animate-fade-in">
      <p className="m-0 leading-normal">{message}</p>
    </div>
  );
}