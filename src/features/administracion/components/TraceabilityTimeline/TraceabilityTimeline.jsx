import { TraceabilityRecord } from './TraceabilityRecord.jsx';

/*
 * Línea de tiempo vertical de solo lectura de una sesión (RF-38), en el
 * orden ascendente de `secuencia` que ya trae `records`
 * (services/sessionTraceResponse.js). No ofrece editar, eliminar,
 * reenviar ni descargar respuestas.
 */
export function TraceabilityTimeline({ records }) {
  return (
    <ol aria-label="Interacciones de la sesión" className="m-0 flex list-none flex-col p-0">
      {records.map((record, index) => (
        <TraceabilityRecord
          key={record.sequence}
          record={record}
          isLast={index === records.length - 1}
        />
      ))}
    </ol>
  );
}
