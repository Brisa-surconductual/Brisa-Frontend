import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { READ_ONLY_MESSAGE } from '../../types/readOnlyRestriction.js';
import { ReadOnlyNotice } from './ReadOnlyNotice.jsx';

const render = (props) => renderToStaticMarkup(<ReadOnlyNotice {...props} />).replaceAll('<!-- -->', '');

describe('ReadOnlyNotice (RF-148)', () => {
  it('13. aviso accesible: nota con título, mensaje uniforme e ícono oculto a lectores', () => {
    const html = render();

    expect(html).toMatch(/^<div[^>]*role="note"/);
    expect(html).toContain('<strong');
    expect(html).toContain('Información de solo lectura');
    expect(html).toContain(READ_ONLY_MESSAGE);
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it('para un rechazo recién ocurrido se anuncia como alerta', () => {
    expect(render({ role: 'alert' })).toMatch(/^<div[^>]*role="alert"/);
  });

  it('admite un texto propio sin perder la semántica', () => {
    const html = render({ children: 'Detalle protegido.' });

    expect(html).toContain('Detalle protegido.');
    expect(html).toContain('role="note"');
  });

  it('no ofrece acciones', () => {
    expect(render()).not.toMatch(/<button|<a |<form|<input/);
  });
});
