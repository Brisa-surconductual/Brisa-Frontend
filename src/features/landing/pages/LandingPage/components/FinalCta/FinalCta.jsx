import { BrisaMark } from '../../../../components/BrisaMark/index.js';
import { CtaGroup } from '../../../../components/CtaGroup/index.js';
import { LandingBackdrop } from '../../../../components/LandingBackdrop/index.js';
import { RichTitle } from '../../../../components/RichTitle/index.js';
import { Section } from '../../../../components/Section/index.js';
import { Sparkle } from '../../../../components/Sparkle/index.js';
import {
  BRAND,
  FINAL_CTA,
  FOOTER,
  NAV_LINKS,
} from '../../../../data/landing.content.js';

/** CTA final sobre fondo vivo + pie de página. */
export function FinalCta({ ctas, onInstall }) {
  return (
    <>
      <Section
        id="comenzar"
        tone="dark"
        labelledBy="lp-final-title"
        className="lp-final"
      >
        <LandingBackdrop />
        <div
          className="lp-sunburst lp-sunburst--dark lp-anim"
          aria-hidden="true"
        />

        <div className="lp-container lp-final__inner">
          <BrisaMark
            size={72}
            animated
          />
          <RichTitle
            id="lp-final-title"
            parts={FINAL_CTA.title}
          />
          <p className="lp-lead">{FINAL_CTA.body}</p>
          <CtaGroup
            ctas={ctas}
            onInstall={onInstall}
            className="lp-cta-group--center"
          />
          <Sparkle
            size={20}
            className="lp-spark lp-spark--final"
          />
        </div>
      </Section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <p className="lp-footer__brand">
            <BrisaMark size={28} />
            <strong>{BRAND.name}</strong>
          </p>
          <nav aria-label="Pie de página">
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <a href={`#${link.id}`}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="lp-footer__note">
            {FOOTER.rights}. {FOOTER.note}
          </p>
        </div>
      </footer>
    </>
  );
}
