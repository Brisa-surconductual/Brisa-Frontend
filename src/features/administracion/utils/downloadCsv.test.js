import { afterEach, describe, expect, it, vi } from 'vitest';

import { CSV_MIME_TYPE, UTF8_BOM, startCsvDownload } from './downloadCsv.js';

function fakeEnv() {
  const link = {
    click: vi.fn(),
    remove: vi.fn(),
    style: {},
  };

  class FakeBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.type = options.type;
    }
  }

  return {
    link,
    env: {
      Blob: FakeBlob,
      URL: {
        createObjectURL: vi.fn(() => 'blob:demo-1'),
        revokeObjectURL: vi.fn(),
      },
      document: {
        createElement: vi.fn(() => link),
        body: { appendChild: vi.fn() },
      },
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Descarga del CSV (RF-144)', () => {
  it('entrega un archivo .csv UTF-8 con el nombre y el tipo correctos', () => {
    const { env, link } = fakeEnv();
    startCsvDownload(
      {
        fileName: 'indicadores_cohorte_activa_20261122.csv',
        content: 'a\r\n1\r\n',
      },
      env,
    );

    const blob = env.URL.createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe(CSV_MIME_TYPE);
    expect(blob.type).toContain('charset=utf-8');
    expect(blob.parts).toEqual([UTF8_BOM, 'a\r\n1\r\n']);
    expect(link.download).toBe('indicadores_cohorte_activa_20261122.csv');
    expect(link.href).toBe('blob:demo-1');
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(link.remove).toHaveBeenCalled();
  });

  it('libera la URL temporal después del clic', () => {
    vi.useFakeTimers();
    const { env } = fakeEnv();
    startCsvDownload({ fileName: 'x.csv', content: '' }, env);

    expect(env.URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(env.URL.revokeObjectURL).toHaveBeenCalledWith('blob:demo-1');
  });

  it('libera la URL aunque falle el clic', () => {
    vi.useFakeTimers();
    const { env, link } = fakeEnv();
    link.click.mockImplementation(() => {
      throw new Error('bloqueado');
    });

    expect(() =>
      startCsvDownload({ fileName: 'x.csv', content: '' }, env),
    ).toThrow();
    vi.runAllTimers();
    expect(env.URL.revokeObjectURL).toHaveBeenCalled();
  });
});
