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

  it('acepta HTTPS en mayúsculas y rechaza otros esquemas y no-texto', () => {
    expect(esUrlSegura('HTTPS://x.test/a')).toBe(true);

    for (const url of [
      'data:image/png;base64,AAAA',
      'blob:https://x.test/1',
      '//x.test/a',
      '',
      undefined,
      ['https://x.test/a'],
    ]) {
      expect(esUrlSegura(url)).toBe(false);
    }
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

  it('normaliza espacios alrededor del MIME y antes de los parámetros', () => {
    for (const mimeType of ['  image/png  ', 'image/png ; q=1']) {
      expect(resolverEstadoRender(bloque({ mimeType }), R.CARGANDO)).toBe(
        R.CARGANDO,
      );
    }
  });

  it('mimeType ausente o vacío tras normalizar no bloquea (A-040)', () => {
    for (const mimeType of [null, undefined, '', '   ', ';charset=x']) {
      expect(resolverEstadoRender(bloque({ mimeType }), R.CARGANDO)).toBe(
        R.CARGANDO,
      );
    }
  });

  it('mimeType que no es texto → NO_SOPORTADO, sin lanzar', () => {
    for (const mimeType of [123, {}, ['image/png']]) {
      expect(resolverEstadoRender(bloque({ mimeType }), R.CARGANDO)).toBe(
        R.NO_SOPORTADO,
      );
    }
  });

  it('noDisponible gana sobre el estado local, también en CARGANDO (D8, CA-33-5)', () => {
    for (const local of [R.CARGANDO, R.MOSTRADO]) {
      expect(resolverEstadoRender(bloque({ noDisponible: true }), local)).toBe(
        R.ERROR_CARGA,
      );
    }

    // También con MIME no permitido o sin url: ERROR_CARGA va primero.
    expect(
      resolverEstadoRender(
        bloque({ noDisponible: true, mimeType: 'image/tiff' }),
        R.CARGANDO,
      ),
    ).toBe(R.ERROR_CARGA);
    expect(
      resolverEstadoRender(
        bloque({ noDisponible: true, url: null }),
        R.CARGANDO,
      ),
    ).toBe(R.ERROR_CARGA);
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
