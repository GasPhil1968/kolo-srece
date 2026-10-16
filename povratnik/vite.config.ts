import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// 'phaser' resolves to the silent custom build (tools/build-phaser.mjs): no sound
// manager, no audio loaders, no audio capability probe.
export default defineConfig({
  base: './',
  resolve: {
    alias: { phaser: fileURLToPath(new URL('./vendor/phaser-silent.mjs', import.meta.url)) },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'app',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2500,
    target: 'es2020',
    sourcemap: false,
  },
  server: { port: 5173, host: true },
  preview: { port: 4173 },
});
