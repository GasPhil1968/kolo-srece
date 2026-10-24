// Re-encode the looping music and ambience at a lower constant bitrate (needs ffmpeg). Each
// re-encoded file must decode to exactly the manifest's sample count, so loops stay seamless;
// otherwise the original file is kept. Shared by the portable and the web build.
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const BITRATE: Record<string, string> = { music: '80k', amb: '48k' };

/** Re-encode one looping MP3; null if it would change its length. */
function smallerMp3(file: string, bitrate: string, samples: number, tmp: string): Buffer | null {
  const ch = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=channels', '-of', 'csv=p=0', file]).toString().trim();
  const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', ch, '-ar', '44100', 'pipe:1'], { maxBuffer: 1 << 30 });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', '44100', '-ac', ch, '-i', 'pipe:0', '-c:a', 'libmp3lame',
    '-b:a', bitrate, '-map_metadata', '-1', '-id3v2_version', '0', '-write_id3v1', '0', tmp], { input: pcm, maxBuffer: 1 << 30 });
  const back = execFileSync('ffmpeg', ['-v', 'error', '-i', tmp, '-f', 'f32le', '-ac', ch, '-ar', '44100', 'pipe:1'], { maxBuffer: 1 << 30 });
  const n = back.length / 4 / Number(ch);
  return n === samples ? readFileSync(tmp) : null;
}

/** Source path -> smaller MP3 bytes, for every music and ambience file that shrinks safely. `dir` must exist. */
export function smallerAudio(dir: string): { smaller: Map<string, Buffer>; kept: number } {
  const audioManifest = JSON.parse(readFileSync('public/assets/audio/manifest.json', 'utf8')) as Record<string, Record<string, { file: string; samples: number }>>;
  const tmp = join(dir, '.tmp.mp3');
  const smaller = new Map<string, Buffer>();
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
  return { smaller, kept };
}
