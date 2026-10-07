# Contrato API · M03 Chat · Lado estudiante

**Versión:** v0.2 · BORRADOR para validar con backend
**Fecha:** 2026-10-07
**Cambios v0.2:** alcance de entradas limitado a los 6 tipos de RF-27 + texto libre (D4 resuelta por frontend); se agrega el ejercicio cronometrado como elemento de presentación (2.2.1); valores de `presentacion` definidos (2.3.1); nuevo anexo A con el mapeo del prototipo; D5 detallada.
**Propone:** Frontend (Sebastián)
**Valida:** Backend (Samuel) · Árbol conversacional / editor (Leandro)
**Alcance:** RF-24, RF-24B, RF-26, RF-26B, RF-27, RF-28, RF-29, RF-30, RF-32, RF-33, RF-34, RF-34B, RF-35 (y RF-43 como esbozo)

---

## 0. Cómo leer este documento

Este contrato define **qué envía y qué recibe el frontend** en cada operación del chat del estudiante. No define cómo lo implementa el backend por dentro.

Fuentes, en orden de prioridad cuando se contradicen:

1. **`prisma/schema.prisma` (schema `chat`) en `master` de Brisa-Backend.** Nombres de campos, enums y tipos de ID.
2. **Especificación de Requerimientos 0809, hoja M03.** Flujos, mensajes y códigos HTTP.
3. **Convenciones ya usadas en el backend:** sesión por cookie, `X-CSRF-Token`, `ValidationPipe` con `whitelist`.
4. **Prototipo `M03_prototipo_v1.1.html`.** Solo como referencia visual; no define datos.

Todo lo marcado **⚠ DECISIÓN** está en la sección 9 y necesita respuesta del backend antes de implementar ese endpoint.

---

## 1. Convenciones generales

### 1.1 Autenticación y seguridad

- Sesión por **cookie** (`withCredentials: true`), igual que el resto de la app. Se reutilizan `SessionAuthGuard`, `SessionScopeGuard` y `RolesGuard` con rol `ESTUDIANTE`.
- Toda petición que **modifica estado** (`POST`, `PATCH`) lleva el header `X-CSRF-Token` (`CsrfSessionGuard`). El `apiClient` del frontend ya lo agrega.
- **El frontend nunca envía `id_usuario`.** El backend lo toma de la sesión. Esto evita que un estudiante opere sobre la sesión de otro.
- **El perfil clínico (`tipo_dependencia`, `tipo_craving`) nunca se expone al estudiante** (RF-24B y RF-26B, requisito de seguridad). El frontend solo recibe `modalidad_activa`.

### 1.2 Formatos

| Elemento | Formato |
|---|---|
| Identificadores | `string` UUID. El schema usa UUID; donde la especificación dice `int` se sigue el schema (ver D10). |
| Fechas y horas | `string` ISO 8601 con zona horaria, ej. `2026-10-07T14:30:00-05:00` |
| Nombres de campo | `snake_case`, igual que el schema |
| Enums | En MAYÚSCULAS, igual que el schema: `GRUPAL`, `PERSONALIZADA`, `ACTIVA`… |

### 1.3 Formato de error (⚠ D1)

Todas las respuestas de error usan este cuerpo:

```json
{
  "statusCode": 409,
  "codigo": "PERFIL_CLINICO_INCOMPLETO",
  "message": "No es posible inicializar la sesión en modalidad personalizada porque el perfil clínico del usuario está incompleto.",
  "error": "Conflict"
}
```

- `statusCode`, `message` y `error` son el formato por defecto de NestJS; ya existen.
- **`codigo` es lo nuevo que se pide.** Varios casos comparten código HTTP pero el frontend debe tratarlos distinto. Por ejemplo, hay dos 404 en la inicialización y dos 409 al seleccionar árbol. Sin `codigo`, el frontend tendría que comparar el texto de `message`, que es frágil.
- En NestJS basta con `throw new ConflictException({ codigo: '...', message: '...' })`.
- `message` es el texto de la especificación y **el frontend lo muestra tal cual** al usuario.

---

## 2. Modelo de datos compartido

### 2.1 `Sesion`

```json
{
  "id_sesion": "uuid",
  "estado": "ACTIVA",
  "modalidad_activa": "GRUPAL",
  "version_arbol": 3,
  "reanudada": true,
  "fecha_inicio": "2026-10-07T14:00:00-05:00",
  "fecha_ultima_interaccion": "2026-10-07T14:22:10-05:00"
}
```

| Campo | Tipo | Origen en schema | Notas |
|---|---|---|---|
| `id_sesion` | uuid | `chat_sesiones.id_sesion` | |
| `estado` | `ACTIVA` \| `PAUSADA` \| `COMPLETADA` | `estado_sesiones.estado_actual` | |
| `modalidad_activa` | `GRUPAL` \| `PERSONALIZADA` | `chat_sesiones.modalidad_activa` | |
| `version_arbol` | int | `chat_sesiones.version_arbol_utilizada` | Necesario para la precarga (RF-34B) |
| `reanudada` | boolean | derivado | `true` si se recuperó una sesión previa (RF-32); el frontend muestra el estado "reanudando" |
| `fecha_inicio` | datetime | `chat_sesiones.fecha_inicio` | |
| `fecha_ultima_interaccion` | datetime | `chat_sesiones.fecha_ultima_interaccion` | |

