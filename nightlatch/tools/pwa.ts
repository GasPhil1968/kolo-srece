// Web-app build: an offline-capable copy of the game for iPad, Android and desktop browsers.
//   npm run build:web  ->  dist-web/  and  release/NightLatch-web.zip
// Runs after `vite build --outDir dist-web`. It replaces the music and ambience with the smaller
// encodings (tools/smallaudio.ts) and writes sw.js with the complete list of files to keep, so
// that one visit with a connection is enough to play offline.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { smallerAudio } from './smallaudio';

const OUT = 'dist-web';
const NAME = 'NightLatch-web';

if (!existsSync(join(OUT, 'index.html'))) throw new Error(`${OUT}/index.html missing: run vite build --outDir ${OUT} first`);

// 1. smaller music and ambience
const r = smallerAudio(OUT);
for (const [src, bytes] of r.smaller) {
  const dest = join(OUT, relative('public', src));
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, bytes);
}
console.log(`audio: ${r.smaller.size} music/ambience files re-encoded, ${r.kept} kept as they were`);

// 2. the list of files to keep offline
const files: string[] = [];
const walk = (dir: string) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f !== 'sw.js') files.push(relative(OUT, p).split('\\').join('/'));
  }
};
walk(OUT);
const urls = ['./', ...files.sort().map((f) => './' + f)];
const version = createHash('sha256').update(urls.join('\n')).update(files.map((f) => statSync(join(OUT, f)).size).join(',')).digest('hex').slice(0, 12);
const sw = readFileSync('pwa/sw.template.js', 'utf8')
  .replace('__VERSION__', version)
  .replace('__FILES__', JSON.stringify(urls, null, 1));
writeFileSync(join(OUT, 'sw.js'), sw);

// 3. Netlify: the service worker and the start page must never be cached by the CDN
writeFileSync(join(OUT, '_headers'), '/sw.js\n  Cache-Control: no-cache\n\n/index.html\n  Cache-Control: no-cache\n\n/\n  Cache-Control: no-cache\n');

// 4. the folder and the zip, the same way as the portable build
mkdirSync('release', { recursive: true });
rmSync(`release/${NAME}.zip`, { force: true });
rmSync(`release/${NAME}`, { recursive: true, force: true });
execFileSync('cp', ['-r', OUT, `release/${NAME}`]);
execFileSync('zip', ['-q', '-r', '-9', `${NAME}.zip`, NAME], { cwd: 'release' });
rmSync(`release/${NAME}`, { recursive: true, force: true });
const total = files.reduce((a, f) => a + statSync(join(OUT, f)).size, 0);
console.log(`web build: ${files.length} files (${(total / 1e6).toFixed(1)} MB) -> ${OUT}/, version ${version}, release/${NAME}.zip (${(statSync(`release/${NAME}.zip`).size / 1e6).toFixed(1)} MB)`);
