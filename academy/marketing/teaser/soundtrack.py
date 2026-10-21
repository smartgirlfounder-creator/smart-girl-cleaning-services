"""Original soundtrack for the Smart Cleaners Academy teaser (18.5 s, 48 kHz stereo).

Every sound is synthesised here from sine waves and noise, so the audio is
original and free to use commercially. Cue times match stage.html.
Usage: python3 soundtrack.py  ->  soundtrack.wav
"""
import wave

import numpy as np

SR = 48000
DUR = 18.5
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N)
R = np.zeros(N)


def note(name):
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    pitch, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[pitch] + (octave - 4) * 12) / 12)


def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    L[i : i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 - pan))
    R[i : i + len(sig)] += sig * gain * np.sqrt(0.5 * (1 + pan))


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def env(dur, attack=0.005, decay=None, release=0.05):
    t = tt(dur)
    e = np.minimum(1, t / max(attack, 1e-4))
    if decay:
        e *= np.exp(-t / decay)
    rel = np.clip((dur - t) / release, 0, 1)
    return e * rel


def onepole(x, cutoff):
    """One-pole low-pass. cutoff may be a scalar or a per-sample array (Hz)."""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def fft_filter(x, lo=None, hi=None):
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    gain = np.ones_like(f)
    if lo:
        gain *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    if hi:
        gain *= 1 / np.sqrt(1 + (f / hi) ** 4)
    return np.fft.irfft(spec * gain, len(x))


# ---------- Building blocks ----------

def pad(freqs, dur, attack=1.2, release=1.5, bright=0.25):
    t = tt(dur)
    out = np.zeros_like(t)
    for k, f in enumerate(freqs):
        for det in (-0.12, 0.0, 0.13):
            ff = f * 2 ** (det / 12)
            ph = rng.uniform(0, 2 * np.pi)
            out += np.sin(2 * np.pi * ff * t + ph) + bright * np.sin(4 * np.pi * ff * t + ph) * 0.5 + bright * 0.25 * np.sin(6 * np.pi * ff * t + ph)
    e = np.minimum(1, t / attack) * np.clip((dur - t) / release, 0, 1)
    return out * e / (len(freqs) * 3)


def pluck(f, dur=0.35, decay=0.12):
    t = tt(dur)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) * np.exp(-t / 0.04)
    return s * env(dur, 0.002, decay, 0.03)


def kick(f0=110, f1=42, dur=0.5, decay=0.18):
    t = tt(dur)
    freq = f1 + (f0 - f1) * np.exp(-t / 0.04)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(phase) * env(dur, 0.001, decay, 0.05)


def hat(dur=0.06):
    n = rng.standard_normal(int(dur * SR))
    return fft_filter(n, lo=7000) * env(dur, 0.001, 0.018, 0.01)


def impact(big=False):
    dur = 3.2 if big else 0.9
    t = tt(dur)
    f0, f1 = (75, 28) if big else (120, 45)
    freq = f1 + (f0 - f1) * np.exp(-t / (0.35 if big else 0.08))
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env(dur, 0.002, 1.1 if big else 0.25, 0.2)
    n = rng.standard_normal(len(t))
    burst = fft_filter(n, hi=2500 if big else 4000) * env(dur, 0.001, 0.25 if big else 0.07, 0.1)
    return body + 0.35 * burst


def riser(dur, f_lo=300, f_hi=7000, tone=(180, 900)):
    t = tt(dur)
    k = t / dur
    cutoff = f_lo * (f_hi / f_lo) ** (k ** 1.6)
    n = onepole(rng.standard_normal(len(t)), cutoff)
    n = n - onepole(n, cutoff * 0.25)
    sweep = tone[0] * (tone[1] / tone[0]) ** k
    s = np.sin(2 * np.pi * np.cumsum(sweep) / SR)
    return (0.8 * n / (np.max(np.abs(n)) + 1e-9) + 0.12 * s) * (k ** 2.2) * np.clip((dur - t) / 0.02, 0, 1)


def chime(f, dur=1.4, decay=0.5):
    t = tt(dur)
    partials = [(1, 1), (2.0, 0.35), (2.76, 0.18), (5.4, 0.08)]
    s = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * m / (decay * 2.2)) for m, a in partials)
    return s * env(dur, 0.002, decay, 0.1)


def click():
    n = rng.standard_normal(int(0.03 * SR))
    return fft_filter(n, lo=2500, hi=9000) * env(0.03, 0.0005, 0.006, 0.005)


def shimmer(dur=3.5):
    t = tt(dur)
    out_l = np.zeros_like(t)
    out_r = np.zeros_like(t)
    for _ in range(40):
        f = rng.uniform(2200, 7500)
        start = rng.uniform(0, 0.6)
        a = rng.uniform(0.3, 1) * np.exp(-np.maximum(t - start, 0) / rng.uniform(0.6, 1.8)) * (t >= start)
        s = np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * a
        p = rng.uniform(-1, 1)
        out_l += s * (1 - p) / 2
        out_r += s * (1 + p) / 2
    return out_l / 20, out_r / 20


# ---------- Scene 1: the mystery (0–3 s) ----------
t = tt(3.4)
rumble = (np.sin(2 * np.pi * 36 * t) * 0.6 + np.sin(2 * np.pi * 54 * t) * 0.3) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.7 * t))
rumble += 0.5 * onepole(rng.standard_normal(len(t)), 120)
add(rumble * np.minimum(1, t / 1.6) * np.clip((3.4 - t) / 0.4, 0, 1), 0.0, 0.22)
for k, b in enumerate((0.6, 1.45, 2.3)):
    add(kick(95, 40, 0.7, 0.25), b, 0.16 + 0.07 * k)
