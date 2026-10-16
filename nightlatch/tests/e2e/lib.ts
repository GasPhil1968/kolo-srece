// Shared helpers for the Playwright browser tests.
import { existsSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NL = any;
declare global {
  interface Window {
    __NL?: unknown;
  }
}

const CHROMIUM = [process.env.NL_CHROMIUM, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'].filter(
  (p): p is string => !!p,
);

/** Minimal static server for dist/ (no SPA fallback: missing files are real 404s). */
export async function serveDist(root = 'dist', port = 0): Promise<{ url: string; server: Server }> {
  const types: Record<string, string> = {
    '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.xml': 'application/xml',
    '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.txt': 'text/plain', '.css': 'text/css', '.webp': 'image/webp',
  };
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const file = join(root, path.endsWith('/') ? path + 'index.html' : path);
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  await new Promise<void>((r) => server.listen(port, '127.0.0.1', () => r()));
  const addr = server.address();
  const p = typeof addr === 'object' && addr ? addr.port : port;
  return { url: `http://127.0.0.1:${p}/`, server };
}

export interface Session {
  browser: Browser;
  page: Page;
  errors: string[];
}

export async function launch(url: string): Promise<Session> {
  const executablePath = CHROMIUM.find((p) => existsSync(p));
  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message + ' ' + (e.stack ?? '').split('\n').slice(0, 3).join(' | ')));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push('CONSOLE ' + m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  await page.goto(url);
  await page.waitForFunction(() => (window.__NL as NL)?.ready(), null, { timeout: 60000 });
  return { browser, page, errors };
}

/** Call a test hook in the page: call(page, 'route', 'office'). */
export function call<T = NL>(page: Page, method: string, ...args: unknown[]): Promise<T> {
  return page.evaluate(([m, a]) => (window.__NL as NL)[m as string](...(a as unknown[])), [method, args] as const) as Promise<T>;
}

export async function waitIdle(page: Page, timeout = 60000) {
  await page.waitForFunction(() => (window.__NL as NL).idle(), null, { timeout, polling: 50 });
}

export async function gameShot(page: Page, path: string) {
  const canvas = await page.$('canvas');
  await canvas!.screenshot({ path });
}

/** Game coordinates (320x180) to page coordinates. */
export async function toPage(page: Page, gx: number, gy: number): Promise<[number, number]> {
  const r = await page.evaluate(() => {
    const c = document.querySelector('canvas')!.getBoundingClientRect();
    return { x: c.left, y: c.top, w: c.width, h: c.height };
  });
  return [r.x + ((gx + 0.5) * r.w) / 320, r.y + ((gy + 0.5) * r.h) / 180];
}

export async function clickGame(page: Page, gx: number, gy: number, button: 'left' | 'right' = 'left') {
  const [x, y] = await toPage(page, gx, gy);
  await page.mouse.move(x, y, { steps: 2 });
  await page.waitForTimeout(25);
  await page.mouse.click(x, y, { button });
}

export async function clickButton(page: Page, scene: string, text: string) {
  const btns: { text: string; x: number; y: number }[] = await call(page, 'buttons', scene);
  const b = btns.find((x) => x.text.trim().toLowerCase().startsWith(text.toLowerCase()));
  if (!b) throw new Error(`no button "${text}" in ${scene}: ${btns.map((x) => x.text).join(' | ')}`);
  await clickGame(page, b.x, b.y);
}

/** Walk towards a hotspot or NPC until it is on screen; returns its screen point (game coords). */
export async function bringIntoView(page: Page, kind: 'hs' | 'npc', id: string): Promise<[number, number]> {
  for (let tries = 0; tries < 6; tries++) {
    const pt: [number, number] | null = await call(page, kind === 'hs' ? 'hotspotPoint' : 'npcPoint', id);
    if (pt) return pt;
    const wx: number | null = await call(page, kind === 'hs' ? 'hotspotWorldX' : 'npcWorldX', id);
    if (wx === null) throw new Error(`${kind} ${id} is not in this room`);
    const cam: number = await call(page, 'cameraX');
    const fp: [number, number] | null = await call(page, 'floorPoint', wx > cam + 160 ? 300 : 20);
    if (!fp) throw new Error(`no floor to walk towards ${id}`);
    await clickGame(page, fp[0], fp[1]);
    await page.waitForTimeout(150);
    await page.waitForFunction(() => (window.__NL as NL).idle(), null, { timeout: 30000, polling: 50 });
  }
  throw new Error(`${kind} ${id} never came on screen`);
}
