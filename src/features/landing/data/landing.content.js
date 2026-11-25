/**
 * Todos los textos de la landing pública, en un solo archivo para que el
 * equipo de psicología los revise (español de Colombia, tuteo, sin jerga
 * técnica: la persona ve lo que puede hacer, no nombres de módulos).
 *
 * No hay métricas, testimonios, estadísticas de eficacia ni promesas
 * clínicas. No se afirma cumplimiento legal (Ley 1581 de 2012 pendiente de
 * verificar con el asesor).
 *
 * Los titulares son listas: un texto suelto es normal y `{ em }` se pinta
 * en cursiva serif.
 */

// TODO(psicología): validar cada afirmación sobre privacidad, anonimato,
// efectividad o uso de la palabra «vapeo» en todo este archivo.

export const BRAND = Object.freeze({
  name: 'Brisa',
  institution: 'Universidad Surcolombiana',
  group: 'Semillero Surconductual',
});

export const NAV_LINKS = Object.freeze([
  { id: 'que-es', label: 'Qué es', icon: 'Wind' },
  { id: 'todo', label: 'Descubre', icon: 'LayoutGrid' },
  { id: 'demo', label: 'Pruébalo', icon: 'MessagesSquare' },
  { id: 'recorrido', label: 'Recorrido', icon: 'Route' },
]);

export const CTA = Object.freeze({
  register: 'Crear cuenta',
  login: 'Ya tengo cuenta',
  install: 'Instalar en tu celular',
  goToSpace: 'Ir a mi espacio',
});

export const HERO = Object.freeze({
  eyebrow: 'Para estudiantes universitarios',
  title: 'Brisa',
  // TODO(psicología): validar el tono y la mención de «vapear».
  subtitle:
    'Un acompañamiento a tu ritmo para que dejes de vapear, sin juicios y con pasos pequeños.',
  orbitLabel: 'Lo que encuentras en Brisa',
  pauseMotion: 'Pausar movimiento',
  resumeMotion: 'Reanudar movimiento',
});

export const ORBIT_NODES = Object.freeze([
  { id: 'chat', label: 'Conversa', icon: 'MessagesSquare', target: 'demo' },
  { id: 'diario', label: 'Escribe', icon: 'NotebookPen', target: 'todo' },
  { id: 'cronograma', label: 'Semana a semana', icon: 'CalendarRange', target: 'recorrido' },
  { id: 'seguimiento', label: 'Tu avance', icon: 'TrendingUp', target: 'seguimiento' },
  { id: 'historia', label: 'Tu historia', icon: 'BookHeart', target: 'recorrido' },
  { id: 'recordatorios', label: 'Avisos', icon: 'BellRing', target: 'recordatorios' },
]);

export const ABOUT = Object.freeze({
  eyebrow: 'Qué es Brisa',
  title: ['Un espacio tranquilo para ir ', { em: 'paso a paso' }],
  body: 'Brisa es una app para estudiantes que quieren dejar de vapear. Conversas, escribes, avanzas semana a semana y ves lo que vas logrando. Tú pones el ritmo.',
  pillars: Object.freeze([
    {
      id: 'sin-juicios',
      icon: 'Brain',
      title: 'Sin juicios',
      text: 'Actividades y conversaciones pensadas para entenderte, no para señalarte.',
    },
    {
      id: 'ritmo',
      icon: 'Footprints',
      title: 'A tu ritmo',
      text: 'Cada semana se abre algo nuevo y puedes retomar justo donde lo dejaste.',
    },
    {
      id: 'respaldo',
      icon: 'ShieldCheck',
      title: 'Con respaldo de psicología',
      text: 'El contenido lo revisa el equipo de psicología del Semillero Surconductual.',
    },
  ]),
  install: Object.freeze({
    button: 'Instalar en tu celular',
    installed: 'Brisa ya está en este dispositivo.',
    iosTitle: 'Instalar en iPhone o iPad',
    iosSteps: [
      'Abre esta página en Safari.',
      'Toca el botón Compartir.',
      'Elige «Agregar a pantalla de inicio».',
    ],
    otherTitle: 'Instalar desde tu navegador',
    close: 'Cerrar',
    otherHelp:
      'Abre el menú de tu navegador y busca «Instalar app» o «Agregar a pantalla de inicio».',
  }),
});

