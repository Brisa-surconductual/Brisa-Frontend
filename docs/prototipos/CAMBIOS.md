# Registro de cambios de los prototipos

Cada entrada indica el módulo, las versiones del prototipo, la fecha, la tarea, la pantalla afectada y la justificación de cada cambio. La entrada más reciente va arriba.

## M01 · v1.3 → v1.3.1 · 2026-10-17 · FE-M01-HOME

Pantalla afectada: `s-splash` y la hoja «Instalar Brisa». Alinea el prototipo con lo implementado tras las revisiones y la prueba manual.

| Cambio | Justificación |
|---|---|
| Texto sobre el verde en blanco pleno; panel de la lista oscuro | El blanco con opacidad baja de 4.5:1 sobre `#1D8378`, y el panel translúcido bajaba el contraste a 3.9:1 (revisión de accesibilidad) |
| Animación de una sola pasada de 5 s que queda quieta | WCAG 2.2.2 (nivel A) exige pausa para movimiento de más de 5 s; limitarlo evita agregar un control que rompería la calma (D18) |
| Menús reales de Android, Chrome, Edge y Firefox (Windows) | Comprobados a mano el 2026-10-17; los del v1.3 estaban desactualizados (D20, D21) |
| La app cuenta como instalada con cualquier `display-mode` distinto de `browser` | Sin manifest, los navegadores abren la app instalada en `minimal-ui` (D19) |
| Pestañas de la hoja de 44 px | Zona táctil mínima |

## M01 · v1.2.1 → v1.3 · 2026-10-16 · FE-M01-HOME

Pantalla afectada: `s-splash` (Home pública, ruta `/`). El resto de pantallas no cambia.

| Cambio | Justificación |
|---|---|
| CTA principal «Instalar Brisa», que abre una hoja con instrucciones por plataforma (Android, iPhone, Computador, No compatible) | El líder pidió priorizar la instalación de la app. Brisa es una PWA y en esta fase no se configura, así que se instruye a agregarla manualmente; en iPhone eso será necesario siempre |
| La hoja tiene pestañas para cambiar de dispositivo | La detección automática falla en casos reales (iPad se identifica como Mac) |
| El botón se oculta si la app se abrió desde la pantalla de inicio | No tiene sentido ofrecer instalar algo ya instalado |
| «Crear cuenta» pasa a secundario e «Iniciar sesión» a enlace | Jerarquía: instalar es la acción principal |
| Subtítulo sin nombrar el vapeo y tres puntos de valor | Regla de marca del Design System v1.2; la pantalla anterior no explicaba qué es Brisa |
| Fondo animado: degradado (14 s) y tres ondas de respiración; quieto con «reducir movimiento» | Pedido del equipo. Movimiento lento para no inquietar a estudiantes con ansiedad o craving; las ondas evocan el isotipo; respeta WCAG 2.3.3 |
| Tonos propios del splash que no se invierten en modo oscuro | En v1.2.1 el fondo usaba tokens de marca que se invierten y dejaban texto blanco sobre verde claro (contraste insuficiente) |
| Se conserva «v1.0.0 · Universidad Surcolombiana» | Decisión del equipo; en el código sale de `package.json` |
