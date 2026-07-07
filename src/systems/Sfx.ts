// ============================================================
// Sfx.ts — 효과음 & 배경음 (에셋 없이 Web Audio API로 합성)
// 오디오 파일이 필요 없어 바이브코딩에 적합. 어디서나 import 해서 Sfx.xxx() 호출.
// 브라우저 정책상 첫 사용자 입력(터치/클릭) 후에 소리가 켜집니다 → unlock() 자동 처리.
// ============================================================

const MUTE_KEY = 'castaway_muted';

class SfxManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  // 스팸 방지용 마지막 재생 시각
  private lastShoot = 0;
  private lastHit = 0;
  private lastGem = 0;

  // 배경음 노드
  private bgmNodes: AudioNode[] = [];
  private bgmOn = false;

  constructor() {
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      /* ignore */
    }
    // 첫 입력에 오디오 잠금 해제
    const unlock = () => this.resume();
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', unlock);
      window.addEventListener('keydown', unlock);
    }
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  resume(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    if (!this.bgmOn && !this.muted) this.bgmStart();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
    }
    if (!m) this.resume();
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // ---- 기본 합성 헬퍼 ----
  private tone(freq: number, dur: number, opts: { type?: OscillatorType; vol?: number; to?: number; delay?: number } = {}): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = opts.type ?? 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), t0 + dur);
    const v = opts.vol ?? 0.15;
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, vol: number, filterFreq = 1200): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(filt).connect(g).connect(this.master);
    src.start();
    src.stop(ctx.currentTime + dur + 0.02);
  }

  // ---- 게임 효과음 ----
  shoot(): void {
    const now = performance.now();
    if (now - this.lastShoot < 90) return; // 연사 스팸 방지
    this.lastShoot = now;
    this.tone(620, 0.08, { type: 'square', vol: 0.06, to: 320 });
  }

  hit(): void {
    const now = performance.now();
    if (now - this.lastHit < 35) return;
    this.lastHit = now;
    this.noise(0.05, 0.05, 2200);
  }

  kill(): void {
    this.tone(420, 0.12, { type: 'triangle', vol: 0.12, to: 120 });
    this.noise(0.08, 0.05, 1000);
  }

  gem(): void {
    const now = performance.now();
    if (now - this.lastGem < 55) return;
    this.lastGem = now;
    this.tone(880, 0.06, { type: 'sine', vol: 0.09 });
    this.tone(1320, 0.07, { type: 'sine', vol: 0.08, delay: 0.05 });
  }

  levelup(): void {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, { type: 'sine', vol: 0.14, delay: i * 0.07 }));
  }

  hurt(): void {
    this.tone(220, 0.22, { type: 'sawtooth', vol: 0.16, to: 70 });
  }

  boss(): void {
    this.noise(0.6, 0.14, 500);
    this.tone(180, 0.6, { type: 'sawtooth', vol: 0.12, to: 60 });
  }

  waveClear(): void {
    this.tone(660, 0.1, { type: 'sine', vol: 0.12 });
    this.tone(990, 0.14, { type: 'sine', vol: 0.12, delay: 0.1 });
  }

  victory(): void {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, { type: 'sine', vol: 0.16, delay: i * 0.12 }));
  }

  defeat(): void {
    [440, 349, 262].forEach((f, i) => this.tone(f, 0.4, { type: 'triangle', vol: 0.15, delay: i * 0.18 }));
  }

  click(): void {
    this.tone(700, 0.05, { type: 'square', vol: 0.08 });
  }

  // ---- 배경음: 잔잔한 파도 + 낮은 드론 ----
  private bgmStart(): void {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.bgmOn) return;
    this.bgmOn = true;

    // 파도 워시 (핑크노이즈 → 로우패스 → LFO로 밀려왔다 나가는 게인)
    const len = Math.floor(ctx.sampleRate * 3);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // 핑크빛 노이즈
      d[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 450;
    const washGain = ctx.createGain();
    washGain.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12; // 느린 파도 주기
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(washGain.gain);
    src.connect(lp).connect(washGain).connect(this.master);

    // 낮은 드론(따뜻함)
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 110;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.025;
    drone.connect(droneGain).connect(this.master);

    src.start();
    lfo.start();
    drone.start();
    this.bgmNodes = [src, lfo, drone];
  }
}

export const Sfx = new SfxManager();
