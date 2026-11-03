import { vi } from 'vitest';

// Sin importar 'react': este módulo se usa dentro de su propio mock.
const ELEMENT_TYPES = new Set([
  Symbol.for('react.transitional.element'),
  Symbol.for('react.element'),
]);

function isValidElement(node) {
  return (
    typeof node === 'object' &&
    node !== null &&
    ELEMENT_TYPES.has(node.$$typeof)
  );
}

/*
 * Solo para pruebas (entorno node, sin DOM). Permite invocar una
 * página como función con estado inicial controlado y recorrer el
 * árbol de elementos que devuelve, para ejecutar sus manejadores
 * reales (envíos, clics) y comprobar llamadas a la API.
 *
 * Uso: vi.mock('react', async (importOriginal) =>
 *   (await import('.../directRender.js')).mockReact(await importOriginal()));
 */
export const hookStub = {
  active: false,
  values: {},
  initials: [],
  setters: [],
  index: 0,
};

export function mockReact(actual) {
  return {
    ...actual,
    useState(initial) {
      if (!hookStub.active) return actual.useState(initial);

      const index = hookStub.index;
      hookStub.index += 1;

      const initialValue =
        typeof initial === 'function' ? initial() : initial;
      const setter = vi.fn();

      hookStub.initials[index] = initialValue;
      hookStub.setters[index] = setter;

      return [
        index in hookStub.values ? hookStub.values[index] : initialValue,
        setter,
      ];
    },
    useEffect(...args) {
      if (!hookStub.active) return actual.useEffect(...args);
      return undefined;
    },
    useRef(initial) {
      if (!hookStub.active) return actual.useRef(initial);
      return { current: initial };
    },
  };
}

// Invoca el componente con el estado indicado por índice de useState.
export function renderDirect(Component, values = {}, props = {}) {
  Object.assign(hookStub, {
    active: true,
    values,
    initials: [],
    setters: [],
    index: 0,
  });

  try {
    return Component(props);
  } finally {
    hookStub.active = false;
  }
}

function childNodes(node) {
  if (Array.isArray(node)) return node;
  if (!isValidElement(node)) return [];

  return Object.values(node.props ?? {}).flatMap((value) =>
    Array.isArray(value) || isValidElement(value) ? [value] : [],
  );
}

// Todos los elementos del árbol que cumplen el predicado.
export function findAll(node, predicate) {
  const found = [];
  const visit = (current) => {
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (!isValidElement(current)) return;
    if (predicate(current)) found.push(current);
    childNodes(current).forEach(visit);
  };

  visit(node);
  return found;
}

// Texto plano de un elemento (sin expandir componentes).
export function textOf(node) {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) return node.map(textOf).join('');
  return isValidElement(node) ? textOf(node.props.children) : '';
}

export function findByText(node, text, type) {
  return findAll(
    node,
    (element) =>
      (type === undefined || element.type === type) &&
      textOf(element).includes(text),
  );
}
