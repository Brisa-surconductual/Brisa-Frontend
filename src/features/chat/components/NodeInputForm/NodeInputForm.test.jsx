import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { TIPO_ENTRADA } from '../../types/index.js';
import { NodeInputForm } from './NodeInputForm.jsx';

const AVISO = 'Esta pregunta todavía no se puede responder en la aplicación.';

const nodo = (entrada, extra = {}) => ({
  idNodo: 'n1',
  tipoNodo: 'PREGUNTA',
  esTerminal: false,
  bloques: [
    { orden: 1, tipo: 'INSTRUCCION', texto: 'Elige una' },
    { orden: 2, tipo: 'TEXTO', texto: '¿Cómo te sientes?' },
  ],
  entrada,
  ...extra,
});

const unica = nodo({
  tipo: TIPO_ENTRADA.OPCION_UNICA,
  obligatorio: true,
  opciones: [{ valor: 'bien', etiqueta: 'Bien' }],
});

const render = (props) =>
  renderToStaticMarkup(<NodeInputForm onResponder={() => {}} {...props} />);

describe('NodeInputForm (D9)', () => {
  it.each([
    ['entrada null', nodo(null)],
    ['tipo CONTINUAR', nodo({ tipo: TIPO_ENTRADA.CONTINUAR })],
  ])('%s en nodo no terminal pinta solo "Continuar"', (_caso, n) => {
    const html = render({ nodo: n });
    expect(html).toContain('Continuar');
    expect(html).not.toContain('Tu respuesta');
    expect(html.match(/<button/g)).toHaveLength(1);
  });

  it('un nodo terminal no pinta nada', () => {
    expect(render({ nodo: nodo(null, { esTerminal: true }) })).toBe('');
  });

  it.each(['DESCONOCIDO', TIPO_ENTRADA.TEXTO_LIBRE, 'constructor'])(
    '%s no registrado muestra el aviso y no ofrece enviar',
    (tipo) => {
      const html = render({ nodo: nodo({ tipo }) });
      expect(html).toContain(AVISO);
      expect(html).not.toContain('<button');
      expect(html).not.toContain('<form');
    },
  );

  it('OPCION_UNICA obligatoria: un grupo, sin "Continuar" ni texto libre', () => {
    const html = render({ nodo: unica });
    expect(html).toContain('role="group"');
    expect(html).toContain('>Bien</button>');
    expect(html).not.toContain('Continuar');
    expect(html).not.toContain('<input');
    expect(html).not.toContain('<textarea');
  });

  it('el nombre accesible es el primer bloque TEXTO', () => {
    expect(render({ nodo: unica })).toMatch(
      /class="sr-only">¿Cómo te sientes\?</,
    );
  });

  it('BOOLEANO usa sus opciones o «Sí» y «No»', () => {
    const propio = render({
      nodo: nodo({
        tipo: TIPO_ENTRADA.BOOLEANO,
        obligatorio: true,
        opciones: [
          { valor: true, etiqueta: 'Ya lo hice' },
          { valor: false, etiqueta: 'Todavía no' },
        ],
      }),
    });
    const porDefecto = render({
      nodo: nodo({ tipo: TIPO_ENTRADA.BOOLEANO, opciones: null }),
    });
    expect(propio).toContain('>Todavía no</button>');
    expect(porDefecto).toContain('>Sí</button>');
    expect(porDefecto).toContain('>No</button>');
  });

  it('MULTISELECCION pinta casillas, ayuda y "Continuar"', () => {
    const html = render({
      nodo: nodo({
        tipo: TIPO_ENTRADA.MULTISELECCION,
        opciones: [{ valor: 'a', etiqueta: 'Calma' }],
        min: 1,
        max: 2,
      }),
    });
    expect(html).toContain('role="checkbox"');
    expect(html).toContain('Elige entre 1 y 2 opciones');
    expect(html).toContain('Continuar');
  });

  it('la región del error existe aunque no haya error (D10)', () => {
    const html = render({ nodo: unica });
    expect(html).toMatch(
      /<div id="[^"]+-error" aria-live="polite" aria-atomic="true"><\/div>/,
    );
    expect(html).not.toContain('aria-describedby');
  });

  it('muestra el mensaje del backend y el componente lo referencia', () => {
    const html = render({
      nodo: unica,
      errorExterno: {
        status: 400,
        codigo: 'VALOR_NO_PERMITIDO',
        mensaje: 'Mensaje backend',
      },
    });
    const [, idError] = html.match(
      /<div id="([^"]+)" aria-live="polite" aria-atomic="true">/,
    );
    expect(html).toContain('Mensaje backend');
    expect(html).toContain(`aria-describedby="${idError}"`);
    expect(html).toContain('aria-invalid="true"');
  });

  it('con `enviando` todos los botones salen deshabilitados', () => {
    const html = render({
      nodo: nodo({ ...unica.entrada, obligatorio: false }),
      enviando: true,
    });
    expect(html.match(/<button/g).length).toBe(
      html.match(/disabled=""/g).length,
    );
  });
});
