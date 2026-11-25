import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { useCurrentContents } from '../../hooks/useCurrentContents.js';

import { CurrentContentAccessCard } from './CurrentContentAccessCard.jsx';

vi.mock('../../hooks/useCurrentContents.js', () => ({
  useCurrentContents: vi.fn(),
}));

vi.mock('../AssignedScheduleSummary/AssignedScheduleSummary.jsx', () => ({
  AssignedScheduleSummary: () => <span>resumen-cronograma</span>,
}));

const retry = vi.fn();

const render = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <CurrentContentAccessCard variant="compact" />
    </MemoryRouter>,
  );

const state = (extra) =>
  useCurrentContents.mockReturnValue({
    currentContent: [],
    loading: false,
    loadError: '',
    retry,
    ...extra,
  });

beforeEach(() => state());

describe('Contenido vigente compacto (inicio del estudiante)', () => {
  it('usa la misma consulta (una sola llamada al hook) y no repite el resumen del cronograma', () => {
    useCurrentContents.mockClear();
    const html = render();

    expect(useCurrentContents).toHaveBeenCalledTimes(1);
    expect(html).not.toContain('resumen-cronograma');
    expect(html).toContain('Tu contenido actual</h2>');
  });

  it('cargando: aviso accesible y sección ocupada', () => {
    state({ loading: true });
    const html = render();

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Consultando contenido vigente...');
    expect(html).toContain('motion-reduce:animate-none');
  });

  it('error: alerta con el mensaje y reintento', () => {
    state({ loadError: 'No pudimos consultar tu contenido.' });
    const html = render();

    expect(html).toContain('role="alert"');
    expect(html).toContain('No pudimos consultar tu contenido.');
    expect(html).toMatch(/<button[^>]*>[\s\S]*Reintentar<\/button>/);
    expect(html).not.toContain('No hay contenido vigente');
  });

  it('sin contenido vigente: mensaje breve, sin inventar datos', () => {
    const html = render();

    expect(html).toContain('No hay contenido vigente para tu avance actual.');
    expect(html).not.toContain('role="alert"');
  });

  it('uno o varios contenidos: nombre, unidad temporal y estado «Vigente»', () => {
    state({
      currentContent: [
        { associationId: 'a1', name: 'Manejo del craving', temporalUnitName: 'Semana 2' },
        { associationId: 'a2', name: 'Respiración', temporalUnitName: 'Semana 2' },
      ],
    });
    const html = render();

    expect(html).toContain('Manejo del craving');
    expect(html).toContain('Respiración');
    expect(html).toContain('Semana 2');
    expect(html.match(/Vigente<\/span>/g)).toHaveLength(2);
    expect(html).not.toMatch(/%|completad/i);
  });

  it('«Ver contenido vigente» es una acción secundaria hacia su pantalla', () => {
    const link = render().match(/<a [^>]*>[\s\S]*?<\/a>/)[0];

    expect(link).toContain('href="/app/estudiante/cronograma/contenido-vigente"');
    expect(link).toContain('Ver contenido vigente');
    expect(link).toContain('bg-[var(--button-secondary-bg)]');
    expect(link).not.toContain('bg-[var(--brand-500)]');
  });

  it('la variante completa no cambia (sigue mostrando el cronograma)', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <CurrentContentAccessCard />
      </MemoryRouter>,
    );

    expect(html).toContain('resumen-cronograma');
    expect(html).toContain('Actualizar contenido');
  });
});
