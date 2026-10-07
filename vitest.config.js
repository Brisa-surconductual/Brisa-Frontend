import { defineConfig } from 'vitest/config';

// Solo lógica pura: no se mezcla vite.config.js para no cargar React
// Compiler ni Tailwind en las pruebas.
export default defineConfig({
  test: {
    environment: 'node',
    passWithNoTests: true,
  },
});
