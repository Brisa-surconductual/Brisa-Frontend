import { describe, expect, it } from 'vitest';

import { ESTADO_RENDER as R } from '../types/index.js';

import { esUrlSegura, resolverEstadoRender } from './multimedia.js';

const URL_OK = 'https://storage.test/obj?firma=1';

const bloque = (extra = {}) => ({
  orden: 1,
  tipo: 'IMAGEN',
  url: URL_OK,
  mimeType: 'image/webp',
  ...extra,
});

describe('esUrlSegura', () => {
  it('solo acepta https', () => {
    expect(esUrlSegura(URL_OK)).toBe(true);
    expect(esUrlSegura('http://storage.test/a')).toBe(false);
    expect(esUrlSegura('javascript:alert(1)')).toBe(false);
    expect(esUrlSegura(null)).toBe(false);
  });
});

describe('resolverEstadoRender (RF-33)', () => {
  it('con MIME permitido devuelve el estado local', () => {
    expect(resolverEstadoRender(bloque(), R.CARGANDO)).toBe(R.CARGANDO);
    expect(resolverEstadoRender(bloque(), R.MOSTRADO)).toBe(R.MOSTRADO);
    expect(
      resolverEstadoRender(
        bloque({ tipo: 'VIDEO', mimeType: 'video/mp4' }),
        R.MOSTRADO,
      ),
    ).toBe(R.MOSTRADO);
  });

  it('normaliza mayúsculas y parámetros del MIME', () => {
    expect(
      resolverEstadoRender(
        bloque({ mimeType: 'Image/PNG; charset=binary' }),
        R.CARGANDO,
      ),
    ).toBe(R.CARGANDO);
  });

  it('MIME fuera de la lista del tipo → NO_SOPORTADO (CA-33-4)', () => {
    expect(
      resolverEstadoRender(bloque({ mimeType: 'image/tiff' }), R.CARGANDO),
    ).toBe(R.NO_SOPORTADO);
    expect(
      resolverEstadoRender(
        bloque({ tipo: 'GIF', mimeType: 'image/png' }),
        R.CARGANDO,
      ),
    ).toBe(R.NO_SOPORTADO);
  });

  it('mimeType null no bloquea (A-040)', () => {
    expect(resolverEstadoRender(bloque({ mimeType: null }), R.CARGANDO)).toBe(
      R.CARGANDO,
    );
  });

  it('noDisponible gana sobre el estado local, también en CARGANDO (D8, CA-33-5)', () => {
    for (const local of [R.CARGANDO, R.MOSTRADO]) {
      expect(resolverEstadoRender(bloque({ noDisponible: true }), local)).toBe(
        R.ERROR_CARGA,
      );
    }
  });

  it('sin url o con url insegura → ERROR_CARGA, antes que NO_SOPORTADO', () => {
    expect(resolverEstadoRender(bloque({ url: null }), R.CARGANDO)).toBe(
      R.ERROR_CARGA,
    );
    expect(
      resolverEstadoRender(
        bloque({ url: 'http://x.test/a', mimeType: 'image/tiff' }),
        R.CARGANDO,
      ),
    ).toBe(R.ERROR_CARGA);
  });
});
