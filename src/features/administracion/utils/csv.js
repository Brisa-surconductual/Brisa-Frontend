/*
 * Serialización CSV conforme a RFC 4180 (sin dependencias):
 * - campos separados por coma y registros terminados en CRLF;
 * - un campo con coma, comilla doble, CR o LF va entre comillas, y cada
 *   comilla interna se duplica;
 * - todas las filas deben tener el mismo número de campos.
 *
 * Números: se escriben con su representación exacta de JavaScript
 * (punto decimal, sin redondear ni convertir a porcentaje), para que
 * Excel, SPSS, R o Python los lean como números.
 *
 * Protección contra fórmulas: un texto que empieza por =, +, -, @,
 * tabulador o CR podría ejecutarse como fórmula en una hoja de cálculo;
 * se antepone un apóstrofo y el campo se entrecomilla. Solo se aplica a
 * textos, nunca a números.
 */
export const CSV_LINE_BREAK = '\r\n';

const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;

export function csvCell(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Número no válido en CSV.');
    return String(value);
  }

  if (typeof value !== 'string') throw new Error('Tipo no válido en CSV.');

  const guarded = FORMULA_START.test(value) ? `'${value}` : value;
  const mustQuote = guarded !== value || NEEDS_QUOTES.test(guarded);

  return mustQuote ? `"${guarded.replaceAll('"', '""')}"` : guarded;
}

// `rows`: arreglo de filas (arreglos de celdas), la primera es el encabezado.
export function toCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('CSV sin filas.');
  }

  const width = rows[0].length;

  if (rows.some((row) => !Array.isArray(row) || row.length !== width)) {
    throw new Error('Las filas del CSV no tienen el mismo número de campos.');
  }

  return (
    rows.map((row) => row.map(csvCell).join(',')).join(CSV_LINE_BREAK) +
    CSV_LINE_BREAK
  );
}
