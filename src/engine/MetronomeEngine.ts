import { SheetMusic, Note, BeatUnit, SoundMode } from '../types/music';
import { guzhengSynth } from './GuzhengAudioSynth';

export interface NoteScheduleEvent {
  note: Note;
  measureIndex: number;
  startBeat: number;     // 相对正拍开始的绝对四分音符拍数 (0.0, 0.75, 1.0, 1.5, 2.0...)
  durationBeats: number; // 当前音符时值拍数
  partId?: string;       // 声部 ID ('part1', 'part2', 'intro')
  isMainPart?: boolean;
}

export class MetronomeEngine {
  private audioCtx: AudioContext | null = null;
  private isRunning: boolean = false;
  private timerId: number | null = null;
  private uiTimerIds: Set<number> = new Set();

  // 调度频率与缓冲参数
  private lookaheadMs: number = 25;
  private scheduleAheadSec: number = 0.16;

  // 节拍核心参数
  private bpm: number = 78;
  private beatUnit: BeatUnit = 'quarter';
  private soundMode: SoundMode = 'both';
  private metronomeVolume: number = 0.75;
  private keySignature: string = '1=D';

  private beatsPerMeasure: number = 2; // e.g. 2/4 拍为 2 拍，4/4 拍为 4 拍
  private totalPreBeats: number = 2;

  // 1. 节拍器打拍时钟
  private playbackStartTime: number = 0; // 正拍开始的绝对时间戳
  private nextTickTime: number = 0;      // 下一次打拍时间
  private currentTickIndex: number = 0;  // 当前打到了第几拍
  private totalTicks: number = 0;        // 本次演奏总打拍数

  // 2. 音符触发队列 (按绝对 startBeat 严格递增排序)
  private noteEvents: NoteScheduleEvent[] = [];
  private currentNoteIndex: number = 0;

  // 3. 预备拍状态
  private isPreBeating: boolean = false;
  private preBeatCount: number = 0;
  private nextPreBeatTime: number = 0;

  // 回调
  public onNoteTrigger?: (note: Note, measureIndex: number, partId?: string) => void;
  public onPreBeatTick?: (count: number, total: number) => void;
  public onPlayEnd?: () => void;

  constructor() {}

  private initAudio() {
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    guzhengSynth.init(this.audioCtx);
  }

  private scheduleUiTimeout(callback: () => void, delayMs: number) {
    const id = window.setTimeout(() => {
      this.uiTimerIds.delete(id);
      callback();
    }, delayMs);
    this.uiTimerIds.add(id);
  }

  public setSoundMode(mode: SoundMode) {
    this.soundMode = mode;
  }

  public setMetronomeVolume(vol: number) {
    this.metronomeVolume = Math.max(0, Math.min(1, vol));
  }

  public setGuzhengVolume(vol: number) {
    guzhengSynth.setVolume(vol);
  }

  /**
   * 统一电子节拍器晶振“滴”声合成器（无下滑沉闷音高，清脆利落）
   */
  private emitTickTone(
    time: number,
    freq: number,
    durationSec: number,
    level: number,
    primaryType: OscillatorType = 'sine',
    overtoneFreq?: number,
    overtoneType: OscillatorType = 'triangle',
    overtoneLevel: number = 0.25,
    ignoreSoundMode: boolean = false
  ) {
    if (!this.audioCtx) return;
    if (!ignoreSoundMode && (this.soundMode === 'silent' || this.soundMode === 'guzheng')) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = primaryType;
    osc.frequency.setValueAtTime(freq, time);

    const peak = Math.max(0.001, level * this.metronomeVolume);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + durationSec);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(time);
    osc.stop(time + durationSec + 0.005);

