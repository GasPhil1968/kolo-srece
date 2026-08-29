#!/usr/bin/env python3
"""Sieht sich eine Aufnahme an: Pegel, Spektrum, Schwebung.
   Nur zum Pruefen des Klangs - gehoert nicht zum Spiel selbst."""
import sys, wave, numpy as np

def load(p):
    w = wave.open(p, 'rb')
    n, sr = w.getnframes(), w.getframerate()
    d = np.frombuffer(w.readframes(n), dtype='<i2').astype(np.float64) / 32768.0
    ch = w.getnchannels()
    if ch == 2:
        d = d.reshape(-1, 2)
        return sr, d[:, 0], d[:, 1]
    return sr, d, d

def main(p):
    sr, L, R = load(p)
    m = (L + R) / 2
    print(f"{p}  {len(m)/sr:.2f}s  {sr} Hz")
    peak = np.max(np.abs(m)); rms = np.sqrt(np.mean(m**2))
    print(f"  Spitze {peak:.3f}   RMS {rms:.4f}   Stereobreite {np.sqrt(np.mean((L-R)**2)):.4f}")
    if peak >= .999: print("  ! uebersteuert")
    if rms < 1e-4: print("  ! praktisch still")

    # lauteste Sekunde spektral zerlegen
    win = int(sr * 0.5)
    if len(m) > win * 2:
        e = np.array([np.sum(m[i:i+win]**2) for i in range(0, len(m)-win, win//2)])
        st = int(np.argmax(e)) * (win//2)
    else:
        st = 0
    seg = m[st:st+win] * np.hanning(win)
    sp = np.abs(np.fft.rfft(seg)); fr = np.fft.rfftfreq(win, 1/sr)
    sp /= (sp.max() + 1e-12)
    pk = [(fr[i], sp[i]) for i in range(2, len(sp)-1)
          if sp[i] > sp[i-1] and sp[i] > sp[i+1] and sp[i] > .012]
    pk.sort(key=lambda x: -x[1])
    print(f"  Teiltoene (ab {st/sr:.2f}s):")
    for f, a in pk[:14]:
        print(f"    {f:8.1f} Hz  {20*np.log10(a+1e-12):6.1f} dB  {'#'*int(a*46)}")

    # Bandenergie
    def band(a, b):
        i = (fr >= a) & (fr < b)
        return 10*np.log10(np.sum(sp[i]**2) + 1e-12)
    print("  Baender: "
          + "  ".join(f"{n}:{band(a,b):.0f}" for n, a, b in
                      [("tief", 20, 200), ("mitte", 200, 900),
                       ("hoehe", 900, 4000), ("luft", 4000, 16000)]))

    # Schwebung: Huellkurve der lautesten Sekunde
    env = np.abs(np.convolve(np.abs(seg), np.ones(220)/220, 'same'))
    env -= env.mean()
    es = np.abs(np.fft.rfft(env * np.hanning(len(env))))
    ef = np.fft.rfftfreq(len(env), 1/sr)
    i = (ef > 0.6) & (ef < 30)
    if i.any():
        j = np.argmax(es[i])
        print(f"  Schwebung ~{ef[i][j]:.1f} Hz")

if __name__ == '__main__':
    for p in sys.argv[1:]: main(p); print()
