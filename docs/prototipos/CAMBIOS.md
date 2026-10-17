# Registro de cambios de los prototipos

Cada entrada indica el módulo, las versiones del prototipo, la fecha, la tarea, la pantalla afectada y la justificación de cada cambio. La entrada más reciente va arriba.

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
