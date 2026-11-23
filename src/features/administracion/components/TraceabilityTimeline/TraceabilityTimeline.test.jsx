import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { interpretSessionTrace } from '../../services/sessionTraceResponse.js';

import { TraceabilityTimeline } from './TraceabilityTimeline.jsx';

const CODE = 'P-1A2B3C4D';
const SESSION = '00000000-0000-4000-8000-000000000001';
const NODE = '00000000-0000-4000-8000-00000000000a';

const record = (secuencia, changes = {}) => ({
  secuencia,
  id_nodo: NODE,
  respuesta_usuario: { valor: 'x' },
  id_nodo_destino: NODE,
  timestamp_interaccion: '2026-11-20T14:00:00.000Z',
  tipo_entrada: 'TEXTO_LIBRE',
  contenido_historico: 'VERIFICADO',
  motivo_no_verificable: null,
  tipo_nodo: 'PREGUNTA',
  texto_nodo: 'Pregunta',
  etiqueta_respuesta: null,
  ...changes,
});

function render(registros) {
  const { trace } = interpretSessionTrace(
    { id_sesion: SESSION, id_participante: CODE, registros },
    { sessionId: SESSION, code: CODE },
  );
  return renderToStaticMarkup(<TraceabilityTimeline records={trace.records} />);
}

const withValue = (valor, changes = {}) => render([record(1, { respuesta_usuario: { valor }, ...changes })]);

describe('TraceabilityTimeline (RF-38)', () => {
  it('número, booleano, texto, arreglo y objeto sin pérdida', () => {
    expect(withValue(7.25, { tipo_entrada: 'ESCALA' })).toMatch(/>7\.25<\/p>/);
    expect(withValue(true, { tipo_entrada: 'BOOLEANO' })).toContain('Sí <code');
    expect(withValue(true, { tipo_entrada: 'BOOLEANO' })).toContain('(true)');
    expect(withValue('Me sentí mejor')).toContain('Me sentí mejor');
    expect(withValue(['a', 'b'], { tipo_entrada: 'MULTISELECCION' })).toMatch(/<li[^>]*>a<\/li><li[^>]*>b<\/li>/);
    expect(withValue({ hora: '08:00' }, { tipo_entrada: 'FECHA_HORA' })).toContain('&quot;hora&quot;: &quot;08:00&quot;');
  });

  it('null fuera de CONTINUAR: sin valor registrado', () => {
    expect(withValue(null, { tipo_entrada: 'ESCALA' })).toContain('Sin valor registrado');
  });

  it('etiquetas múltiples', () => {
    const html = withValue(['a', 'b'], { tipo_entrada: 'MULTISELECCION', etiqueta_respuesta: ['Opción A', 'Opción B'] });

    expect(html).toContain('Opciones elegidas:');
    expect(html).toContain('Opción A');
    expect(html).toContain('Opción B');
  });

  it('un texto con HTML se muestra escapado, nunca se interpreta', () => {
    const html = withValue('<img src=x onerror=alert(1)>', { texto_nodo: '<script>alert(1)</script>' });

    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;script&gt;');
  });

  it('nodo verificado sin texto', () => {
    expect(render([record(1, { texto_nodo: null })])).toContain('Este contenido no tiene texto');
  });

  it('no verificable sin motivo conocido: advierte sin texto', () => {
    const html = render([record(1, { contenido_historico: 'NO_VERIFICABLE', motivo_no_verificable: 'MOTIVO_NUEVO', texto_nodo: 'oculto' })]);

    expect(html).toContain('no se muestra');
    expect(html).toContain('MOTIVO_NUEVO');
    expect(html).not.toContain('oculto');
  });

  it('fecha en hora de Colombia dentro de <time>', () => {
    expect(render([record(1)])).toContain('<time dateTime="2026-11-20T14:00:00.000Z">');
  });
});
