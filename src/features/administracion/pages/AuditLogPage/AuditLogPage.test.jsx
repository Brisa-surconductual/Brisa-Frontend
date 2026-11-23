import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { AuditEntryCard } from '../../components/AuditEntryCard/index.js';
import { AuditStatusBadge } from '../../components/AuditStatusBadge/index.js';
import { DEMO_AUDIT_RECORDS } from '../../data/auditDemoData.js';
import { toAuditEntries } from '../../services/auditEntry.js';
import { AuditLogPage } from './AuditLogPage.jsx';

const state = vi.hoisted(() => ({ value: null }));

// Por defecto usa el hook real; cada prueba puede fijar un estado.
vi.mock('./hooks/useAuditLog.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useAuditLog: () => state.value ?? actual.useAuditLog() };
});

const BASE = Object.freeze({
  entries: [],
  isLoading: false,
  loadError: '',
  isDenied: false,
  isDemo: false,
  isSessionExpired: false,
  isLoadingMore: false,
  hasMore: false,
  loadMore: vi.fn(),
  retry: vi.fn(),
});

const clean = (html) => html.replaceAll('<!-- -->', '');
const textOf = (html) => html.replace(/<[^>]+>/g, '');

function render(changes) {
  state.value = changes ? { ...BASE, ...changes } : null;
  return clean(renderToStaticMarkup(<AuditLogPage />));
}

const withDemoList = () => render({ entries: toAuditEntries(DEMO_AUDIT_RECORDS), isDemo: true });

afterEach(() => {
  state.value = null;
  vi.unstubAllEnvs();
});

describe('Pantalla de auditoría (RF-123)', () => {
  it('encabezado, descripción y nota de privacidad y solo lectura', () => {
    const html = render({});

    expect(html).toMatch(/<h1[^>]*>Auditoría<\/h1>/);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).not.toContain('<main');
    expect(textOf(html)).toContain('Consulta los registros de accesos y acciones realizadas en el módulo administrativo.');
    expect(textOf(html)).toContain('Registros de solo lectura: no pueden crearse, modificarse ni eliminarse');
  });

  it('muestra el aviso de demostración solicitado', () => {
    expect(textOf(withDemoList())).toContain(
      'Registros de demostración. No representan acciones reales ni las operaciones realizadas en este entorno.',
    );
  });

  it('lista un registro por tarjeta, en el orden recibido', () => {
    const html = withDemoList();
    const order = [...html.matchAll(/<time dateTime="([^"]+)"/g)].map(([, value]) => value);

    expect(html.match(/<article/g)).toHaveLength(8);
    expect(html).toMatch(/<ol/);
    expect(order).toEqual(DEMO_AUDIT_RECORDS.map(({ timestamp }) => timestamp).filter((value) => /Z|[+-]\d{2}:\d{2}$/.test(value)));
    expect(textOf(html)).toContain('8 registros · hora de Colombia');
  });

  it('nunca muestra IP, usuario, sesión, recurso interno, datos personales, clínicos ni técnicos', () => {
    const html = withDemoList();

    for (const value of [
      '192.0.2', '198.51.100', '203.0.113', 'demo-usuario', 'demo-sesion', 'demo-recurso',
      'demo-auditoria', '@example.com', 'Nombre Ficticio', '0000000000', 'consumo', 'clínico',
      'formato', 'Navegador ficticio',
    ]) {
      expect(html).not.toContain(value);
    }
  });

  it('sin acciones de escritura: no hay botones, enlaces ni formularios en la lista', () => {
    const html = withDemoList();

    expect(html).not.toMatch(/<button|<form|<input|<a /);
    expect(textOf(html)).not.toMatch(/Editar|Eliminar|Exportar|Descargar/);
  });

  it('carga: aviso accesible y sin registros', () => {
    const html = render({ isLoading: true, isDemo: true });

    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/role="status"[^>]*>Cargando registros de auditoría/);
    expect(html).not.toContain('<article');
  });

  it('error: alerta con reintento, sin registros ficticios', () => {
    const html = render({ loadError: 'No pudimos cargar los registros de auditoría. Intenta nuevamente.', isDemo: true });

    expect(html).toMatch(/role="alert"[\s\S]*Registros no disponibles/);
    expect(html).toContain('Reintentar');
    expect(html).not.toContain('<article');
  });

  it('vacío: lo dice sin acciones', () => {
    const html = render({ isDemo: true });

    expect(html).toMatch(/role="status"[\s\S]*Aún no hay registros de auditoría/);
    expect(html).not.toContain('<button');
  });

  it('acceso denegado: alerta con el mensaje de RF-123, sin reintento ni registros', () => {
    const html = render({ isDenied: true });

    expect(html).toMatch(/role="alert"[\s\S]*Acceso denegado[\s\S]*No tiene permisos para realizar esta acción administrativa\./);
    expect(html).not.toContain('Reintentar');
    expect(html).not.toContain('<article');
    expect(html).not.toContain('Resultado simulado');
  });

  it('acceso denegado en demostración: aclara que es un resultado simulado', () => {
    expect(textOf(render({ isDenied: true, isDemo: true }))).toContain(
      'Resultado simulado por la fuente de demostración; no es una comprobación real de permisos.',
    );
  });

  it('ofrece paginación cuando el servidor tiene más registros', () => {
    const entries = toAuditEntries(DEMO_AUDIT_RECORDS);
    expect(textOf(render({ entries, hasMore: true }))).toContain('Cargar más registros');
    expect(render({ entries, hasMore: true, isLoadingMore: true })).toMatch(/<button[^>]*disabled/);
  });

  it('muestra la sesión vencida y oculta registros que ya no se pueden consultar', () => {
    const html = render({ isSessionExpired: true, entries: toAuditEntries(DEMO_AUDIT_RECORDS) });
    expect(textOf(html)).toContain('Vuelve a iniciar sesión');
    expect(html).not.toContain('<article');
  });

  it('con el hook real y sin modo demo, muestra el estado de carga', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_M08_DEMO', 'false');

    expect(render(null)).toContain('Cargando registros de auditoría');
  });
});

