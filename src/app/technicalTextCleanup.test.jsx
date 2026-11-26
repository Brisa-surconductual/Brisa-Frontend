import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { NotificationSummary } from '@/features/administracion/components/CohortDashboard/NotificationSummary.jsx';
import {
  alertSourceLabel,
  alertStatusLabel,
  alertTypeLabel,
} from '@/features/administracion/utils/alertLabels.js';
import { TRACKING_ALERT_SOURCE } from '@/features/administracion/types/participantTracking.js';
import { ProgramEligibilityCard } from '@/features/chat/components/ProgramEligibilityCard/ProgramEligibilityCard.jsx';
import { NodeEditorForm } from '@/features/chat/pages/GroupTreeDetailPage/components/NodeEditorForm/NodeEditorForm.jsx';
import { DestinationModuleSelector } from '@/features/cronograma/components/DestinationModuleSelector/index.js';
import { DASHBOARD_SHORTCUTS } from '@/features/users/pages/PsychologyHomePage/data/psychologyStats.js';

/*
 * Limpieza de textos técnicos: se comprueba el texto RENDERIZADO (lo que
 * ve o escucha la persona usuaria), no el código fuente. Los comentarios
 * internos, los identificadores RF/MXX de la implementación y los
 * valores de los contratos siguen existiendo.
 */
const visible = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ');

const attributes = (html) =>
  [...html.matchAll(/(?:aria-label|title|placeholder|alt)="([^"]*)"/g)]
    .map(([, v]) => v)
    .join(' ');

const TECHNICAL =
  /\bRF-?\d{2,3}[A-Z]?\b|\bM0\d\b|\bbackend\b|Integración pendiente|se integre/i;

function expectNoTechnicalText(html) {
  expect(visible(html)).not.toMatch(TECHNICAL);
  expect(attributes(html)).not.toMatch(TECHNICAL);
}

describe('Fuente de las alertas (historial administrativo)', () => {
  it('cada fuente conocida se describe por lo que detecta', () => {
    expect(alertSourceLabel(TRACKING_ALERT_SOURCE.HIGH_CRAVING)).toBe(
      'Detección de craving elevado',
    );
    expect(alertSourceLabel(TRACKING_ALERT_SOURCE.INACTIVITY)).toBe(
      'Detección de inactividad',
    );
  });

  it('el contrato conserva los identificadores originales', () => {
    expect(TRACKING_ALERT_SOURCE).toEqual({
      HIGH_CRAVING: 'RF-63',
      INACTIVITY: 'RF-68',
    });
  });

  it('tipos y estados desconocidos se indican sin mostrar el valor técnico', () => {
    expect(alertTypeLabel('RECAIDA')).toBe('Tipo no reconocido');
    expect(alertStatusLabel('ARCHIVADA')).toBe('Estado no reconocido');
    expect(alertTypeLabel('CRAVING_ELEVADO')).toBe('Craving elevado');
    expect(alertStatusLabel('EN_REVISION')).toBe('En revisión');
    expect(alertTypeLabel(null)).toBe('Tipo no disponible');
    expect(alertStatusLabel(undefined)).toBe('Estado no disponible');
  });

  it('una fuente desconocida o ausente no muestra un código', () => {
    expect(alertSourceLabel('RF-99')).toBe('Fuente no reconocida');
    expect(alertSourceLabel(null)).toBe('Fuente no disponible');
  });
});

describe('Módulos destino (Cronograma)', () => {
  const modules = [
    { id: 'm-chat', code: 'CHAT', name: 'Chat' },
    { id: 'm-seg', code: 'SEGUIM', name: 'Seguimiento' },
  ];
  const html = renderToStaticMarkup(
    <DestinationModuleSelector
      modules={modules}
      selectedModuleIds={['m-seg']}
      onToggle={() => {}}
    />,
  );

  it('muestra el nombre del módulo, no su código interno', () => {
    expect(visible(html)).toContain('Chat');
    expect(visible(html)).toContain('Seguimiento');
    expect(visible(html)).not.toMatch(/\bSEGUIM\b|\bCHAT\b/);
  });

  it('la selección sigue identificándose por el id del módulo', () => {
    expect(html).toContain('id="destination-module-m-chat"');
    expect(html).toContain('id="destination-module-m-seg"');
    expect(html).toMatch(/id="destination-module-m-seg"[^>]*checked=""/);
  });

  it('sin módulos conserva su estado vacío', () => {
    expect(renderToStaticMarkup(<DestinationModuleSelector />)).toContain(
      'No hay módulos destino disponibles.',
    );
  });
});

describe('Textos del chat administrativo', () => {
  it('la tarjeta de elegibilidad no muestra el código del requerimiento', () => {
    const html = renderToStaticMarkup(
      <ProgramEligibilityCard
        eligibility={{
          modalidad_actual: 'GRUPAL',
          total_usuarios_activos: 4,
          con_perfil_completo: 4,
          sin_perfil_completo: 0,
          elegible: true,
        }}
        onEnable={vi.fn()}
      />,
    );

    expect(visible(html)).toContain(
      'Transición de modalidad grupal a personalizada',
    );
    expectNoTechnicalText(html);
  });

  it('el editor de nodos explica la disponibilidad y la captura sin códigos', () => {
    const html = renderToStaticMarkup(
      <NodeEditorForm
        formId="nodo"
        values={{ idContenido: 'c1', capturaPerfilDimension: '' }}
        errors={{}}
        saving={false}
        tiposNodo={[]}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(visible(html)).toContain(
      'cuando el contenido se habilite en su propio cronograma;',
    );
    expect(attributes(html) + visible(html)).toContain(
      'su perfil queda con el valor activado.',
    );
    expectNoTechnicalText(html);
  });
});

describe('Panel administrativo', () => {
  it('el resumen de notificaciones explica «Descartadas» sin códigos', () => {
    const html = renderToStaticMarkup(
      <NotificationSummary
        data={{
          averageOpenRate: 0.5,
          averageConversionRate: 0.2,
          sent: 10,
          delivered: 9,
          opened: 5,
          dismissed: 1,
        }}
      />,
    );

    expect(visible(html)).toContain(
      '«Descartadas» son notificaciones entregadas que el usuario descartó;',
    );
    expectNoTechnicalText(html);
  });

  it('la modalidad del chat ya no se anuncia como pendiente de integración', () => {
    const chat = DASHBOARD_SHORTCUTS.find(({ id }) => id === 'CHAT');

    expect(chat.to).toBe('/app/administrativo/chat/modalidad');
    expect(chat.status).toBeUndefined();
  });

  it('los accesos conservan sus rutas', () => {
    expect(DASHBOARD_SHORTCUTS.map(({ to }) => to)).toEqual([
      '/app/administrativo/cronograma',
      '/app/administrativo/cronograma/progreso',
      '/app/administrativo/cronograma/contenidos',
      '/app/administrativo/chat/modalidad',
    ]);
  });
});
