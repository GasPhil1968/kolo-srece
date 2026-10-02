"""Procedural renderer for the Šargija UI button kit (transparent RGBA PNGs)."""
import json, os
import numpy as np
from PIL import Image

OUT = "/home/user/kolo-srece/ui-kit"
SS = 4  # supersampling factor for anti-aliased edges

def hx(h): h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], float) / 255
NIGHT, WINE, EMBER, CREAM = hx('0a0908'), hx('6b1119'), hx('d43a2a'), hx('f4ead6')
AMBER, BRASS, DWOOD, WALNUT = hx('f0a83c'), hx('c9a24a'), hx('2a170a'), hx('3d2412')
def over(c, a, base=NIGHT): return base * (1 - a) + c * a
def mix(a, b, t): return a * (1 - t) + b * t

RADIUS, BORDER = 2, 2   # export px (= 1 logical px each, matches CSS border-radius:1px / 1px border)

FAMILIES = [
  # key, logical size, face L, face R, gradient mode, border, highlight border, chip?, usage
  dict(key="menu_primary", size=(320, 40), faceL=over(WINE, .55), faceR=over(AMBER, .05), grad="lr",
       border=over(EMBER, .72), usage="Main menu rows: songs, practice, free play, instructions, settings (left label + right status)."),
  dict(key="menu_quiet", size=(320, 40), faceL=over(AMBER, .045), faceR=over(AMBER, .03), grad="lr",
       border=over(BRASS, .45), usage="Secondary / quiet menu rows."),
  dict(key="action_primary", size=(320, 36), faceL=over(WINE, .62), faceR=over(WINE, .38), grad="center",
       border=over(EMBER, .8), usage="Primary wide actions: replay, repeat song, repeat verse, practise weak passages."),
  dict(key="action_secondary", size=(320, 36), faceL=hx('17120e'), faceR=hx('100d0b'), grad="center",
       border=over(mix(CREAM, BRASS, .55), .4), usage="Secondary wide actions on result screens and navigation."),
  dict(key="card_play", size=(112, 32), faceL=over(EMBER, .24), faceR=over(WINE, .5), grad="center",
       border=over(EMBER, .78), usage="Song-card PLAY button."),
  dict(key="card_demo", size=(40, 32), faceL=hx('120e0b'), faceR=hx('0e0c0a'), grad="center",
       border=over(BRASS, .6), usage="Song-card DEMO / listen button (icon added in HTML)."),
  dict(key="back", size=(80, 28), faceL=hx('110d0b'), faceR=hx('0d0b09'), grad="center",
       border=over(mix(CREAM, BRASS, .5), .34), usage="BACK / MENU button for subscreens and in-play menu."),
  dict(key="settings_chip", size=(96, 48), faceL=hx('13100d'), faceR=hx('0f0c0a'), grad="center",
       border=over(CREAM, .22), chip=True, usage="Settings / language chips: difficulty, instrument, sound colour, effects, language (title + subtitle)."),
  dict(key="song_option_chip", size=(48, 24), faceL=hx('13100d'), faceR=hx('0f0c0a'), grad="center",
       border=over(CREAM, .22), chip=True, usage="Compact song option chips inside song cards."),
]

