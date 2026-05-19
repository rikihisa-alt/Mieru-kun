// 通知ユーティリティ(音+点滅)
// 注: 音は初回ユーザー操作後でないとブラウザがブロックする

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  try {
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    audioCtx = new Ctor();
    return audioCtx;
  } catch {
    return null;
  }
}

export function unlockAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function tone(freq: number, duration: number, startOffset: number) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

export function playNewOrderBeep() {
  // ピン
  tone(880, 0.15, 0);
}

export function playCallAlert() {
  // ピンポン×2 (より強く)
  tone(1100, 0.18, 0);
  tone(1100, 0.18, 0.22);
  tone(1100, 0.18, 0.44);
}
