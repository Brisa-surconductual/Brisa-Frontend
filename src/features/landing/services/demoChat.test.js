import { describe, expect, it } from 'vitest';

import { DEMO } from '../data/landing.content.js';
import { chooseOption, startDemo } from './demoChat.js';

describe('demoChat', () => {
  it('arranca con el saludo de Brisa', () => {
    const { nodeId, messages } = startDemo(DEMO.tree);

    expect(nodeId).toBe('inicio');
    expect(messages).toHaveLength(1);
    expect(messages[0].from).toBe('bot');
  });

  it('responde a una opción y avanza', () => {
    const step = chooseOption(DEMO.tree, 'inicio', 'tranquilo');

    expect(step.userText).toBe('Tranquilo');
    expect(step.nextId).toBe('pausa');
  });

  it('ignora opciones inexistentes', () => {
    expect(chooseOption(DEMO.tree, 'inicio', 'zzz')).toBeNull();
  });

  it('todo el árbol es alcanzable y termina en un nodo sin opciones', () => {
    const { nodes, start } = DEMO.tree;
    const seen = new Set([start]);
    const queue = [start];

    while (queue.length) {
      nodes[queue.pop()].options.forEach(({ next }) => {
        expect(nodes[next]).toBeDefined();
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      });
    }

    expect(seen.size).toBe(Object.keys(nodes).length);
    expect(Object.values(nodes).some((n) => n.options.length === 0)).toBe(true);
  });
});
