// Portable build: a folder (and zip) that plays by double-clicking index.html, with no web
// server and no installation. Browsers refuse to fetch files from a file:// page, so every
// asset is embedded as a data URI in assets-data.js (see src/game/assets.ts), and the game is
// bundled as a classic script, since module scripts are also blocked on file://.
//
// To keep the download small, music and ambience are re-encoded at constant 80 / 48 kbit/s
// (needs ffmpeg). Each re-encoded file must decode to exactly the manifest's sample count, so
// loops stay seamless; otherwise the original file is used. `--full-audio` keeps the originals.
//
//   npm run build:portable   ->  dist-portable/  and  release/NightLatch.zip
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { build } from 'esbuild';

const OUT = 'dist-portable';
const NAME = 'NightLatch';
const BITRATE: Record<string, string> = { music: '80k', amb: '48k' };
const FULL_AUDIO = process.argv.includes('--full-audio');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

/** Re-encode one looping MP3 at a lower constant bitrate; null if it would change its length. */
function smallerMp3(file: string, bitrate: string, samples: number, tmp: string): Buffer | null {
  const ch = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=channels', '-of', 'csv=p=0', file]).toString().trim();
  const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', ch, '-ar', '44100', 'pipe:1'], { maxBuffer: 1 << 30 });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', '44100', '-ac', ch, '-i', 'pipe:0', '-c:a', 'libmp3lame',
    '-b:a', bitrate, '-map_metadata', '-1', '-id3v2_version', '0', '-write_id3v1', '0', tmp], { input: pcm, maxBuffer: 1 << 30 });
  const back = execFileSync('ffmpeg', ['-v', 'error', '-i', tmp, '-f', 'f32le', '-ac', ch, '-ar', '44100', 'pipe:1'], { maxBuffer: 1 << 30 });
  const n = back.length / 4 / Number(ch);
  return n === samples ? readFileSync(tmp) : null;
}

// 1. the game, as one classic script
await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2020',
  outfile: `${OUT}/game.js`,
  legalComments: 'none',
  logLevel: 'warning',
});

// 2. every asset as a data URI
const TYPES: Record<string, string> = {
  png: 'image/png', json: 'application/json', xml: 'application/xml', txt: 'text/plain', mp3: 'audio/mpeg',
};
const files: string[] = [];
const walk = (dir: string) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
};
walk('public/assets');
const map: Record<string, string> = {};
let bytes = 0;
const audioManifest = JSON.parse(readFileSync('public/assets/audio/manifest.json', 'utf8')) as Record<string, Record<string, { file: string; samples: number }>>;
const smaller = new Map<string, Buffer>();
if (!FULL_AUDIO) {
  const tmp = join(OUT, '.tmp.mp3');
  let kept = 0;
  for (const cat of Object.keys(BITRATE)) {
    for (const e of Object.values(audioManifest[cat])) {
      const src = `public/assets/audio/${e.file}`;
      const out = smallerMp3(src, BITRATE[cat], e.samples, tmp);
      if (out && out.length < statSync(src).size) smaller.set(src, out);
      else kept++;
    }
  }
  rmSync(tmp, { force: true });
  console.log(`audio: ${smaller.size} music/ambience files re-encoded at ${BITRATE.music}/${BITRATE.amb}, ${kept} kept as they were`);
}
for (const f of files.sort()) {
  const ext = f.split('.').pop()!.toLowerCase();
  const type = TYPES[ext];
  if (!type) throw new Error(`no MIME type for ${f}`);
  const data = smaller.get(f) ?? readFileSync(f);
  // Phaser decodes base64 text with atob(), which only round-trips ASCII
  if (!type.startsWith('image/') && !type.startsWith('audio/') && !/^[\x00-\x7f]*$/.test(data.toString('latin1'))) {
    throw new Error(`${f} is not plain ASCII; it would be garbled in the portable build`);
  }
  bytes += data.length;
  map['assets/' + relative('public/assets', f).split('\\').join('/')] = `data:${type};base64,${data.toString('base64')}`;
}
writeFileSync(`${OUT}/assets-data.js`, `window.NL_ASSETS=${JSON.stringify(map)};\n`);

// 3. the page: same as the web build, with classic scripts
const html = readFileSync('index.html', 'utf8').replace(
  /<script type="module" src="\/src\/main.ts"><\/script>/,
  '<script defer src="assets-data.js"></script>\n<script defer src="game.js"></script>',
);
if (!html.includes('assets-data.js')) throw new Error('index.html: could not find the module script tag');
writeFileSync(`${OUT}/index.html`, html);

// 4. instructions
writeFileSync(
  `${OUT}/LIESMICH.txt`,
  `NIGHT LATCH - ein Noir-Detektiv-Adventure (Brackwater, 1951)

SPIELEN
  1. Die ZIP-Datei entpacken (nicht direkt aus der ZIP heraus starten).
  2. index.html doppelklicken. Das Spiel startet im Browser (Chrome, Edge, Firefox oder Safari).
  3. Am besten mit Ton spielen. Taste F schaltet auf Vollbild.

Es ist keine Installation und keine Internetverbindung nötig. Spielstände werden im Browser
gespeichert (Autosave bei jedem Kapitel und wichtigen Ereignissen, dazu 6 freie Speicherplätze).
Das Spiel ist auf Englisch.

STEUERUNG
  Linksklick auf den Boden ............ gehen
  Linksklick auf Dinge/Personen ....... benutzen, nehmen, öffnen, reden
  Rechtsklick auf Dinge/Personen ...... ansehen
  Gegenstand anklicken, dann Ziel ..... Gegenstand benutzen (Rechtsklick legt ihn zurück)
  Gegenstand auf Gegenstand ........... kombinieren
  Rechtsklick auf Gegenstand .......... genauer ansehen
  N  Notizbuch (Hinweise, Personen, Schlussfolgerungen, Zeitleiste)
  M  Stadtplan (von jeder Tür zur Straße)
  H  Tipp zum aktuellen Ziel (nochmal drücken für einen deutlicheren Tipp)
  Esc  Menü: Speichern, Laden, Einstellungen
  Tab / Leertaste  alle anklickbaren Stellen im Raum zeigen

Viel Spaß, Detective.
`,
);
writeFileSync(
  `${OUT}/README.txt`,
  `NIGHT LATCH - a noir point-and-click detective adventure (Brackwater, 1951)

TO PLAY: unzip the folder, then double-click index.html. It runs in your browser (Chrome, Edge,
Firefox or Safari), offline, with nothing to install. Saves are kept by the browser.

Left-click: walk / use / take / talk.  Right-click: look.  Click an item, then a target: use it.
N notebook, M map, H hint, Esc menu, Tab show hotspots, F fullscreen.
`,
);

// 5. the zip
mkdirSync('release', { recursive: true });
rmSync(`release/${NAME}.zip`, { force: true });
rmSync(`release/${NAME}`, { recursive: true, force: true });
execFileSync('cp', ['-r', OUT, `release/${NAME}`]);
execFileSync('zip', ['-q', '-r', '-9', `${NAME}.zip`, NAME], { cwd: 'release' });
rmSync(`release/${NAME}`, { recursive: true, force: true });
const zipSize = statSync(`release/${NAME}.zip`).size;
console.log(`portable build: ${files.length} assets (${(bytes / 1e6).toFixed(1)} MB) -> ${OUT}/, release/${NAME}.zip (${(zipSize / 1e6).toFixed(1)} MB)`);
