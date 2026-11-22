/**
 * 過場黑色時空旋渦專屬音效合成器（Web Audio API 零外部檔案依賴）：
 * - 支援 iPad Safari / iOS / macOS / Windows / Android 首次觸控自動解鎖音訊
 * - 提供持續低頻黑洞旋渦風聲、主角旋轉吸入呼嘯聲、跌出旋渦與落入清朝古韻鐘磬音
 */

class VortexSfxController {
  private ctx: AudioContext | null = null;
  private ambienceMaster: GainNode | null = null;
  private ambienceNodes: Array<AudioNode & { stop?: (when?: number) => void }> = [];
  private isRunningAmbience = false;
  public muted = false;

  constructor() {
    this.installGlobalGestureUnlock();
  }

  private getOrCreateContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private installGlobalGestureUnlock(): void {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      const ctx = this.getOrCreateContext();
      if (!ctx) return;
      try {
        const silent = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = silent;
        src.connect(ctx.destination);
        src.start(0);
      } catch {
        // Ignore Safari gesture timing errors
      }
      if (ctx.state === 'running') {
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopAmbience();
    } else {
      this.startAmbience();
      this.playSpinIntoVortex();
    }
    return this.muted;
  }

  /**
   * 啟動黑色時空旋渦背景持續共鳴與旋轉風聲
   */
  public startAmbience(): void {
    if (this.muted || this.isRunningAmbience) return;
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.linearRampToValueAtTime(0.16, now + 0.45);
      master.connect(ctx.destination);
      this.ambienceMaster = master;

      // 1. 深淵黑洞雙低頻振盪器
      const subOsc = ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(58, now);

      const fifthOsc = ctx.createOscillator();
      fifthOsc.type = 'triangle';
      fifthOsc.frequency.setValueAtTime(87, now);

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.28, now);

      // 旋渦脈動 LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.65, now);
      const lfoDepth = ctx.createGain();
      lfoDepth.gain.setValueAtTime(14, now);
      lfo.connect(lfoDepth);
      lfoDepth.connect(fifthOsc.frequency);

      subOsc.connect(droneGain);
      fifthOsc.connect(droneGain);
      droneGain.connect(master);

      // 2. 旋轉氣流帶通濾波雜訊
      const bufLen = ctx.sampleRate * 2;
      const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufLen; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.04 * white) / 1.04;
        data[i] = lastOut * 2.4;
      }

      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      noiseSrc.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(280, now);
      filter.Q.setValueAtTime(4.2, now);

      const sweepLfo = ctx.createOscillator();
      sweepLfo.type = 'sine';
      sweepLfo.frequency.setValueAtTime(0.42, now);
      const sweepGain = ctx.createGain();
      sweepGain.gain.setValueAtTime(160, now);
      sweepLfo.connect(sweepGain);
      sweepGain.connect(filter.frequency);

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.55, now);

      noiseSrc.connect(filter);
      filter.connect(windGain);
      windGain.connect(master);

      subOsc.start(now);
      fifthOsc.start(now);
      lfo.start(now);
      sweepLfo.start(now);
      noiseSrc.start(now);

      this.ambienceNodes = [subOsc, fifthOsc, lfo, sweepLfo, noiseSrc];
      this.isRunningAmbience = true;
    } catch {
      this.isRunningAmbience = false;
    }
  }

  /**
   * 停止過場旋渦環境音（離開過場或進入探索時呼叫）
   */
  public stopAmbience(): void {
    const ctx = this.ctx;
    if (this.ambienceMaster && ctx) {
      try {
        const now = ctx.currentTime;
        this.ambienceMaster.gain.cancelScheduledValues(now);
        this.ambienceMaster.gain.setValueAtTime(
          Math.max(0.0001, this.ambienceMaster.gain.value),
          now
        );
        this.ambienceMaster.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      } catch {
        // ignore
      }
    }
    const toStop = [...this.ambienceNodes];
    this.ambienceNodes = [];
    this.isRunningAmbience = false;
    window.setTimeout(() => {
      for (const n of toStop) {
        try {
          n.stop?.();
          n.disconnect();
        } catch {
          // ignore
        }
      }
      try {
        this.ambienceMaster?.disconnect();
      } catch {
        // ignore
      }
      this.ambienceMaster = null;
    }, 170);
  }

  /**
   * 階段二音效：主角旋轉住捲入中央黑色旋渦的螺旋吸入聲
   */
  public playSpinIntoVortex(): void {
    if (this.muted) return;
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const dur = 1.15;

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(88, now + dur);

      // 快速旋轉顫音模擬身體高速自轉吸入黑洞
      const spinLfo = ctx.createOscillator();
      spinLfo.type = 'sine';
      spinLfo.frequency.setValueAtTime(11, now);
      spinLfo.frequency.linearRampToValueAtTime(19, now + dur);
      const spinDepth = ctx.createGain();
      spinDepth.gain.setValueAtTime(42, now);
      spinLfo.connect(spinDepth);
      spinDepth.connect(osc.frequency);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1400, now);
      lp.frequency.exponentialRampToValueAtTime(220, now + dur);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.11, now + 0.14);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(lp);
      lp.connect(g);
      g.connect(ctx.destination);

      osc.start(now);
      spinLfo.start(now);
      osc.stop(now + dur + 0.03);
      spinLfo.stop(now + dur + 0.03);
    } catch {
      // ignore
    }
  }

  /**
   * 階段三音效：主角由黑色旋渦拋出、跌落清朝盛世並響起古風五聲清音
   */
  public playTumbleOutToQing(): void {
    if (this.muted) return;
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. 衝出時空裂縫上揚呼嘯
      const whooshOsc = ctx.createOscillator();
      whooshOsc.type = 'triangle';
      whooshOsc.frequency.setValueAtTime(115, now);
      whooshOsc.frequency.exponentialRampToValueAtTime(460, now + 0.42);
      whooshOsc.frequency.exponentialRampToValueAtTime(180, now + 0.78);

      const wg = ctx.createGain();
      wg.gain.setValueAtTime(0.001, now);
      wg.gain.linearRampToValueAtTime(0.1, now + 0.1);
      wg.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      whooshOsc.connect(wg);
      wg.connect(ctx.destination);
      whooshOsc.start(now);
      whooshOsc.stop(now + 0.82);

      // 2. 落入清朝宮廷地面時的輕柔五聲音階古韻鐘磬（D5 - A5）
      const notes = [587.33, 880.0];
      notes.forEach((freq, idx) => {
        const t0 = now + 0.72 + idx * 0.09;
        const bell = ctx.createOscillator();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(freq, t0);

        const bg = ctx.createGain();
        bg.gain.setValueAtTime(0.001, t0);
        bg.gain.linearRampToValueAtTime(0.085, t0 + 0.02);
        bg.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.65);

        bell.connect(bg);
        bg.connect(ctx.destination);
        bell.start(t0);
        bell.stop(t0 + 0.68);
      });
    } catch {
      // ignore
    }
  }

  /**
   * 點擊「進入關卡探索」時的確認穿越音效
   */
  public playConfirmEnterStage(): void {
    if (this.muted) return;
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [440, 587.33, 880].forEach((freq, i) => {
        const t0 = now + i * 0.06;
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t0);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, t0);
        g.gain.linearRampToValueAtTime(0.11, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);

        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.3);
      });
    } catch {
      // ignore
    }
  }
}

export const vortexSfx = new VortexSfxController();
