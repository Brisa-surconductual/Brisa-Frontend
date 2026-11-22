# RF-30B (provisional) — Taxonomía de variables y etiquetado

Estado: IMPLEMENTADA en `feat/chat-taxonomia-variables-rf30b` (pendiente de PR).
Contrato backend: `brisa-backend/docs/CONTRATO_RF30B_TAXONOMIA_VARIABLES.md`.

## Alcance en el frontend

1. **Editor de nodos** (`GroupTreeDetailPage › NodeEditorForm`): panel glass
   `TaxonomyVariablePicker` con el selector «Variable que captura este nodo»
   (opcional, una por nodo). Al elegir una variable:
   - se activa la respuesta y el selector «Tipo de respuesta» queda filtrado
     a `tipos_entrada_permitidos` (craving/frecuencia → Escala o Número;
     contexto emocional → Selección única o múltiple; situación de riesgo → Sí/No);
   - una variable de categorías precarga sus valores como opciones;
   - se muestran las etiquetas con que se clasificará la respuesta.
   Se guarda como `contenido.variable = { codigo }`. La tarjeta del nodo
   muestra «Variable: …».
2. **Pestaña «Variables»** (`/app/administrativo/chat/variables`, junto a
   «Árboles»): lista la taxonomía (versión global, estado, tipos y
   etiquetas), crea variables y las habilita/deshabilita con confirmación.
   Una variable en uso por un flujo publicado no ofrece «Deshabilitar».

## API (`features/chat/api/taxonomia/`)

| Función | Endpoint |
| --- | --- |
| `listarTaxonomiaVariables` | `GET /chat/taxonomia-variables[?incluir_deshabilitadas=true]` |
| `crearVariableTaxonomia` | `POST /chat/taxonomia-variables` |
| `cambiarEstadoVariableTaxonomia` | `PATCH /chat/taxonomia-variables/:codigo` |

Errores por `codigo`; el `message` del backend se muestra tal cual
(`VARIABLE_DUPLICADA`, `DEFINICION_VARIABLE_INVALIDA`,
`VARIABLE_EN_USO_PUBLICADO`, `VARIABLE_NO_VALIDA`, `VARIABLE_DESHABILITADA`,
`TIPO_ENTRADA_INCOMPATIBLE`, `OPCIONES_FUERA_DE_TAXONOMIA`).

## Fuera de alcance

El etiquetado ocurre en el backend al responder; el estudiante no ve cambios.
El consumo de las variables etiquetadas (M-5 / RF-53) no tiene interfaz aquí.
