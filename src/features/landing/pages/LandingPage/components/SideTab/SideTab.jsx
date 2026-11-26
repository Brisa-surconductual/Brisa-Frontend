import { Link } from 'react-router-dom';

/** Pestaña lateral fija con el CTA principal (solo escritorio). */
export function SideTab({ ctas, onInstall }) {
  const { primary } = ctas;

  if (primary.action === 'install') {
    return (
      <button
        type="button"
        className="lp-sidetab"
        onClick={onInstall}
      >
        {primary.label}
      </button>
    );
  }

  return (
    <Link
      to={primary.to}
      className="lp-sidetab"
    >
      {primary.label}
    </Link>
  );
}
