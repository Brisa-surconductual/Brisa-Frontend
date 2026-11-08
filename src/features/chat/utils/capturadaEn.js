const dosDigitos = (n) => String(n).padStart(2, '0');

// D6: hora del dispositivo en ISO 8601 con su desfase, sin milisegundos
// (`2026-11-08T14:30:00-05:00`). `desfase` sigue a getTimezoneOffset():
// minutos que hay que sumar a la hora local para llegar a UTC (Bogotá: 300).
export function capturadaEn(
  fecha = new Date(),
  desfase = fecha.getTimezoneOffset(),
) {
  const local = new Date(fecha.getTime() - desfase * 60_000)
    .toISOString()
    .slice(0, 19);
  const signo = desfase > 0 ? '-' : '+';
  const minutos = Math.abs(desfase);

  return `${local}${signo}${dosDigitos(Math.floor(minutos / 60))}:${dosDigitos(minutos % 60)}`;
}
