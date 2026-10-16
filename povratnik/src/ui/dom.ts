// Tiny DOM helpers.
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean | undefined> = {},
  children: (Node | string | null | undefined)[] = [],
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') e.className = String(v);
    else if (k === 'text') e.textContent = String(v);
    else if (k === 'style') e.setAttribute('style', String(v));
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined) continue;
    e.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

export function button(label: string, onClick: (ev: MouseEvent) => void, cls = 'btn', attrs: Record<string, string> = {}): HTMLButtonElement {
  const b = el('button', { class: cls, type: 'button', ...attrs }, [label]);
  b.addEventListener('click', (ev) => {
    ev.stopPropagation();
    onClick(ev);
  });
  return b;
}

export function clear(e: Element): void {
  while (e.firstChild) e.removeChild(e.firstChild);
}
