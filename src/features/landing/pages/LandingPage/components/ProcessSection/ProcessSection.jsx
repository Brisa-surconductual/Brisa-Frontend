import { Reveal } from '../../../../components/Reveal/index.js';
import { RichTitle } from '../../../../components/RichTitle/index.js';
import { Section } from '../../../../components/Section/index.js';
import { PROCESS } from '../../../../data/landing.content.js';

/** Proceso en cuatro pasos numerados (estilo editorial). */
export function ProcessSection() {
  return (
    <Section
      id="proceso"
      tone="light"
      labelledBy="lp-process-title"
    >
      <div className="lp-container">
        <p className="lp-eyebrow">{PROCESS.eyebrow}</p>
        <RichTitle
          id="lp-process-title"
          parts={PROCESS.title}
        />

        <ol className="lp-steps">
          {PROCESS.steps.map((step, index) => (
            <Reveal
              as="li"
              key={step.id}
              delay={index * 0.08}
              className="lp-step"
            >
              <span
                className="lp-step__num lp-display"
                aria-hidden="true"
              >
                {String(step.id).padStart(2, '0')}
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