add(riser(1.55, 250, 6000, (160, 700)), 1.6, 0.35)
add(pad([note("A2"), note("E3")], 3.4, attack=2.0, release=0.6, bright=0.1), 0.0, 0.18)

# ---------- Scene 2: the reveal (3–7 s) ----------
add(click(), 3.2, 0.5)
add(chime(note("E6"), 1.2, 0.35), 3.22, 0.22, -0.3)
add(chime(note("A6"), 1.4, 0.4), 3.34, 0.2, 0.3)
add(impact(False), 3.2, 0.35)
add(pad([note("A2"), note("E3"), note("A3"), note("C4"), note("E4")], 4.2, attack=1.4, release=0.5, bright=0.35), 3.0, 0.6)
for i in range(16):  # soft digital pulses
    tt0 = 4.5 + i * 0.125
    add(pluck([note("A4"), note("E5"), note("C5"), note("E5")][i % 4], 0.25, 0.06), tt0, 0.16 + 0.1 * i / 16, (-0.4, 0.4)[i % 2])
add(riser(0.65, 600, 9000, (300, 1200)), 6.35, 0.3)

# ---------- Scene 3: the experience (7–12 s), 120 BPM ----------
chords = [
    ([note("A2"), note("C4"), note("E4"), note("A4")], note("A1")),
    ([note("F2"), note("A3"), note("C4"), note("F4")], note("F1")),
    ([note("C3"), note("E4"), note("G4"), note("C5")], note("C2")),
    ([note("G2"), note("B3"), note("D4"), note("G4")], note("G1")),
]
for c, (tones, bass) in enumerate(chords):
    start = 7.0 + c * 1.225
    add(pad(tones, 1.4, attack=0.08, release=0.25, bright=0.4), start, 0.26)
    bt = tt(1.2)
    add(np.sin(2 * np.pi * bass * bt) * env(1.2, 0.01, 0.6, 0.1) + 0.3 * np.sin(4 * np.pi * bass * bt) * env(1.2, 0.01, 0.3, 0.1), start, 0.4)
    for s16 in range(10):
        f = tones[1:][s16 % 3] * (2 if s16 % 4 == 3 else 1)
        add(pluck(f, 0.22, 0.05), start + s16 * 0.1225, 0.12, (-0.5, 0.5)[s16 % 2])
for beat in np.arange(7.0, 11.9, 0.5):
    add(kick(), beat, 0.45)
for eighth in np.arange(7.25, 11.9, 0.5):
    add(hat(), eighth, 0.18, 0.3)
for hit in (7.0, 8.6, 10.2):
    add(impact(False), hit, 0.5)
for ui in (7.4, 7.8, 8.2):  # cleaning steps completing
    add(click(), ui, 0.35)
    add(chime(note("E6") * (1.12 if ui > 7.6 else 1), 0.6, 0.15), ui + 0.01, 0.12, 0.2)
add(chime(note("D#5"), 0.8, 0.25), 8.62, 0.12, -0.2)  # the safety stop: a muted, minor tone
add(chime(note("A4"), 0.8, 0.25), 8.62, 0.12, 0.2)
for k, f in enumerate((note("C6"), note("E6"), note("G6"))):  # the 100/100 result
    add(chime(f, 0.9, 0.3), 10.25 + k * 0.09, 0.14, (-0.3, 0, 0.3)[k])
add(riser(1.9, 300, 9000, (200, 1400)), 11.05, 0.5)
add(pad([note("A2"), note("D3"), note("E3"), note("A3")], 1.25, attack=0.35, release=0.15, bright=0.3), 11.8, 0.45)  # held suspense into the reveal

# ---------- Scene 4: the hero reveal (12–16 s) ----------
add(impact(True), 12.98, 0.75)
sl, sr = shimmer(4.0)
L[int(13.0 * SR) : int(13.0 * SR) + len(sl)] += sl * 0.9
R[int(13.0 * SR) : int(13.0 * SR) + len(sr)] += sr * 0.9
add(pad([note("F2"), note("C3"), note("F3"), note("A3"), note("C4"), note("G4")], 5.4, attack=0.25, release=2.0, bright=0.45), 13.0, 0.42)
add(pad([note("F1"), note("C2")], 5.0, attack=0.1, release=1.8, bright=0.0), 13.0, 0.35)

# ---------- Scene 5: the launch ending (16–18.5 s) ----------
for k, f in enumerate((note("A5"), note("E6"), note("A6"))):
    add(chime(f, 2.2, 0.7), 16.05 + k * 0.2, 0.2, (-0.25, 0.0, 0.25)[k])
add(kick(80, 35, 1.2, 0.5), 16.05, 0.35)
add(pad([note("A2"), note("E3"), note("A3"), note("C#4"), note("E4")], 2.4, attack=0.6, release=1.2, bright=0.3), 16.1, 0.25)

# ---------- Master ----------
mix = np.stack([L, R])
fade = np.ones(N)
fi = int(17.7 * SR)
fade[fi:] = np.linspace(1, 0, N - fi) ** 1.5
fade[: int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
mix *= fade
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix *= 0.89 / np.max(np.abs(mix))
pcm = (mix.T * 32767).astype(np.int16)
with wave.open("soundtrack.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("soundtrack.wav written")
