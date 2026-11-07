import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

// Regla de nivel superior o capa que contiene cada selector `a`.
function enclosingBlocks(selector) {
  const blocks = [];
  const stack = [];
  let buffer = '';

  for (const char of css) {
    if (char === '{') {
      const prelude = buffer.trim();
      if (prelude === selector) blocks.push(stack.at(-1) ?? null);
      stack.push(prelude);
      buffer = '';
    } else if (char === '}') {
      stack.pop();
      buffer = '';
    } else if (char === ';') {
      buffer = '';
    } else {
      buffer += char;
    }
  }

  return blocks;
}

describe('Cascada de enlaces (CP-20)', () => {
  it('`a { color: inherit }` vive en la capa base', () => {
    expect(enclosingBlocks('a')).toEqual(['@layer base']);
  });

  it('la regla conserva la herencia de color', () => {
    expect(css).toMatch(/@layer base\s*\{\s*a\s*\{\s*color:\s*inherit;\s*\}/);
  });
});
