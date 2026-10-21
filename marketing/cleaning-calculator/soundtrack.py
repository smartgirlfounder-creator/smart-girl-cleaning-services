"""Original soundtrack for the Cleaning Calculator Pro walkthrough.

Synthesised from sine waves and noise, so it is free to use commercially.
All timing comes from cues.json (written by `node render.mjs cues`), so the music
follows the video: risers into each stage, taps on buttons, pops on cards,
blips when the live total changes.
Usage: python3 soundtrack.py  ->  soundtrack.wav
"""
import json
import wave

import numpy as np

cues = json.load(open("cues.json"))
SR = 44100
DUR = float(cues["duration"])
N = int(SR * DUR)
rng = np.random.default_rng(11)
L = np.zeros(N)
R = np.zeros(N)


def note(name):
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    return 440.0 * 2 ** ((names[name[:-1]] + (int(name[-1]) - 4) * 12) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(d, a=0.005, decay=None, r=0.05):
    t = tt(d)
    e = np.minimum(1, t / max(a, 1e-4))
    if decay:
        e *= np.exp(-t / decay)
    return e * np.clip((d - t) / r, 0, 1)


def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N or i + len(sig) <= 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 - pan))
    R[i : i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 + pan))


def bandpass(x, lo=None, hi=None):
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    return np.fft.irfft(spec * g, len(x))


def pad(freqs, d, a=0.8, r=1.0, bright=0.3):
    t = tt(d)
    out = np.zeros_like(t)
    for f in freqs:
        for det in (-0.1, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            ph = rng.uniform(0, 6.28)
            out += np.sin(2 * np.pi * ff * t + ph) + bright * 0.5 * np.sin(4 * np.pi * ff * t + ph)
    return out * np.minimum(1, t / a) * np.clip((d - t) / r, 0, 1) / (len(freqs) * 3)


def pluck(f, d=0.3, decay=0.09):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.03)) * env(d, 0.002, decay, 0.03)


def kick(f0=105, f1=44, d=0.45, decay=0.16):
    t = tt(d)
    freq = f1 + (f0 - f1) * np.exp(-t / 0.035)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(d, 0.001, decay, 0.05)


def hat(d=0.05):
    return bandpass(rng.standard_normal(int(d * SR)), lo=7500) * env(d, 0.001, 0.015, 0.01)


def snap(d=0.18):
    n = bandpass(rng.standard_normal(int(d * SR)), lo=1200, hi=6000)
    return n * env(d, 0.001, 0.05, 0.02)


def impact(big=False):
    d = 3.0 if big else 0.8
    t = tt(d)
    f0, f1 = (80, 30) if big else (120, 48)
    freq = f1 + (f0 - f1) * np.exp(-t / (0.3 if big else 0.07))
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(d, 0.002, 1.0 if big else 0.22, 0.2)
    burst = bandpass(rng.standard_normal(len(t)), hi=2500 if big else 4000) * env(d, 0.001, 0.22 if big else 0.06, 0.1)
    return body + 0.3 * burst


def riser(d):
    t = tt(d)
    k = t / d
    n = rng.standard_normal(len(t))
    # sweep a band upward by mixing progressively brighter filtered noise
    lowband = bandpass(n, lo=300, hi=1500)
    highband = bandpass(n, lo=2500, hi=9000)
    sweep = np.sin(2 * np.pi * np.cumsum(220 * (6 ** k)) / SR)
    s = (1 - k) * lowband + k * highband
    s = s / (np.max(np.abs(s)) + 1e-9)
    return (0.75 * s + 0.12 * sweep) * k**2.4 * np.clip((d - t) / 0.02, 0, 1)


def chime(f, d=1.0, decay=0.35):
    t = tt(d)
    parts = [(1, 1), (2.0, 0.3), (2.76, 0.15), (5.4, 0.06)]
    return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * m / (decay * 2.2)) for m, a in parts) * env(d, 0.002, decay, 0.08)


def click():
    return bandpass(rng.standard_normal(int(0.025 * SR)), lo=2500, hi=9000) * env(0.025, 0.0005, 0.005, 0.004)


def pop(f=880):
    t = tt(0.14)
    freq = f * (1 + 0.6 * np.exp(-t / 0.02))
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(0.14, 0.002, 0.04, 0.02)


def shimmer(d=3.0):
    t = tt(d)
    lo, ro = np.zeros_like(t), np.zeros_like(t)
    for _ in range(36):
        f = rng.uniform(2200, 7000)
        st = rng.uniform(0, 0.5)
        a = rng.uniform(0.3, 1) * np.exp(-np.maximum(t - st, 0) / rng.uniform(0.5, 1.6)) * (t >= st)
        s = np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * a
        p = rng.uniform(-1, 1)
        lo += s * (1 - p) / 2
        ro += s * (1 + p) / 2
    return lo / 18, ro / 18


stages = cues["stages"]
first, end = stages[0], cues["hero"]

