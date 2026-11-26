import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { PARTICIPANT_EXPORT_BLOCK as BLOCK, PARTICIPANT_EXPORT_STATUS as S } from '../../types/participantExport.js';

import { ParticipantExportButton } from './ParticipantExportButton.jsx';

const hook = vi.hoisted(() => ({ value: null, args: [] }));

vi.mock('../../hooks/useParticipantExport.js', () => ({
  useParticipantExport: (args) => {
    hook.args.push(args);
    return hook.value;
  },
}));

const CODE = 'P-1A2B3C4D';

const BASE = Object.freeze({
  code: CODE,
  blockedBy: null,
  canExport: true,
  dialogOpen: false,
  status: S.IDLE,
  file: null,
  isExporting: false,
  openDialog: vi.fn(),
  cancelDialog: vi.fn(),
  confirmExport: vi.fn(),
});

function render(changes = {}, props = {}) {
  hook.value = { ...BASE, ...changes };
  return renderToStaticMarkup(<ParticipantExportButton participantCode={CODE} authentic {...props} />).replaceAll('<!-- -->', '');
}

const textOf = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const trigger = (html) => html.match(/<button[^>]*aria-haspopup="dialog"[^>]*>[\s\S]*?<\/button>/)[0];

afterEach(() => {
  hook.value = null;
  hook.args = [];
});

describe('Acción «Exportar CSV» de la ficha (RF-145)', () => {
  it('botón accesible que abre un diálogo, con icono decorativo y contexto para lectores de pantalla', () => {
    const button = trigger(render());

    expect(button).toMatch(/^<button aria-haspopup="dialog" type="button"/);
    expect(button).not.toContain('disabled=""');
    expect(textOf(button).trim()).toBe('Exportar CSV del historial de seguimiento');
    expect(button).toContain('<span class="sr-only"> del historial de seguimiento</span>');
    expect(button).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(button).toContain('min-h-[44px]');
  });

  it('pasa al hook el seudónimo y si es auténtico', () => {
    render({}, { participantCode: 'P-0000000A', authentic: false });

    expect(hook.args.at(-1)).toEqual({ participantCode: 'P-0000000A', authentic: false });
  });

  it('modal cerrado: sin contenido de confirmación', () => {
    const html = render();

    expect(html).toContain('<dialog');
    expect(html).not.toContain('Confirmar exportación');
  });

  it('modal abierto: muestra la confirmación con el seudónimo', () => {
    const visible = textOf(render({ dialogOpen: true }));

    expect(visible).toContain('Confirmar exportación');
    expect(visible).toMatch(/Participante P-1A2B3C4D/);
  });

  it.each([
    [BLOCK.DEMO, 'No disponible en la demostración.'],
    [BLOCK.IDENTITY_PENDING, 'Disponible cuando la ficha muestre el código verificado del participante.'],
  ])('bloqueada (%s): deshabilitada, con aviso discreto y sin diálogo', (blockedBy, hint) => {
    const html = render({ blockedBy, canExport: false, code: null });
    const hintId = html.match(/<p id="([^"]+)"[^>]*>([^<]*)<\/p>/);

    expect(trigger(html)).toContain('disabled=""');
    expect(hintId[2]).toBe(hint);
    expect(trigger(html)).toContain(`aria-describedby="${hintId[1]}"`);
    expect(html).not.toContain('<dialog');
  });

  it('generando: botón deshabilitado y confirmación en curso', () => {
    const html = render({ dialogOpen: true, status: S.EXPORTING, isExporting: true });

    expect(trigger(html)).toContain('disabled=""');
    expect(textOf(html)).toContain('Generando CSV...');
  });

  it('descarga iniciada: lo dice sin afirmar que el archivo quedó guardado', () => {
    const html = render({ status: S.STARTED, file: { fileName: 'seguimiento_individual_20261126.csv' } });
    const visible = textOf(html);

    expect(html).toContain('role="status"');
    expect(visible).toContain('Descarga iniciada');
    expect(visible).toContain('seguimiento_individual_20261126.csv');
    expect(visible).toContain('Comprueba que se haya guardado en tu dispositivo.');
  });

  it.each([
    [S.FORBIDDEN, 'Tu cuenta no tiene autorización para exportar la información individual de este participante.'],
    [S.NO_INDICATORS, 'El participante todavía no tiene indicadores exportables.'],
    [S.UNAVAILABLE, 'El seguimiento no está disponible temporalmente.'],
    [S.ABORTED, 'La exportación no pudo completarse.'],
    [S.NOT_FOUND, 'El participante solicitado no existe en el sistema.'],
    [S.INCONSISTENT, 'no corresponde al participante solicitado'],
    [S.SESSION_REQUIRED, 'Tu sesión no está activa.'],
    [S.CONNECTION, 'No hubo respuesta del servidor.'],
    [S.INVALID_RESPONSE, 'no tiene el formato esperado'],
    [S.INVALID_CODE, 'El código del participante no es válido.'],
  ])('%s: aviso claro de que no se descargó ningún archivo', (status, message) => {
    const html = render({ status });
    const visible = textOf(html);

    expect(html).toContain('role="alert"');
    expect(visible).toContain('No se exportó el archivo');
    expect(visible).toContain(message);
    expect(visible).toMatch(/no se descargó ningún archivo/i);
    expect(visible).not.toContain('Descarga iniciada');
    expect(visible).not.toMatch(/SIN_PERMISO|EXPORTACION_ABORTADA|\b\d{3}\b|backend|\bRF-?\d/);
  });

  it('fallo del navegador al iniciar la descarga: sin éxito', () => {
    const visible = textOf(render({ status: S.DOWNLOAD_FAILED }));

    expect(visible).toContain('el navegador no pudo iniciar la descarga');
    expect(visible).not.toContain('Descarga iniciada');
  });

  it('el resultado se anuncia en una región viva', () => {
    expect(render({ status: S.ABORTED })).toMatch(/<div aria-live="polite">[\s\S]*role="alert"/);
  });
});
