import { useRef, useState } from 'react';
import {
  m,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import { GraduationCap, Lock, LockOpen } from 'lucide-react';

import { BrisaMark } from '../../../../components/BrisaMark/index.js';
import { LandingBackdrop } from '../../../../components/LandingBackdrop/index.js';
import { RichTitle } from '../../../../components/RichTitle/index.js';
import { Section } from '../../../../components/Section/index.js';
import { Sparkle } from '../../../../components/Sparkle/index.js';
import { JOURNEY } from '../../../../data/landing.content.js';
import { getJourneyWeeks, getStageIndex } from '../../../../services/journey.js';
import {
  JOURNEY_PREVIEW_WEEKS,
  JOURNEY_TOTAL_WEEKS,
} from '../../../../types/landingConfig.js';

// La cantidad de semanas sale de la configuración: sin total definido no se
// muestra un número fijo (ver services/journey.js).
const { weeks, hasMore } = getJourneyWeeks(
  JOURNEY_TOTAL_WEEKS,
  JOURNEY_PREVIEW_WEEKS,
);

function WeekList({ active, all }) {
  return (
    <ol className="lp-weeks">
      {weeks.map((week, index) => {
        const open = all || index <= active;

        return (
          <li
            key={week}
            className="lp-week"
            data-open={open}
            aria-current={!all && index === active ? 'step' : undefined}
          >
            {open ? (
              <LockOpen
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            ) : (
              <Lock
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            )}
            <span>
              {JOURNEY.weekLabel} {week}
            </span>
            <span className="lp-week__state">
              {open ? JOURNEY.unlocked : JOURNEY.locked}
            </span>
          </li>
        );
      })}
      {hasMore && (
        <li className="lp-week lp-week--more">
          <span>…</span>
          <span>{JOURNEY.rest}</span>
        </li>
      )}
    </ol>
  );
}

function StageCard({ stageIndex }) {
  const stage = JOURNEY.stages[stageIndex];

  return (
    <div className="lp-stage lp-glass">
      <ol
        className="lp-stage__dots"
        aria-label="Etapas de la historia"
      >
        {JOURNEY.stages.map((item, index) => (
          <li
            key={item.id}
            data-on={index <= stageIndex}
            aria-current={index === stageIndex ? 'step' : undefined}
          >
            {item.name}
          </li>
        ))}
      </ol>
      <p className="lp-stage__text">{stage.text}</p>
      {stageIndex === 2 && (
        <p className="lp-stage__grad">
          <GraduationCap
            size={18}
            strokeWidth={1.7}
            aria-hidden="true"
          />
          {JOURNEY.graduation}
        </p>
      )}
    </div>
  );
}

/**
 * Scrollytelling: la sección queda fijada (sticky) mientras el scroll
 * desbloquea semanas y avanza la historia con la mascota. Con movimiento
 * reducido es una versión estática con todo visible.
 */
export function JourneySection() {
  const reduce = useReducedMotion();
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const count = weeks.length;

    setActive(Math.min(count - 1, Math.max(0, Math.floor(value * count))));
  });

  const stageIndex = reduce
    ? 1
    : getStageIndex(active, weeks.length, hasMore);

  return (
    <Section
      id="recorrido"
      tone="dark"
      labelledBy="lp-journey-title"
      className="lp-journey"
    >
      <LandingBackdrop className="lp-aurora--soft" />

      <div
        ref={trackRef}
        className="lp-journey__track"
        data-static={Boolean(reduce)}
        style={{ '--weeks': weeks.length }}
      >
        <div className="lp-journey__pin">
          <div className="lp-container lp-journey__grid">
            <div className="lp-journey__copy">
              <p className="lp-eyebrow">{JOURNEY.eyebrow}</p>
              <RichTitle
                id="lp-journey-title"
                parts={JOURNEY.title}
              />
              <p className="lp-lead">{JOURNEY.body}</p>
            </div>

            <div className="lp-journey__stage">
              <WeekList
                active={active}
                all={Boolean(reduce)}
              />

              <div
                className="lp-path"
                aria-hidden="true"
              >
                <span className="lp-path__line" />
                {!reduce && (
                  <m.span
                    className="lp-path__fill"
                    style={{ scaleX: progress }}
                  />
                )}
                {/* La mascota avanza con transform: --p va de 0 a 1. */}
                <m.span
                  className="lp-path__mascot"
                  style={reduce ? undefined : { '--p': progress }}
                >
                  <BrisaMark size={48} animated />
                </m.span>
                <Sparkle
                  size={20}
                  className="lp-path__goal"
                />
              </div>

              <StageCard stageIndex={stageIndex} />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
