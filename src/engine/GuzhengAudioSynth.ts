import { Note, SinglePitch, GuzhengTechnique } from '../types/music';

// 调性根音映射（对应简谱 1 在中音区 octave=0 时的基准频率，以 A4=440Hz 推算）
const KEY_ROOT_FREQUENCIES: Record<string, number> = {
  '1=C': 261.63,   // C4
  '1=D': 293.66,   // D4 (古筝最常用基础调)
  '1=E': 329.63,   // E4
  '1=F': 349.23,   // F4
  '1=G': 392.00,   // G4 (古筝常用转调)
  '1=A': 440.00,   // A4
  '1=B': 493.88,   // B4
  '1=bB': 233.08,  // Bb3
  '1=bE': 311.13,  // Eb4
};

// 简谱音符 (1-7) 相对主音 1 的半音差 (自然大调音阶)
const SEMITONE_OFFSET: Record<number, number> = {
  1: 0,
  2: 2,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11,
};

// 中国传统五声音阶（供花指上行刮奏生成紧邻音高）
const PENTATONIC_SCALE = [1, 2, 3, 5, 6];

interface ActiveVoice {
  voiceGain: GainNode;
  oscs: OscillatorNode[];
}

export class GuzhengAudioSynth {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.85;
  private activeVoices: Set<ActiveVoice> = new Set();

  constructor() {}

