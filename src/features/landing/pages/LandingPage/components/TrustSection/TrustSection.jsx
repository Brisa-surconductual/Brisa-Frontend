import { LandingBackdrop } from '../../../../components/LandingBackdrop/index.js';
import { GlassCard } from '../../../../components/GlassCard/index.js';
import { LandingIcon } from '../../../../components/LandingIcon/index.js';
import { Reveal } from '../../../../components/Reveal/index.js';
import { RichTitle } from '../../../../components/RichTitle/index.js';
import { Section } from '../../../../components/Section/index.js';
import { TRUST } from '../../../../data/landing.content.js';

/** Confianza + espacio reservado (sin contenido) para ayuda en crisis. */
export function TrustSection() {
  return (
    <Section
      id="confianza"
      tone="dark"
      labelledBy="lp-trust-title"
    >
      <LandingBackdrop />

      <div className="lp-container">
        <p className="lp-eyebrow">{TRUST.eyebrow}</p>
        <RichTitle
          id="lp-trust-title"
          parts={TRUST.title}
        />

        <ul className="lp-trust">
          {TRUST.items.map((item, index) => (
            <Reveal
              as="li"
              key={item.id}
              delay={index * 0.07}
            >
              <GlassCard className="lp-trust__card">
                <span
                  className="lp-trust__num lp-display"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="lp-module__icon">
                  <LandingIcon
                    name={item.icon}
                    size={22}
                  />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </GlassCard>
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