# ---------- Opening: the problem (tense, sparse) ----------
t = tt(3.6)
drone = (np.sin(2 * np.pi * 55 * t) * 0.6 + np.sin(2 * np.pi * 82.4 * t) * 0.25) * np.minimum(1, t / 1.2) * np.clip((3.6 - t) / 0.4, 0, 1)
add(drone, 0, 0.22)
for b in np.arange(0.4, 3.3, 0.5):  # ticking clock
    add(click(), b, 0.35, 0.3 if int(b * 2) % 2 else -0.3)
for s in cues["problems"]:
    add(snap(), s, 0.35)
add(riser(1.2), cues["reveal"] - 1.2, 0.3)

# ---------- Reveal ----------
r0 = cues["reveal"]
add(impact(), r0, 0.45)
add(chime(note("E6"), 1.2, 0.4), r0 + 0.02, 0.18, -0.3)
add(chime(note("B6"), 1.2, 0.4), r0 + 0.14, 0.15, 0.3)
add(pad([note("A2"), note("E3"), note("A3"), note("C4"), note("E4")], first - r0 + 0.3, a=1.0, r=0.4, bright=0.3), r0, 0.45)

# ---------- Main groove: 104 BPM, Am – F – C – G ----------
BPM = 104
beat = 60 / BPM
bar = beat * 4
chords = [
    ([note("A2"), note("C4"), note("E4"), note("A4")], note("A1")),
    ([note("F2"), note("A3"), note("C4"), note("F4")], note("F1")),
    ([note("C3"), note("E4"), note("G4"), note("C5")], note("C2")),
    ([note("G2"), note("B3"), note("D4"), note("G4")], note("G1")),
]
split = cues["split"]
t0 = first
i = 0
while t0 < end - 0.05:
    tones, bass = chords[i % 4]
    length = min(bar, end - t0)
    calm = split <= t0 < split + 3.5  # the split-screen moment breathes
    add(pad(tones, length + 0.25, a=0.08, r=0.3, bright=0.35), t0, 0.2 if not calm else 0.28)
    bt = tt(length)
    bass_sig = (np.sin(2 * np.pi * bass * bt) + 0.25 * np.sin(4 * np.pi * bass * bt)) * env(length, 0.01, None, 0.1)
    add(bass_sig, t0, 0.0 if calm else 0.22)
    for b in range(4):
        tb = t0 + b * beat
        if tb >= end:
            break
        if not calm:
            add(kick(), tb, 0.38)
            add(hat(), tb + beat / 2, 0.12, 0.25)
            if b in (1, 3):
                add(snap(0.12), tb, 0.08, -0.15)
        for e in range(2):  # gentle arpeggio
            f = tones[1:][(b * 2 + e) % 3] * (2 if (b + e) % 4 == 3 else 1)
            add(pluck(f, 0.25, 0.07), tb + e * beat / 2, 0.07 if not calm else 0.1, (-0.4, 0.4)[e])
    t0 += bar
    i += 1

# ---------- Stage transitions ----------
for s in stages[1:]:
    if s >= end:
        continue
    add(riser(0.9), s - 0.9, 0.22)
    add(impact(), s, 0.3)
    add(chime(note("A5"), 0.8, 0.25), s + 0.02, 0.08, 0.2)

# ---------- Interface sounds ----------
for x in cues["taps"]:
    add(click(), x, 0.45)
    add(pop(1320), x + 0.01, 0.08)
for x in cues["highlights"]:
    add(pop(990), x, 0.06, 0.2)
for x in cues["cards"]:
    add(pop(740), x, 0.12, -0.2)
    add(bandpass(rng.standard_normal(int(0.25 * SR)), lo=800, hi=5000) * env(0.25, 0.08, None, 0.15), x - 0.08, 0.05)
for k, x in enumerate(cues["counts"]):
    add(chime(note("C6") * 2 ** (k / 12 * 2), 0.5, 0.15), x, 0.12, 0.3)
for k, x in enumerate(cues["chips"]):
    add(pluck(note("E5") * 2 ** ((k % 4) * 3 / 12), 0.2, 0.06), x, 0.1, (-0.5, 0.5)[k % 2])
add(impact(), split, 0.35)

# ---------- Hero finish ----------
add(riser(1.4), end - 1.4, 0.35)
add(impact(True), end, 0.7)
sl, sr = shimmer(3.5)
i0 = int(end * SR)
L[i0 : i0 + len(sl)] += sl[: N - i0] * 0.8
R[i0 : i0 + len(sr)] += sr[: N - i0] * 0.8
add(pad([note("A2"), note("E3"), note("A3"), note("C#4"), note("E4"), note("B4")], DUR - end, a=0.2, r=2.0, bright=0.45), end, 0.4)
for k, f in enumerate((note("A5"), note("E6"), note("A6"))):
    add(chime(f, 2.4, 0.8), end + 1.1 + k * 0.18, 0.16, (-0.3, 0, 0.3)[k])

# ---------- Master ----------
mix = np.stack([L, R])
fade = np.ones(N)
fi = int((DUR - 2.2) * SR)
fade[fi:] = np.linspace(1, 0, N - fi) ** 1.4
fade[: int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
mix *= fade
mix = np.tanh(mix * 1.5) / np.tanh(1.5)
mix *= 0.89 / np.max(np.abs(mix))
with wave.open("soundtrack.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype(np.int16).tobytes())
print("soundtrack.wav written")
