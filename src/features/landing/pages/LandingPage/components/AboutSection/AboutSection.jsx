import { LandingIcon } from '../../../../components/LandingIcon/index.js';
import { Reveal } from '../../../../components/Reveal/index.js';
import { RichTitle } from '../../../../components/RichTitle/index.js';
import { Section } from '../../../../components/Section/index.js';
import { Sparkle } from '../../../../components/Sparkle/index.js';
import { ABOUT } from '../../../../data/landing.content.js';

/** «Qué es Brisa»: una idea clara, tres pilares y el botón de instalar. */
export function AboutSection() {
  return (
    <Section
      id="que-es"
      tone="light"
      labelledBy="lp-about-title"
    >
      <div
        className="lp-sunburst lp-anim"
        aria-hidden="true"
      />
      <div className="lp-container lp-about">
        <div className="lp-about__intro">
          <p className="lp-eyebrow">{ABOUT.eyebrow}</p>
          <RichTitle
            id="lp-about-title"
            parts={ABOUT.title}
          />
          <Reveal
            as="p"
            className="lp-lead"
          >
            {ABOUT.body}
          </Reveal>
        </div>

        <ul className="lp-pillars">
          {ABOUT.pillars.map((pillar, index) => (
            <Reveal
              as="li"
              key={pillar.id}
              delay={index * 0.08}
              className="lp-pillar"
            >
              <span className="lp-pillar__icon">
                <LandingIcon
                  name={pillar.icon}
                  size={22}
                />
              </span>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
              <Sparkle
                size={16}
                className="lp-pillar__spark"
              />
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
