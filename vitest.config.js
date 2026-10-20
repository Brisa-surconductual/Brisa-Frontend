import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

// Solo lógica pura: no se mezcla vite.config.js para no cargar React
// Compiler ni Tailwind en las pruebas.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    passWithNoTests: true,
  },
});
