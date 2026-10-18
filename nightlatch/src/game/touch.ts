// Touch controls: the game is built around a mouse, so touches are turned into mouse events
// before Phaser sees them. A tap is a left click (walk / use), holding a finger still for a
// moment is a right click (look / put the item back), and a two-finger tap shows every hotspot.
const HOLD_MS = 450;
const SLOP = 12; // px a finger may wander before a press stops counting as a tap or hold

export const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export function installTouch(canvas: HTMLCanvasElement) {
  let start: { x: number; y: number } | null = null;
  let timer = 0;
  let held = false;

  const mouse = (type: string, x: number, y: number, button: number) =>
    canvas.dispatchEvent(new MouseEvent(type, {
      clientX: x, clientY: y, button, buttons: type === 'mouseup' ? 0 : 1 << (button === 2 ? 1 : 0),
      bubbles: true, cancelable: true, view: window,
    }));
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
    held = false;
    mouse('mousemove', t.clientX, t.clientY, 0); // shows the hover label under the finger
    timer = window.setTimeout(() => {
      if (!start) return;
      held = true;
      navigator.vibrate?.(15);
      click(start.x, start.y, 2);
    }, HOLD_MS);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    if (!start || !t) return;
    mouse('mousemove', t.clientX, t.clientY, 0);
    if (Math.hypot(t.clientX - start.x, t.clientY - start.y) > SLOP) {
      clearTimeout(timer);
      start = { x: t.clientX, y: t.clientY }; // a drag ends as a tap where the finger lifts
    }
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    if (start && !held) click(start.x, start.y, 0);
    start = null;
  }, { passive: false });

  canvas.addEventListener('touchcancel', () => {
    clearTimeout(timer);
    start = null;
  });
}
