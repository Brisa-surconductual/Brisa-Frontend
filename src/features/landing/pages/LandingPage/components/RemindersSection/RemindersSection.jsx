import { Bell } from 'lucide-react';

import { LandingBackdrop } from '../../../../components/LandingBackdrop/index.js';
import { Reveal } from '../../../../components/Reveal/index.js';
import { RichTitle } from '../../../../components/RichTitle/index.js';
import { Section } from '../../../../components/Section/index.js';
import { REMINDERS } from '../../../../data/landing.content.js';

/**
 * Pila animada de 2 a 3 notificaciones con lenguaje genérico y discreto.
 * Cada una es un botón: al tocarla abre el chat de la demo.
 */
export function RemindersSection({ onOpenDemo }) {
  return (
    <Section
      id="recordatorios"
      tone="dark"
      labelledBy="lp-reminders-title"
    >
      <LandingBackdrop className="lp-aurora--soft" />

      <div className="lp-container lp-reminders">
        <div>
          <p className="lp-eyebrow">{REMINDERS.eyebrow}</p>
          <RichTitle
            id="lp-reminders-title"
            parts={REMINDERS.title}
          />
          <Reveal as="p" className="lp-lead">
            {REMINDERS.body}
          </Reveal>
        </div>

        <ul className="lp-notifs">
          {REMINDERS.items.map((item, index) => (
            <li
              key={item.id}
              className="lp-notifs__item lp-anim"
              style={{ '--i': index }}
            >
              <button
                type="button"
                className="lp-notif lp-glass"
                onClick={onOpenDemo}
                aria-label={`${REMINDERS.appName}, ${item.time}: ${item.text} ${REMINDERS.openHint}`}
              >
                <span className="lp-notif__icon">
                  <Bell
                    size={18}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                </span>
                <span className="lp-notif__body">
                  <span className="lp-notif__meta">
                    <strong>{REMINDERS.appName}</strong>
                    <span>{item.time}</span>
                  </span>
                  <span className="lp-notif__text">{item.text}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