### 2.2 `Nodo` (⚠ D2: estructura de `nodos.contenido`)

Es la pieza central del contrato. En el schema, `nodos.contenido` es un `Json` libre y **hoy nadie ha definido su estructura**. Esta es la propuesta. Sirve igual para el renderizado del estudiante (RF-26) y para el editor de árboles de Leandro (RF-25 y RF-25C).

```json
{
  "id_nodo": "uuid",
  "tipo_nodo": "PREGUNTA",
  "contenido": {
    "emisor": "AVATAR",
    "texto": "¿Qué tan probable es que cumplas esta meta esta semana?",
    "instrucciones": "Desliza para elegir un valor.",
    "multimedia": []
  },
  "entrada": {
    "tipo_entrada": "ESCALA",
    "obligatorio": true,
    "min": 0,
    "max": 10,
    "paso": 1,
    "etiqueta_min": "Nada probable",
    "etiqueta_max": "Muy probable"
  }
}
```

**`tipo_nodo`** (catálogo `chat.tipo_nodo`, hoy vacío; ⚠ D2):

| Valor | Significado | ¿Lleva `entrada`? |
|---|---|---|
| `MENSAJE` | Texto o instrucción del avatar | No (`entrada: null`) |
| `PREGUNTA` | Solicita respuesta estructurada | Sí |
| `RESUMEN` | Cierre de día o semana | No |

**`contenido`** (lo que se presenta, RF-26 y RF-33):

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `emisor` | `AVATAR` \| `SISTEMA` | Sí | Define el estilo de la burbuja (el prototipo distingue los dos) |
| `texto` | string | Sí | Mensaje principal. **El frontend no lo modifica** (RF-26) |
| `instrucciones` | string | No | Texto secundario bajo el mensaje |
| `titulo` | string | No | Solo para `RESUMEN` |
| `multimedia` | `Recurso[]` | No | Lista vacía si no hay (ver 2.4). Varias imágenes en orden se muestran como secuencia deslizable (así se representa el cómic del prototipo) |
| `ejercicio` | `Ejercicio` | No | Solo en nodos `MENSAJE`. Ver 2.2.1 |

#### 2.2.1 `Ejercicio` cronometrado (elemento de presentación)

Algunos días del programa son ejercicios guiados con duración: observación del impulso y exposición interoceptiva (S3 D4, S5 D4, S5 D5 y árboles personalizados). El ejercicio **no es un tipo de entrada**: no captura una respuesta, es un elemento visual del nodo, cubierto por RF-26 ("elementos visuales") y RF-33. Por eso no amplía RF-27.

