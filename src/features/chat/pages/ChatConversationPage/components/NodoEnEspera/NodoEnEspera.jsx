import { CalendarClock, House } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { textoHabilitacion } from '../../utils/esperaCronograma.js';

/*
 * RF-24 / RF-22: el siguiente nodo pertenece a una unidad de tu cronograma
 * que todavía no empieza. No se muestra su contenido ni su formulario; al
 * llegar la fecha se puede continuar sin hacer nada más. La fecha es
 * aproximada porque una pausa del cronograma la corre.
 */
export function NodoEnEspera({ habilitaAprox, onVolverInicio }) {
  const fecha = textoHabilitacion(habilitaAprox);

  return (
    <section
      aria-labelledby="nodo-en-espera-titulo"
      className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-xl)] border border-[var(--info-border)] bg-[var(--info-bg)] p-[var(--space-4)] text-[var(--info-text)] shadow-[var(--glass-shadow)]"
    >
      <h2
        id="nodo-en-espera-titulo"
        className="m-0 flex items-center gap-[var(--space-2)] text-[length:var(--font-size-md)] font-bold"
      >
        <CalendarClock
          size={20}
          strokeWidth={1.8}
          aria-hidden="true"
          className="shrink-0"
        />
        Por hoy es todo
      </h2>

      <p className="m-0 text-[length:var(--font-size-sm)] text-pretty">
        {fecha
          ? `Tu siguiente sesión se habilita aproximadamente el ${fecha}. Tus respuestas quedaron guardadas.`
          : 'Tu siguiente sesión se habilitará cuando avance tu cronograma. Tus respuestas quedaron guardadas.'}
      </p>

      <Button variant="secondary" size="large" onClick={onVolverInicio}>
        <House size={20} strokeWidth={1.8} aria-hidden="true" />
        Volver al inicio
      </Button>
    </section>
  );
}
