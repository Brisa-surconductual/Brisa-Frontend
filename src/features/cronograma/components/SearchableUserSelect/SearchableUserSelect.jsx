import { useState, useEffect } from 'react';
import { CircleCheck, Search } from 'lucide-react';

import { searchStudents } from '../../api/pausasAdministrativas/searcherStudents';
import { getNextActiveIndex } from '../../utils/comboboxNavigation.js';

const INPUT_ID = 'assign-participant';
const LISTBOX_ID = 'assign-participant-options';
const HINT_ID = 'assign-participant-hint';

function getUserEmail(user, fallback) {
  return user.correoElectronico?.value || user.correoElectronico || user.email || fallback;
}

/*
 * Buscador de participantes (combobox). Las consultas y la
 * selección no cambian; se añade la semántica ARIA y el manejo
 * con teclado: flechas para recorrer, Enter para elegir y Escape
 * para cerrar la lista.
 */
export function SearchableUserSelect({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Correo elegido: al escribirlo en el campo se repite la búsqueda,
  // pero la lista no vuelve a abrirse sobre una selección ya hecha.
  const [selectedEmail, setSelectedEmail] = useState('');

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
        // Solo el estado HTTP: el error de axios incluye el término
        // buscado y la cabecera CSRF.
        console.error(
          'Error buscando usuarios. Estado HTTP:',
          error?.response?.status ?? 'sin respuesta',
        );
        setResults([]);
        setIsOpen(false);
      }
    }, 300); 

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelectUser(user) {
    const email = getUserEmail(user, 'Correo no disponible');

    setQuery(email);
    setSelectedEmail(email);
    setIsOpen(false);
    setActiveIndex(-1);
    onChange(user.idUsuario);
  }

  const showOptions =
    isOpen && results.length > 0 && query !== selectedEmail;
  const activeOption =
    showOptions && activeIndex >= 0 && activeIndex < results.length
      ? activeIndex
      : -1;

  function handleKeyDown(event) {
    if (!showOptions) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(
        getNextActiveIndex(event.key, activeOption, results.length),
      );
      return;
    }

    if (event.key === 'Enter' && activeOption >= 0) {
      // Enter elige la opción activa en vez de enviar el formulario.
      event.preventDefault();
      handleSelectUser(results[activeOption]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative flex flex-col gap-[6px]">
      <label
        htmlFor={INPUT_ID}
        className="flex items-center gap-[var(--space-1)] text-[13px] font-bold text-[var(--text-primary)]"
      >
        Participante
        <span className="text-[var(--danger-text)]" aria-hidden="true">
          *
        </span>
      </label>

      <div className="relative">
        <Search
          size={18}
          strokeWidth={1.8}
          className="pointer-events-none absolute top-1/2 left-[13px] -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden="true"
        />

        <input
          id={INPUT_ID}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showOptions}
          aria-controls={LISTBOX_ID}
          aria-activedescendant={
            activeOption >= 0 ? `${LISTBOX_ID}-${activeOption}` : undefined
          }
          aria-describedby={HINT_ID}
          aria-required="true"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            if (!e.target.value) onChange('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Escribe al menos 2 letras del correo..."
          className="min-h-[44px] w-full rounded-[var(--radius-md)] border-[1.5px] border-[var(--surface-border)] bg-[var(--surface-card)] py-[10px] pr-[13px] pl-[42px] text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-400)] focus:shadow-[var(--focus-ring)] focus:outline-none"
          autoComplete="off"
        />

        <ul
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Participantes encontrados"
          hidden={!showOptions}
          className="absolute top-[calc(100%+4px)] left-0 z-50 m-0 max-h-60 w-full list-none overflow-y-auto rounded-[var(--radius-md)] border border-[var(--surface-border)] bg-[var(--surface-card)] p-[var(--space-1)] shadow-[var(--shadow-lg)]"
        >
          {showOptions &&
            results.map((user, index) => (
              <li
                key={user.idUsuario}
                id={`${LISTBOX_ID}-${index}`}
                role="option"
                aria-selected={index === activeOption}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectUser(user)}
                className={`flex min-h-[44px] cursor-pointer items-center rounded-[var(--radius-sm)] px-[var(--space-3)] text-[13px] [overflow-wrap:anywhere] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)] motion-reduce:transition-none ${
                  index === activeOption ? 'bg-[var(--brand-50)] font-semibold' : ''
                }`}
              >
                {getUserEmail(user, 'Sin correo')}
              </li>
            ))}
        </ul>
      </div>

      <p
        id={HINT_ID}
        className="m-0 text-[11px] leading-[1.45] text-[var(--text-muted)]"
      >
        Usa las flechas para recorrer los resultados y Enter para elegir.
      </p>

      {value && (
        <p className="m-0 inline-flex items-center gap-[var(--space-1)] text-[length:var(--font-size-xs)] font-bold text-[var(--success-text)]">
          <CircleCheck size={14} strokeWidth={2} aria-hidden="true" />
          Participante seleccionado
        </p>
      )}
    </div>
  );
}
