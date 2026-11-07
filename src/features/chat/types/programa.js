// RF-25B: el backend pide `id_programa` (entero) para consultar y cambiar la
// modalidad, pero hoy no existe un catálogo de programas en el frontend ni un
// endpoint que lo entregue (aclaración A-013). Hasta confirmarlo se usa un
// único programa, configurable con VITE_ID_PROGRAMA.
export const ID_PROGRAMA_ACTUAL = Number(import.meta.env.VITE_ID_PROGRAMA) || 1;
