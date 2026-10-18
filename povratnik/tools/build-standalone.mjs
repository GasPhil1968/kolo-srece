// Builds a standalone game: one index.html that runs by double-click (file://), no server needed.
// Browsers refuse module scripts, XHR and canvas pixel reads for file:// pages, so this build:
//  - bundles the game into one classic (IIFE) script, lazy imports included, with the CSS inlined;
//  - embeds every image as a data: URI and every atlas JSON as an object (scene.ts reads
//    globalThis.__POV_EMBED__ before it falls back to the URL), so nothing is fetched.
// Output: standalone/index.html (plus nothing else). Run after the game builds: npm run build:standalone
import { build } from 'esbuild';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = path.join(root, 'public/assets');
const outDir = path.join(root, 'standalone');

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const MIME = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };

const result = await build({
  entryPoints: [path.join(root, 'src/main.ts')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['es2020'],
  write: false,
  outdir: 'out',
  loader: { '.css': 'css' },
  // CSS background images are written as /assets/...; they are replaced by embedded data URIs below.
  external: ['/assets/*'],
  legalComments: 'none',
});
const js = result.outputFiles.find((f) => f.path.endsWith('.js')).text;

const embed = {};
for (const file of await walk(assetsDir)) {
  const rel = 'assets/' + path.relative(assetsDir, file).split(path.sep).join('/');
  const ext = path.extname(file).toLowerCase();
  if (ext === '.json') embed[rel] = JSON.parse(await readFile(file, 'utf8'));
  else if (MIME[ext]) embed[rel] = `data:${MIME[ext]};base64,${(await readFile(file)).toString('base64')}`;
}

const css = (result.outputFiles.find((f) => f.path.endsWith('.css'))?.text ?? '').replace(
  /url\((['"]?)\/(assets\/[^'")]+)\1\)/g,
  (m, _q, p) => (embed[p] ? `url(${embed[p]})` : m),
);

// Embedded art is split over classic scripts (they also load from file://), about 20 MB each, so that
// each delivery archive stays under 30 MB.
const CHUNK = 20_000_000;
const chunks = [];
let cur = {};
let curSize = 0;
for (const [k, v] of Object.entries(embed)) {
  const size = JSON.stringify(v).length;
  if (curSize + size > CHUNK && curSize > 0) {
    chunks.push(cur);
    cur = {};
    curSize = 0;
  }
  cur[k] = v;
  curSize += size;
}
if (curSize) chunks.push(cur);
await mkdir(outDir, { recursive: true });
const chunkTags = [];
for (let i = 0; i < chunks.length; i++) {
  const name = `assets-${i + 1}.js`;
  const body = `(globalThis.__POV_EMBED__=globalThis.__POV_EMBED__||{});Object.assign(globalThis.__POV_EMBED__,${JSON.stringify(chunks[i]).replace(/<\//g, '<\\/')});`;
  await writeFile(path.join(outDir, name), body);
  chunkTags.push(`<script src="${name}"></script>`);
}

const template = await readFile(path.join(root, 'index.html'), 'utf8');
const html = template
  .replace('<script type="module" src="/src/main.ts"></script>', '')
  .replace('</head>', () => `<style>${css}</style>\n  </head>`)
  .replace(
    '</body>',
    // A function replacement: the game code contains '$&' and similar, which a string replacement would expand.
    () =>
    // The embedded art comes first (its own files), then the game. Escaping "</" keeps the inline script intact.
    `${chunkTags.join('\n')}\n<script>${js.replace(/<\/script/gi, '<\\/script')}</script>\n  </body>`,
  );

await writeFile(path.join(outDir, 'index.html'), html);
const size = (await readFile(path.join(outDir, 'index.html'))).length;
console.log(`standalone/index.html: ${(size / 1e6).toFixed(1)} MB, ${Object.keys(embed).length} embedded assets in ${chunks.length} script file(s)`);
