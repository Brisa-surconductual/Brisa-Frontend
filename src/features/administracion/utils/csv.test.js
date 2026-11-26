import { describe, expect, it } from 'vitest';

import { CSV_LINE_BREAK, csvCell, toCsv } from './csv.js';
import { parseCsv } from './csvTestParser.js';

describe('CSV conforme a RFC 4180', () => {
  it('separa por coma y termina cada registro en CRLF', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['1', '2'],
      ]),
    ).toBe('a,b\r\n1,2\r\n');
    expect(CSV_LINE_BREAK).toBe('\r\n');
  });

  it('entrecomilla campos con comas, comillas o saltos de línea y duplica las comillas', () => {
    expect(csvCell('Cohorte, piloto')).toBe('"Cohorte, piloto"');
    expect(csvCell('Cohorte "B"')).toBe('"Cohorte ""B"""');
    expect(csvCell('línea 1\nlínea 2')).toBe('"línea 1\nlínea 2"');
    expect(csvCell('a\r\nb')).toBe('"a\r\nb"');
  });

  it('conserva tildes y caracteres UTF-8 sin alterarlos', () => {
    expect(csvCell('Cohorte Ñandú Ápice')).toBe('Cohorte Ñandú Ápice');
  });

  it('números con su valor exacto: sin redondeo ni porcentaje', () => {
    expect(csvCell(0.7342)).toBe('0.7342');
    expect(csvCell(0.123456789)).toBe('0.123456789');
    expect(csvCell(0)).toBe('0');
    expect(csvCell(1260)).toBe('1260');
    expect(() => csvCell(Number.NaN)).toThrow();
  });

  it('neutraliza textos que una hoja de cálculo ejecutaría como fórmula', () => {
    for (const value of ['=1+1', '+SUM(A1)', '-2+3', '@cmd', '\tx']) {
      const cell = csvCell(value);
      expect(cell.startsWith(`"'`)).toBe(true);
      expect(parseCsv(`${cell}\r\n`)[0][0]).toBe(`'${value}`);
    }
  });

  it('rechaza filas con distinto número de campos y tipos no admitidos', () => {
    expect(() => toCsv([['a', 'b'], ['1']])).toThrow();
    expect(() => toCsv([])).toThrow();
    expect(() => csvCell(null)).toThrow();
    expect(() => csvCell({ nombre: 'x' })).toThrow();
  });

  it('se interpreta de vuelta con los mismos valores', () => {
    const rows = [
      ['nombre', 'valor'],
      ['Cohorte "Piloto", B\nsegunda línea', '0.5'],
    ];

    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});
