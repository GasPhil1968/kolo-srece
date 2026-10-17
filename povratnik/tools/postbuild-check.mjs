// After `vite build`: the silent game must ship no audio files and no audio code paths.
import { readdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const AUDIO = /\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|webm)$/i;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = await walk(dist);
const audio = files.filter((f) => AUDIO.test(f));
if (audio.length) {
  console.error('audio files in dist:\n' + audio.join('\n'));
  process.exit(1);
}
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8')).join('\n');
if (/new AudioContext|webkitAudioContext|new Audio\(/.test(js)) {
  console.error('audio API use found in the built JavaScript');
  process.exit(1);
}
console.log(`postbuild: ${files.length} files, no audio files or audio API use`);
