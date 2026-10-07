import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { TIPO_ENTRADA, TIPO_NODO } from '../../types/index.js';
import { NodeInputForm } from './NodeInputForm.jsx';
import { resolverRespuesta } from './resolverRespuesta.js';

const pregunta = (entrada) => ({
  id_nodo: 'n1',
  tipo_nodo: TIPO_NODO.PREGUNTA,
  contenido: { texto: '¿Cómo te sientes?' },
  entrada: { obligatorio: true, ...entrada },
});

const unica = pregunta({
  tipo_entrada: TIPO_ENTRADA.SELECCION_UNICA,
  opciones: [{ valor: 'bien', etiqueta: 'Bien' }],
});

const render = (props) =>
  renderToStaticMarkup(<NodeInputForm onResponder={() => {}} {...props} />);

describe('resolverRespuesta', () => {
  it('aplica `normalizar` antes de validar si el tipo lo define', () => {
    const tipo = {
      normalizar: (_entrada, v) => v.toUpperCase(),
      validar: (_entrada, v) => (v === 'A' ? null : 'OPCION_NO_VALIDA'),
      textoRespuesta: (_entrada, v) => `Texto ${v}`,
    };
    expect(resolverRespuesta({}, tipo, 'a')).toEqual({
      valido: true,
      respuesta: 'A',
      textoRespuesta: 'Texto A',
    });
  });
});

describe('NodeInputForm', () => {
  it('un nodo sin entrada pinta solo "Continuar"', () => {
    const html = render({ nodo: { tipo_nodo: TIPO_NODO.MENSAJE } });
    expect(html).toContain('Continuar');
    expect(html).not.toContain('Tu respuesta');
    expect(html.match(/<button/g)).toHaveLength(1);
  });

  it.each([
    ['SELECCION_UNICA', unica, 'Bien'],
    [
      'BOOLEANO',
      pregunta({
        tipo_entrada: TIPO_ENTRADA.BOOLEANO,
        etiqueta_verdadero: 'Sí',
        etiqueta_falso: 'No',
      }),
      'No',
    ],
  ])('%s pinta sus opciones en un grupo', (_tipo, nodo, etiqueta) => {
    const html = render({ nodo });
    expect(html).toContain('role="group"');
    expect(html).toContain(`>${etiqueta}</button>`);
    expect(html).not.toContain('Continuar');
  });

  it('SELECCION_MULTIPLE pinta casillas, ayuda y "Continuar"', () => {
    const html = render({
      nodo: pregunta({
        tipo_entrada: TIPO_ENTRADA.SELECCION_MULTIPLE,
        opciones: [{ valor: 'a', etiqueta: 'Calma' }],
        min_selecciones: 1,
        max_selecciones: 2,
      }),
    });
    expect(html).toContain('role="checkbox"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('Elige entre 1 y 2');
    expect(html).toContain('Calma');
    expect(html).toContain('Continuar');
  });

  it('un tipo no registrado no pinta nada', () => {
    expect(render({ nodo: pregunta({ tipo_entrada: 'constructor' }) })).toBe(
      '',
    );
  });

  it('muestra el error externo y el campo lo referencia', () => {
    const html = render({
      nodo: unica,
      errorExterno: { codigo: 'OPCION_NO_VALIDA', message: 'Mensaje backend' },
    });
    const [, idError] = html.match(/<p id="([^"]+)" role="alert"/);
    expect(html).toContain('Mensaje backend');
    expect(html).toContain(`aria-describedby="${idError}"`);
  });

  it('con `enviando` todos los botones salen deshabilitados', () => {
    const html = render({
      nodo: { ...unica, entrada: { ...unica.entrada, obligatorio: false } },
      enviando: true,
    });
    expect(html.match(/<button/g).length).toBe(
      html.match(/disabled=""/g).length,
    );
  });
});
