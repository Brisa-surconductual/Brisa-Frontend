import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { RichTitle } from '../../../../components/RichTitle/index.js';
import { Section } from '../../../../components/Section/index.js';
import { FAQ } from '../../../../data/landing.content.js';

/**
 * Acordeón accesible (patrón APG): cada pregunta es un botón dentro de un
 * encabezado con aria-expanded y aria-controls; el panel es una región con
 * aria-labelledby. Flechas, Inicio y Fin mueven el foco entre preguntas.
 */
export function FaqSection() {
  const [openId, setOpenId] = useState(null);

  function handleKeyDown(event) {
    const buttons = [
      ...event.currentTarget.querySelectorAll('[data-faq-trigger]'),
    ];
    const current = buttons.indexOf(document.activeElement);
    const target = {
      ArrowDown: (current + 1) % buttons.length,
      ArrowUp: (current - 1 + buttons.length) % buttons.length,
      Home: 0,
      End: buttons.length - 1,
    }[event.key];

    if (current < 0 || target === undefined) return;

    event.preventDefault();
    buttons[target].focus();
  }

  return (
    <Section
      id="faq"
      tone="light"
      labelledBy="lp-faq-title"
      className="lp-faq"
    >
      <div className="lp-container lp-faq__grid">
        <div>
          <p className="lp-eyebrow">{FAQ.eyebrow}</p>
          <RichTitle
            id="lp-faq-title"
            parts={FAQ.title}
          />
        </div>

        <div
          className="lp-accordion"
          onKeyDown={handleKeyDown}
        >
          {FAQ.items.map((item) => {
            const open = openId === item.id;

            return (
              <div
                key={item.id}
                className="lp-acc"
                data-open={open}
              >
                <h3>
                  <button
                    type="button"
                    id={`lp-faq-btn-${item.id}`}
                    data-faq-trigger
                    aria-expanded={open}
                    aria-controls={`lp-faq-panel-${item.id}`}
                    onClick={() => setOpenId(open ? null : item.id)}
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={20}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={`lp-faq-panel-${item.id}`}
                  role="region"
                  aria-labelledby={`lp-faq-btn-${item.id}`}
                  hidden={!open}
                  className="lp-acc__panel"
                >
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
