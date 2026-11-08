import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { ChatNodeMessage } from './ChatNodeMessage.jsx';

const render = (bloques) =>
  renderToStaticMarkup(<ChatNodeMessage nodo={{ bloques }} />);

describe('ChatNodeMessage (RF-26)', () => {
  it('pinta el texto idéntico, con saltos de línea, y escapa el HTML (CA-26-3)', () => {
    const texto = '  Dijo “hola”\nOtra línea <b>hola</b> ';
    const html = render([{ orden: 1, tipo: 'TEXTO', texto }]);

    expect(html).toContain(
      '  Dijo “hola”\nOtra línea &lt;b&gt;hola&lt;/b&gt; ',
    );
    expect(html).not.toContain('<b>');
  });

  it('una IMAGEN expone su textoAlternativo como alt (CA-26-4)', () => {
    const html = render([
      {
        orden: 1,
        tipo: 'IMAGEN',
        url: 'https://example.test/a.png',
        textoAlternativo: 'Escala ilustrada',
      },
    ]);

    expect(html).toContain('alt="Escala ilustrada"');
    expect(html).toContain('loading="lazy"');
  });

  it('sin textoAlternativo, el nombre accesible es el del tipo (D18)', () => {
    const url = 'https://example.test/r';
    const html = render([
      { orden: 1, tipo: 'IMAGEN', url, textoAlternativo: null },
      { orden: 2, tipo: 'GIF', url },
      { orden: 3, tipo: 'VIDEO', url },
      { orden: 4, tipo: 'AUDIO', url },
      { orden: 5, tipo: 'DOCUMENTO', url },
    ]);

    expect(html.match(/alt="Imagen"/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Video"');
    expect(html).toContain('aria-label="Audio"');
    expect(html).toContain('>Documento</span>');
  });

  it('un recurso no disponible muestra el aviso y el resto sigue (CA-26-5)', () => {
    const html = render([
      { orden: 1, tipo: 'TEXTO', texto: 'Antes' },
      {
        orden: 2,
        tipo: 'VIDEO',
        url: 'https://example.test/v.mp4',
        textoAlternativo: 'Respiración guiada',
        noDisponible: true,
      },
      { orden: 3, tipo: 'INSTRUCCION', texto: 'Después' },
    ]);

    expect(html).toContain('No se pudo cargar este recurso.');
    expect(html).toContain('Respiración guiada');
    expect(html).not.toContain('<video');
    expect(html).toContain('Antes');
    expect(html).toContain('Después');
  });

  it('un multimedia sin url muestra el aviso directamente (D14)', () => {
    const html = render([{ orden: 1, tipo: 'AUDIO', url: null }]);

    expect(html).toContain('No se pudo cargar este recurso.');
    expect(html).not.toContain('<audio');
  });

  it('una URL que no es https muestra el aviso', () => {
    const html = render([
      { orden: 1, tipo: 'DOCUMENTO', url: 'javascript:alert(1)' },
    ]);

    expect(html).toContain('No se pudo cargar este recurso.');
    expect(html).not.toContain('href=');
  });

  it('un DOCUMENTO abre en pestaña nueva con rel seguro', () => {
    const html = render([
      { orden: 1, tipo: 'DOCUMENTO', url: 'https://example.test/d.pdf' },
    ]);

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('Abrir documento');
  });

  it('un tipo desconocido no se pinta y no hay emojis', () => {
    const html = render([{ orden: 1, tipo: 'OTRO', texto: 'Oculto' }]);

    expect(html).not.toContain('Oculto');
    expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
