function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }

  return value;
}

export const INSTALL_PLATFORM = Object.freeze({
  ANDROID: 'android',
  IOS: 'ios',
  DESKTOP: 'desktop',
  UNSUPPORTED: 'unsupported',
});

// Fase PWA: se agrega el modo 'nativo' (aviso de instalación del navegador).
export const INSTALL_MODE = Object.freeze({
  INSTALADA: 'instalada',
  INSTRUCCIONES: 'instrucciones',
});

// Teclas o íconos de menú que aparecen dentro de un paso. El componente
// decide con qué ícono pintar cada una.
export const INSTALL_KEY = Object.freeze({
  MENU_VERTICAL: 'menuVertical',
  MENU_HORIZONTAL: 'menuHorizontal',
  COMPARTIR: 'compartir',
});

export const INSTALL_TABS = deepFreeze([
  { platform: INSTALL_PLATFORM.ANDROID, label: 'Android' },
  { platform: INSTALL_PLATFORM.IOS, label: 'iPhone' },
  { platform: INSTALL_PLATFORM.DESKTOP, label: 'Computador' },
]);

export const INSTALL_SHEET_TEXT = Object.freeze({
  title: 'Instala Brisa',
  intro:
    'Brisa quedará en tu pantalla de inicio y se abrirá como cualquier ' +
    'otra app.',
  tabsLabel: 'Elige tu dispositivo',
  detected: 'Detectamos tu dispositivo; cámbialo si no es correcto.',
  close: 'Entendido',
  backdropLabel: 'Cerrar instrucciones',
});

const bold = (text) => ({ negrita: text });
const key = (name) => ({ tecla: name });

// Cada paso es una lista de fragmentos: texto, { negrita } o { tecla }.
// Así los pasos se pintan como JSX, sin HTML.
// Menús de Chrome, Edge, Firefox y Android revisados a mano por el
// responsable (2026-10-17).
export const INSTALL_INSTRUCTIONS = deepFreeze({
  // FASE PWA: cuando haya manifest y la app esté en HTTPS, "Instalar" quedará
  // habilitada. Cambiar estos pasos para recomendar "Instalar" (abre Brisa
  // como app y oculta el botón) en lugar de "Crear acceso directo". Ver A8 y
  // A9 en M01_aclaraciones.md.
  [INSTALL_PLATFORM.ANDROID]: {
    steps: [
      [
        'Toca el menú ',
        key(INSTALL_KEY.MENU_VERTICAL),
        ' arriba a la derecha.',
      ],
      ['Desliza y elige ', bold('«Instalar y crear acceso directo»'), '.'],
      [
        'Elige ',
        bold('«Crear acceso directo»'),
        ' y confirma con ',
        bold('«Agregar»'),
        '.',
      ],
    ],
    note: 'Si usas otro navegador, busca la misma opción en su menú.',
  },
  [INSTALL_PLATFORM.IOS]: {
    steps: [
      [
        'Toca el botón Compartir ',
        key(INSTALL_KEY.COMPARTIR),
        ' en la barra inferior.',
      ],
      ['Desliza y elige ', bold('«Agregar a inicio»'), '.'],
      ['Toca ', bold('«Agregar»'), ' arriba a la derecha.'],
    ],
    note: 'Si no ves la opción, abre esta página en Safari.',
  },
  [INSTALL_PLATFORM.DESKTOP]: {
    intro:
      'Brisa quedará como una app en tu computador y se abrirá en su ' +
      'propia ventana.',
    groups: [
      {
        title: 'En Chrome',
        steps: [
          [
            'Abre el menú ',
            key(INSTALL_KEY.MENU_VERTICAL),
            ' arriba a la derecha.',
          ],
          [
            'Entra a ',
            bold('«Enviar, guardar y compartir»'),
            ' y elige ',
            bold('«Instalar página como aplicación»'),
            '.',
          ],
          ['Confirma con ', bold('«Instalar»'), '.'],
        ],
      },
      {
        title: 'En Edge',
        steps: [
          [
            'Abre el menú ',
            key(INSTALL_KEY.MENU_HORIZONTAL),
            ' arriba a la derecha.',
          ],
          [
            'Entra a ',
            bold('«Más herramientas»'),
            ', luego a ',
            bold('«Aplicaciones»'),
            ' y elige ',
            bold('«Instalar este sitio como una aplicación»'),
            '.',
          ],
          ['Confirma con ', bold('«Instalar»'), '.'],
        ],
      },
      // Firefox solo permite instalar sitios en Windows (versión 143+).
      {
        title: 'En Firefox (Windows)',
        steps: [
          [
            'En la barra de direcciones, toca el ícono ',
            bold('«Añadir pestaña a la barra de tareas»'),
            '.',
          ],
          ['Brisa queda en la barra de tareas y en el menú Inicio.'],
        ],
      },
    ],
    note:
      'Los nombres del menú pueden variar según la versión de tu ' +
      'navegador. Brisa también funciona en tu celular.',
  },
  [INSTALL_PLATFORM.UNSUPPORTED]: {
    intro: 'Tu navegador no permite agregar Brisa a la pantalla de inicio.',
    steps: [
      ['En Android, abre esta página en ', bold('Chrome'), '.'],
      ['En iPhone, ábrela en ', bold('Safari'), '.'],
    ],
  },
});
