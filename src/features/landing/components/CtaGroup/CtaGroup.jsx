import { Link } from 'react-router-dom';
import { ArrowRight, Download } from 'lucide-react';

import { MagneticButton } from '../MagneticButton/index.js';

/**
 * CTA principal + «Ya tengo cuenta» (+ enlace discreto «Crear cuenta»).
 * El principal es «Instalar en tu celular» (acción) o una ruta. Las rutas
 * vienen de `resolveCtas`, nunca se escriben a mano en los componentes.
 */
export function CtaGroup({ ctas, onInstall, className = '' }) {
  const { primary } = ctas;

  return (
    <div className={`lp-cta-group ${className}`}>
      {primary.action === 'install' ? (
        <MagneticButton
          variant="primary"
          onClick={onInstall}
        >
          <Download
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />
          {primary.label}
        </MagneticButton>
      ) : (
        <MagneticButton
          as={Link}
          to={primary.to}
          variant="primary"
        >
          {primary.label}
          <ArrowRight
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </MagneticButton>
      )}

      {ctas.login && (
        <MagneticButton
          as={Link}
          to={ctas.login.to}
          variant="glass"
        >
          {ctas.login.label}
        </MagneticButton>
      )}

      {ctas.register && (
        <Link
          to={ctas.register.to}
          className="lp-cta-link"
        >
          {ctas.register.label}
        </Link>
      )}
    </div>
  );
}
