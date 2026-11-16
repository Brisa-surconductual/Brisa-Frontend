import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  conversationReducer,
  crearEstadoInicial,
  selectItems,
} from '../../pages/ChatConversationPage/utils/conversationState.js';
import { ChatNodeMessage } from '../ChatNodeMessage/ChatNodeMessage.jsx';

import { ChatMediaBlock } from './ChatMediaBlock.jsx';

const ERROR_CARGA = 'El recurso multimedia no está disponible.';
const NO_SOPORTADO = 'Este formato no se puede mostrar.';
const URL_A = 'https://storage.test/a.webp?firma=1';
const URL_B = 'https://storage.test/a.webp?firma=2';

const render = (bloque) =>
  renderToStaticMarkup(<ChatMediaBlock bloque={bloque} />);

const imagen = (extra = {}) => ({
  orden: 1,
  tipo: 'IMAGEN',
  url: URL_A,
  mimeType: 'image/webp',
  textoAlternativo: 'Persona respirando profundo',
  ...extra,
});

describe('ChatMediaBlock (RF-33)', () => {
  it('en CARGANDO el medio está montado, invisible y con alto reservado (CA-33-3)', () => {
    const html = render(imagen());

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`src="${URL_A}"`);
    expect(html).toContain('alt="Persona respirando profundo"');
    expect(html).toContain('opacity-0');
    expect(html).toContain('aspect-[4/3]');
    // D9: nunca `display:none` (la clase `hidden` de Tailwind).
    expect(html).not.toMatch(/class="[^"]*\bhidden\b/);
  });

  it('un GIF permitido se pinta como imagen', () => {
    const html = render(imagen({ tipo: 'GIF', mimeType: 'image/gif' }));

    expect(html).toContain('<img');
  });

  it('el video tiene controles, solo metadatos y no se reproduce solo (CA-33-2)', () => {
    const html = render(imagen({ tipo: 'VIDEO', mimeType: 'video/mp4' }));

    expect(html).toContain('<video');
    expect(html).toContain('controls');
    expect(html).toContain('preload="metadata"');
    expect(html).toContain('aspect-video');
    expect(html).not.toContain('autoplay');
  });

  it('MIME no permitido: aviso y sin pedir el archivo (CA-33-4)', () => {
    const html = render(imagen({ mimeType: 'image/tiff' }));

    expect(html).toContain(NO_SOPORTADO);
    expect(html).toContain('Persona respirando profundo');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('src=');
  });

  it('noDisponible: aviso normativo, sin quedarse en carga', () => {
    const html = render(imagen({ noDisponible: true }));

    expect(html).toContain(ERROR_CARGA);
    expect(html).not.toContain('aria-busy');
    expect(html).not.toContain('<img');
  });

  it('AUDIO conserva el aviso de RF-26', () => {
    const html = render({ orden: 1, tipo: 'AUDIO', url: null });

    expect(html).toContain('No se pudo cargar este recurso.');
  });
});

// A-017 identifica el recurso caído por índice y compara la URL tras la
// recarga. Se recorre el reducer y se pinta el nodo resultante.
describe('RF-33 con la recarga única de A-017', () => {
  const ID = '33000000-0000-4000-8000-000000000001';

  const conversacion = (url) => ({
    idSesion: ID,
    estadoSesion: 'ACTIVA',
    nodo: {
      idNodo: 'n1',
      esTerminal: false,
      bloques: [
        { orden: 1, tipo: 'TEXTO', texto: 'Respira' },
        imagen({ orden: 2, url }),
      ],
      entrada: null,
    },
  });

  const recorrer = (acciones) =>
    acciones.reduce(conversationReducer, crearEstadoInicial(ID));

  const pintar = (estado) =>
    renderToStaticMarkup(
      <ChatNodeMessage nodo={selectItems(estado)[0].nodo} />,
    );

  it('a) la recarga trae la MISMA URL y vuelve a fallar → ERROR_CARGA (CA-33-5)', () => {
    const estado = recorrer([
      { type: 'EXITO', conversacion: conversacion(URL_A) },
      { type: 'RECURSO_ERROR', indice: 1 },
      { type: 'EXITO', conversacion: conversacion(URL_A) },
    ]);

    expect(estado.recarga).toBe(1);
    expect(selectItems(estado)[0].nodo.bloques[1].noDisponible).toBe(true);

    const html = pintar(estado);
    expect(html).toContain(ERROR_CARGA);
    expect(html).not.toContain('aria-busy');
    expect(html).toContain('Respira');
  });

  it('b) la recarga trae una URL NUEVA que también falla → ERROR_CARGA sin segunda recarga (CA-33-6)', () => {
    const tras = recorrer([
      { type: 'EXITO', conversacion: conversacion(URL_A) },
      { type: 'RECURSO_ERROR', indice: 1 },
      { type: 'EXITO', conversacion: conversacion(URL_B) },
    ]);

    // Con URL nueva el recurso vuelve a intentarse.
    expect(pintar(tras)).toContain(`src="${URL_B}"`);

    const estado = conversationReducer(tras, {
      type: 'RECURSO_ERROR',
      indice: 1,
    });

    expect(estado.recarga).toBe(tras.recarga);
    expect(estado.recargando).toBe(false);

    const html = pintar(estado);
    expect(html).toContain(ERROR_CARGA);
    expect(html).not.toContain('aria-busy');
  });
});