// Cada tarjeta tiene su propia animación (ver ModuleArt) y NO nombra el
// módulo: habla de lo que la persona puede hacer.
export const FEATURES = Object.freeze({
  eyebrow: 'Qué encuentras',
  title: ['Todo lo que te ', { em: 'acompaña' }],
  items: Object.freeze([
    { id: 'cuenta', icon: 'UserRoundCheck', title: 'Empieza a tu manera', text: 'Creas tu cuenta con calma y decides qué compartir. Nada se hace sin tu permiso.', size: 'wide' },
    { id: 'diario', icon: 'NotebookPen', title: 'Escribe lo que sientas', text: 'Un diario corto, solo para ti. Lo que escribes queda guardado tal cual.', size: 'tall' },
    { id: 'chat', icon: 'MessagesSquare', title: 'Conversa sin escribir', text: 'Respondes tocando opciones y, si te vas, retomas donde quedaste. Con ayuda a un toque.', size: 'wide' },
    { id: 'cronograma', icon: 'CalendarRange', title: 'Una semana a la vez', text: 'Cada semana se abre contenido nuevo, a medida que avanzas.', size: 'base' },
    { id: 'seguimiento', icon: 'TrendingUp', title: 'Mira tu avance', text: 'Rachas, metas e insignias para ver lo que vas construyendo.', size: 'base' },
    { id: 'historia', icon: 'BookHeart', title: 'Una historia contigo', text: 'Una pequeña historia que avanza contigo y termina con una celebración.', size: 'base' },
    { id: 'recordatorios', icon: 'BellRing', title: 'Avisos discretos', text: 'Pocos recordatorios al día, con palabras generales que nadie más entiende.', size: 'base' },
    { id: 'apoyo', icon: 'ShieldCheck', title: 'Un equipo que cuida', text: 'Psicología acompaña el proceso, con tu información protegida.', size: 'wide' },
  ]),
});

export const DEMO = Object.freeze({
  eyebrow: 'Pruébalo',
  title: ['Así se siente ', { em: 'una conversación' }],
  body: 'Toca una opción y Brisa responde. Casi nunca tendrás que escribir: eliges entre respuestas.',
  badge: 'Ejemplo',
  chatTitle: 'Brisa',
  optionsLabel: 'Elige una respuesta',
  restart: 'Volver a empezar',
  typing: 'Brisa está escribiendo',
  helpButton: 'Ayuda',
  helpReply: 'Aquí tendrías la ayuda siempre a un toque.',
  endNote: 'Fin del ejemplo',
  // Contenido genérico y NO clínico.
  // TODO(psicología): validar el guion de ejemplo.
  tree: Object.freeze({
    start: 'inicio',
    nodes: Object.freeze({
      inicio: {
        bot: 'Hola, soy Brisa. ¿Cómo viene tu día?',
        options: [
          { id: 'tranquilo', label: 'Tranquilo', next: 'pausa' },
          { id: 'movido', label: 'Con mucho movimiento', next: 'pausa' },
          { id: 'nodecir', label: 'Prefiero no decirlo', next: 'respeto' },
        ],
      },
      respeto: {
        bot: 'Está bien, no tienes que contar nada. Podemos hacer algo corto si quieres.',
        options: [{ id: 'corto', label: 'Algo corto', next: 'pausa' }],
      },
      pausa: {
        bot: 'Gracias por contarme. ¿Te gustaría una pausa guiada de un minuto?',
        options: [
          { id: 'si', label: 'Sí, vamos', next: 'respirar' },
          { id: 'luego', label: 'Más tarde', next: 'cierre' },
        ],
      },
      respirar: {
        bot: 'Perfecto. Suelta los hombros y toma aire despacio. Cuando termines, dime cómo te sientes.',
        options: [
          { id: 'mejor', label: 'Un poco mejor', next: 'cierre' },
          { id: 'igual', label: 'Igual que antes', next: 'cierre' },
        ],
      },
      cierre: {
        bot: 'Listo por hoy. Cuando quieras, aquí seguimos. Tu avance queda guardado.',
        options: [],
      },
    }),
  }),
});

export const JOURNEY = Object.freeze({
  eyebrow: 'Recorrido semanal',
  title: ['Una semana a la vez, ', { em: 'sin prisa' }],
  body: 'Las semanas se abren según tu avance. La historia avanza contigo, desde el inicio hasta una pequeña celebración final.',
  weekLabel: 'Semana',
  rest: 'y las que siguen',
  unlocked: 'Abierta',
  locked: 'Por abrir',
  stages: Object.freeze([
    { id: 'inicio', name: 'Inicio', text: 'Conoces tu espacio y cuentas desde dónde partes.' },
    { id: 'desarrollo', name: 'Camino', text: 'Cada semana trae algo nuevo y la historia avanza.' },
    { id: 'cierre', name: 'Final', text: 'La historia llega a su final y lo celebras.' },
  ]),
  graduation: 'Celebración final',
});

export const TRACKING = Object.freeze({
  eyebrow: 'Tu avance',
  title: ['Lo que logras, ', { em: 'a la vista' }],
  body: 'Rachas, metas e insignias para que veas lo que vas construyendo. Lo de abajo es solo un ejemplo.',
  streak: { label: 'Tu racha', caption: 'días seguidos' },
  goalsTitle: 'Tus metas',
  goalTabs: Object.freeze([
    { id: 'activas', label: 'En curso', items: ['Completar la actividad de la semana', 'Escribir en tu diario'] },
    { id: 'cumplidas', label: 'Cumplidas', items: ['Contar desde dónde partes'] },
    { id: 'recomendadas', label: 'Para ti', items: ['Probar una pausa guiada'] },
  ]),
  badgesTitle: 'Tus insignias',
  badges: Object.freeze([
    { id: 'inicio', label: 'Primer paso', icon: 'Footprints' },
    { id: 'diario', label: 'Voz propia', icon: 'NotebookPen' },
    { id: 'racha', label: 'Constancia', icon: 'Flame' },
    { id: 'meta', label: 'Meta cumplida', icon: 'Target' },
    { id: 'historia', label: 'Capítulo', icon: 'BookHeart' },
  ]),
  chartTitle: 'Tus días activos',
  chartExplanation:
    'Cada barra es una semana. No es una calificación: sirve para ver tu ritmo y notar cuándo te cuesta más.',
  chartBars: Object.freeze([3, 5, 4, 6, 5, 7]),
  motivationTitle: 'Un mensaje cada semana',
  // TODO(psicología): redactar y validar mensajes motivacionales reales.
  motivation: 'Cada pequeño paso cuenta. Hoy basta con volver a intentarlo.',
});

