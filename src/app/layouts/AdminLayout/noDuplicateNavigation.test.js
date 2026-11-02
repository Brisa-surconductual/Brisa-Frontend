import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/*
 * Guarda de regresión: la navegación administrativa vive solo en
 * AdminLayout. Ninguna página vuelve a montar el encabezado o la
 * barra de pestañas antiguos ni su propio <main>.
 */
const FEATURES_DIR = fileURLToPath(new URL('../../../features', import.meta.url));

function pageFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) return pageFiles(path);

    return /Page\.jsx$/.test(entry.name) ? [path] : [];
  });
}

// Cronogramas y chat (salvo la página del estudiante) y el panel.
const ADMIN_PAGES = pageFiles(FEATURES_DIR).filter(
  (path) =>
    (/features[\\/](cronograma|chat)[\\/]pages/.test(path) &&
      !/CurrentContentPage/.test(path)) ||
    /PsychologyHomePage\.jsx$/.test(path),
);

describe('Navegación administrativa sin duplicados', () => {
  it('encuentra las páginas administrativas', () =>
    expect(ADMIN_PAGES.length).toBeGreaterThanOrEqual(17));

  it.each(ADMIN_PAGES.map((path) => [path.replace(/.*features[\\/]/, ''), path]))(
    '%s no monta navegación ni <main> propios',
    (_, path) => {
      const source = readFileSync(path, 'utf8');

      expect(source).not.toMatch(/<AdministrativeHeader\b/);
      expect(source).not.toMatch(/<AdministrativeTabBar\b/);
      expect(source).not.toMatch(/<main\b/);
      expect(source).not.toMatch(/min-h-screen/);
    },
  );
});
