import { useState } from 'react';
import { Quote } from 'lucide-react';

import { LandingIcon } from '../../../../components/LandingIcon/index.js';
import { Reveal } from '../../../../components/Reveal/index.js';
import { RichTitle } from '../../../../components/RichTitle/index.js';
import { Section } from '../../../../components/Section/index.js';
import { useInView } from '../../../../hooks/useInView.js';
import { TRACKING } from '../../../../data/landing.content.js';

const STREAK_DAYS = 7;

/** Anillo de racha hecho de segmentos que se encienden (opacity/scale). */
function StreakRing({ on }) {
  return (
    <div
      className="lp-ring"
      data-on={on}
    >
      {Array.from({ length: STREAK_DAYS }, (_, i) => (
        <span
          key={i}
          className="lp-ring__seg"
          style={{
            '--a': `${(360 / STREAK_DAYS) * i}deg`,
            '--i': i,
          }}
        />
      ))}
      <div className="lp-ring__center">
        <strong className="lp-display">{STREAK_DAYS}</strong>
        <span>{TRACKING.streak.caption}</span>
      </div>
    </div>
  );
}

function GoalTabs() {
  const [selected, setSelected] = useState(TRACKING.goalTabs[0].id);
  const tabs = TRACKING.goalTabs;
  const current = tabs.find((tab) => tab.id === selected) ?? tabs[0];

  function handleKeyDown(event) {
    const index = tabs.findIndex((tab) => tab.id === selected);
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];

    if (!step) return;

    event.preventDefault();

    const next = (index + step + tabs.length) % tabs.length;

    setSelected(tabs[next].id);
    const tablist = event.currentTarget.closest('[role="tablist"]');

    tablist.querySelectorAll('[role="tab"]')[next]?.focus();
  }

  return (
    <div className="lp-goals">
      <h3>{TRACKING.goalsTitle}</h3>
      <div
        role="tablist"
        aria-label={TRACKING.goalsTitle}
        className="lp-tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`lp-goal-tab-${tab.id}`}
            aria-selected={tab.id === selected}
            aria-controls="lp-goal-panel"
            tabIndex={tab.id === selected ? 0 : -1}
            className="lp-tab"
            onClick={() => setSelected(tab.id)}
            onKeyDown={handleKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <ul
        role="tabpanel"
        id="lp-goal-panel"
        aria-labelledby={`lp-goal-tab-${current.id}`}
        className="lp-goals__list"
      >
        {current.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function TrackingSection() {
  // Las insignias y la gráfica se activan al entrar en el viewport.
  const [ref, inView] = useInView({ once: true, threshold: 0.35 });

  return (
    <Section
      id="seguimiento"
      tone="light"
      labelledBy="lp-tracking-title"
    >
      <div className="lp-container">
        <p className="lp-eyebrow">{TRACKING.eyebrow}</p>
        <RichTitle
          id="lp-tracking-title"
          parts={TRACKING.title}
        />
        <Reveal as="p" className="lp-lead">
          {TRACKING.body}
        </Reveal>

        <div
          ref={ref}
          className="lp-tracking"
          data-in={inView}
        >
          <div className="lp-card lp-card--ring">
            <h3>{TRACKING.streak.label}</h3>
            <StreakRing on={inView} />
          </div>

          <div className="lp-card">
            <GoalTabs />
          </div>

          <div className="lp-card lp-card--badges">
            <h3>{TRACKING.badgesTitle}</h3>
            <ul className="lp-badges">
              {TRACKING.badges.map((badge, index) => (
                <li
                  key={badge.id}
                  className="lp-badge"
                  style={{ '--i': index }}
                >
                  <span className="lp-badge__disc">
                    <LandingIcon
                      name={badge.icon}
                      size={22}
                    />
                  </span>
                  <span>{badge.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <figure className="lp-card lp-card--chart">
            <figcaption>
              <h3>{TRACKING.chartTitle}</h3>
            </figcaption>
            <div
              className="lp-chart"
              role="img"
              aria-label={`${TRACKING.chartTitle}: ${TRACKING.chartBars.join(', ')} días con actividad por semana`}
            >
              {TRACKING.chartBars.map((value, index) => (
                <span
                  key={index}
                  className="lp-chart__bar"
                  style={{ '--h': `${(value / 7) * 100}%`, '--i': index }}
                />
              ))}
            </div>
            <p className="lp-card__note">{TRACKING.chartExplanation}</p>
          </figure>

          <aside className="lp-card lp-card--quote">
            <Quote
              size={22}
              strokeWidth={1.7}
              aria-hidden="true"
            />
            <h3>{TRACKING.motivationTitle}</h3>
            <p className="lp-display lp-quote">{TRACKING.motivation}</p>
            <p className="lp-card__note">{TRACKING.fortnightly}</p>
          </aside>
        </div>
      </div>
    </Section>
  );
}
