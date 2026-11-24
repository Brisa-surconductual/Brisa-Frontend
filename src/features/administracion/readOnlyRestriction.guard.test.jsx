import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { ParticipantAssignmentPanel } from './components/ParticipantAssignmentPanel/index.js';
import { ParticipantCard } from './components/ParticipantCard/index.js';
import * as cohortSource from './data/cohortSource.js';
import * as participantSource from './data/participantSource.js';
import { AuditLogPage } from './pages/AuditLogPage/index.js';

const state = vi.hoisted(() => ({ value: null }));

// La página de auditoría se prueba con un estado fijo de su hook.
vi.mock('./pages/AuditLogPage/hooks/useAuditLog.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useAuditLog: () => state.value ?? actual.useAuditLog() };
});

/*
 * PRUEBAS DE REGRESIÓN DE RF-148 (solo lectura sobre datos de M02,
 * M03, M05, M06 y M07 desde el M08).
 *
 * Verifican el estado real del frontend, no la seguridad: el bloqueo
 * efectivo de las escrituras, su registro y la integridad de la base de
 * datos SOLO puede garantizarlos el backend. Las guardas del rol
 * administrativo las cubre src/app/router/AppRouter.test.jsx («exige
 * sesión, rol ADMINISTRATIVO…»), que sigue en la suite.
 *
 * No prohíben de forma permanente POST, PUT, PATCH o DELETE en el M08:
 * cohortes y asociaciones de participantes (RF-124, RF-125) los
 * necesitarán cuando se autorice la integración.
 */
const FEATURE_DIR = dirname(fileURLToPath(import.meta.url));
const SHARED_DIR = resolve(FEATURE_DIR, '../../shared');
const API_DIR = join(FEATURE_DIR, 'api');

const ALLOWED_PACKAGES = Object.freeze(['react', 'react-router-dom', 'lucide-react']);

// Recursos de los módulos protegidos por RF-148, como segmentos de una ruta.
const PROTECTED_RESOURCE = /['"`][^'"`\n]*\/(diario|chat|seguimiento|gamificacion|notificaciones)(\/|['"`?])/i;
const HTTP_WRITE = /\b(apiClient|axios)\s*\.\s*(post|put|patch|delete)\b|method\s*:\s*['"`](POST|PUT|PATCH|DELETE)['"`]/i;

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) return sourceFiles(path);

    return /\.(js|jsx)$/.test(entry.name) && !/\.test\.(js|jsx)$/.test(entry.name) ? [path] : [];
  });
}

const SOURCES = sourceFiles(FEATURE_DIR).map((path) => ({
  path,
  name: relative(FEATURE_DIR, path).split(sep).join('/'),
  code: readFileSync(path, 'utf8'),
}));

