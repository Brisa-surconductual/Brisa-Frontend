import { useReducedMotion } from 'motion/react';
import { Pause, Play } from 'lucide-react';

import { BrisaMark } from '../../../../components/BrisaMark/index.js';
import { CtaGroup } from '../../../../components/CtaGroup/index.js';
import { LandingBackdrop } from '../../../../components/LandingBackdrop/index.js';
import { LandingIcon } from '../../../../components/LandingIcon/index.js';
import { Section } from '../../../../components/Section/index.js';
import { Sparkle } from '../../../../components/Sparkle/index.js';
import { usePointerParallax } from '../../../../hooks/usePointerParallax.js';
import { HERO, ORBIT_NODES } from '../../../../data/landing.content.js';

const STEP = 360 / ORBIT_NODES.length;

/**
 * Hero orbital: «Brisa» y el logo animado al centro, seis nodos que orbitan
 * despacio, parallax con el puntero (solo transform) y un control visible
 * para pausar el movimiento (WCAG 2.2.2).
 */
export function HeroOrbital({ ctas, onInstall, paused, onTogglePaused }) {
  const reduce = useReducedMotion();
  const heroRef = usePointerParallax(!reduce && !paused);

  return (
    <Section
      id="inicio"
      tone="dark"
      arc={false}
      labelledBy="lp-hero-title"
      className="lp-hero"
    >
      <LandingBackdrop />

      <div ref={heroRef} className="lp-hero__inner lp-container">
        <p className="lp-eyebrow">{HERO.eyebrow}</p>

        <div className="lp-orbit" role="group" aria-label={HERO.orbitLabel}>
          <span
            className="lp-orbit__track lp-orbit__track--outer"
            aria-hidden="true"
          />
          <span
            className="lp-orbit__track lp-orbit__track--inner"
            aria-hidden="true"
          />
          <Sparkle
            size={22}
            className="lp-layer lp-layer--1 lp-spark lp-spark--a"
          />
          <Sparkle
            size={14}
            className="lp-layer lp-layer--2 lp-spark lp-spark--b"
          />

          <div className="lp-orbit__core lp-layer lp-layer--3">
            <BrisaMark size={84} animated className="lp-orbit__mascot" />
            <h1 id="lp-hero-title" className="lp-display lp-hero__title">
              {HERO.title}
            </h1>
          </div>

          <ul className="lp-orbit__ring lp-anim">
            {ORBIT_NODES.map((node, index) => (
              <li
                key={node.id}
                className="lp-orbit__node"
                style={{ '--a': `${index * STEP}deg` }}
              >
                <a href={`#${node.target}`} className="lp-orbit__link lp-anim">
                  <span className="lp-orbit__bubble lp-glass">
                    <LandingIcon name={node.icon} size={22} />
                  </span>
                  <span className="lp-orbit__label">{node.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lp-hero__copy">
          <p className="lp-hero__subtitle">{HERO.subtitle}</p>

          <button
            type="button"
            className="lp-motion-toggle"
            aria-pressed={paused}
            onClick={onTogglePaused}
          >
            {paused ? (
              <Play size={16} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Pause size={16} strokeWidth={1.8} aria-hidden="true" />
            )}
            {paused ? HERO.resumeMotion : HERO.pauseMotion}
          </button>

          <CtaGroup ctas={ctas} onInstall={onInstall} />
        </div>
      </div>
    </Section>
  );
}
