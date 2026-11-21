# RF-33 · Prueba manual de contenido multimedia

- **Estado:** Pendiente: sin datos de prueba en dev (A-065).
- **Tarea:** FE-M03-05 (Taiga HU #262, subtarea #263). Ficha: [RF-33.md](RF-33.md).
- **Fuente de los textos:** RF-33 v1.1, flujo alterno (VERBATIM).
- **Entorno:** `npm run dev`, ventana de 360 px de ancho, sesión de estudiante con un nodo de
  la tabla de datos como nodo actual. DevTools abierto en la pestaña Network con «Disable cache»
  marcado, salvo que el paso diga otra cosa.

## Datos requeridos

Los tiene que sembrar el backend en dev (A-065). «Objeto existe» indica si el archivo está en
el bucket S3 de dev con la clave que usa el bloque.

| # | Nodo / bloque | Tipo | `mimeType` | Objeto existe | Paso que cubre |
|---|---|---|---|---|---|
| M1 | Nodo con una imagen válida | `IMAGEN` | `image/webp` | Sí | 1, 10, 12 |
| M2 | Nodo con un GIF válido | `GIF` | `image/gif` | Sí | 2 |
| M3 | Nodo con un video corto válido (menos de 30 s) | `VIDEO` | `video/mp4` | Sí | 3 |
| M4 | Nodo con una imagen inexistente | `IMAGEN` | `image/webp` | No | 4, 10 |
| M5 | Nodo con un video inexistente | `VIDEO` | `video/mp4` | No | 5 |
| M6 | Nodo con una imagen en formato no permitido | `IMAGEN` | `image/tiff` | Sí | 6 |
| M7 | Nodo con una imagen sin `mimeType` | `IMAGEN` | `null` | Sí | 7 |
| M8 | Nodo con un audio inexistente | `AUDIO` | `audio/mpeg` | No | 8 |
| M9 | Nodo con un documento inexistente | `DOCUMENTO` | `application/pdf` | No | 8 |
| M10 | Nodo con dos bloques: imagen válida (orden 1) e imagen inexistente (orden 2) | `IMAGEN` + `IMAGEN` | `image/webp` | Sí + No | 11 |
| M11 | Sesión con historial que incluye un nodo con un medio roto | `IMAGEN` | `image/webp` | No | 9 (depende del contrato 2b) |
| M12 | Opcional: vigencia de firma corta en dev (`AWS_S3_READ_EXPIRATION_SECONDS=60`, el mínimo que acepta el backend) con M1 | `IMAGEN` | `image/webp` | Sí | 4 (variante de URL vencida) |

## Pasos

«Persona» indica que el paso no se puede delegar en una herramienta automática.

| # | Precondición | Acción | Resultado esperado | Persona |
|---|---|---|---|---|
| 1 | Nodo M1. Red sin limitación | Abrir el nodo. Repetir con DevTools > Rendering > «Emulate CSS media feature prefers-reduced-motion: reduce» | Se ve un marcador que ocupa el espacio de la imagen y luego la imagen, con su `textoAlternativo` como `alt`. Con movimiento reducido el marcador no pulsa. En Network, la petición de la imagen tarda menos de 2 s (CA de RF-33) | — |
| 2 | Nodo M2 | Abrir el nodo | El GIF se ve animado, con el nombre accesible «Imagen animada» si no trae `textoAlternativo` | — |
| 3 | Nodo M3. iPhone real con Safari, además del navegador de escritorio | Abrir el nodo. No tocar el video durante 5 s; luego tocar reproducir | El video es visible desde el inicio con sus controles y no se reproduce solo. En Network solo se piden los metadatos hasta tocar reproducir. En iOS el video se puede tocar y reproducir | iPhone real |
| 4 | Nodo M4 | Abrir el nodo y filtrar Network por `nodo-actual` | Una sola petición extra a `nodo-actual` (la recarga única) y luego el aviso «No fue posible cargar el contenido multimedia.» con ícono y el `textoAlternativo`. No hay una segunda recarga. Variante M12 (URL vencida): con la barra de dispositivos de DevTools en 360 × 300 para que la imagen de M1 quede fuera de pantalla y no se pida (`loading="lazy"`), abrir el nodo, esperar más de 60 s y desplazarse hasta la imagen. La primera petición falla (firma vencida), sale una sola recarga de `nodo-actual` con una URL nueva y la imagen se ve, sin interrumpir la conversación (CA de RF-33) | — |
| 5 | Nodo M5 | Abrir el nodo y filtrar Network por `nodo-actual` | Igual que el paso 4: una sola recarga y luego «No fue posible cargar el contenido multimedia.». Es el único camino del `onError` de `<video>` sin prueba automática | — |
| 6 | Nodo M6 | Abrir el nodo y filtrar Network por el dominio del bucket | Se ve «El formato del contenido multimedia no es soportado.» y no hay ninguna petición al almacenamiento para ese bloque | — |
| 7 | Nodo M7 | Abrir el nodo | La imagen se intenta cargar y se ve (un `mimeType` `null` no bloquea). Un bloque con URL ausente o `http` no se puede producir con S3 real: ese caso queda cubierto solo por pruebas unitarias (`services/multimedia.test.js`, `ChatMediaBlock.test.jsx`) | — |
| 8 | Nodos M8 y M9 | Abrir cada nodo | Una sola recarga y luego «No fue posible cargar el contenido multimedia.». El texto del nodo y el componente de respuesta siguen visibles | — |
| 9 | Sesión M11, con el contrato 2b disponible | Recargar la página para que se pinte el historial | El medio roto del historial muestra «No fue posible cargar el contenido multimedia.» sin pedir `nodo-actual` | — |
| 10 | Nodos M1 y M4. NVDA con Firefox o Chrome en escritorio, o VoiceOver en iPhone | Abrir el nodo M1 con «Slow 3G» en Network y recorrerlo con el lector; luego abrir M4 | Con M1 el lector anuncia «Cargando imagen» y no lee ni enfoca la imagen oculta; al cargar, lee el `alt`. Con M4 anuncia el aviso de fallo | Lector de pantalla |
| 11 | Nodo M10 | Abrir el nodo y observar la imagen válida durante la recarga que provoca la inexistente. Repetir con el lector de pantalla | Anotar qué pasa con la imagen ya visible: si la recarga trae URL refirmadas, se vuelve a montar y a cargar (decisión D12 del brief). Registrar si hay parpadeo o marcador y qué anuncia el lector. La imagen inexistente termina en «No fue posible cargar el contenido multimedia.» | Juicio de UX |
| 12 | Nodo M1 | En Network elegir «Slow 3G» y abrir el nodo; mientras se ve el marcador, cambiar a «Offline» | La imagen falla, sale una sola petición a `nodo-actual` (que falla por no haber red) y luego el aviso «No fue posible cargar el contenido multimedia.». No hay bucle de recargas ni pantalla de error global (A-062) | — |

## Textos esperados (RF-33 v1.1)

- Fallo de carga, usado en todo fallo (enmienda D16): «No fue posible cargar el contenido multimedia.»
- Formato no soportado: «El formato del contenido multimedia no es soportado.»
- No se deben ver: «El recurso multimedia no está disponible.» (404, sin uso por A-056) ni
  «El contenido multimedia no está disponible sin conexión.» (eliminado por A-062).

## Registro de resultados

| Paso | Resultado (pasa / falla / bloqueado) | Fecha | Quién | Observaciones |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
| 9 | | | | |
| 10 | | | | |
| 11 | | | | |
| 12 | | | | |