function importsOf(code) {
  return [...code.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map(([, specifier]) => specifier);
}

function isAllowedImport(file, specifier) {
  if (specifier.startsWith('@/')) return specifier.startsWith('@/shared/');
  if (!specifier.startsWith('.')) return ALLOWED_PACKAGES.includes(specifier);

  const target = resolve(dirname(file), specifier);
  return target.startsWith(FEATURE_DIR + sep) || target.startsWith(SHARED_DIR + sep);
}

describe('RF-148: límites del módulo administrativo', () => {
  it('encuentra el código fuente de la feature', () => {
    expect(SOURCES.length).toBeGreaterThan(40);
  });

  it('no importa otras features ni el árbol de app: solo la propia feature, shared y librerías permitidas', () => {
    const violations = SOURCES.flatMap(({ path, name, code }) =>
      importsOf(code).filter((specifier) => !isAllowedImport(path, specifier)).map((specifier) => `${name} → ${specifier}`),
    );

    expect(violations).toEqual([]);
  });

  /*
   * RF-148 permite CONSULTAR datos de esos módulos (RF-142). Las únicas
   * referencias admitidas son las rutas de la interfaz de consulta
   * (E9-D1: /cohortes/:id/seguimiento), declaradas aquí una a una; esos
   * archivos no pueden contener HTTP. Cualquier otra referencia falla.
   */
  // RF-38: rutas de la interfaz de consulta de la trazabilidad del chat.
  const READ_ONLY_REFERENCES = Object.freeze(['utils/chatTraceabilityRoutes.js', 'utils/cohortRoutes.js']);

  it('solo los archivos de consulta autorizados hacen referencia a M02, M03, M05, M06 o M07', () => {
    const referencing = SOURCES.filter(({ code }) => PROTECTED_RESOURCE.test(code));

    expect(referencing.map(({ name }) => name)).toEqual(READ_ONLY_REFERENCES);
    for (const { code } of referencing) {
      expect(code).not.toMatch(HTTP_WRITE);
      expect(code).not.toMatch(/apiClient|from\s+['"]axios['"]|\bfetch\s*\(/);
    }
  });

  it('regla permanente: las escrituras HTTP solo podrán vivir en administracion/api/, nunca hacia recursos protegidos', () => {
    const writers = SOURCES.filter(({ code }) => HTTP_WRITE.test(code));

    expect(writers.filter(({ path }) => !path.startsWith(API_DIR + sep)).map(({ name }) => name)).toEqual([]);
    expect(writers.filter(({ code }) => PROTECTED_RESOURCE.test(code)).map(({ name }) => name)).toEqual([]);
  });

  it('limita el acceso HTTP a los adaptadores administrativos integrados', () => {
    const http = SOURCES.filter(({ code }) =>
      /apiClient|from\s+['"]axios['"]|\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|new\s+WebSocket/.test(code),
    );

    expect(http.map(({ name }) => name)).toEqual([
      'api/chatTraceability/fetchParticipantSessions.js',
      'api/chatTraceability/fetchSessionTraceability.js',
      'api/cohortesApi.js',
      'api/listAuditRecords.js',
      'api/observeReadOnlyRejections.js',
      'api/participantesCohorteApi.js',
      'api/vistaAgregadaConductualApi.js',
    ]);
    const { code } = http.find(({ name }) => name === 'api/observeReadOnlyRejections.js');
    expect(code).toContain('apiClient.interceptors.response');
    expect(code).not.toMatch(/apiClient\s*\(|apiClient\.(?:get|head|options|request)\s*\(/);
  });

  it('el traductor de solo lectura se usa en la observación HTTP y el aviso', () => {
    const users = SOURCES.filter(({ name, code }) =>
      /readOnlyRestriction/.test(code) && !/readOnlyRestriction\.js$/.test(name),
    ).map(({ name }) => name);

    expect(users).toEqual([
      'api/observeReadOnlyRejections.js',
      'components/ReadOnlyNotice/ReadOnlyNotice.jsx',
    ]);
  });
});

describe('RF-148: las escrituras permitidas del M08 siguen disponibles', () => {
  it('RF-124: crear, editar y cambiar el estado de cohortes', () => {
    for (const operation of ['createCohort', 'updateCohort', 'changeCohortStatus']) {
      expect(typeof cohortSource[operation]).toBe('function');
    }
  });

  it('RF-125: asignar y retirar participantes de una cohorte', () => {
    for (const operation of ['assignParticipants', 'removeCohortParticipant']) {
      expect(typeof participantSource[operation]).toBe('function');
    }
  });
});

describe('RF-148: las vistas de consulta no modifican datos de participantes', () => {
  const PARTICIPANT = Object.freeze({
    id: 'p-1',
    code: 'C-1',
    participationStatus: 'PENDIENTE_VALIDACION',
    registrationStatus: 'COMPLETO',
    consentStatus: 'PENDIENTE',
    baselineStatus: 'NO_REGISTRADA',
    pendingReasons: ['Motivo.'],
  });

  const tagsIn = (html, tag) => (html.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length;

  it('la tarjeta de participante solo consulta: sin campos de edición de sus estados', () => {
    const html = renderToStaticMarkup(<ParticipantCard participant={PARTICIPANT} />);

    for (const tag of ['button', 'input', 'select', 'textarea', 'form']) expect(tagsIn(html, tag)).toBe(0);
  });

  it('con el retiro (RF-125) solo añade esa acción, sin editar registro, consentimiento ni línea base', () => {
    const html = renderToStaticMarkup(<ParticipantCard participant={PARTICIPANT} removeAction={{ busy: false, onClick: () => {} }} />);

    expect(tagsIn(html, 'button')).toBe(1);
    for (const tag of ['input', 'select', 'textarea', 'form']) expect(tagsIn(html, tag)).toBe(0);
  });

  it('el panel de asignación (RF-125) solo permite seleccionar participantes', () => {
    const html = renderToStaticMarkup(
      <ParticipantAssignmentPanel
        headingRef={{ current: null }}
        available={[{ id: 'k-1', code: 'C-9', issue: null }]}
        unavailable={[]}
        isLoadingCandidates={false}
        catalogError=""
        selected={[{ id: 'k-1', code: 'C-9', hasIssue: false }]}
        selectionError=""
        conflicts={[]}
        requestError=""
        isSubmitting={false}
        onToggle={() => {}}
        onRemove={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
        onRetryCatalog={() => {}}
      />,
    );

    const inputTypes = [...html.matchAll(/<input\b[^>]*type="([^"]+)"/g)].map(([, type]) => type);
    expect(inputTypes).toEqual(['checkbox']);
    expect(tagsIn(html, 'select')).toBe(0);
    expect(tagsIn(html, 'textarea')).toBe(0);
  });
});

describe('RF-148: la consulta de auditoría es de solo lectura', () => {
  afterEach(() => {
    state.value = null;
  });

  it('con registros no ofrece ningún control', () => {
    state.value = {
      entries: [{ id: 'a', action: 'ACCESO_MODULO', resource: 'R', timestamp: '2026-01-01T00:00:00Z', status: 'EXITOSA' }],
      isLoading: false,
      loadError: '',
      isDenied: false,
      isDemo: false,
      isIntegrationPending: false,
      retry: () => {},
    };
    const html = renderToStaticMarkup(<AuditLogPage />);

    for (const tag of ['button', 'a', 'input', 'select', 'textarea', 'form']) {
      expect((html.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length).toBe(0);
    }
  });
});
