import { describe, expect, it } from 'vitest';

import { TRACE_QUERY_STATUS as S } from '../types/chatTraceability.js';

import { traceNoticeText } from './chatTraceabilityMessages.js';
import {
  getParticipantSessionsPath,
  getSessionTraceabilityPath,
  safeAdminReturnPath,
} from './chatTraceabilityRoutes.js';

const SESSION = '00000000-0000-4000-8000-00000000000A';

describe('rutas de la trazabilidad (RF-38)', () => {
  it('listado del participante con el código normalizado', () => {
    expect(getParticipantSessionsPath('p-1a2b3c4d')).toBe(
      '/app/administrativo/chat/participantes/P-1A2B3C4D/sesiones',
    );
  });

  it('trazabilidad con código y UUID de la sesión', () => {
    expect(getSessionTraceabilityPath('P-1A2B3C4D', SESSION)).toBe(
      '/app/administrativo/chat/participantes/P-1A2B3C4D/sesiones/00000000-0000-4000-8000-00000000000a/trazabilidad',
    );
  });

  it.each([
    ['referencia opaca de M08', 'seg-0001'],
    ['código ficticio de la demostración', 'PART-0015'],
    ['UUID del estudiante', '00000000-0000-4000-8000-000000000002'],
    ['ruta inyectada', 'P-1A2B3C4D/../../x'],
  ])('sin enlace con %s', (_, code) => {
    expect(getParticipantSessionsPath(code)).toBeNull();
    expect(getSessionTraceabilityPath(code, SESSION)).toBeNull();
  });

  it('sin enlace con un id de sesión inválido', () => {
    expect(getSessionTraceabilityPath('P-1A2B3C4D', '../x')).toBeNull();
  });

  it.each([
    ['/app/administrativo/cohortes/c-1/seguimiento/seg-1', '/app/administrativo/cohortes/c-1/seguimiento/seg-1'],
    ['https://malicioso.example/app/administrativo/', null],
    ['//malicioso.example', null],
    ['/app/administrativo//malicioso', null],
    ['/app/estudiante', null],
    ['/app/administrativo\\x', null],
    [undefined, null],
  ])('destino de «Volver» %s', (value, expected) => {
    expect(safeAdminReturnPath(value)).toBe(expected);
  });
});

describe('traceNoticeText (ADR-0004)', () => {
  it('muestra el mensaje del backend', () => {
    expect(traceNoticeText(S.DENIED, 'No tiene permisos.')).toBe('No tiene permisos.');
  });

  it('sin mensaje usa el respaldo', () => {
    expect(traceNoticeText(S.SERVER_ERROR, '')).toBe('Ocurrió un error inesperado. Inténtalo de nuevo.');
    expect(traceNoticeText(S.CONNECTION_ERROR, '')).toBe('No hay conexión. Revisa tu internet e inténtalo de nuevo.');
  });

  it('los errores del cliente usan siempre su propio texto', () => {
    expect(traceNoticeText(S.MISMATCH, 'otro')).toMatch(/no corresponde/);
  });
});