describe('Registro de auditoría', () => {
  const card = (record) => clean(renderToStaticMarkup(<AuditEntryCard entry={toAuditEntries([record])[0]} />));

  it.each([
    ['ACCESO_MODULO', 'Acceso al módulo'],
    ['CONSULTA_PARTICIPANTE', 'Consulta de participante'],
    ['EXPORTACION_DATOS', 'Exportación de datos'],
    ['CONFIGURACION_UMBRALES', 'Configuración de umbrales'],
  ])('%s se presenta como «%s»', (action, label) => {
    const html = card({ id: 'x', action, resource: 'R', timestamp: '2026-03-09T14:32:05Z', status: 'EXITOSA' });

    expect(html).toMatch(new RegExp(`<h3[^>]*>.*${label}</h3>`));
    expect(html).not.toContain(action);
  });

  it('una acción desconocida se muestra como no clasificada, con su valor tal cual', () => {
    const text = textOf(card({ id: 'x', action: 'ACCION_NO_DEFINIDA', resource: 'R', timestamp: '2026-03-09T14:32:05Z', status: 'FALLIDA' }));

    expect(text).toContain('Acción no clasificada ACCION_NO_DEFINIDA');
  });

  it('un valor de acción con marcado se muestra como texto, nunca como HTML', () => {
    const html = card({ id: 'x', action: '<img src=x onerror=alert(1)>', resource: 'R', timestamp: '2026-03-09T14:32:05Z', status: 'EXITOSA' });

    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('fecha y hora con <time>, en hora de Colombia', () => {
    const html = card({ id: 'x', action: 'ACCESO_MODULO', resource: 'R', timestamp: '2026-03-09T14:32:05Z', status: 'EXITOSA' });

    expect(html).toContain('<time dateTime="2026-03-09T14:32:05Z">9 de mar de 2026, 09:32<span class="sr-only"> (hora de Colombia)</span></time>');
  });

  it('una marca sin zona horaria no se interpreta', () => {
    const html = card({ id: 'x', action: 'ACCESO_MODULO', resource: 'R', timestamp: '2026-03-05T08:00:00', status: 'EXITOSA' });

    expect(html).toContain('Fecha y hora no disponibles');
    expect(html).not.toContain('<time');
  });

  it('el recurso se muestra como descripción; ausente, como no especificado', () => {
    expect(card({ id: 'x', action: 'ACCESO_MODULO', resource: 'Módulo administrativo', timestamp: '', status: 'EXITOSA' })).toContain('Módulo administrativo');
    expect(card({ id: 'x', action: 'ACCESO_MODULO', resource: '  ', timestamp: '', status: 'EXITOSA' })).toContain('Recurso no especificado');
  });

  it('ignora campos no permitidos aunque lleguen en el registro', () => {
    const html = clean(renderToStaticMarkup(
      <AuditEntryCard entry={{ id: 'id-interno', action: 'ACCESO_MODULO', resource: 'R', timestamp: '', status: 'EXITOSA', ipAddress: '192.0.2.1', userEmail: 'p@example.com' }} />,
    ));

    expect(html).not.toMatch(/192\.0\.2\.1|p@example\.com|id-interno/);
  });
});

describe('Insignia de estado de auditoría', () => {
  it.each([
    ['EXITOSA', 'Exitosa', 'success'],
    ['FALLIDA', 'Fallida', 'danger'],
    ['DENEGADA', 'Denegada', 'warning'],
  ])('%s se presenta con texto «%s», ícono y tono %s', (status, label, tone) => {
    const html = clean(renderToStaticMarkup(<AuditStatusBadge status={status} />));

    expect(html).toContain(`<span class="sr-only">Estado: </span>${label}`);
    expect(html).toContain('<svg');
    expect(html).toContain(`var(--${tone}-text)`);
  });

  it('un estado desconocido se muestra tal cual y uno ausente como «Sin estado»', () => {
    expect(renderToStaticMarkup(<AuditStatusBadge status="OTRO" />)).toContain('OTRO');
    expect(renderToStaticMarkup(<AuditStatusBadge />)).toContain('Sin estado');
  });
});
