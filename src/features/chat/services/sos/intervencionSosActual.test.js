import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  descartarIntervencionSos,
  intervencionSosActual,
  solicitarIntervencionSos,
} from './intervencionSosActual.js';

function falso(enCurso = true) {
  return {
    activar: vi.fn().mockResolvedValue(undefined),
    descartar: vi.fn(),
    enCurso: vi.fn(() => enCurso),
  };
}

afterEach(() => descartarIntervencionSos());

describe('intervención SOS de la pestaña (RF-43)', () => {
  it('un toque crea la intervención y activa una sola vez', () => {
    const controlador = falso();
    const crear = vi.fn(() => controlador);

    expect(
      solicitarIntervencionSos(
        { contexto: { modulo: 'OTRO' }, toque: 5 },
        crear,
      ),
    ).toBe(controlador);
    expect(crear).toHaveBeenCalledWith({
      contexto: { modulo: 'OTRO' },
      toque: 5,
    });
    expect(controlador.activar).toHaveBeenCalledTimes(1);
    expect(intervencionSosActual()).toBe(controlador);
  });

  it('con una intervención en curso, otro toque no activa otra', () => {
    const crear = vi.fn(() => falso(true));

    const primera = solicitarIntervencionSos({}, crear);
    const segunda = solicitarIntervencionSos({}, crear);

    expect(segunda).toBe(primera);
    expect(crear).toHaveBeenCalledTimes(1);
  });

  it('terminada la anterior, un toque nuevo empieza otra y descarta la vieja', () => {
    const vieja = falso(false);
    const nueva = falso(true);
    const crear = vi.fn().mockReturnValueOnce(vieja).mockReturnValueOnce(nueva);

    solicitarIntervencionSos({}, crear);

    expect(solicitarIntervencionSos({}, crear)).toBe(nueva);
    expect(vieja.descartar).toHaveBeenCalled();
  });

  it('descartar (cierre de sesión) la quita de memoria', () => {
    const controlador = falso();
    solicitarIntervencionSos({}, () => controlador);

    descartarIntervencionSos();

    expect(controlador.descartar).toHaveBeenCalled();
    expect(intervencionSosActual()).toBeNull();
  });

  it('no descarta una intervención distinta de la indicada', () => {
    const controlador = falso();
    solicitarIntervencionSos({}, () => controlador);

    descartarIntervencionSos(falso());

    expect(intervencionSosActual()).toBe(controlador);
  });
});
