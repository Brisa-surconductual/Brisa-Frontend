import { useRef } from 'react';
import { LifeBuoy, RotateCcw } from 'lucide-react';

import { BrisaMark } from '../../../../components/BrisaMark/index.js';
import { Reveal } from '../../../../components/Reveal/index.js';
import { RichTitle } from '../../../../components/RichTitle/index.js';
import { Section } from '../../../../components/Section/index.js';
import { Sparkle } from '../../../../components/Sparkle/index.js';
import { DEMO } from '../../../../data/landing.content.js';
import { usePhoneDemo } from '../../hooks/usePhoneDemo.js';

/**
 * Teléfono en HTML/CSS con un mini chat en árbol. Solo opciones: no hay
 * campo de texto, igual que el chat real. Etiquetado como ejemplo.
 */
function Phone() {
  const logRef = useRef(null);
  const optionsRef = useRef(null);
  const demo = usePhoneDemo({ logRef, optionsRef });

  return (
    <div className="lp-phone">
      <span
        className="lp-phone__notch"
        aria-hidden="true"
      />
      <div className="lp-phone__screen">
        <div className="lp-phone__bar">
          <BrisaMark size={30} animated />
          <strong>{DEMO.chatTitle}</strong>
          <span className="lp-phone__badge">{DEMO.badge}</span>
        </div>

        <div
          ref={logRef}
          className="lp-phone__log"
          role="log"
          aria-live="polite"
          aria-label="Conversación de ejemplo"
          tabIndex={0}
        >
          {demo.messages.map((message) => (
            <p
              key={message.id}
              className={`lp-msg lp-msg--${message.from}`}
            >
              {message.text}
            </p>
          ))}
          {demo.typing && (
            <p
              className="lp-msg lp-msg--bot lp-typing"
              role="status"
            >
              <span className="lp-sr-only">{DEMO.typing}</span>
              <span aria-hidden="true" className="lp-typing__dot lp-anim" />
              <span aria-hidden="true" className="lp-typing__dot lp-anim" />
              <span aria-hidden="true" className="lp-typing__dot lp-anim" />
            </p>
          )}
        </div>

        <div
          ref={optionsRef}
          className="lp-phone__options"
          role="group"
          aria-label={DEMO.optionsLabel}
        >
          {demo.finished ? (
            <>
              <p className="lp-phone__end">{DEMO.endNote}</p>
              <button
                type="button"
                className="lp-chip lp-chip--accent"
                onClick={demo.restart}
              >
                <RotateCcw
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                {DEMO.restart}
              </button>
            </>
          ) : (
            demo.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="lp-chip"
                disabled={demo.typing}
                onClick={() => demo.choose(option.id)}
              >
                {option.label}
              </button>
            ))
          )}
        </div>

        <button
          type="button"
          className="lp-phone__help"
          onClick={demo.showHelp}
        >
          <LifeBuoy
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
          />
          {DEMO.helpButton}
        </button>
      </div>
    </div>
  );
}

export function PhoneDemo({ demoKey }) {
  return (
    <Section
      id="demo"
      tone="light"
      labelledBy="lp-demo-title"
    >
      <div className="lp-container lp-demo">
        <div className="lp-demo__copy">
          <p className="lp-eyebrow">{DEMO.eyebrow}</p>
          <RichTitle
            id="lp-demo-title"
            parts={DEMO.title}
          />
          <Reveal as="p" className="lp-lead">
            {DEMO.body}
          </Reveal>
        </div>

        <div className="lp-demo__stage">
          <Sparkle
            size={28}
            className="lp-spark lp-spark--demo lp-anim"
          />
          {/* La key reinicia la conversación cuando un recordatorio la abre. */}
          <Phone key={demoKey} />
        </div>
      </div>
    </Section>
  );
}
