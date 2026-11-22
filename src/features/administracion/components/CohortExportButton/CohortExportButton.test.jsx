import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { EXPORT_STATUS as ST } from '../../types/cohortExport.js';
import { EXPORT_MESSAGE } from '../../utils/exportMessages.js';
import { CohortExportButton } from './CohortExportButton.jsx';

const hook = vi.hoisted(() => ({ value: null }));

vi.mock('../../hooks/useCohortExport.js', () => ({
  useCohortExport: () => hook.value,
}));

const BASE = Object.freeze({
  status: ST.IDLE,
  file: null,
  isExporting: false,
  isDemo: true,
  isIntegrationPending: false,
  exportCsv: vi.fn(),
});

function render(changes = {}, props = {}) {
  hook.value = { ...BASE, ...changes };
  return renderToStaticMarkup(
    <CohortExportButton
      cohortId="demo-cohorte-b"
      cohortName="Cohorte Piloto B"
      cohortStatus="ACTIVA"
      {...props}
    />,
  ).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

afterEach(() => {
  hook.value = null;
});

describe('Botón «Exportar indicadores CSV» (RF-144)', () => {
  it('botón accesible con icono, texto claro y aviso de datos ficticios', () => {
    const html = render();

    expect(html).toMatch(
      /<button type="button"[^>]*>.*Exportar indicadores CSV<span class="sr-only"> de Cohorte Piloto B<\/span><\/button>/,
    );
    expect(html).not.toMatch(/<button[^>]* disabled=""/);
    expect(textOf(html)).toContain('Datos de demostración');
    expect(textOf(html)).toContain('sin datos personales');
  });

  it('no ofrece ninguna opción para exportar datos individuales', () => {
    const html = render();

    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).not.toMatch(/<input|<select|PII|individual/i);
  });

  it('mientras genera el archivo, queda deshabilitado y lo anuncia', () => {
    const html = render({ isExporting: true, status: ST.EXPORTING });

    expect(html).toMatch(/<button[^>]* disabled=""/);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Generando CSV...');
  });

  it('solo para la cohorte activa', () => {
    const html = render({}, { cohortStatus: 'INACTIVA' });

    expect(html).toMatch(/<button[^>]* disabled=""/);
    expect(html).toContain('Disponible solo para la cohorte activa.');
  });

  it('integración pendiente: deshabilitado y sin afirmar exportación', () => {
    const html = render({ isDemo: false, isIntegrationPending: true });

    expect(html).toMatch(/<button[^>]* disabled=""/);
    expect(html).toContain(
      'Exportación pendiente de integración con el servidor.',
    );
    expect(html).not.toContain('Datos de demostración');
  });

  it('éxito: descarga iniciada, sin afirmar que se guardó en el disco', () => {
    const text = textOf(
      render({
        status: ST.STARTED,
        file: {
          fileName: 'indicadores_cohorte_activa_20261122.csv',
          notificationsAvailable: true,
          behavioralStale: false,
        },
      }),
    );

    expect(text).toContain('Descarga iniciada');
    expect(text).toContain('indicadores_cohorte_activa_20261122.csv');
    expect(text).not.toMatch(/guardado|guardó en/i);
  });

  it('éxito con notificaciones no disponibles y conducta desactualizada: lo informa', () => {
    const text = textOf(
      render({
        status: ST.STARTED,
        file: {
          fileName: 'x.csv',
          notificationsAvailable: false,
          behavioralStale: true,
        },
      }),
    );

    expect(text).toContain('se marcaron como «No disponible»');
    expect(text).toContain('estado_vista_conductual');
  });

  it.each([
    [ST.FORBIDDEN],
    [ST.COHORT_NOT_ACTIVE],
    [ST.NO_INDICATORS],
    [ST.GENERATION_FAILED],
    [ST.AUDIT_UNAVAILABLE],
    [ST.DOWNLOAD_FAILED],
  ])('%s: mensaje sin indicar éxito', (status) => {
    const html = render({ status });

    expect(html).toContain(EXPORT_MESSAGE[status]);
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('Descarga iniciada');
  });

  it('mensajes oficiales de RF-144', () => {
    expect(EXPORT_MESSAGE[ST.FORBIDDEN]).toBe(
      'Acceso denegado. No cuenta con los privilegios necesarios para exportar datos del módulo administrativo.',
    );
    expect(EXPORT_MESSAGE[ST.COHORT_NOT_ACTIVE]).toBe(
      'No se puede exportar. La cohorte seleccionada no está activa o no existe en el sistema.',
    );
    expect(EXPORT_MESSAGE[ST.NO_INDICATORS]).toBe(
      'La cohorte activa no contiene datos de indicadores para exportar. Por favor, espere a que el sistema procese los datos.',
    );
    expect(EXPORT_MESSAGE[ST.GENERATION_FAILED]).toBe(
      'Ocurrió un error al generar el archivo CSV. Por favor, intente nuevamente o contacte a soporte.',
    );
  });
});
