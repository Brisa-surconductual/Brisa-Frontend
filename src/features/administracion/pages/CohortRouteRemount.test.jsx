import { afterEach, describe, expect, it, vi } from 'vitest';

import { CohortDetailPage } from './CohortDetailPage/CohortDetailPage.jsx';
import { ParticipantTrackingPage } from './ParticipantTrackingPage/ParticipantTrackingPage.jsx';

/*
 * E10: cambiar de cohorte dentro de la misma ruta (URL o historial) monta
 * de nuevo la página, con una clave por cohorte, como la ficha (E9-D3).
 * Así no sobreviven ni un render el encabezado, los registros, los
 * filtros, el orden o la página del seguimiento de otra cohorte, ni el
 * panel de asignación o los avisos del detalle de otra cohorte.
 */
const params = vi.hoisted(() => ({ value: {} }));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useParams: () => params.value,
}));

afterEach(() => {
  params.value = {};
});

describe.each([
  ['Seguimiento de la cohorte (RF-142)', ParticipantTrackingPage],
  ['Detalle de la cohorte (RF-125)', CohortDetailPage],
])('%s: cambio de cohorte sin estado residual', (_, Page) => {
  it('cada cohorte tiene su propia instancia de la página', () => {
    params.value = { idCohorte: 'demo-cohorte-b' };
    const first = Page();
    params.value = { idCohorte: 'demo-cohorte-c' };
    const second = Page();
    params.value = { idCohorte: 'demo-cohorte-b' };
    const again = Page();

    expect(first.key).toBe('demo-cohorte-b');
    expect(second.key).toBe('demo-cohorte-c');
    expect(first.type).toBe(second.type);
    expect(again.key).toBe(first.key);
  });
});