```json
"ejercicio": {
  "permite_interrumpir": true,
  "fases": [
    {
      "titulo": "Respiración rápida",
      "duracion_segundos": 30,
      "mensajes": [
        "Respira rápido, como si acabaras de correr.",
        "Observa lo que sientes en tu cuerpo."
      ]
    },
    {
      "titulo": "Recuperación",
      "duracion_segundos": 10,
      "mensajes": ["Relaja tu cuerpo y vuelve a respirar de forma normal."]
    }
  ]
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `fases` | lista, mínimo 1 | Se ejecutan en orden. El frontend muestra cuenta regresiva, barra de progreso y rota los `mensajes` durante la fase |
| `fases[].duracion_segundos` | int > 0 | |
| `fases[].mensajes` | string[], mínimo 1 | |
| `permite_interrumpir` | boolean | Si es `true`, el frontend muestra "No puedo continuar" para cortar el ejercicio |

Comportamiento:

- El botón para avanzar se habilita al terminar el tiempo, o al interrumpir si está permitido. Avanzar es un `POST …/respuestas` normal con `respuesta: null`.
- **Los datos del ejercicio se capturan con las preguntas siguientes**, que ya existen en el árbol (ej. "¿Pudiste quedarte con la sensación?", "¿Cómo cambió el impulso?"). El temporizador no envía segundos ni estado de interrupción.
- El cronómetro corre en el dispositivo. Es distinto del SOS (RF-43), donde los 60 segundos se miden en el servidor.

### 2.3 `entrada`: los tipos de respuesta (RF-27)

Son los 6 tipos de la especificación más texto libre, que RF-27 permite solo cuando el nodo lo habilita explícitamente. El valor de `tipo_entrada` va al catálogo `chat.tipo_entrada` (⚠ D2).

| `tipo_entrada` | Campos de configuración | Valor que envía el frontend en `respuesta` |
|---|---|---|
| `SELECCION_UNICA` | `opciones: [{ valor, etiqueta }]` | `string`: el `valor` elegido |
| `SELECCION_MULTIPLE` | `opciones`, `min_selecciones`, `max_selecciones` | `string[]`: valores elegidos |
| `ESCALA` | `min`, `max`, `paso`, `etiqueta_min`, `etiqueta_max` | `number` |
| `NUMERICO` | `min?`, `max?`, `decimales` (0 = entero), `unidad?` | `number` |
| `FECHA_HORA` | `formato`: `FECHA` \| `HORA` \| `FECHA_HORA`, `min?`, `max?` | `string` ISO 8601 |
| `BOOLEANO` | `etiqueta_verdadero`, `etiqueta_falso` | `boolean` |
| `TEXTO_LIBRE` | `min_palabras?`, `max_palabras?`, `placeholder?` | `string` |

Campos comunes a toda `entrada`:

| Campo | Tipo | Notas |
|---|---|---|
| `tipo_entrada` | enum de la tabla | |
| `obligatorio` | boolean | Si es `false`, el frontend permite enviar `respuesta: null` |
| `mensaje_error` | string | Opcional. Texto de validación definido por psicología (`reglas_validaciones.mensaje_error`) |
| `presentacion` | string | Opcional. Variante visual sin cambiar el tipo de dato ni el valor enviado. Ver 2.3.1 |

#### 2.3.1 Valores de `presentacion`

| `presentacion` | Aplica a | Cómo se ve | Requisito en `opciones` |
|---|---|---|---|
| *(ausente)* | todos | Presentación por defecto: botones, deslizador, campo, etc. | — |
| `TARJETAS` | `SELECCION_UNICA`, `SELECCION_MULTIPLE` | Grilla de tarjetas con ícono (la grilla de valores del prototipo) | Cada opción puede traer `icono`: nombre de un ícono de **lucide** (ej. `"feather"`, `"heart"`). **No emojis** |
| `SILUETA` | `SELECCION_MULTIPLE` | Silueta corporal con zonas tocables, más etiquetas | `valor` de cada opción ∈ `CABEZA`, `GARGANTA`, `PECHO`, `ABDOMEN`, `MANOS` (las zonas que dibuja el frontend) |

- Si llega una `presentacion` que el frontend no conoce, usa la presentación por defecto del `tipo_entrada`. Nunca falla por esto.
- El backend valida igual que sin `presentacion`: para él, `TARJETAS` o `SILUETA` son una selección como cualquier otra.

**Alcance de tipos (D4, decisión v0.2):** el contrato se limita a los 6 tipos de RF-27 más `TEXTO_LIBRE`. El formulario del frontend se construye como un **registro de componentes por `tipo_entrada`**, de modo que si más adelante se aprueba un tipo nuevo (ej. una clasificación por arrastre) se agrega un componente sin tocar los existentes. El anexo A muestra cómo queda cada componente del prototipo.

**Validación (RF-28):** el backend es la fuente de verdad. Con la conexión activa, el frontend **además** valida localmente con estos mismos campos (`obligatorio`, `min`, `max`, `opciones`…) para dar retroalimentación inmediata. Sin conexión (RF-34), esa validación local es la única disponible. Por eso las reglas **tienen que venir dentro del nodo** (⚠ D3).

### 2.4 `Recurso` multimedia (RF-33)

```json
{
  "id_recurso": "uuid",
  "tipo": "IMAGEN",
  "url": "https://…",
  "texto_alternativo": "Ilustración de una ola que sube y baja",
  "metadata": {
    "formato": "image/webp",
    "tamano_bytes": 184320,
    "ancho": 800,
    "alto": 450,
    "duracion_segundos": null
  }
}
```

- `tipo`: `IMAGEN` \| `VIDEO` \| `GIF`.
- `texto_alternativo` es **obligatorio** por accesibilidad (WCAG AA, ya exigido en el design system).
- `metadata.tamano_bytes` lo usa la precarga para decidir si cabe en el dispositivo (RF-34B).
- La `url` debe poder **guardarse en caché y usarse sin conexión** (⚠ D7).

### 2.5 `Transicion` (solo en la precarga, para RF-34)

```json
{
  "id_nodo_origen": "uuid",
  "id_nodo_destino": "uuid",
  "operador_condicion": "IGUALDAD",
  "valor_condicion": "No",
  "orden_evaluacion": 1
}
```

Corresponde a `chat.reglas_nodos`. `operador_condicion` toma los valores `IGUALDAD`, `RANGO` o `CATEGORIA` (enum existente). Con conexión, el frontend **no evalúa transiciones**: el backend devuelve el siguiente nodo. Sin conexión, el frontend las evalúa con la misma lógica (⚠ D8).

---

## 3. RF-24 / 24B / 26B / 32 · Iniciar o reanudar sesión

```
POST /chat/sesiones
```

Una sola llamada al entrar al chat. El backend:

1. Resuelve la modalidad (RF-24B).
2. Si es personalizada, selecciona el árbol (RF-26B).
3. Si hay una sesión previa `ACTIVA` o `PAUSADA`, la recupera (RF-32); si no, crea una nueva en el nodo inicial (RF-24).

**Request:** sin cuerpo (`{}`). La identidad sale de la cookie.

**Response 201 (sesión nueva) / 200 (sesión reanudada):**

```json
{
  "sesion": { "...": "ver 2.1" },
  "nodo_actual": { "...": "ver 2.2" },
  "historial_reciente": [
    {
      "id_nodo": "uuid",
      "tipo_nodo": "PREGUNTA",
      "contenido": { "emisor": "AVATAR", "texto": "¿Esta meta es todo o nada?" },
      "respuesta": "Sí",
      "timestamp_interaccion": "2026-10-07T14:20:00-05:00"
    }
  ]
}
```

- `historial_reciente` sirve para **repintar el hilo** al reanudar, de modo que el estudiante vea lo que ya respondió y no solo la pregunta suelta. Se propone un máximo de 20 entradas en orden cronológico. Sale de `chat.historial_nodos`. Es una lista vacía en sesión nueva.
- El frontend usa `sesion.reanudada` para elegir el estado de pantalla: **cargando** mientras espera la respuesta, **reanudando** si `true`, **error** si la llamada falla.

**Errores:**

| HTTP | `codigo` | Mensaje (especificación) | Qué hace el frontend |
|---|---|---|---|
| 401 | `NO_AUTENTICADO` | Debe iniciar sesión para acceder al chat. | Redirige a login |
| 404 | `FLUJO_NO_DISPONIBLE` | No existe un flujo conversacional disponible para el usuario. | Estado de error, botón "Volver" |
| 404 | `MODALIDAD_NO_CONFIGURADA` | No se encontró una configuración de modalidad terapéutica para el programa. | Estado de error |
| 409 | `PERFIL_CLINICO_INCOMPLETO` | No es posible inicializar la sesión en modalidad personalizada porque el perfil clínico del usuario está incompleto. | Estado de error |
| 404 | `ARBOL_PERSONALIZADO_NO_CONFIGURADO` | No se encontró un árbol conversacional personalizado configurado para el perfil clínico del usuario. Contacte al equipo de psicología. | Estado de error |
| 409 | `ARBOL_PERSONALIZADO_NO_PUBLICADO` | El árbol conversacional personalizado para este perfil aún no se encuentra disponible para uso. | Estado de error |
| 422 | `SIN_UNIDAD_TEMPORAL_VIGENTE` | ⚠ D9: sin mensaje en la especificación | Estado de error |
| 500 | `ESTADO_CONVERSACIONAL_INCONSISTENTE` | Error al recuperar el estado de la conversación. Intente nuevamente. | Estado de error, botón "Reintentar" |
| 500 | `PERFIL_CLINICO_NO_DISPONIBLE` | No fue posible determinar el perfil clínico del usuario. Intente nuevamente más tarde. | Estado de error, botón "Reintentar" |
| 500 | `ARBOL_NO_DISPONIBLE` | No fue posible cargar el árbol conversacional personalizado en este momento. Intente nuevamente más tarde. | Estado de error, botón "Reintentar" |

> **Nota sobre el prototipo:** el prototipo muestra un modal "Continuar / Empezar de nuevo". La especificación **no contempla reiniciar** una sesión: RF-24 y RF-32 siempre recuperan el último nodo válido. Este contrato no incluye "empezar de nuevo" (⚠ D5).

---

## 4. RF-26 · Obtener el nodo actual

```
GET /chat/sesiones/:id_sesion/nodo-actual
```

Normalmente **no hace falta**, porque `POST /chat/sesiones` y `POST …/respuestas` ya devuelven el nodo que sigue. Existe para un caso concreto: después de un error, el componente de error genérico ofrece "Reintentar" y recarga el nodo sin reiniciar la sesión.

**Response 200:** `{ "nodo_actual": Nodo }`

**Errores:**

| HTTP | `codigo` | Mensaje |
|---|---|---|
| 404 | `SESION_NO_ENCONTRADA` | ⚠ sin mensaje en la especificación; propuesta: "No se encontró la sesión de chat." |
| 404 | `NODO_NO_ENCONTRADO` | No se pudo recuperar el contenido del chat. |
| 500 | `CONTENIDO_NODO_NO_DISPONIBLE` | El contenido del nodo no está disponible. |
| 409 | `SESION_ERROR_CONFIGURACION` | Mensaje del error de RF-26B que dejó la sesión en `ERROR_CONFIGURACION` |

---

## 5. RF-27 / 28 / 29 / 30 · Enviar respuesta y avanzar

```
POST /chat/sesiones/:id_sesion/respuestas
```

Una llamada hace todo el ciclo: captura (RF-27), validación (RF-28), transición (RF-29) y persistencia (RF-30). Devuelve el siguiente nodo para pintarlo de inmediato.

También se usa para **avanzar en nodos sin entrada** (`MENSAJE` y `RESUMEN`), con `respuesta: null`. Así cada paso queda registrado igual en `historial_nodos`.

**Request:**

```json
{
  "id_interaccion_cliente": "uuid-generado-en-el-navegador",
  "id_nodo": "uuid-del-nodo-que-se-responde",
  "respuesta": 7,
  "timestamp_interaccion": "2026-10-07T14:22:10-05:00",
  "estado_conectividad": "ONLINE"
}
```

| Campo | Tipo | Notas |
|---|---|---|
| `id_interaccion_cliente` | uuid | Lo genera el frontend (`crypto.randomUUID()`). Permite **detectar duplicados** si la misma respuesta llega dos veces: doble clic, reintento o sincronización offline (RF-35). ⚠ D6 |
| `id_nodo` | uuid | El nodo que el estudiante está respondiendo. Si no coincide con el nodo actual de la sesión en el servidor, se rechaza (protege contra pestañas desfasadas) |
| `respuesta` | según la tabla 2.3, o `null` | `null` en nodos sin entrada o en entradas no obligatorias |
| `timestamp_interaccion` | datetime | Hora local del dispositivo |
| `estado_conectividad` | `ONLINE` \| `OFFLINE` | Catálogo `chat.estado_conectividad`. Siempre `ONLINE` en este endpoint; `OFFLINE` solo llega por sincronización |

**Response 200:**

```json
{
  "id_interaccion": "uuid",
  "transicion": {
    "id_nodo_origen": "uuid",
    "id_nodo_destino": "uuid",
    "fin_de_flujo": false
  },
  "nodo_siguiente": { "...": "Nodo, o null si fin_de_flujo" },
  "sesion": { "estado": "ACTIVA" }
}
```

- Si `fin_de_flujo: true`, entonces `nodo_siguiente: null` y `sesion.estado` puede pasar a `COMPLETADA`. El frontend muestra el cierre y el botón para volver al cronograma.
- La captura de perfil clínico (RF-27B) ocurre **dentro del backend** cuando el nodo es de captura. Para el frontend es una `SELECCION_UNICA` más y no cambia nada.

**Errores de validación (RF-28):** se muestran **bajo el campo**, sin perder lo que el estudiante ya ingresó.

| HTTP | `codigo` | Mensaje |
|---|---|---|
| 400 | `RESPUESTA_OBLIGATORIA` | Este campo es obligatorio. |
| 400 | `TIPO_DATO_INVALIDO` | El formato de la respuesta no es válido. |
| 400 | `FORMATO_INVALIDO` | El formato de la respuesta es incorrecto. |
| 400 | `FUERA_DE_RANGO` | El valor ingresado está fuera del rango permitido. |
| 400 | `OPCION_NO_VALIDA` | La respuesta seleccionada no es válida para esta pregunta. |
| 400 | `TIPO_ENTRADA_NO_CORRESPONDE` | El tipo de respuesta no corresponde al formato requerido. |
| 403 | `NODO_SIN_ENTRADA` | Este nodo no requiere respuesta del usuario. (Solo si se envía un valor distinto de `null` a un nodo sin entrada) |

Si `entrada.mensaje_error` viene definido en el nodo, el backend lo usa en lugar del mensaje genérico.

**Errores del flujo:** se muestran con el **componente de error genérico** dentro del chat, con "Reintentar" y sin perder la sesión.

| HTTP | `codigo` | Mensaje |
|---|---|---|
| 409 | `NODO_NO_ES_ACTUAL` | ⚠ propuesta: "La conversación avanzó en otro dispositivo. Se cargará el punto actual." El frontend llama a `GET …/nodo-actual` |
| 409 | `INTERACCION_DUPLICADA` | La interacción ya fue registrada en el servidor. Se omite el duplicado. **El frontend lo trata como éxito** (ver D6) |
| 422 | `INTERACCION_INCOMPLETA` | La interacción no contiene información suficiente para ser registrada. |
| 404 | `NODO_DESTINO_INVALIDO` | El nodo destino no es válido. |
| 500 | `TRANSICION_NO_DETERMINADA` | No se pudo determinar la siguiente acción en la conversación. |
| 500 | `INTERACCION_NO_ALMACENADA` | No fue posible almacenar la interacción en el servidor. |
| 500 | `PERFIL_CLINICO_NO_ALMACENADO` | No fue posible registrar la variable clínica en este momento. Intente nuevamente más tarde. |

---

## 6. RF-34B · Precarga para uso offline

Se ejecuta **justo después** de un `POST /chat/sesiones` exitoso, en segundo plano. No bloquea la conversación.

### 6.1 Descargar el contenido

```
GET /chat/sesiones/:id_sesion/precarga?version_local=3
```

- `version_local` es opcional: la versión del árbol que el dispositivo ya tiene en IndexedDB.
- Si `version_local` es igual a la del servidor: **Response 200** `{ "actualizado": false, "version_arbol": 3 }`. No se descarga nada.

**Response 200 (con contenido):**

```json
{
  "actualizado": true,
  "version_arbol": 4,
  "id_unidad_temporal": "uuid",
  "nodos": [ "Nodo", "..." ],
  "transiciones": [ "Transicion", "..." ],
  "recursos": [ "Recurso", "..." ],
  "tamano_total_bytes": 5242880,
  "generado_en": "2026-10-07T14:00:01-05:00"
}
```

- `nodos` son los nodos de la **unidad temporal vigente** del estudiante (`nodos.id_contenido_cronograma`, unidos al cronograma).
- `recursos` es la lista sin duplicados de todo el multimedia de esos nodos. El frontend los descarga por separado a la caché, y puede omitir algunos si falta espacio (precarga `PARCIAL`).

**Errores:**

| HTTP | `codigo` | Mensaje |
|---|---|---|
| 422 | `SESION_NO_INICIALIZADA` | No es posible ejecutar la precarga porque la sesión conversacional no ha sido inicializada. |
| 422 | `UNIDAD_TEMPORAL_NO_DETERMINADA` | No fue posible determinar la unidad temporal vigente para realizar la precarga. |
| 503 | `ARBOL_NO_DISPONIBLE_PRECARGA` | No fue posible obtener el árbol conversacional para precarga local. |

Los mensajes de éxito parcial ("Se detectó una versión actualizada…", "La precarga se realizó parcialmente…") y los errores de almacenamiento local ("No fue posible almacenar localmente…") **los genera el frontend**: ocurren en el dispositivo, no en el servidor.

### 6.2 Reportar el resultado

```
POST /chat/sesiones/:id_sesion/precarga/estado
```

La tabla `chat.sincronizaciones` guarda datos que **solo conoce el dispositivo** (espacio disponible, resultado de la descarga). El frontend los reporta al terminar.

```json
{
  "estado_precarga": "PARCIAL",
  "version_arbol_local": 4,
  "id_unidad_temporal": "uuid",
  "espacio_disponible_dispositivo": 52428800,
  "limite_almacenamiento_local": 104857600,
  "recursos_omitidos": ["uuid-recurso"]
}
```

- `estado_precarga`: `COMPLETA` \| `PARCIAL` \| `FALLIDA` (enum existente).
- **Response 204.** Si esta llamada falla no se reintenta: es informativa y no afecta al estudiante.

---

## 7. RF-34 / RF-35 · Operación offline y sincronización

### 7.1 Qué pasa sin conexión (todo en el frontend)

Sin conexión no hay llamadas al servidor. El frontend:

1. Lee nodos y transiciones de IndexedDB (precarga).
2. Valida la respuesta con las reglas de `entrada` (2.3).
3. Evalúa las `transiciones` para obtener el siguiente nodo (⚠ D8).
4. Guarda cada interacción en una **cola local** con `estado_sincronizacion: "PENDIENTE_SINCRONIZACION"`, en orden cronológico.

Si el nodo siguiente no está en caché, muestra el mensaje de RF-34: "No es posible continuar la sesión sin conexión porque falta contenido necesario."

### 7.2 Sincronizar al reconectar

```
POST /chat/sincronizaciones
```

Se dispara automáticamente al volver la conexión (evento `online` del navegador) y se reintenta con espera creciente si falla.

**Request:**

```json
{
  "version_arbol_local": 4,
  "interacciones": [
    {
      "id_interaccion_cliente": "uuid",
      "id_sesion": "uuid",
      "id_nodo": "uuid",
      "respuesta": "Sí",
      "id_nodo_destino_local": "uuid",
      "timestamp_interaccion": "2026-10-07T15:01:00-05:00",
      "estado_conectividad": "OFFLINE"
    }
  ]
}
```

- `interacciones` va **ordenada por `timestamp_interaccion`** (RF-35 exige preservar el orden).
- `id_nodo_destino_local` es la transición que calculó el frontend, para que el backend la verifique.
- Tamaño de lote propuesto: máximo 50 interacciones por llamada; si hay más, se envían en varios lotes en orden.

**Response 200:**

```json
{
  "resultados": [
    { "id_interaccion_cliente": "uuid", "estado": "SINCRONIZADO", "id_interaccion": "uuid" },
    { "id_interaccion_cliente": "uuid", "estado": "DUPLICADO" },
    { "id_interaccion_cliente": "uuid", "estado": "ERROR", "codigo": "FUERA_DE_RANGO", "message": "…" },
    { "id_interaccion_cliente": "uuid", "estado": "PENDIENTE" }
  ],
  "id_nodo_actual_servidor": "uuid"
}
```

- El backend procesa **en orden** y **se detiene en el primer `ERROR`**. Las interacciones siguientes vuelven como `PENDIENTE` para no romper el orden.
- `DUPLICADO` corresponde al 409 de la especificación ("La interacción ya fue registrada…"). Va dentro del lote para no abortar toda la sincronización, y el frontend lo trata como sincronizado.
- `id_nodo_actual_servidor` permite al frontend alinear su estado local con el del servidor.

**Errores del lote completo:**

| HTTP | `codigo` | Mensaje |
|---|---|---|
| 503 | `SINCRONIZACION_INTERRUMPIDA` | La sincronización fue interrumpida. Los datos pendientes se sincronizarán cuando se restablezca la conexión. |
| 500 | `SINCRONIZACION_FALLIDA` | No fue posible completar la sincronización. Se reintentará automáticamente. |

---

## 8. RF-43 · SOS craving (esbozo, no implementar todavía)

RF-43 depende de **RF-63, que no está en la especificación**, y del esquema del diario (M02). Este bloque solo deja la forma acordada para no improvisar después.

```
POST /chat/sos                       → inicia la intervención
POST /chat/sos/:id_evento/cierre     → cierra y devuelve recursos de apoyo
POST /chat/sesiones/:id_sesion/reanudar → retoma la sesión pausada
```

Ideas a confirmar:

- **Inicio:** el backend pausa la sesión activa (`motivo_pausa: SOS_CRAVING`, ya existe en el enum), inicia el cronómetro del **servidor** (RF-43 exige medir los 60 segundos en el servidor) y devuelve los nodos fijos del sub-árbol TCC, junto con `patron_crisis: boolean` (más de 3 activaciones en una hora).
- **Cierre:** devuelve `duracion_intervencion` medida en el servidor, los recursos de apoyo (106, 155, 123, contactos USCO) y `id_sesion_pausada` para ofrecer retomarla.
- El envío del evento a M05 lo hace el backend; el frontend no participa.

---

## 9. Decisiones pendientes con backend

| # | Tema | Propuesta del frontend | Responde |
|---|---|---|---|
| **D1** | Campo `codigo` en errores | Agregar `codigo` al cuerpo de error en todo el módulo chat (sección 1.3) | Samuel |
| **D2** | Estructura de `nodos.contenido` y catálogos `tipo_nodo` / `tipo_entrada` (hoy vacíos, sin seed) | Adoptar las secciones 2.2 y 2.3. **Afecta también al editor de Leandro**: lo que guarda el editor es lo que renderiza el estudiante | Samuel + Leandro |
| **D3** | Reglas de validación | En el schema cuelgan de `reglas_nodos` (la transición), no del nodo. Para validar sin conexión el frontend las necesita **dentro del nodo**. Propuesta: el backend las une al serializar el nodo, sin cambiar el schema | Samuel + Leandro |
| **D4** | Tipos del prototipo fuera de los 6 de la especificación | **Resuelta en v0.2:** se mantienen los 6 tipos de RF-27 + texto libre; los componentes extra se reescriben según el anexo A, y el ejercicio cronometrado pasa a ser un elemento de presentación (2.2.1). **Queda una pregunta para psicología:** en S1 D1, S2 D3 y S3 D3, ¿clasificar las 8 frases como 8 preguntas seguidas de selección única afecta los indicadores (% de evitación, PE, IAFC), por formato o por fatiga? Si la respuesta es sí, se propone un tipo `CLASIFICACION` y se amplía RF-27 | Psicología |
| **D5** | "Empezar de nuevo" del prototipo | **No se implementa** (ver anexo B). El modal del prototipo se reemplaza por el estado "reanudando" | Equipo (confirmar) |
| **D6** | Idempotencia | Guardar `id_interaccion_cliente` (columna nueva en `chat.interacciones`, con `UNIQUE`). Sin esto, RF-35 no puede garantizar que no se dupliquen registros | Samuel |
| **D7** | URLs del multimedia | Si son URLs firmadas de S3 con expiración corta, se rompen sin conexión. Se necesitan URLs estables o un endpoint de descarga propio | Samuel |
| **D8** | Lógica de transición offline | El frontend replica la evaluación de `IGUALDAD`, `RANGO` y `CATEGORIA`. Hay que definir con precisión el formato de `valor_condicion` para cada operador (ej. `RANGO` → `{ "min": 0, "max": 5 }`), y qué pasa si el árbol cambia de versión mientras el estudiante está sin conexión | Samuel + Leandro |
| **D9** | Estudiante sin unidad temporal vigente | La especificación pide una "estructura temporal válida" pero no define el error. Propuesta: 422 `SIN_UNIDAD_TEMPORAL_VIGENTE` con mensaje a definir | Samuel |
| **D10** | Tipo de ID | La especificación dice `int` en varias tablas y el schema usa UUID. Se sigue el schema | Confirmar |
| **D11** | RF-43 | Bloqueado hasta definir RF-63 | Equipo |

---

## 10. Resumen de endpoints

| Método | Ruta | RF | Prioridad |
|---|---|---|---|
| `POST` | `/chat/sesiones` | 24, 24B, 26B, 32 | Etapa 1 |
| `GET` | `/chat/sesiones/:id_sesion/nodo-actual` | 26 | Etapa 2 |
| `POST` | `/chat/sesiones/:id_sesion/respuestas` | 27, 28, 29, 30 | Etapa 2 |
| `GET` | `/chat/sesiones/:id_sesion/precarga` | 34B | Etapa 3 |
| `POST` | `/chat/sesiones/:id_sesion/precarga/estado` | 34B | Etapa 3 |
| `POST` | `/chat/sincronizaciones` | 35 | Etapa 3 |
| `POST` | `/chat/sos` (+ cierre, reanudar) | 43 | Final, bloqueado |

Todas requieren sesión de estudiante. Las de escritura requieren además `X-CSRF-Token`.

---

## Anexo A · Cómo queda cada componente del prototipo

El prototipo tiene 28 días con contenido (semanas 1, 2, 3 y 5). **18 días se trasladan sin pérdida** (algunos solo cambian de presentación). Los 10 restantes usan `drag`, `swipe`, `textbuilder`, `timer` o `barchart`. Así queda cada componente:

| Componente del prototipo | Dónde | En este contrato | Qué se pierde |
|---|---|---|---|
| `msg` | Todos | `MENSAJE`, `entrada: null` | Nada |
| `choice` | Todos | `SELECCION_UNICA` | Nada |
| `choice_multi` | Varios | `SELECCION_MULTIPLE` | Nada |
| `slider` | Varios | `ESCALA` | Nada |
| `freetext` | Varios | `TEXTO_LIBRE` con `min_palabras` | Nada |
| `summary` | Cierre de semana | `RESUMEN` | Nada |
| `valuegrid` | S1 D2 | `SELECCION_MULTIPLE` + `presentacion: TARJETAS`, `min_selecciones: 3`, `max_selecciones: 5` | Nada (emojis → íconos lucide) |
| `bodymap` | S3 D1, S5 D2, personalizado | `SELECCION_MULTIPLE` + `presentacion: SILUETA` | Nada |
| `comic` | S2 D6 | `MENSAJE` con `multimedia` de varias imágenes en secuencia | Requiere que psicología o diseño produzcan las ilustraciones; hoy son emojis |
| `timer` | S3 D4, S5 D4, S5 D5, personalizado | `MENSAJE` con `ejercicio` (2.2.1), seguido de las preguntas que ya existen | Nada: los datos los capturan las preguntas siguientes |
| `textbuilder` | S1 D3, S1 D7 | Una `SELECCION_UNICA` por hueco; la frase final la arma el mensaje siguiente | Casi nada |
| `drag` | S1 D1, S2 D3, S3 D3 | Una `SELECCION_UNICA` por frase (8 seguidas), opciones = las columnas | El dato es idéntico; la experiencia es más larga. **Pregunta abierta a psicología (D4)** |
| `swipe` | S1 D2 | Una `SELECCION_MULTIPLE` "¿Cuáles de estos valores te aleja el vapeo?" sobre la lista completa de valores | Se pierde el vínculo con los valores elegidos en el nodo anterior |
| `barchart` | S2 D2 | Se elimina del chat; se propone llevarlo a M05 (Seguimiento), que es donde viven las gráficas | El momento de "ver tus propias respuestas" dentro del día |
| Transición `skip_if_no` | S1 D5 | `Transicion` con `operador_condicion: IGUALDAD` hacia el nodo que corresponda | Nada |

---

## Anexo B · Por qué no hay "Empezar de nuevo" (D5)

**Lo que muestra el prototipo:** al entrar con una sesión previa aparece un modal con **Continuar** y **Empezar de nuevo**. Este último vuelve al primer nodo del día.

**Lo que dice la especificación:**

- RF-24: si existe sesión previa, el sistema *recupera el último nodo válido*. No hay elección del usuario.
- RF-32: *"Solo se puede recuperar el último estado válido del flujo."*
- El único reinicio previsto es automático: el 409 de RF-32 ("El estado de la conversación es inconsistente. Se reiniciará la sesión."). Lo decide el sistema ante un error.

**Por qué no conviene permitirlo ahora:**

- El estudiante respondería dos veces las mismas preguntas del mismo día. Habría que definir qué respuestas valen para los indicadores y para M05.
- RF-31 guarda el historial completo de nodos recorridos; repetir ensucia la trazabilidad.

**Qué hace el frontend:** el modal se reemplaza por el estado "reanudando" (un aviso breve, "Continuando donde lo dejaste") cuando `sesion.reanudada` es `true`.

**Si en el futuro se quisiera permitir:** el schema ya tiene preparado `historial_nodos.estado_registro = SESION_INTERRUMPIDA` para marcar las respuestas anteriores sin borrarlas. Haría falta un endpoint `POST /chat/sesiones/:id_sesion/reiniciar`, actualizar RF-24 y RF-32, y que M05 ignore los registros interrumpidos. Nada de este contrato tendría que cambiar.
