let ctx: AudioContext | null = null;
let sfx: GainNode | null = null;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    const master = ctx.createGain();
    sfx = ctx.createGain();
    sfx.gain.value = 0.55;
    master.gain.value = 0.9;
    sfx.connect(master);
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function bus() {
  if (!ctx || !sfx) return null;
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, sfx };
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.12, slide = 0) {
  const b = bus();
  if (!b) return;
  const t = b.ctx.currentTime;
  const o = b.ctx.createOscillator();
  const g = b.ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(b.sfx);
  o.start(t);
  o.stop(t + dur + 0.03);
}

function noiseBurst(dur: number, gain = 0.2, hp = 800) {
  const b = bus();
  if (!b) return;
  const n = b.ctx.createBuffer(1, b.ctx.sampleRate * dur, b.ctx.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
  const src = b.ctx.createBufferSource();
  src.buffer = n;
  const f = b.ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = hp;
  const g = b.ctx.createGain();
  const t = b.ctx.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(b.sfx);
  src.start(t);
  src.stop(t + dur);
}

export function sfxFire() {
  noiseBurst(0.09, 0.28, 400);
  tone(140, 0.08, "square", 0.1, -80);
  tone(980, 0.04, "triangle", 0.05, 200);
}

export function sfxHit() {
  tone(880, 0.05, "square", 0.08, 120);
}

export function sfxHead() {
  tone(1320, 0.07, "square", 0.1, 200);
  tone(660, 0.08, "triangle", 0.07, 80);
}

export function sfxHurt() {
  tone(180, 0.14, "sawtooth", 0.1, -90);
}

export function sfxReload() {
  tone(240, 0.08, "square", 0.06, 40);
  tone(180, 0.1, "triangle", 0.05, -20);
}

export function sfxEmpty() {
  tone(90, 0.05, "square", 0.05, 0);
}

export function sfxKill() {
  tone(523, 0.1, "triangle", 0.08, 0);
  tone(784, 0.14, "sine", 0.07, 40);
}
