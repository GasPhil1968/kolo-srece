// Touch controls: the game is built around a mouse, so touches are turned into mouse events
// before Phaser sees them. A tap is a left click (walk / use), holding a finger still for a
// moment is a right click (look / put the item back), and a two-finger tap shows every hotspot.
// Dragging an item from the inventory onto something uses it there in one move.
const HOLD_MS = 450;
const SLOP = 12; // px a finger may wander before a press stops counting as a tap or hold
const GAME_W = 320;
const GAME_H = 180;
const PANEL_Y = 144; // the inventory bar starts here, in game pixels

export const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

/** Played rotated: the phone is held upright but the picture lies sideways (see index.html). */
export function isRotated() {
  return document.documentElement.classList.contains('rot') && window.matchMedia('(orientation: portrait)').matches;
}

export function installTouch(canvas: HTMLCanvasElement, refreshBounds: () => void = () => {}) {
  let start: { x: number; y: number } | null = null;
  let moved = false;
  let timer = 0;
  let held = false;

  /** Where a touch lands in game pixels, allowing for the picture being turned a quarter. */
  const toGame = (x: number, y: number): [number, number] => {
    const r = canvas.getBoundingClientRect();
    if (!isRotated()) return [((x - r.left) / r.width) * GAME_W, ((y - r.top) / r.height) * GAME_H];
    // turned 90 degrees clockwise: the canvas's left edge is at the top of the screen
    return [((y - r.top) / r.height) * GAME_W, ((r.right - x) / r.width) * GAME_H];
  };
  /** The page position Phaser reads as the given game pixel (it maps through the canvas's box). */
  const toClient = ([gx, gy]: [number, number]): [number, number] => {
    const r = canvas.getBoundingClientRect();
    return [r.left + (gx / GAME_W) * r.width, r.top + (gy / GAME_H) * r.height];
  };

  const mouse = (type: string, x: number, y: number, button: number) => {
    refreshBounds(); // Phaser must read the same box we map through (turning the picture moves it)
    const [cx, cy] = toClient(toGame(x, y));
    canvas.dispatchEvent(new MouseEvent(type, {
      clientX: cx, clientY: cy, button, buttons: type === 'mouseup' ? 0 : 1 << (button === 2 ? 1 : 0),
      bubbles: true, cancelable: true, view: window,
    }));
  };
  const click = (x: number, y: number, button: number) => {
    mouse('mousemove', x, y, 0);
    mouse('mousedown', x, y, button);
    mouse('mouseup', x, y, button);
  };

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    if (e.touches.length >= 2) {
      start = null;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', keyCode: 32 } as KeyboardEventInit));
      setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', keyCode: 32 } as KeyboardEventInit)), 50);
      return;
    }
    const t = e.touches[0];
    start = { x: t.clientX, y: t.clientY };
    moved = false;
    held = false;
    mouse('mousemove', t.clientX, t.clientY, 0); // shows the hover label under the finger
    timer = window.setTimeout(() => {
      if (!start || moved) return;
      held = true;
      navigator.vibrate?.(15);
      click(start.x, start.y, 2);
    }, HOLD_MS);
  }, { passive: false });

  let last: { x: number; y: number } | null = null;
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    if (!start || !t) return;
    last = { x: t.clientX, y: t.clientY };
    mouse('mousemove', t.clientX, t.clientY, 0);
    if (Math.hypot(t.clientX - start.x, t.clientY - start.y) > SLOP) {
      moved = true;
      clearTimeout(timer);
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    if (start && !held) {
      const end = moved && last ? last : start;
      const from = toGame(start.x, start.y);
      const to = toGame(end.x, end.y);
      if (moved && from[1] >= PANEL_Y && to[1] < PANEL_Y) {
        // dragged out of the inventory: pick the item up, then use it where the finger let go
        click(start.x, start.y, 0);
        click(end.x, end.y, 0);
      } else click(end.x, end.y, 0);
    }
    start = null;
    last = null;
  }, { passive: false });

  canvas.addEventListener('touchcancel', () => {
    clearTimeout(timer);
    start = null;
  });
}
