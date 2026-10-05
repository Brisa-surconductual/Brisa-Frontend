import { useState, useEffect } from 'react';
import { searchStudents } from '../../api/pausasAdministrativas/searcherStudents';

export function SearchableUserSelect({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = searchStudents ? await searchStudents(query.trim()) : [];
        
        const dataArray = Array.isArray(response) ? response : (response?.data || []);
        
        setResults(dataArray);
        setIsOpen(dataArray.length > 0); 
      } catch (error) {
        console.error('Error buscando usuarios:', error);
        setResults([]);
        setIsOpen(false);
      }
    }, 300); 

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelectUser(user) {
    const email = user.correoElectronico?.value || user.correoElectronico || user.email || 'Correo no disponible';
    
    setQuery(email);       
    setIsOpen(false);      
    onChange(user.idUsuario); e
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <label className="text-[13px] font-bold text-[var(--text-primary)]">
        Participante <span className="text-[var(--danger-text)]">*</span>
      </label>
      
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!e.target.value) onChange('');
        }}
        placeholder="Escribe al menos 2 letras del correo..."
        className="w-full rounded-[var(--radius-md)] border-[1.5px] border-[var(--surface-border)] bg-[var(--surface-card)] px-[13px] py-[10px] text-[14px] text-[var(--text-primary)] focus:border-[var(--brand-400)] focus:outline-none"
        autoComplete="off"
      />

      {isOpen && results.length > 0 && (
        <ul className="absolute top-[calc(100%+4px)] left-0 z-50 max-h-60 w-full overflow-y-auto rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-white shadow-xl">
          {results.map((user) => {
            const email = user.correoElectronico?.value || user.correoElectronico || user.email || 'Sin correo';
            return (
              <li
                key={user.idUsuario}
                onMouseDown={(e) => e.preventDefault()} 
                onClick={() => handleSelectUser(user)}
                className="cursor-pointer px-4 py-2.5 text-[13px] text-[var(--text-primary)] transition-colors hover:bg-[var(--brand-50)] border-b border-[var(--surface-border)] last:border-none"
              >
                {email}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}