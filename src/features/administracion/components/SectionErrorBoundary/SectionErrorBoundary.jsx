import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/shared/components/ui/Button/index.js';

import { CohortNotice } from '../CohortNotice/index.js';

const DEFAULT_DESCRIPTION =
  'Ocurrió un error al presentar esta sección. Las demás secciones de la ficha no se ven afectadas.';

/*
 * Límite de error de una sección (RF-149, requisito no funcional: «Error
 * Boundaries o aislamiento de estado por módulo»; también lo usa el panel
 * principal, RF-140). Si una sección falla al presentarse, solo ella
 * muestra un aviso; el resto de la pantalla sigue funcionando. No muestra
 * el detalle técnico ni datos. React solo ofrece límites de error como
 * componentes de clase.
 *
 * Opcionales: `description` reemplaza el texto del aviso y `onRetry`
 * muestra «Reintentar», que vuelve a presentar la sección y llama a
 * `onRetry` (por ejemplo, para volver a consultarla).
 */
export class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  handleRetry() {
    this.setState({ failed: false });
    this.props.onRetry?.();
  }

  render() {
    if (!this.state.failed) return this.props.children;

    const { label, description, onRetry } = this.props;

    return (
      <section
        aria-label={label}
        className="flex flex-col gap-[var(--space-3)]"
      >
        <CohortNotice
          tone="danger"
          icon={AlertTriangle}
          title={`${label}: no se pudo mostrar`}
          role="alert"
          action={
            onRetry ? (
              <Button variant="secondary" onClick={this.handleRetry}>
                <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
                Reintentar
              </Button>
            ) : undefined
          }
        >
          {description ?? DEFAULT_DESCRIPTION}
        </CohortNotice>
      </section>
    );
  }
}