    if (overtoneFreq) {
      const subOsc = this.audioCtx.createOscillator();
      const subGain = this.audioCtx.createGain();
      subOsc.type = overtoneType;
      subOsc.frequency.setValueAtTime(overtoneFreq, time);

      subGain.gain.setValueAtTime(0.0001, time);
      subGain.gain.linearRampToValueAtTime(peak * overtoneLevel, time + 0.003);
      subGain.gain.exponentialRampToValueAtTime(0.0001, time + durationSec * 0.85);

      subOsc.connect(subGain);
      subGain.connect(this.audioCtx.destination);
      subOsc.start(time);
      subOsc.stop(time + durationSec + 0.005);
    }
  }

  // 预备拍清脆“滴”提示
  private playPreBeatSound(time: number, isLast: boolean) {
    this.emitTickTone(
      time,
      isLast ? 2400 : 1650,
      0.045,
      isLast ? 0.65 : 0.45,
      'sine',
      isLast ? 3600 : undefined,
      'triangle',
      0.25
    );
  }

  // 四分音符强拍：高音清脆“滴！” (2400Hz 正弦+三角泛音, 42ms)
  private playQuarterStrongBeat(time: number) {
    this.emitTickTone(time, 2400, 0.042, 0.78, 'sine', 3600, 'triangle', 0.25);
  }

  // 四分音符其余拍：标准“滴” (1650Hz 正弦脉冲, 38ms)
  private playQuarterBeat(time: number) {
    this.emitTickTone(time, 1650, 0.038, 0.56, 'sine');
  }

  // 八分音符正拍：明亮方波/三角混合“滴” (2000Hz / 1500Hz, 30ms)
  private playEighthOnBeat(time: number, isMeasureStart: boolean) {
    const freq = isMeasureStart ? 2000 : 1500;
    this.emitTickTone(time, freq, 0.03, isMeasureStart ? 0.65 : 0.52, 'triangle', freq, 'square', 0.22);
  }

  // 八分音符后半拍：高频短促轻快“嘀” (1100Hz, 20ms)
  private playEighthOffBeat(time: number) {
    this.emitTickTone(time, 1100, 0.02, 0.36, 'triangle');
  }

  /**
   * 切换四分(♩) / 八分(♪) / 附点(♩.)时立即发出示范“滴”或“滴-嘀”声
   */
  public previewBeatUnitSound(unit: BeatUnit) {
    this.initAudio();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime + 0.015;
    if (unit === 'eighth') {
      // 八分音符模式示范“滴-嘀”
      this.emitTickTone(now, 2000, 0.03, 0.65, 'triangle', 2000, 'square', 0.22, true);
      this.emitTickTone(now + 0.18, 1100, 0.02, 0.38, 'triangle', undefined, 'triangle', 0.2, true);
    } else {
      // 四分/附点四分模式示范清脆“滴”
      this.emitTickTone(now, 2400, 0.042, 0.75, 'sine', 3600, 'triangle', 0.25, true);
    }
  }

  // 构建曲谱时间轴（确保全部谱面音符均可发声，并精确对齐 beatUnit）
  public prepareTimeline(
    sheet: SheetMusic,
    loopRange?: { start: number; end: number } | null,
    selectedPartId: string = 'all',
    beatUnit?: BeatUnit
  ) {
    if (beatUnit) {
      this.beatUnit = beatUnit;
    }
    this.noteEvents = [];
    this.beatsPerMeasure = sheet.timeSignature[0] || 2;
    this.keySignature = sheet.key || '1=D';
    this.totalPreBeats = this.beatsPerMeasure;

    const startM = loopRange ? Math.max(1, loopRange.start) : 1;
    const endM = loopRange ? Math.min(sheet.measures.length, loopRange.end) : sheet.measures.length;

    // 确定参与播放的声部列表
    const partsToPlay: { id: string; name: string; isMain?: boolean; measures: typeof sheet.measures }[] = [];

    if (selectedPartId === 'all' && sheet.parts && sheet.parts.length > 0) {
      partsToPlay.push(...sheet.parts);
    } else if (selectedPartId !== 'all' && sheet.parts && sheet.parts.length > 0) {
      const p = sheet.parts.find((part) => part.id === selectedPartId);
      if (p) partsToPlay.push(p);
      else partsToPlay.push({ id: 'main', name: '主谱', isMain: true, measures: sheet.measures });
    } else {
      partsToPlay.push({ id: 'main', name: '主谱', isMain: true, measures: sheet.measures });
    }

    // 收集各声部音符并计算绝对 startBeat (以四分音符为 1 拍)
    // 所有非休止符（包括 tiedFromPrev 延续音）均按各自 duration 触发古筝拨弦，保证谱面光点所到之处必有声
    for (const part of partsToPlay) {
      let accumulatedBeat = 0;

      for (let mIdx = startM - 1; mIdx < endM; mIdx++) {
        const measure = part.measures[mIdx];
        if (!measure) continue;

        let measureBeatOffset = 0;
        for (const note of measure.notes) {
          const noteDur = Number(note.duration) || 1;
          const notePitch = Number(note.pitch) || 0;
          const hasChord = Array.isArray(note.chord) && note.chord.length > 0;

          if (notePitch !== 0 || hasChord) {
            this.noteEvents.push({
              measureIndex: mIdx,
              note,
              startBeat: accumulatedBeat + measureBeatOffset,
              durationBeats: noteDur,
              partId: part.id,
              isMainPart: part.isMain ?? (part.id === 'part1' || part.id === 'main'),
            });
          }
          measureBeatOffset += noteDur;
        }

        accumulatedBeat += this.beatsPerMeasure;
      }
    }

    // 若存在前奏导引旋律 (如《唐诗联唱》前8小节领唱)，同步加入并采用统一古筝音色
    if (sheet.introMelody && sheet.introMelody.length > 0) {
      const maxIntroM = Math.min(sheet.introMelody.length, endM);

      for (let mIdx = startM - 1; mIdx < maxIntroM; mIdx++) {
        const introM = sheet.introMelody[mIdx];
        if (!introM) continue;

        const mAccumulated = (mIdx - (startM - 1)) * this.beatsPerMeasure;
        let inOffset = 0;
        for (const note of introM.notes) {
          const noteDur = Number(note.duration) || 1;
          const notePitch = Number(note.pitch) || 0;
          if (notePitch !== 0) {
            this.noteEvents.push({
              measureIndex: mIdx,
              note,
              startBeat: mAccumulated + inOffset,
              durationBeats: noteDur,
              partId: 'intro',
              isMainPart: true,
            });
          }
          inOffset += noteDur;
        }
      }
    }

    // 严格按发声时间戳升序排序
    this.noteEvents.sort((a, b) => {
      if (Math.abs(a.startBeat - b.startBeat) > 0.0001) {
        return a.startBeat - b.startBeat;
      }
      return (b.isMainPart ? 1 : 0) - (a.isMainPart ? 1 : 0);
    });

    // 计算总打拍数 (按当前拍位细分)
    const totalMeasures = endM - startM + 1;
    const ticksPerMeasure = this.getTicksPerMeasure();
    this.totalTicks = totalMeasures * ticksPerMeasure;
  }

  private getTicksPerMeasure(): number {
    if (this.beatUnit === 'eighth') {
      return this.beatsPerMeasure * 2;
    }
    return this.beatsPerMeasure;
  }

  // 计算标准四分音符的绝对秒数：BPM 恒代表每分钟四分音符拍数 (♩ = 60 即严格 1.000 秒/拍)
  private getSecondsPerQuarter(): number {
    return 60.0 / this.bpm;
  }

  // 计算节拍器单次敲击的时间间隔 (秒)
  // 八分音符模式下每拍敲击两次“滴-嘀”(间隔为四分音符的一半)；四分与附点模式下每拍敲击一次“滴”
  private getSecondsPerTick(): number {
    if (this.beatUnit === 'eighth') {
      return this.getSecondsPerQuarter() / 2;
    }
    return this.getSecondsPerQuarter();
  }

  // 开始播放（支持指定 beatUnit 与 soundMode）
  public start(
    bpm: number,
    beatUnit: BeatUnit = 'quarter',
    withPreBeat: boolean = true,
    soundMode: SoundMode = 'both'
  ) {
    this.stop();
    this.initAudio();
    if (!this.audioCtx) return;

    this.bpm = bpm;
    this.beatUnit = beatUnit;
    this.soundMode = soundMode;
    this.isRunning = true;

    const secondsPerQuarter = this.getSecondsPerQuarter();

    if (withPreBeat) {
      this.isPreBeating = true;
      this.preBeatCount = 0;
      this.nextPreBeatTime = this.audioCtx.currentTime + 0.05;
      this.playbackStartTime = this.nextPreBeatTime + this.totalPreBeats * secondsPerQuarter;
    } else {
      this.isPreBeating = false;
      this.playbackStartTime = this.audioCtx.currentTime + 0.05;
    }

    this.nextTickTime = this.playbackStartTime;
    this.currentTickIndex = 0;
    this.currentNoteIndex = 0;

    this.scheduleLoop();
  }

  // 调度循环核心 (Lookahead 毫秒级精准对齐)
  private scheduleLoop = () => {
    if (!this.isRunning || !this.audioCtx) return;

    const secondsPerQuarter = this.getSecondsPerQuarter();
    const secondsPerTick = this.getSecondsPerTick();
    const ticksPerMeasure = this.getTicksPerMeasure();
    const now = this.audioCtx.currentTime;

    // 1. 预备拍模式调度（统一按四分音符拍数与节奏倒数 1 小节）
    if (this.isPreBeating) {
      while (this.nextPreBeatTime < now + this.scheduleAheadSec) {
        this.preBeatCount++;
        const count = this.preBeatCount;
        const total = this.totalPreBeats;
        const eventTime = this.nextPreBeatTime;

        this.playPreBeatSound(eventTime, count === total);

        const delayMs = Math.max(0, (eventTime - now) * 1000);
        this.scheduleUiTimeout(() => {
          if (this.isRunning && this.isPreBeating) {
            this.onPreBeatTick?.(count, total);
          }
        }, delayMs);

        this.nextPreBeatTime += secondsPerQuarter;

        if (this.preBeatCount >= total) {
          this.isPreBeating = false;
          break;
        }
      }
    }

    // 2. 正式曲谱演奏调度
    if (!this.isPreBeating) {
      // A. 节拍器打拍时钟轨道（四分音符“滴”、八分音符“滴-嘀”显著区分）
      while (
        this.nextTickTime < now + this.scheduleAheadSec &&
        this.currentTickIndex < this.totalTicks
      ) {
        const tickTime = this.nextTickTime;
        const tickInMeasure = this.currentTickIndex % ticksPerMeasure;

        if (this.soundMode === 'metronome' || this.soundMode === 'both') {
          if (this.beatUnit === 'eighth') {
            if (tickInMeasure % 2 === 0) {
              this.playEighthOnBeat(tickTime, tickInMeasure === 0);
            } else {
              this.playEighthOffBeat(tickTime);
            }
          } else {
            if (tickInMeasure === 0) {
              this.playQuarterStrongBeat(tickTime);
            } else {
              this.playQuarterBeat(tickTime);
            }
          }
        }

        this.nextTickTime += secondsPerTick;
        this.currentTickIndex++;
      }

      // B. 曲谱音符与古筝原声发声轨道（全音符不遗漏发声）
      while (this.currentNoteIndex < this.noteEvents.length) {
        const item = this.noteEvents[this.currentNoteIndex];
        const noteAbsoluteTime = this.playbackStartTime + item.startBeat * secondsPerQuarter;

        if (noteAbsoluteTime >= now + this.scheduleAheadSec) {
          break;
        }

        if (this.soundMode === 'guzheng' || this.soundMode === 'both') {
          guzhengSynth.playNote(
            item.note,
            noteAbsoluteTime,
            this.keySignature,
            secondsPerQuarter,
            item.partId === 'intro' ? 'intro' : undefined,
            item.durationBeats
          );
        }

        // 页面视觉高亮与自动滚动触发
        const delayMs = Math.max(0, (noteAbsoluteTime - now) * 1000);
        this.scheduleUiTimeout(() => {
          if (this.isRunning && !this.isPreBeating) {
            this.onNoteTrigger?.(item.note, item.measureIndex, item.partId);
          }
        }, delayMs);

        this.currentNoteIndex++;
      }

      // C. 播放完毕检测
      if (this.currentTickIndex >= this.totalTicks && this.currentNoteIndex >= this.noteEvents.length) {
        const remainingMs = Math.max(0, (this.nextTickTime - now) * 1000);
        this.scheduleUiTimeout(() => {
          if (this.isRunning) {
            this.onPlayEnd?.();
          }
        }, remainingMs);
        return;
      }
    }

    this.timerId = window.setTimeout(this.scheduleLoop, this.lookaheadMs);
  };

  public stop() {
    this.isRunning = false;
    this.isPreBeating = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    for (const id of this.uiTimerIds) {
      clearTimeout(id);
    }
    this.uiTimerIds.clear();
    guzhengSynth.stopAll();
  }

  public updateBpm(newBpm: number, unit?: BeatUnit) {
    if (!this.isRunning || !this.audioCtx) {
      this.bpm = newBpm;
      if (unit) this.beatUnit = unit;
      return;
    }

    const now = this.audioCtx.currentTime;
    const oldSecPerQuarter = this.getSecondsPerQuarter();
    const oldTicksPerMeasure = this.getTicksPerMeasure();
    const oldTickSizeQuarters = this.beatUnit === 'eighth' ? 0.5 : 1.0;

    if (this.isPreBeating) {
      this.bpm = newBpm;
      if (unit) this.beatUnit = unit;
      const newSecPerQuarter = this.getSecondsPerQuarter();
      const remainingPreBeats = Math.max(0, this.totalPreBeats - this.preBeatCount);
      this.playbackStartTime = Math.max(now, this.nextPreBeatTime) + remainingPreBeats * newSecPerQuarter;
      this.nextTickTime = this.playbackStartTime;
      return;
    }

    const elapsedQuarterBeats = Math.max(0, (now - this.playbackStartTime) / oldSecPerQuarter);
    const totalMeasures = oldTicksPerMeasure > 0 ? this.totalTicks / oldTicksPerMeasure : 0;
    const nextTickQuarterPos = this.currentTickIndex * oldTickSizeQuarters;

    this.bpm = newBpm;
    if (unit) this.beatUnit = unit;

    const newSecPerQuarter = this.getSecondsPerQuarter();
    const newSecPerTick = this.getSecondsPerTick();
    const newTicksPerMeasure = this.getTicksPerMeasure();
    const newTickSizeQuarters = this.beatUnit === 'eighth' ? 0.5 : 1.0;

    this.totalTicks = Math.round(totalMeasures * newTicksPerMeasure);
    this.playbackStartTime = now - elapsedQuarterBeats * newSecPerQuarter;
    this.currentTickIndex = Math.max(0, Math.ceil((nextTickQuarterPos - 1e-6) / newTickSizeQuarters));
    this.nextTickTime = this.playbackStartTime + this.currentTickIndex * newSecPerTick;
  }
}

export const metronome = new MetronomeEngine();