export const REMINDERS = Object.freeze({
  eyebrow: 'Avisos',
  title: ['Recordatorios ', { em: 'discretos' }],
  body: 'Recibes pocos avisos al día, tú decides cuándo, y nunca dicen de qué se trata. Toca uno para abrir la conversación de ejemplo.',
  appName: 'Brisa',
  openHint: 'Abrir la conversación de ejemplo',
  // Lenguaje genérico y discreto: sin la palabra «vapeo».
  // TODO(psicología): validar que los textos reales sigan siendo discretos.
  items: Object.freeze([
    { id: 'r1', time: '9:00', text: 'Tienes un momento tuyo esperando.' },
    { id: 'r2', time: '2:30', text: 'Pasa a saludar cuando puedas.' },
    { id: 'r3', time: '7:00', text: 'Cierra el día con una pausa corta.' },
  ]),
});

export const TRUST = Object.freeze({
  eyebrow: 'Confianza',
  title: ['Tu decisión, ', { em: 'tus reglas' }],
  // TODO(psicología): validar cada afirmación sobre privacidad y anonimato.
  items: Object.freeze([
    { id: 'consent', icon: 'FileCheck2', title: 'Tú aceptas primero', text: 'No se crea tu cuenta sin que aceptes, de forma clara y por separado, cómo se usan tus datos.' },
    { id: 'psico', icon: 'ShieldCheck', title: 'Revisado por psicología', text: 'El contenido lo valida el equipo de psicología del Semillero Surconductual.' },
    { id: 'anon', icon: 'EyeOff', title: 'Tu nombre no aparece', text: 'Quien acompaña el proceso ve un código, no tu nombre.' },
    { id: 'ads', icon: 'BellOff', title: 'Sin anuncios', text: 'Brisa no muestra publicidad ni te sigue por internet.' },
  ]),
  // TODO(psicología): aquí irá la ayuda para momentos difíciles. NO escribir
  // teléfonos ni protocolos sin validación del equipo de psicología.
});

export const PROCESS = Object.freeze({
  eyebrow: 'Cómo empiezas',
  title: ['Cuatro pasos, ', { em: 'sin complicarte' }],
  steps: Object.freeze([
    { id: 1, title: 'Crea tu cuenta', text: 'Aceptas cómo se usan tus datos y entras con tu correo.' },
    { id: 2, title: 'Cuéntanos desde dónde partes', text: 'Unas preguntas cortas, y revisas todo antes de confirmar.' },
    { id: 3, title: 'Avanza semana a semana', text: 'Conversas, escribes y haces actividades cortas.' },
    { id: 4, title: 'Mira lo que logras', text: 'Ves tus rachas, metas e insignias, y llegas al final de la historia.' },
  ]),
});

export const FAQ = Object.freeze({
  eyebrow: 'Preguntas frecuentes',
  title: ['Lo que ', { em: 'suelen preguntar' }],
  // TODO(psicología): validar las respuestas sobre privacidad y uso.
  items: Object.freeze([
    { id: 'q1', q: '¿Brisa reemplaza a un profesional de la salud?', a: 'No. Es un apoyo desarrollado por el Semillero Surconductual de la Universidad Surcolombiana. No sustituye la atención de un profesional.' },
    { id: 'q2', q: '¿Tengo que escribir mucho?', a: 'No. En la conversación eliges respuestas tocando opciones. El diario es el único lugar donde escribes, y es corto.' },
    { id: 'q3', q: '¿Quién puede ver lo que respondo?', a: 'El equipo de psicología acompaña el proceso viendo un código, no tu nombre.' },
    { id: 'q4', q: '¿Puedo pausar y retomar?', a: 'Sí. La conversación sigue justo donde la dejaste y lo de cada semana te espera.' },
    { id: 'q5', q: '¿Cómo la instalo?', a: 'Desde tu navegador, con el botón «Instalar en tu celular» o la opción «Agregar a pantalla de inicio».' },
  ]),
});

export const FINAL_CTA = Object.freeze({
  title: ['Empieza cuando ', { em: 'estés listo' }],
  body: 'Crear tu cuenta toma pocos minutos. Tú decides el ritmo.',
});

export const FOOTER = Object.freeze({
  rights: 'Proyecto de la Universidad Surcolombiana',
  note: 'Hecho por el Semillero Surconductual.',
});

export const A11Y = Object.freeze({
  skip: 'Ir al contenido',
  mobileNav: 'Navegación de la página',
});
