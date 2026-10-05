export function FormAlert({ message, type = 'error' }) {
  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className={`rounded-[var(--radius-md)] p-3 text-[13px] font-medium flex items-center gap-2 animate-fade-in ${
      isSuccess 
        ? 'bg-[var(--success-bg, #f0fdf4)] border border-[var(--success-border, #bbf7d0)] text-[var(--success-text, #16a34a)]' 
        : 'bg-[var(--danger-50, #fef2f2)] border border-[var(--danger-200, #fecaca)] text-[var(--danger-700, #b91c1c)]'
    }`}>
      <p className="m-0 leading-normal">{message}</p>
    </div>
  );
}