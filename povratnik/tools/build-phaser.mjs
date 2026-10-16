// Builds a silent Phaser 3 bundle (vendor/phaser-silent.mjs) from Phaser's own sources.
// The game has no audio. This build removes Phaser's sound manager, its audio file
// loaders and its boot-time audio capability probe (which would create an <audio>
// element), so the shipped JavaScript contains no audio code paths at all.
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const phaserSrc = path.join(root, 'node_modules/phaser/src');
const out = path.join(root, 'vendor/phaser-silent.mjs');
const entry = path.join(phaserSrc, 'phaser.js');

const FLAGS = {
  'typeof CANVAS_RENDERER': 'true',
  'typeof WEBGL_RENDERER': 'true',
  'typeof WEBGL_DEBUG': 'false',
  'typeof EXPERIMENTAL': 'false',
  'typeof PLUGIN_3D': 'false',
  'typeof PLUGIN_CAMERA3D': 'false',
  'typeof PLUGIN_FBINSTANT': 'false',
  'typeof FEATURE_SOUND': 'false',
};
const AUDIO_STUB = 'module.exports = Object.freeze({ flac:false, aac:false, audioData:false, dolby:false, m4a:false, mp3:false, ogg:false, opus:false, wav:false, webAudio:false, webm:false });\n';
const REMOVED_FILETYPES = ['AudioFile', 'AudioSpriteFile', 'HTML5AudioFile', 'VideoFile'];

const force = process.argv.includes('--force');
if (!force && existsSync(out) && statSync(out).mtimeMs > statSync(path.join(root, 'node_modules/phaser/package.json')).mtimeMs
    && statSync(out).mtimeMs > statSync(fileURLToPath(import.meta.url)).mtimeMs) {
  console.log('phaser-silent.mjs is up to date');
  process.exit(0);
}

const silentPhaser = {
  name: 'silent-phaser',
  setup(b) {
    b.onLoad({ filter: /node_modules[\\/]phaser[\\/]src[\\/].*\.js$/ }, async (args) => {
      const rel = path.relative(phaserSrc, args.path).split(path.sep).join('/');
      if (rel === 'device/Audio.js') return { contents: AUDIO_STUB, loader: 'js' };
      let src = await readFile(args.path, 'utf8');
      for (const [k, v] of Object.entries(FLAGS)) src = src.split(k).join(v);
      if (rel === 'loader/filetypes/index.js') {
        for (const t of REMOVED_FILETYPES) src = src.replace(new RegExp(`\\s*${t}: require\\('\\./${t}'\\),?`), '');
      }
      return { contents: src, loader: 'js' };
    });
  },
};

await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  minify: true,
  legalComments: 'eof',
  outfile: out,
  plugins: [silentPhaser],
  logLevel: 'warning',
  define: { global: 'globalThis' },
  footer: { js: 'export default __phaser_default;' },
  banner: { js: '/* Phaser 3.90.0 (MIT, Phaser Studio Inc.) - silent custom build for POVRATNIK: no sound manager, no audio loaders, no audio probe. */' },
}).catch(() => process.exit(1));

// esbuild turns the CommonJS entry into an ESM module whose default export must be named for the footer.
let text = await readFile(out, 'utf8');
const m = text.match(/export\s*default\s*([A-Za-z_$][\w$]*)\s*\(\)\s*;/);
const { writeFile } = await import('node:fs/promises');
if (m) {
  text = text.replace(m[0], `const __phaser_default = ${m[1]}();`);
} else {
  console.error('Unexpected esbuild output shape; cannot locate default export.');
  process.exit(1);
}
const banned = [/AudioContext/, /decodeAudioData/, /createElement\(["']audio["']\)/, /new Audio\(/, /speechSynthesis/, /HTMLAudioElement/];
const hits = banned.filter((re) => re.test(text)).map(String);
await writeFile(out, text);
console.log(`wrote ${path.relative(root, out)} (${(text.length / 1024).toFixed(0)} KiB); audio patterns found: ${hits.length ? hits.join(', ') : 'none'}`);
if (hits.length) process.exit(2);
