import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { CohortStatusBadge } from '../CohortStatusBadge/index.js';
import { CohortCard } from './CohortCard.jsx';

const clean = (html) => html.replaceAll('<!-- -->', '');
const card = (cohort) => clean(renderToStaticMarkup(<CohortCard cohort={cohort} />));

const COHORT = Object.freeze({
  id: 'c-1',
  name: 'Cohorte de prueba',
  startDate: '2026-02-01',
  endDate: '2026-05-31',
  status: 'ACTIVA',
  scheduleId: 's-1',
  scheduleName: 'Cronograma de prueba',
});

describe('Insignia de estado de cohorte', () => {
  it.each([
    ['BORRADOR', 'Borrador'],
    ['ACTIVA', 'Activa'],
    ['INACTIVA', 'Inactiva'],
  ])('%s se presenta con texto «%s» y no solo con color', (status, label) => {
    const html = clean(renderToStaticMarkup(<CohortStatusBadge status={status} />));

    expect(html).toContain(`<span class="sr-only">Estado: </span>${label}`);
    expect(html).toContain('<svg');
  });

  it('un estado desconocido se muestra tal cual y uno ausente como «Sin estado»', () => {
    expect(renderToStaticMarkup(<CohortStatusBadge status="OTRO" />)).toContain('OTRO');
    expect(renderToStaticMarkup(<CohortStatusBadge />)).toContain('Sin estado');
  });
});

describe('Tarjeta de cohorte', () => {
  it('muestra nombre, estado, periodo sin desfase y cronograma', () => {
    const html = card(COHORT);

    expect(html).toMatch(/<h3[^>]*>Cohorte de prueba<\/h3>/);
    expect(html).toContain('Activa');
    expect(html).toContain('<time dateTime="2026-02-01">1 de feb de 2026</time>');
    expect(html).toContain('<time dateTime="2026-05-31">31 de may de 2026</time>');
    expect(html).toContain('Cronograma de prueba');
  });

  it('sin nombre de cronograma no inventa uno', () => {
    expect(card({ ...COHORT, scheduleName: undefined })).toContain('Nombre no disponible');
    expect(card({ ...COHORT, scheduleName: undefined, scheduleId: undefined })).toContain(
      'Sin cronograma asociado',
    );
  });

  it('fechas ausentes o inválidas se indican como no disponibles', () => {
    const html = card({ ...COHORT, startDate: '', endDate: '2026-02-30' });

    expect(html.match(/Fecha no disponible/g)).toHaveLength(2);
    expect(html).not.toContain('<time');
  });

  it('es de solo lectura: sin botones, enlaces ni formularios', () => {
    expect(card(COHORT)).not.toMatch(/<button|<a |<form|<input/);
  });

  it('con detailPath ofrece «Ver participantes» hacia el detalle, identificando la cohorte', () => {
    const html = clean(
      renderToStaticMarkup(
        <MemoryRouter>
          <CohortCard cohort={COHORT} detailPath="/app/administrativo/cohortes/c-1" />
        </MemoryRouter>,
      ),
    );

    expect(html).toMatch(
      /<a [^>]*href="\/app\/administrativo\/cohortes\/c-1"[^>]*>.*Ver participantes<span class="sr-only"> de Cohorte de prueba<\/span><\/a>/,
    );
    expect(html).not.toContain('<button');
  });
});