  public init(context?: AudioContext) {
    if (context) {
      if (this.audioCtx !== context) {
        this.masterGain = null;
      }
      this.audioCtx = context;
    } else if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (!this.masterGain && this.audioCtx) {
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  /**
   * 立即平滑淡出并停止所有正在振动的音源（切歌、暂停或重播时调用，杜绝长音残响污染）
   */
  public stopAll() {
    if (!this.audioCtx) {
      this.activeVoices.clear();
      return;
    }
    const now = this.audioCtx.currentTime;
    for (const voice of this.activeVoices) {
      try {
        voice.voiceGain.gain.cancelScheduledValues(now);
        voice.voiceGain.gain.setValueAtTime(Math.max(0.0001, voice.voiceGain.gain.value), now);
        voice.voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
        for (const osc of voice.oscs) {
          try {
            osc.stop(now + 0.03);
          } catch {
            // 忽略已停止的振荡器
          }
        }
      } catch {
        // 忽略已释放节点
      }
    }
    this.activeVoices.clear();
  }

  /**
   * 规范化调号格式（支持 "1=D"、"D"、"1 = G"、"C调"、"bB" 等）
   */
  private normalizeKeySignature(key?: string): string {
    const raw = (key || '1=D').replace(/\s+/g, '').replace(/调$/u, '');
    if (KEY_ROOT_FREQUENCIES[raw]) return raw;
    const match = raw.match(/(?:1=)?(b?[CDEFGAB])/i);
    if (match && match[1]) {
      const token = match[1].startsWith('b') || match[1].startsWith('B') && match[1].length === 2
        ? 'b' + match[1].slice(1).toUpperCase()
        : match[1].toUpperCase();
      const normalized = `1=${token}`;
      if (KEY_ROOT_FREQUENCIES[normalized]) return normalized;
    }
    return '1=D';
  }

  private toValidPitch(pitch: unknown): number {
    const n = Math.round(Number(pitch) || 0);
    return n >= 1 && n <= 7 ? n : 0;
  }

  private toValidOctave(octave: unknown): number {
    const n = Math.round(Number(octave) || 0);
    return Math.max(-2, Math.min(2, Number.isFinite(n) ? n : 0));
  }

  /**
   * 根据调性、简谱数字与八度计算古筝实际振动频率 (Hz)
   */
  public getFrequency(pitch: number, octave: number = 0, key: string = '1=D'): number {
    const safePitch = this.toValidPitch(pitch);
    if (safePitch === 0) return 0;
    const safeOctave = this.toValidOctave(octave);
    const safeKey = this.normalizeKeySignature(key);
    const rootFreq = KEY_ROOT_FREQUENCIES[safeKey] || KEY_ROOT_FREQUENCIES['1=D'];
    const semitones = (SEMITONE_OFFSET[safePitch] ?? 0) + safeOctave * 12;
    return rootFreq * Math.pow(2, semitones / 12);
  }

  private registerVoice(voiceGain: GainNode, mainOsc: OscillatorNode, oscs: OscillatorNode[]) {
    const voice: ActiveVoice = { voiceGain, oscs };
    this.activeVoices.add(voice);
    mainOsc.onended = () => {
      this.activeVoices.delete(voice);
      try {
        voiceGain.disconnect();
      } catch {
        // 忽略已断开的节点
      }
    };
  }

  /**
   * 获取目标音下方紧邻的 count 个五声音阶音高（由低到高排列），用于自然上行花指扫弦与小撮合成
   */
  private getPentatonicSweepBelow(pitch: number, octave: number, count: number = 3): SinglePitch[] {
    const result: SinglePitch[] = [];
    let curPitch = this.toValidPitch(pitch) || 1;
    let curOct = this.toValidOctave(octave);
    for (let i = 0; i < count; i++) {
      let prevIdx = -1;
      for (let idx = PENTATONIC_SCALE.length - 1; idx >= 0; idx--) {
        if (PENTATONIC_SCALE[idx] < curPitch) {
          prevIdx = idx;
          break;
        }
      }
      if (prevIdx < 0) {
        prevIdx = PENTATONIC_SCALE.length - 1;
        curOct = Math.max(-2, curOct - 1);
      }
      curPitch = PENTATONIC_SCALE[prevIdx];
      result.unshift({ pitch: curPitch, octave: curOct });
    }
    return result;
  }

  /**
   * 演奏单根古筝琴弦物理音色（带时值感知门限包络，确保短音利落、长音饱满）
   */
  public playStringVoice(
    freq: number,
    time: number,
    durationSec: number = 0.75,
    velocity: number = 0.8,
    technique?: GuzhengTechnique,
    shortTail: boolean = false
  ) {
    if (!this.audioCtx || !this.masterGain || freq <= 0) return;

    const ctx = this.audioCtx;
    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(1.0, time);
    voiceGain.connect(this.masterGain);

    const oscs: OscillatorNode[] = [];
    const safeDur = Math.max(0.08, durationSec);
    const tailSec = shortTail ? Math.min(0.08, safeDur * 0.4) : 0.32;
    const sustainEnd = Math.max(time + 0.05, time + safeDur * 0.92);
    const releaseEnd = time + safeDur + tailSec;

    // 1. 义甲触弦瞬态物理噪声脉冲 (Tortoiseshell pick attack click)
    const attackDuration = 0.007;
    const noiseOsc = ctx.createOscillator();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();

    noiseOsc.type = 'triangle';
    noiseOsc.frequency.setValueAtTime(freq * 4.0, time);

    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3000, time);
    noiseFilter.Q.setValueAtTime(1.8, time);

    noiseGain.gain.setValueAtTime(Math.max(0.0001, velocity * 0.4), time);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + attackDuration);

    noiseOsc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(voiceGain);

    noiseOsc.start(time);
    noiseOsc.stop(time + attackDuration + 0.003);
    oscs.push(noiseOsc);

    // 2. 琴弦主振动发音（干脆起音，仅保留真实物理 8ms 弦张力瞬态 freq * 1.003）
    const stringOsc = ctx.createOscillator();
    stringOsc.type = 'sawtooth';
    stringOsc.frequency.setValueAtTime(freq * 1.003, time);
    stringOsc.frequency.exponentialRampToValueAtTime(freq, time + 0.008);
    oscs.push(stringOsc);

    // 颤音处理（时值足够长时在 0.18s 后加入左手吟揉颤音）
    if (technique === '颤音' && safeDur > 0.35) {
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.setValueAtTime(5.2, time);
      vibratoGain.gain.setValueAtTime(freq * 0.018, time);
      vibrato.connect(stringOsc.frequency);
      vibrato.start(time + 0.18);
      vibrato.stop(releaseEnd + 0.02);
      oscs.push(vibrato);
    }

    // 3. 古筝音板与琴柱动态共鸣滤波
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(3.2, time);

    const maxCutoff = Math.min(8200, Math.max(2200, freq * 7.0));
    const sustainCutoff = Math.min(3400, Math.max(750, freq * 2.1));
    filter.frequency.setValueAtTime(maxCutoff, time);
    filter.frequency.exponentialRampToValueAtTime(sustainCutoff, time + Math.min(0.06, safeDur * 0.35));
    filter.frequency.exponentialRampToValueAtTime(Math.max(360, freq * 1.05), sustainEnd);

    // 4. 四段式时值感知门限振幅包络 (Attack -> Pluck Decay -> Sustain Gate -> Release Tail)
    const ampGain = ctx.createGain();
    const decayEnd = time + Math.min(0.08, safeDur * 0.45);
    const kneeTime = Math.min(releaseEnd - 0.02, time + safeDur + Math.min(0.08, tailSec * 0.25));

    ampGain.gain.setValueAtTime(0.0001, time);
    ampGain.gain.linearRampToValueAtTime(velocity * 0.85, time + 0.004);
    ampGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.48), decayEnd);
    ampGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.28), sustainEnd);
    if (!shortTail && kneeTime > sustainEnd + 0.005) {
      ampGain.gain.exponentialRampToValueAtTime(Math.max(0.0005, velocity * 0.045), kneeTime);
    }
    ampGain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);

    stringOsc.connect(filter);
    filter.connect(ampGain);
    ampGain.connect(voiceGain);

    stringOsc.start(time);
    stringOsc.stop(releaseEnd + 0.03);

    // 5. 桐木共鸣腔次级基频体振（随音符时值同步门限收敛，不掩盖下一个快音）
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'sine';
    bodyOsc.frequency.setValueAtTime(freq, time);

    bodyGain.gain.setValueAtTime(0.0001, time);
    bodyGain.gain.linearRampToValueAtTime(velocity * 0.32, time + 0.006);
    bodyGain.gain.exponentialRampToValueAtTime(Math.max(0.001, velocity * 0.14), sustainEnd);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(voiceGain);

    bodyOsc.start(time);
    bodyOsc.stop(releaseEnd + 0.03);
    oscs.push(bodyOsc);

    this.registerVoice(voiceGain, stringOsc, oscs);
  }

  /**
   * 摇指技法合成（16Hz 快速连续劈托颗粒脉冲，按真实时值起止）
   */
  private playYaozhi(
    pitches: SinglePitch[],
    time: number,
    durationSec: number,
    key: string
  ) {
    const stepSec = 0.0625; // 16Hz (约 62.5ms 一次劈托)
    const numPlucks = Math.max(2, Math.floor((durationSec - 0.03) / stepSec));

    for (let i = 0; i < numPlucks; i++) {
      const pluckTime = time + i * stepSec;
      const remaining = Math.max(0.07, durationSec - i * stepSec);
      const isFirst = i === 0;
      const vel = isFirst ? 0.8 : 0.44 + (i % 2 === 0 ? 0.06 : 0);
      const gateDur = i === numPlucks - 1 ? remaining : Math.min(0.11, remaining);

      pitches.forEach((p, idx) => {
        const freq = this.getFrequency(p.pitch, p.octave, key);
        if (freq > 0) {
          this.playStringVoice(freq, pluckTime + idx * 0.002, gateDur, vel, undefined, true);
        }
      });
    }
  }

  /**
   * 演奏曲谱中的一个 Note（支持单音、八度大撮、和弦琶音、花指、摇指、延音与前奏导引）
   */
  public playNote(
    note: Note,
    time: number,
    key: string = '1=D',
    secondsPerQuarter: number = 0.77,
    style?: string,
    durationBeatsOverride?: number
  ) {
    if (!this.audioCtx) this.init();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    // 确保传入 time <= 0 或已过期时自动修正为未来触发时间，解决点击试听无声问题
    const safeTime = !time || !Number.isFinite(time) || time < now ? now + 0.012 : time;

    const rawBeats = Number(durationBeatsOverride ?? note.duration);
    const effectiveBeats = Number.isFinite(rawBeats) && rawBeats > 0 ? rawBeats : 1;
    const durationSec = Math.max(0.08, effectiveBeats * secondsPerQuarter);

    const mainPitch = this.toValidPitch(note.pitch);
    const mainOctave = this.toValidOctave(note.octave);

    // 解析和弦或按大撮/小撮指法自动补全双音
    let chordList: SinglePitch[] = Array.isArray(note.chord)
      ? note.chord
          .map((p) => ({ pitch: this.toValidPitch(p.pitch), octave: this.toValidOctave(p.octave) }))
          .filter((p) => p.pitch > 0)
      : [];

    if (chordList.length === 0 && mainPitch > 0) {
      if (note.technique === '大撮') {
        const lowerOct = mainOctave > -2 ? mainOctave - 1 : -1;
        chordList = [
          { pitch: mainPitch, octave: mainOctave },
          { pitch: mainPitch, octave: lowerOct },
        ];
      } else if (note.technique === '小撮') {
        const lowerPartner = this.getPentatonicSweepBelow(mainPitch, mainOctave, 2)[0];
        chordList = [{ pitch: mainPitch, octave: mainOctave }, lowerPartner];
      }
    }

    // 1. 休止符不发声
    if (mainPitch === 0 && chordList.length === 0) {
      return;
    }

    // 2. 前奏导引声部与全谱统一采用古筝拨弦原声音色
    if (style === 'intro' && chordList.length === 0) {
      const freq = this.getFrequency(mainPitch, mainOctave, key);
      if (freq > 0) {
        this.playStringVoice(freq, safeTime, durationSec, 0.78, note.technique);
      }
      return;
    }

    // 3. 摇指处理（单音或双音八度持续 16Hz 劈托）
    if (note.technique === '摇指') {
      const pitches: SinglePitch[] =
        chordList.length > 0 ? chordList : [{ pitch: mainPitch, octave: mainOctave }];
      this.playYaozhi(pitches, safeTime, durationSec, key);
      return;
    }

    // 4. 多音 / 大撮 / 小撮 / 和弦琶音播放
    if (chordList.length > 0) {
      const sortedChord = [...chordList].sort((a, b) => {
        return this.getFrequency(a.pitch, a.octave, key) - this.getFrequency(b.pitch, b.octave, key);
      });

      const isArpeggio = note.technique === '花指' || sortedChord.length >= 3;

      if (note.technique === '花指' && sortedChord.length === 2) {
        const lowest = sortedChord[0];
        const leadNotes = this.getPentatonicSweepBelow(lowest.pitch, lowest.octave, 2);
        leadNotes.forEach((sp, sIdx) => {
          const sFreq = this.getFrequency(sp.pitch, sp.octave, key);
          const sTime = Math.max(now + 0.005, safeTime - (leadNotes.length - sIdx) * 0.022);
          if (sFreq > 0) {
            this.playStringVoice(sFreq, sTime, Math.min(0.16, durationSec * 0.4), 0.42, undefined, true);
          }
        });
        sortedChord.forEach((p, idx) => {
          const freq = this.getFrequency(p.pitch, p.octave, key);
          if (freq > 0) {
            this.playStringVoice(freq, safeTime + idx * 0.002, durationSec, 0.84, note.technique);
          }
        });
        return;
      }

      if (isArpeggio) {
        const count = sortedChord.length;
        sortedChord.forEach((p, idx) => {
          const freq = this.getFrequency(p.pitch, p.octave, key);
          const offsetBeforeBeat = (count - 1 - idx) * 0.022;
          const pluckTime = Math.max(now + 0.005, safeTime - offsetBeforeBeat);
          const vel = idx === count - 1 ? 0.85 : 0.62;
          if (freq > 0) {
            this.playStringVoice(freq, pluckTime, durationSec, vel, idx === count - 1 ? note.technique : undefined);
          }
        });
      } else {
        // 大撮/小撮：双音在 3ms 内几乎严格同时齐响
        sortedChord.forEach((p, idx) => {
          const freq = this.getFrequency(p.pitch, p.octave, key);
          const pluckDelay = idx * 0.002;
          if (freq > 0) {
            this.playStringVoice(freq, safeTime + pluckDelay, durationSec, 0.84, note.technique);
          }
        });
      }
      return;
    }

    // 5. 常规单音播放（含花指装饰扫弦）
    const freq = this.getFrequency(mainPitch, mainOctave, key);
    if (freq <= 0) return;

    if (note.technique === '花指') {
      const sweepPitches = this.getPentatonicSweepBelow(mainPitch, mainOctave, 3);
      sweepPitches.forEach((sp, sIdx) => {
        const sFreq = this.getFrequency(sp.pitch, sp.octave, key);
        const sTime = Math.max(now + 0.005, safeTime - 0.075 + sIdx * 0.022);
        if (sFreq > 0) {
          this.playStringVoice(sFreq, sTime, Math.min(0.14, durationSec * 0.4), 0.42, undefined, true);
        }
      });
    }

    this.playStringVoice(freq, safeTime, durationSec, 0.82, note.technique);
  }

  /**
   * 单音即时试听（用户手动点击音符或在编辑弹窗试听）
   */
  public previewNote(
    pitch: number,
    octave: number = 0,
    key: string = '1=D',
    technique?: GuzhengTechnique
  ) {
    this.playNote(
      {
        id: 'preview',
        pitch,
        octave,
        duration: 1.4,
        technique,
      },
      0,
      key,
      0.78
    );
  }
}

export const guzhengSynth = new GuzhengAudioSynth();
