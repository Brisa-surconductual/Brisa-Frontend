// RF-25 / RF-24: contenidos que se pueden ligar a un nodo y dónde está
// programado cada uno (cronograma, unidad temporal y fechas). Un mismo flujo
// sirve a varios cronogramas: cada estudiante recorre el contenido según su
// programación en su propio cronograma.

const ESTADO_CRONOGRAMA_ETIQUETA = Object.freeze({
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
});

// Las fechas de la unidad son de tipo `date` (AAAA-MM-DD): se formatean en
// UTC para que la zona horaria no las corra un día.
const FORMATO_DIA = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
// La disponibilidad es un instante: se muestra en la hora local.
const FORMATO_INSTANTE = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function fecha(valor, formato) {
  if (!valor) return null;
  const instante = new Date(
    formato === FORMATO_DIA && /^\d{4}-\d{2}-\d{2}$/.test(valor)
      ? `${valor}T00:00:00Z`
      : valor,
  );
  return Number.isNaN(instante.getTime()) ? null : formato.format(instante);
}

function rango(inicio, fin, formato) {
  const desde = fecha(inicio, formato);
  const hasta = fecha(fin, formato);
  if (desde && hasta) return `${desde} – ${hasta}`;
  return desde ?? hasta ?? '';
}

function mapProgramacion(p) {
  return Object.freeze({
    id: p.id_contenido_cronograma,
    idCronograma: p.cronograma?.id_cronograma ?? null,
    nombreCronograma: p.cronograma?.nombre_cronograma ?? 'Cronograma',
    estadoCronograma: p.cronograma?.estado ?? null,
    ordenUnidad: p.unidad?.orden_unidad ?? null,
    nombreUnidad: p.unidad?.nombre_unidad ?? '',
    fechaInicioUnidad: p.unidad?.fecha_inicio ?? null,
    fechaFinUnidad: p.unidad?.fecha_fin ?? null,
    fechaInicioDisponibilidad: p.fecha_inicio_disponibilidad ?? null,
    fechaFinDisponibilidad: p.fecha_fin_disponibilidad ?? null,
  });
}

// Catálogo `contenidos` del backend → modelo de la interfaz.
export function mapContenidos(catalogo) {
  return (Array.isArray(catalogo) ? catalogo : []).map((item) =>
    Object.freeze({
      id: item.id_contenido,
      nombre: item.nombre_contenido,
      tipo: item.tipo_contenido ?? null,
      programaciones: Object.freeze(
        (Array.isArray(item.programaciones) ? item.programaciones : []).map(
          mapProgramacion,
        ),
      ),
    }),
  );
}

export function buscarContenido(idContenido, contenidos) {
  if (!idContenido) return null;
  return (contenidos ?? []).find((c) => c.id === idContenido) ?? null;
}

export function programacionesDe(idContenido, contenidos) {
  return buscarContenido(idContenido, contenidos)?.programaciones ?? [];
}

// Opciones del selector "Contenido asociado".
export function opcionesContenido(contenidos) {
  return (contenidos ?? []).map((c) => {
    const total = new Set(c.programaciones.map((p) => p.idCronograma)).size;
    const sufijo =
      total === 0
        ? 'sin programar'
        : total === 1
          ? 'en 1 cronograma'
          : `en ${total} cronogramas`;
    return { value: c.id, label: `${c.nombre} · ${sufijo}` };
  });
}

// Una programación en palabras: cronograma, unidad y fechas.
export function describirProgramacion(p) {
  const estado = ESTADO_CRONOGRAMA_ETIQUETA[p.estadoCronograma];
  const disponibilidad = rango(
    p.fechaInicioDisponibilidad,
    p.fechaFinDisponibilidad,
    FORMATO_INSTANTE,
  );
  return Object.freeze({
    cronograma: estado
      ? `${p.nombreCronograma} (${estado})`
      : p.nombreCronograma,
    unidad:
      p.ordenUnidad !== null
        ? `Unidad ${p.ordenUnidad} · ${p.nombreUnidad}`
        : p.nombreUnidad,
    fechas: rango(p.fechaInicioUnidad, p.fechaFinUnidad, FORMATO_DIA),
    disponibilidad: disponibilidad ? `Disponible: ${disponibilidad}` : '',
  });
}
