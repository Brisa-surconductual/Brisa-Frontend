import { GlassCard } from '../../../../components/GlassCard/index.js';
import { LandingBackdrop } from '../../../../components/LandingBackdrop/index.js';
import { LandingIcon } from '../../../../components/LandingIcon/index.js';
import { Reveal } from '../../../../components/Reveal/index.js';
import { RichTitle } from '../../../../components/RichTitle/index.js';
import { Section } from '../../../../components/Section/index.js';
import { FEATURES } from '../../../../data/landing.content.js';
import { FeatureArt } from '../FeatureArt/index.js';

/**
 * Bento de lo que ofrece Brisa. Cada tarjeta tiene su propia animación y
 * habla de lo que la persona puede hacer, sin nombrar módulos.
 */
export function FeatureGrid() {
  return (
    <Section
      id="todo"
      tone="dark"
      labelledBy="lp-features-title"
    >
      <LandingBackdrop className="lp-aurora--soft" />

      <div className="lp-container">
        <p className="lp-eyebrow">{FEATURES.eyebrow}</p>
        <RichTitle
          id="lp-features-title"
          parts={FEATURES.title}
        />
      </div>

      <ul className="lp-container lp-bento">
        {FEATURES.items.map((item, index) => (
          <Reveal
            as="li"
            key={item.id}
            delay={(index % 4) * 0.06}
            className={`lp-bento__cell lp-bento__cell--${item.size}`}
          >
            <GlassCard className="lp-module">
              <FeatureArt id={item.id} />
              <div className="lp-module__head">
                <span className="lp-module__icon">
                  <LandingIcon
                    name={item.icon}
                    size={22}
                  />
                </span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </GlassCard>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
