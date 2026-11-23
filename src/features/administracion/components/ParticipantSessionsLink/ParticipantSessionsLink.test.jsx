import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { ParticipantSessionsLink } from './ParticipantSessionsLink.jsx';

const render = (props) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <ParticipantSessionsLink {...props} />
    </MemoryRouter>,
  );

describe('ParticipantSessionsLink (RF-38 desde la ficha M08)', () => {
  it('con un código A7 auténtico enlaza al listado', () => {
    expect(render({ participantCode: 'P-1A2B3C4D', authentic: true })).toContain(
      'href="/app/administrativo/chat/participantes/P-1A2B3C4D/sesiones"',
    );
  });

  it.each([
    ['sin fuente auténtica (demostración o integración pendiente)', { participantCode: 'P-1A2B3C4D', authentic: false }],
    ['con el código ficticio de la demostración', { participantCode: 'PART-0015', authentic: true }],
    ['con la referencia opaca', { participantCode: 'seg-0001', authentic: true }],
    ['sin código', { participantCode: null, authentic: true }],
  ])('no se muestra %s', (_, props) => {
    expect(render(props)).toBe('');
  });
});
