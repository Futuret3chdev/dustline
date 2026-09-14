let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    sfx = ctx.createGain();
    sfx.gain.value = 0.7;
    master.gain.value = 0.85;
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

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.12, slide = 0) {
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
  o.stop(t + dur + 0.02);
}

export function sfxShoot() {
  beep(420 + Math.random() * 40, 0.08, "triangle", 0.1, 180);
  beep(880, 0.05, "sine", 0.04, 200);
}

export function sfxBounce() {
  beep(520, 0.06, "square", 0.05, -80);
}

export function sfxPop(n: number) {
  const f = 380 + Math.min(8, n) * 55;
  beep(f, 0.12, "sine", 0.11, 240);
  beep(f * 2, 0.08, "triangle", 0.05, 120);
}

export function sfxDrop() {
  beep(180, 0.16, "sawtooth", 0.07, -80);
}

export function sfxWin() {
  beep(523, 0.14, "triangle", 0.1, 0);
  beep(659, 0.16, "triangle", 0.1, 0);
  beep(784, 0.22, "sine", 0.1, 80);
}

export function sfxLose() {
  beep(220, 0.28, "sawtooth", 0.1, -140);
  beep(140, 0.4, "triangle", 0.08, -60);
}

export function sfxClick() {
  beep(640, 0.04, "square", 0.04, 40);
}