def grain_field(w, h, seed):
    """Wood grain running along x; identical for every state of a family (fixed seed)."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w].astype(float) / SS
    warp = np.zeros_like(x)
    for _ in range(4):
        f, ph, amp = rng.uniform(.004, .03), rng.uniform(0, 6.28), rng.uniform(.6, 2.2)
        warp += amp * np.sin(x * f + ph + y * rng.uniform(-.01, .01))
    period = rng.uniform(5.5, 7.5)
    g = np.sin((y + warp) * 2 * np.pi / period)
    g2 = np.sin((y * 2.7 + warp * 1.6) * 2 * np.pi / period + 1.3)
    g = .65 * g + .35 * g2
    return g  # -1..1

def render(fam, state, idx):
    lw, lh = fam["size"]; W, H = lw * 2, lh * 2
    w, h = W * SS, H * SS
    y, x = np.mgrid[0:h, 0:w].astype(float) / SS + .5 / SS  # export-px coordinates
    # rounded-rect masks (outer silhouette fills the canvas; transparent only at rounded corners)
    def rr(inset, r):
        cx = np.clip(x, inset + r, W - inset - r); cy = np.clip(y, inset + r, H - inset - r)
        inside = (x >= inset) & (x <= W - inset) & (y >= inset) & (y <= H - inset)
        return inside & ((x - cx) ** 2 + (y - cy) ** 2 <= r * r)
    outer = rr(0, RADIUS); inner = rr(BORDER, max(RADIUS - BORDER, .01))
    u, v = x / W, y / H

    # --- face colour ---------------------------------------------------------------
    t = u if fam["grad"] == "lr" else np.abs(u - .5) * 2
    face = fam["faceL"][None, None] * (1 - t[..., None]) + fam["faceR"][None, None] * t[..., None]
    g = grain_field(w, h, 1000 + idx)[..., None]
    grain_amp = .022
    shade = (1 + .05 * (.5 - v))[..., None]               # shallow top-to-bottom warmth
    border = fam["border"].copy()
    warm = np.zeros(3)

    if state == "highlighted":
        border = mix(border, AMBER, .62)
        warm = (AMBER * .05 + EMBER * .035)
    elif state == "pressed":
        shade = shade * .74
        border = border * .86
    elif state == "selected":
        border = over(EMBER, .95)
        warm = EMBER * .085
    elif state == "disabled":
        border = over(CREAM, .08)
        face = mix(face, NIGHT[None, None], .55)
        grain_amp = .009

    face = face * shade + warm
    face = face + grain_amp * g * (hx('8a5a2c') - .25)[None, None] * 1.0
    # top inner hairline (soft amber light) for raised states
    if state in ("normal", "highlighted", "selected"):
        lit = np.exp(-((y - BORDER - .5) ** 2) / 1.2)[..., None]
        k = {"normal": .05, "highlighted": .08, "selected": .06}[state]
        face = face + lit * AMBER * k
    if state == "pressed":   # shallow inset shadow on top & left inner edges
        depth = max(4.0, H * .14)
        st = np.exp(-np.clip(y - BORDER, 0, None) / (depth * .45))
        sl = np.exp(-np.clip(x - BORDER, 0, None) / (depth * .45))
        sh = 1 - .55 * np.maximum(st, .8 * sl)
        face = face * sh[..., None]

    # border: subtle vertical gradient for a brass/ember edge feel
    bcol = border[None, None] * (1.08 - .16 * v)[..., None]
    rgb = np.where(inner[..., None], face, bcol)
    rgb = np.clip(rgb, 0, 1)
    a = outer.astype(float)
    # downsample (premultiplied) for clean AA without halos
    pm = rgb * a[..., None]
    pm = pm.reshape(H, SS, W, SS, 3).mean((1, 3)); A = a.reshape(H, SS, W, SS).mean((1, 3))
    col = np.where(A[..., None] > 0, pm / np.maximum(A[..., None], 1e-6), 0)
    img = np.dstack([col, A])
    return Image.fromarray((np.clip(img, 0, 1) * 255 + .5).astype(np.uint8), "RGBA")

def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = []; sheet_rows = []
    for idx, fam in enumerate(FAMILIES):
        states = ["normal", "highlighted", "pressed"] + (["selected", "disabled"] if fam.get("chip") else [])
        lw, lh = fam["size"]; W, H = lw * 2, lh * 2
        shadow = int(np.ceil(max(4.0, H * .14) * 1.4))
        ins = dict(left=max(6, shadow), top=max(6, min(shadow, H // 2 - 2)), right=6, bottom=6)
        row = []
        for s in states:
            im = render(fam, s, idx); fn = f"shargija_{fam['key']}_{s}.png"
            im.save(os.path.join(OUT, fn)); row.append(im)
            manifest.append(dict(file=fn, family=fam["key"], state=s, export_px=[W, H], logical_px=[lw, lh],
                                 nine_slice_export_px=ins,
                                 nine_slice_logical_px={k: v / 2 for k, v in ins.items()},
                                 usage=fam["usage"]))
        sheet_rows.append(row)
    json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=2, ensure_ascii=False)
    # hero sheet: assets pasted unmodified at export scale on #0a0908
    pad, gap = 64, 40
    colw = [max(r[c].width for r in sheet_rows if c < len(r)) for c in range(5)]
    Wt = pad * 2 + sum(colw) + gap * 4
    Ht = pad * 2 + sum(r[0].height for r in sheet_rows) + gap * (len(sheet_rows) - 1)
    sheet = Image.new("RGBA", (Wt, Ht), (10, 9, 8, 255)); yy = pad
    for r in sheet_rows:
        xx = pad
        for c, im in enumerate(r):
            sheet.alpha_composite(im, (xx + (colw[c] - im.width) // 2, yy)); xx += colw[c] + gap
        yy += r[0].height + gap
    sheet.convert("RGB").save(os.path.join(OUT, "shargija_ui_kit_hero_sheet.png"))
    print(len(manifest), "assets; sheet", sheet.size)

main()
