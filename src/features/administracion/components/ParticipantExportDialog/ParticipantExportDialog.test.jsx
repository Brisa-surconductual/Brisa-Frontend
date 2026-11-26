import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { ParticipantExportDialog } from './ParticipantExportDialog.jsx';

const CODE = 'P-1A2B3C4D';

function render(props = {}) {
  return renderToStaticMarkup(
    <ParticipantExportDialog open participantCode={CODE} onCancel={vi.fn()} onConfirm={vi.fn()} {...props} />,
  ).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('Modal de confirmación de la exportación (RF-145): contenido', () => {
  it('identifica al participante solo por su seudónimo y advierte sensibilidad, auditoría y contenido', () => {
    const html = render();
    const visible = textOf(html);

    expect(visible).toContain('Exportar historial en CSV');
    expect(visible).toMatch(/Participante P-1A2B3C4D/);
    expect(visible).toContain('información personal y sensible');
    expect(visible).toContain('La descarga quedará registrada en la auditoría.');
    expect(visible).toContain('solo indicadores cuantitativos');
    expect(visible).toContain('No incluye textos del diario ni del chat.');
    expect(visible).not.toMatch(/@|seg-|\bRF-?\d|\bM0\d\b|backend/);
  });

  it('dos acciones: «Cancelar» y «Confirmar exportación»', () => {
    const buttons = (render().match(/<button[\s\S]*?<\/button>/g) ?? []).map((button) => textOf(button).trim());

    expect(buttons).toEqual(['Cancelar', 'Confirmar exportación']);
  });

  it('accesible: diálogo nativo con título y descripción enlazados', () => {
    const html = render();
    const labelledBy = html.match(/<dialog[^>]*aria-labelledby="([^"]+)"/)[1];
    const describedBy = html.match(/<dialog[^>]*aria-describedby="([^"]+)"/)[1];

    expect(html).toContain(`<h2 id="${labelledBy}"`);
    expect(html).toContain(`<div id="${describedBy}"`);
    expect(html.match(/<svg[^>]*>/g).every((svg) => svg.includes('aria-hidden="true"'))).toBe(true);
  });

  it('adaptación móvil: ancho con margen, altura limitada con desplazamiento y botones apilados en pantallas estrechas', () => {
    const html = render();

    expect(html).toMatch(/<dialog[^>]*w-\[min\(calc\(100%-32px\),520px\)\]/);
    expect(html).toMatch(/<dialog[^>]*max-h-\[calc\(100dvh-32px\)\][^"]*overflow-y-auto/);
    expect(html).toContain('max-[370px]:grid-cols-1');
  });

  it('generando: no se puede cancelar y la confirmación muestra el progreso', () => {
    const html = render({ exporting: true });

    expect(html).toMatch(/<dialog[^>]*aria-busy="true"/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Cancelar<\/button>/);
    expect(textOf(html)).toContain('Generando CSV...');
  });

  it('cerrado: no pinta el contenido', () => {
    expect(render({ open: false })).not.toContain('Confirmar exportación');
  });
});
