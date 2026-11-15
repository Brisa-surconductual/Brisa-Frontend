import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

import { CohortNotice } from '../CohortNotice/index.js';

/*
 * Límite de error de una sección de la ficha (RF-149, requisito no
 * funcional: «Error Boundaries o aislamiento de estado por módulo»). Si
 * una sección falla al presentarse, solo ella muestra un aviso; el resto
 * de la ficha sigue funcionando. No muestra el detalle técnico ni datos.
 * React solo ofrece límites de error como componentes de clase.
 */
export class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <section aria-label={this.props.label} className="flex flex-col gap-[var(--space-3)]">
        <CohortNotice tone="danger" icon={AlertTriangle} title={`${this.props.label}: no se pudo mostrar`} role="alert">
          Ocurrió un error al presentar esta sección. Las demás secciones de la
          ficha no se ven afectadas.
        </CohortNotice>
      </section>
    );
  }
}
