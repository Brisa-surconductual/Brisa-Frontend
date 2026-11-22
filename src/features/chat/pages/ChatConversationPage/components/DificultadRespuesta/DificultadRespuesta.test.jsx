import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import { DificultadRespuesta } from './DificultadRespuesta.jsx';

const render = (props) =>
  renderToStaticMarkup(
    <DificultadRespuesta
      ayudaSolicitada={false}
      onPedirAyuda={() => {}}
      {...props}
    />,
  );

describe('DificultadRespuesta (RF-37)', () => {
  it('muestra el texto acordado y el botón «Pedir ayuda»', () => {
    const html = render();

    expect(html).toContain(
      'Parece que estás teniendo dificultades con esta pregunta. Si lo necesitas, puedes pedir ayuda para continuar.',
    );
    expect(html).toContain('Pedir ayuda');
    expect(html).not.toContain('role="alert"');
  });

  it('al pedir ayuda orienta sin omitir la pregunta ni inventar rutas', () => {
    const html = render({ ayudaSolicitada: true });

    expect(html).toContain('equipo de psicología');
    expect(html).toContain('tu respuesta sigue abierta');
    expect(html).not.toContain('Pedir ayuda</button>');
    expect(html).not.toMatch(/omitir|href=/i);
  });

  it('usa solo tokens de diseño', () => {
    expect(render()).not.toMatch(/#[0-9a-f]{3,6}\b|rgb\(/i);
  });
});
