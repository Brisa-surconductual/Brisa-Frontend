import { Link } from 'react-router-dom';

import { LandingIcon } from '../../../../components/LandingIcon/index.js';
import { A11Y, NAV_LINKS } from '../../../../data/landing.content.js';

/**
 * Pill de navegación flotante abajo (en todos los tamaños; no hay barra
 * superior): cuatro anclas y el CTA principal (instalar).
 */
export function MobileDock({ ctas, onInstall }) {
  const { primary } = ctas;

  return (
    <nav
      className="lp-dock lp-glass"
      aria-label={A11Y.mobileNav}
    >
      {NAV_LINKS.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="lp-dock__link"
        >
          <LandingIcon
            name={link.icon}
            size={20}
          />
          <span>{link.label}</span>
        </a>
      ))}
      {primary.action === 'install' ? (
        <button
          type="button"
          className="lp-dock__cta"
          onClick={onInstall}
        >
          Instalar
        </button>
      ) : (
        <Link
          to={primary.to}
          className="lp-dock__cta"
        >
          {primary.label}
        </Link>
      )}
    </nav>
  );
}
