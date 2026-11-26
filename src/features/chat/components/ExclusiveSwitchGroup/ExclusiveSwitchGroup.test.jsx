import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ExclusiveSwitchGroup } from './ExclusiveSwitchGroup.jsx';

const opciones = [
  { value: 'ABSTINENCIA_FISICA', label: 'Abstinencia física' },
  { value: 'TOLERANCIA', label: 'Tolerancia' },
];

describe('ExclusiveSwitchGroup (RF-25)', () => {
  it('marca solo el valor activo y lo dice en texto', () => {
    const html = renderToStaticMarkup(
      <ExclusiveSwitchGroup
        id="g"
        legend="Valor"
        options={opciones}
        value="TOLERANCIA"
        onChange={vi.fn()}
      />,
    );

    expect(html.match(/role="switch"/g)).toHaveLength(2);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html).toContain('Activado');
    expect(html).toContain('Desactivado');
  });

  it('muestra el error en texto', () => {
    const html = renderToStaticMarkup(
      <ExclusiveSwitchGroup
        id="g"
        legend="Valor"
        options={opciones}
        value=""
        error="Activa el valor."
        onChange={vi.fn()}
      />,
    );

    expect(html).toContain('Activa el valor.');
    expect(html).not.toContain('aria-checked="true"');
  });
});
