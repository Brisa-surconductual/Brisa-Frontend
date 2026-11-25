import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { StudentHomePage } from './StudentHomePage.jsx';

const auth = vi.hoisted(() => ({ value: {} }));
const http = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
const iniciar = vi.hoisted(() => vi.fn());

vi.mock('@/app/providers/index.js', () => ({ useAuth: () => auth.value }));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/shared/utils/apiClient.jsx', () => ({ apiClient: http }));

vi.mock('@/features/chat/api/sesion/iniciarSesionConversacional.js', () => ({
  iniciarSesionConversacional: iniciar,
}));

vi.mock('@/features/cronograma/components/CurrentContentAccessCard/index.js', () => ({
  CurrentContentAccessCard: ({ variant }) => <section>tarjeta-contenido-{variant}</section>,
}));

vi.mock('@/features/cronograma/components/AssignedScheduleSummary/index.js', () => ({
  AssignedScheduleSummary: () => <div>resumen-cronograma</div>,
}));

const session = (extra) => ({
  user: { email: 'luisa.qa@example.com' },
  role: 'ESTUDIANTE',
  estadoRegistro: 'REGISTRO_COMPLETO',
  alcance: 'COMPLETA',
  logout: vi.fn(),
  ...extra,
});

const render = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <StudentHomePage />
    </MemoryRouter>,
  );

const chatCard = (html) => {
  const start = html.indexOf('<section aria-labelledby="espacio-terapeutico-titulo"');
  return html.slice(start, html.indexOf('</section>', start));
};

beforeEach(() => {
  auth.value = session();
  http.post.mockReset();
  http.get.mockReset();
  iniciar.mockReset();
});

describe('Inicio: el chat es la acción principal', () => {
  it('saluda con el nombre del usuario autenticado y sin emoji', () => {
    const html = render();

    expect(html).toContain('Hola, luisa.qa</h1>');
    expect(html).toContain('Este es tu espacio para avanzar a tu ritmo.');
    expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('«Tu espacio terapéutico» es la primera sección tras la bienvenida', () => {
    const html = render();
    const firstH2 = html.match(/<h2[^>]*>([^<]*)<\/h2>/)[1];

    expect(firstH2).toBe('Tu espacio terapéutico');
    expect(chatCard(html)).toContain(
      'Un lugar para conversar, reflexionar y continuar tu proceso de dejar de vapear.',
    );
  });

  it('«Ir a mi chat» lleva a la entrada del chat, nunca a un id de sesión', () => {
    const card = chatCard(render());
    const links = [...card.matchAll(/href="([^"]*)"/g)].map(([, href]) => href);

    expect(links).toEqual(['/app/estudiante/chat']);
    expect(card).toContain('Ir a mi chat');
  });

  it('con el registro confirmado es la única acción verde sólida y no muestra datos inventados', () => {
    const html = render();
    const card = chatCard(html);

    expect(card).toContain('bg-[var(--brand-500)]');
    expect(html.match(/bg-\[var\(--brand-500\)\]/g)).toHaveLength(1);
    expect(card).not.toMatch(/sesión|progreso|%|última|modalidad|disponible/i);
  });

  it('pintar el inicio no crea ni reanuda sesiones ni hace peticiones', () => {
    render();

    expect(iniciar).not.toHaveBeenCalled();
    expect(http.post).not.toHaveBeenCalled();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('el código del inicio no importa la API del chat', () => {
    const dir = fileURLToPath(new URL('.', import.meta.url));
    const files = readdirSync(dir, { recursive: true })
      .filter((file) => /\.jsx?$/.test(file) && !/\.test\.jsx?$/.test(file))
      .map((file) => readFileSync(join(dir, file), 'utf8'));

    for (const source of files) {
      expect(source).not.toMatch(/features\/chat\/api|iniciarSesionConversacional|apiClient/);
    }
  });

  it('el contenido vigente usa la variante compacta', () => {
    expect(render()).toContain('tarjeta-contenido-compact');
  });
});

describe('Estado del programa', () => {
  it('registro completo: aviso compacto dentro de «Estado del programa» junto al cronograma', () => {
    const html = render();
    const start = html.indexOf('<section aria-labelledby="estado-programa-titulo"');
    const status = html.slice(start, html.indexOf('</section>', start));

    expect(status).toContain('¡Registro completado!');
    expect(status).toContain('REGISTRO_COMPLETO');
    expect(status).toContain('resumen-cronograma');
    // La versión completa (con descripción larga) no se repite.
    expect(html).not.toContain('Tu programa psicoeducativo está listo');
    expect(html).not.toContain('estado-cuenta-titulo');
  });

  it.each([
    ['PENDIENTE_CONSENTIMIENTO', 'COMPLETA', 'Falta aceptar el consentimiento informado'],
    ['PENDIENTE_REVISION', 'COMPLETA', 'Tu registro está pendiente de revisión'],
    ['REGISTRO_COMPLETO', 'LIMITADA', 'Tu sesión necesita actualizarse'],
    [undefined, undefined, 'No pudimos confirmar el estado de tu registro'],
  ])('%s / %s: el aviso completo va antes del chat y el acceso no se presenta como garantizado', (estado, alcance, text) => {
    auth.value = session({ estadoRegistro: estado, alcance });
    const html = render();
    const card = chatCard(html);

    expect(html.indexOf(text)).toBeGreaterThan(-1);
    expect(html.indexOf(text)).toBeLessThan(html.indexOf('espacio-terapeutico-titulo'));
    expect(card).toContain('El acceso al chat depende del estado de tu registro.');
    expect(card).not.toContain('bg-[var(--brand-500)]');
    expect(card).toContain('href="/app/estudiante/chat"');
    expect(html).not.toContain('¡Registro completado!');
  });

  it('consentimiento pendiente conserva su botón de acción', () => {
    auth.value = session({ estadoRegistro: 'PENDIENTE_CONSENTIMIENTO' });

    expect(render()).toMatch(/<button[^>]*>Revisar consentimiento<\/button>/);
  });
});
