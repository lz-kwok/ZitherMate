import { SheetMusic, Measure, Note, SinglePitch } from '../../types/music';
import { TANGSHI_ORIGINAL_SCORE } from './tangshiOriginal';

type ExtraNoteOpts = Partial<Omit<Note, 'id' | 'pitch' | 'octave' | 'duration' | 'chord'>>;

const BOX_MEASURES = new Set([30, 35, 40, 45, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100]);
const ARP3_LOW: SinglePitch[] = [
  { pitch: 2, octave: 0 },
  { pitch: 6, octave: -1 },
  { pitch: 2, octave: -1 },
];
const ARP3_HIGH: SinglePitch[] = [
  { pitch: 2, octave: 1 },
  { pitch: 6, octave: 0 },
  { pitch: 2, octave: 0 },
];
const ARP4_SOL: SinglePitch[] = [
  { pitch: 5, octave: 0 },
  { pitch: 3, octave: 0 },
  { pitch: 2, octave: 0 },
  { pitch: 5, octave: -1 },
];

function mkNote(
  prefix: 'p1' | 'p2',
  m: number,
  idx: number,
  pitch: number,
  octave: number,
  duration: number,
  extra?: ExtraNoteOpts
): Note {
  return { id: `${prefix}_m${m}_n${idx}`, pitch, octave, duration, ...extra };
}

function mkChord(
  prefix: 'p1' | 'p2',
  m: number,
  idx: number,
  chord: SinglePitch[],
  duration: number,
  extra?: ExtraNoteOpts
): Note {
  return {
    id: `${prefix}_m${m}_n${idx}`,
    pitch: chord[0].pitch,
    octave: chord[0].octave,
    chord: chord.map((c) => ({ ...c })),
    duration,
    ...extra,
  };
}

function mkOct(
  prefix: 'p1' | 'p2',
  m: number,
  idx: number,
  pitch: number,
  topOct: number,
  duration: number,
  extra?: ExtraNoteOpts
): Note {
  return mkChord(
    prefix,
    m,
    idx,
    [
      { pitch, octave: topOct },
      { pitch, octave: topOct - 1 },
    ],
    duration,
    extra
  );
}

function mkM(measureNumber: number, notes: Note[]): Measure {
  return BOX_MEASURES.has(measureNumber)
    ? { measureNumber, showBoxNumber: true, notes }
    : { measureNumber, notes };
}

// 100% 严格依照中央音乐学院/中国音乐学院考级曲谱《唐诗联唱》（彭野曲 / 成莉改编，1=D 2/4 ♩=78 抒情地）
// 完整收录：
// 1. 前奏领唱导引旋律 ( 5. 6 | 1 1 | 1 6 1 | 2 - | [5] 2. 6 | 2 1 | 1 - | 1. 0 )
// 2. 古筝 I (主旋律声部，涵盖八度大撮、托抹勾、双音与花指)
// 3. 古筝 II (对话/轮奏/伴奏声部，与古筝 I 严格交替呼应，完整复现重奏美感)

// 古筝 I 声部 (28 小节)
const guzhengPart1Measures: Measure[] = [
  // System 1: [1] ~ [4] (前奏休止，领唱起)
  { measureNumber: 1, notes: [{ id: 'p1_m1_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p1_m1_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 2, notes: [{ id: 'p1_m2_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p1_m2_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 3, notes: [{ id: 'p1_m3_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p1_m3_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 4, notes: [{ id: 'p1_m4_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p1_m4_n2', pitch: 0, octave: 0, duration: 1 }] },

  // System 2: [5] ~ [8] (领唱后半段与收尾)
  { measureNumber: 5, showBoxNumber: true, notes: [{ id: 'p1_m5_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p1_m5_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 6, notes: [{ id: 'p1_m6_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p1_m6_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 7, notes: [{ id: 'p1_m7_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p1_m7_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 8, notes: [{ id: 'p1_m8_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p1_m8_n2', pitch: 0, octave: 0, duration: 1 }] },

  // System 3: [9] ~ [14] (古筝起奏)
  // 小节 9: 花指大撮起手 5: 5_ 6_
  {
    measureNumber: 9,
    notes: [
      {
        id: 'p1_m9_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 1,
        technique: '花指',
        slur: 'start',
      },
      { id: 'p1_m9_n2', pitch: 5, octave: -1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'p1_m9_n3', pitch: 6, octave: -1, duration: 0.5, technique: '抹', slur: 'stop' },
    ],
  },
  // 小节 10: [10] 1/1 6_ 5_
  {
    measureNumber: 10,
    showBoxNumber: true,
    notes: [
      {
        id: 'p1_m10_n1',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 1,
        technique: '托',
      },
      { id: 'p1_m10_n2', pitch: 6, octave: -1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'p1_m10_n3', pitch: 5, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },
  // 小节 11: 5: - (长音2拍，古筝 II 呼应接唱)
  {
    measureNumber: 11,
    notes: [
      {
        id: 'p1_m11_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '托',
        slur: 'start',
      },
    ],
  },
  // 小节 12: 5: - (延音连线)
  {
    measureNumber: 12,
    notes: [
      {
        id: 'p1_m12_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '托',
        slur: 'stop',
        tiedFromPrev: true,
      },
    ],
  },
  // 小节 13: 5: 5_ 6_ (古筝 I 再次领唱)
  {
    measureNumber: 13,
    notes: [
      {
        id: 'p1_m13_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 1,
        technique: '托',
      },
      { id: 'p1_m13_n2', pitch: 5, octave: -1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'p1_m13_n3', pitch: 6, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },
  // 小节 14: 1/1 6_ 5_
  {
    measureNumber: 14,
    notes: [
      {
        id: 'p1_m14_n1',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 1,
        technique: '托',
      },
      { id: 'p1_m14_n2', pitch: 6, octave: -1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'p1_m14_n3', pitch: 5, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },

  // System 4: [15] ~ [20]
  // 小节 15: [15] 5: -
  {
    measureNumber: 15,
    showBoxNumber: true,
    notes: [
      {
        id: 'p1_m15_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '托',
        slur: 'start',
      },
    ],
  },
  // 小节 16: 5: -
  {
    measureNumber: 16,
    notes: [
      {
        id: 'p1_m16_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '托',
        slur: 'stop',
        tiedFromPrev: true,
      },
    ],
  },
  // 小节 17: 5:. 6_ (附点四分 + 八分音符抹)
  {
    measureNumber: 17,
    notes: [
      {
        id: 'p1_m17_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 1.5,
        dot: true,
        technique: '托',
      },
      { id: 'p1_m17_n2', pitch: 6, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },
  // 小节 18: 1 -
  {
    measureNumber: 18,
    notes: [
      { id: 'p1_m18_n1', pitch: 1, octave: 0, duration: 2, technique: '托' },
    ],
  },
  // 小节 19: 1/1 6_ 1_
  {
    measureNumber: 19,
    notes: [
      {
        id: 'p1_m19_n1',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 1,
        technique: '托',
      },
      { id: 'p1_m19_n2', pitch: 6, octave: -1, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'p1_m19_n3', pitch: 1, octave: 0, duration: 0.5, technique: '托' },
    ],
  },
  // 小节 20: [20] 2 -
  {
    measureNumber: 20,
    showBoxNumber: true,
    notes: [
      { id: 'p1_m20_n1', pitch: 2, octave: 0, duration: 2, technique: '托' },
    ],
  },

  // System 5: [21] ~ [28]
  // 小节 21: 琶音 2/6/2. 6_
  {
    measureNumber: 21,
    notes: [
      {
        id: 'p1_m21_n1',
        pitch: 2,
        octave: 1,
        chord: [{ pitch: 2, octave: 1 }, { pitch: 6, octave: 0 }, { pitch: 2, octave: -1 }],
        duration: 1.5,
        dot: true,
        technique: '花指',
      },
      { id: 'p1_m21_n2', pitch: 6, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },
  // 小节 22: 1 6_ 5_
  {
    measureNumber: 22,
    notes: [
      { id: 'p1_m22_n1', pitch: 1, octave: 0, duration: 1, technique: '托' },
      { id: 'p1_m22_n2', pitch: 6, octave: -1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'p1_m22_n3', pitch: 5, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },
  // 小节 23: 5: -
  {
    measureNumber: 23,
    notes: [
      {
        id: 'p1_m23_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '托',
        slur: 'start',
      },
    ],
  },
  // 小节 24: 5: -
  {
    measureNumber: 24,
    notes: [
      {
        id: 'p1_m24_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '托',
        slur: 'stop',
        tiedFromPrev: true,
      },
    ],
  },
  // 小节 25: [25] 5. 5 (勾托交替)
  {
    measureNumber: 25,
    showBoxNumber: true,
    notes: [
      { id: 'p1_m25_n1', pitch: 5, octave: -1, duration: 1, technique: '勾' },
      { id: 'p1_m25_n2', pitch: 5, octave: 0, duration: 1, technique: '托' },
    ],
  },
  // 小节 26: 5 3 (抹托)
  {
    measureNumber: 26,
    notes: [
      { id: 'p1_m26_n1', pitch: 5, octave: 0, duration: 1, technique: '抹' },
      { id: 'p1_m26_n2', pitch: 3, octave: 0, duration: 1, technique: '托' },
    ],
  },
  // 小节 27: 2/2. -
  {
    measureNumber: 27,
    notes: [
      {
        id: 'p1_m27_n1',
        pitch: 2,
        octave: 0,
        chord: [{ pitch: 2, octave: 0 }, { pitch: 2, octave: -1 }],
        duration: 2,
        technique: '大撮',
        slur: 'start',
      },
    ],
  },
  // 小节 28: 2/2. - (第1页收尾)
  {
    measureNumber: 28,
    notes: [
      {
        id: 'p1_m28_n1',
        pitch: 2,
        octave: 0,
        chord: [{ pitch: 2, octave: 0 }, { pitch: 2, octave: -1 }],
        duration: 2,
        technique: '大撮',
        slur: 'stop',
        tiedFromPrev: true,
      },
    ],
  },

  // ==================== 第 2 页 (M29 ~ M52) ====================
  mkM(29, [mkOct('p1', 29, 1, 5, 0, 1), mkNote('p1', 29, 2, 3, 0, 0.5, { technique: '托', beamWithNext: true }), mkNote('p1', 29, 3, 2, 0, 0.5, { technique: '托' })]),
  mkM(30, [mkNote('p1', 30, 1, 1, 0, 1, { technique: '托' }), mkNote('p1', 30, 2, 6, -1, 0.5, { technique: '托', beamWithNext: true, slur: 'start' }), mkNote('p1', 30, 3, 1, 0, 0.5, { slur: 'stop' })]),
  mkM(31, [mkOct('p1', 31, 1, 2, 0, 2, { slur: 'start' })]),
  mkM(32, [mkOct('p1', 32, 1, 2, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(33, [mkOct('p1', 33, 1, 5, -1, 1.5, { dot: true }), mkNote('p1', 33, 2, 6, -1, 0.5, { technique: '抹' })]),
  mkM(34, [mkNote('p1', 34, 1, 1, 0, 2, { technique: '托' })]),
  mkM(35, [mkOct('p1', 35, 1, 1, 0, 1), mkNote('p1', 35, 2, 6, -1, 0.5, { technique: '抹', beamWithNext: true, slur: 'start' }), mkNote('p1', 35, 3, 1, 0, 0.5, { slur: 'stop' })]),
  mkM(36, [mkNote('p1', 36, 1, 2, 0, 2, { technique: '托' })]),
  mkM(37, [mkChord('p1', 37, 1, ARP3_LOW, 1.5, { dot: true, technique: '花指' }), mkNote('p1', 37, 2, 6, -1, 0.5, { technique: '抹' })]),
  mkM(38, [mkNote('p1', 38, 1, 2, 0, 1, { technique: '托' }), mkNote('p1', 38, 2, 1, 0, 1, { technique: '下滑音' })]),
  mkM(39, [mkOct('p1', 39, 1, 1, 0, 2, { slur: 'start' })]),
  mkM(40, [mkOct('p1', 40, 1, 1, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(41, [mkChord('p1', 41, 1, ARP4_SOL, 1, { technique: '花指' }), mkNote('p1', 41, 2, 0, 0, 1)]),
  mkM(42, [mkNote('p1', 42, 1, 0, 0, 1), mkNote('p1', 42, 2, 0, 0, 1)]),
  mkM(43, [mkNote('p1', 43, 1, 5, 0, 0.5, { technique: '勾', beamWithNext: true }), mkNote('p1', 43, 2, 5, 1, 0.5, { technique: '托', beamWithNext: true }), mkNote('p1', 43, 3, 3, 1, 0.5, { technique: '抹', beamWithNext: true }), mkNote('p1', 43, 4, 5, 1, 0.5, { technique: '托' })]),
  mkM(44, [mkNote('p1', 44, 1, 2, 1, 0.5, { technique: '抹', beamWithNext: true }), mkNote('p1', 44, 2, 3, 1, 0.5, { technique: '托', beamWithNext: true }), mkNote('p1', 44, 3, 6, 0, 0.5, { technique: '抹', beamWithNext: true }), mkNote('p1', 44, 4, 1, 1, 0.5, { technique: '托' })]),
  mkM(45, [mkChord('p1', 45, 1, ARP4_SOL, 1, { technique: '花指' }), mkNote('p1', 45, 2, 0, 0, 1)]),
  mkM(46, [mkNote('p1', 46, 1, 0, 0, 1), mkNote('p1', 46, 2, 0, 0, 1)]),
  mkM(47, [mkNote('p1', 47, 1, 2, 0, 0.5, { technique: '勾', beamWithNext: true }), mkNote('p1', 47, 2, 2, 1, 0.5, { technique: '托', beamWithNext: true }), mkNote('p1', 47, 3, 2, 1, 0.5, { technique: '托', beamWithNext: true, slur: 'start' }), mkNote('p1', 47, 4, 3, 1, 0.5, { slur: 'stop' })]),
  mkM(48, [mkNote('p1', 48, 1, 1, 1, 0.5, { technique: '抹', beamWithNext: true }), mkNote('p1', 48, 2, 2, 1, 0.5, { technique: '托', beamWithNext: true }), mkNote('p1', 48, 3, 1, 1, 0.5, { technique: '托', beamWithNext: true }), mkNote('p1', 48, 4, 6, 0, 0.5, { technique: '托' })]),
  mkM(49, [mkOct('p1', 49, 1, 5, 0, 2)]),
  mkM(50, [mkNote('p1', 50, 1, 3, 0, 1.5, { technique: '托', dot: true }), mkNote('p1', 50, 2, 2, 0, 0.5, { technique: '托' })]),
  mkM(51, [mkOct('p1', 51, 1, 1, 0, 2)]),
  mkM(52, [mkNote('p1', 52, 1, 2, 0, 1, { technique: '抹' }), mkNote('p1', 52, 2, 3, 0, 0.5, { technique: '托', beamWithNext: true, slur: 'start' }), mkNote('p1', 52, 3, 5, 0, 0.5, { slur: 'stop' })]),

  // ==================== 第 3 页 (M53 ~ M76) ====================
  mkM(53, [mkNote('p1', 53, 1, 2, 0, 1, { technique: '抹' }), mkNote('p1', 53, 2, 3, 0, 1, { technique: '托' })]),
  mkM(54, [mkNote('p1', 54, 1, 5, 0, 1, { technique: '抹' }), mkNote('p1', 54, 2, 3, 0, 1, { technique: '托' })]),
  mkM(55, [mkNote('p1', 55, 1, 5, -1, 0.5, { technique: '勾', beamWithNext: true }), mkNote('p1', 55, 2, 5, 0, 0.5, { technique: '托', beamWithNext: true }), mkNote('p1', 55, 3, 6, -1, 0.5, { technique: '抹', beamWithNext: true }), mkNote('p1', 55, 4, 1, 0, 0.5, { technique: '托' })]),
  mkM(56, [mkNote('p1', 56, 1, 2, 0, 0.5, { technique: '抹', beamWithNext: true }), mkNote('p1', 56, 2, 1, 0, 0.5, { technique: '托', beamWithNext: true }), mkNote('p1', 56, 3, 2, 0, 0.5, { technique: '抹', beamWithNext: true }), mkNote('p1', 56, 4, 3, 0, 0.5, { technique: '托' })]),
  mkM(57, [mkChord('p1', 57, 1, ARP4_SOL, 2, { technique: '花指' })]),
  mkM(58, [mkNote('p1', 58, 1, 0, 0, 1), mkNote('p1', 58, 2, 0, 0, 1)]),
  mkM(59, [mkNote('p1', 59, 1, 5, 0, 0.5, { beamWithNext: true }), mkNote('p1', 59, 2, 5, 1, 0.5, { beamWithNext: true }), mkNote('p1', 59, 3, 3, 1, 0.5, { beamWithNext: true }), mkNote('p1', 59, 4, 5, 1, 0.5)]),
  mkM(60, [mkNote('p1', 60, 1, 2, 1, 0.5, { beamWithNext: true }), mkNote('p1', 60, 2, 3, 1, 0.5, { beamWithNext: true }), mkNote('p1', 60, 3, 6, 0, 0.5, { beamWithNext: true }), mkNote('p1', 60, 4, 1, 1, 0.5)]),
  mkM(61, [mkChord('p1', 61, 1, ARP4_SOL, 2, { technique: '花指' })]),
  mkM(62, [mkNote('p1', 62, 1, 0, 0, 1), mkNote('p1', 62, 2, 0, 0, 1)]),
  mkM(63, [mkNote('p1', 63, 1, 2, 0, 0.5, { beamWithNext: true }), mkNote('p1', 63, 2, 2, 1, 0.5, { beamWithNext: true }), mkNote('p1', 63, 3, 2, 1, 0.5, { beamWithNext: true, slur: 'start' }), mkNote('p1', 63, 4, 3, 1, 0.5, { slur: 'stop' })]),
  mkM(64, [mkNote('p1', 64, 1, 1, 1, 0.5, { beamWithNext: true }), mkNote('p1', 64, 2, 2, 1, 0.5, { beamWithNext: true }), mkNote('p1', 64, 3, 1, 1, 0.5, { beamWithNext: true }), mkNote('p1', 64, 4, 6, 0, 0.5)]),
  mkM(65, [mkOct('p1', 65, 1, 5, 0, 2)]),
  mkM(66, [mkNote('p1', 66, 1, 3, 0, 1.5, { dot: true }), mkNote('p1', 66, 2, 2, 0, 0.5)]),
  mkM(67, [mkOct('p1', 67, 1, 1, 0, 2)]),
  mkM(68, [mkNote('p1', 68, 1, 5, 0, 1, { technique: '托' }), mkNote('p1', 68, 2, 3, 0, 1, { technique: '托' })]),
  mkM(69, [mkNote('p1', 69, 1, 6, -1, 1, { technique: '抹' }), mkNote('p1', 69, 2, 2, 0, 1, { technique: '上滑音' })]),
  mkM(70, [mkNote('p1', 70, 1, 5, -1, 1, { technique: '抹' }), mkNote('p1', 70, 2, 6, -1, 1, { technique: '托' })]),
  mkM(71, [mkOct('p1', 71, 1, 1, 0, 2, { slur: 'start' })]),
  mkM(72, [mkOct('p1', 72, 1, 1, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(73, [mkOct('p1', 73, 1, 5, -1, 1, { technique: '花指', lyric: '红' }), mkNote('p1', 73, 2, 5, -1, 0.5, { beamWithNext: true, slur: 'start', lyric: '豆' }), mkNote('p1', 73, 3, 6, -1, 0.5, { slur: 'stop' })]),
  mkM(74, [mkOct('p1', 74, 1, 1, 0, 1, { lyric: '生' }), mkNote('p1', 74, 2, 6, -1, 0.5, { beamWithNext: true, lyric: '南' }), mkNote('p1', 74, 3, 5, -1, 0.5)]),
  mkM(75, [mkOct('p1', 75, 1, 5, -1, 2, { slur: 'start', lyric: '国' })]),
  mkM(76, [mkOct('p1', 76, 1, 5, -1, 2, { slur: 'stop', tiedFromPrev: true })]),

  // ==================== 第 4 页 (M77 ~ M100) ====================
  mkM(77, [mkOct('p1', 77, 1, 5, -1, 1, { lyric: '春' }), mkNote('p1', 77, 2, 5, -1, 0.5, { beamWithNext: true, slur: 'start', lyric: '来' }), mkNote('p1', 77, 3, 6, -1, 0.5, { slur: 'stop' })]),
  mkM(78, [mkOct('p1', 78, 1, 1, 0, 1, { lyric: '发' }), mkNote('p1', 78, 2, 6, -1, 0.5, { beamWithNext: true, lyric: '几' }), mkNote('p1', 78, 3, 5, -1, 0.5)]),
  mkM(79, [mkOct('p1', 79, 1, 5, -1, 2, { slur: 'start', lyric: '枝' })]),
  mkM(80, [mkOct('p1', 80, 1, 5, -1, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(81, [mkOct('p1', 81, 1, 5, -1, 1.5, { dot: true, lyric: '劝' }), mkNote('p1', 81, 2, 6, -1, 0.5)]),
  mkM(82, [mkNote('p1', 82, 1, 1, 0, 2, { lyric: '君' })]),
  mkM(83, [mkOct('p1', 83, 1, 1, 0, 1, { lyric: '多' }), mkNote('p1', 83, 2, 6, -1, 0.5, { beamWithNext: true, slur: 'start', lyric: '采' }), mkNote('p1', 83, 3, 1, 0, 0.5, { slur: 'stop' })]),
  mkM(84, [mkNote('p1', 84, 1, 2, 0, 2, { lyric: '撷' })]),
  mkM(85, [mkChord('p1', 85, 1, ARP3_LOW, 1.5, { dot: true, technique: '花指', lyric: '此' }), mkNote('p1', 85, 2, 6, -1, 0.5, { lyric: '物' })]),
  mkM(86, [mkNote('p1', 86, 1, 1, 0, 1, { lyric: '最' }), mkNote('p1', 86, 2, 6, -1, 0.5, { beamWithNext: true, lyric: '相' }), mkNote('p1', 86, 3, 5, -1, 0.5)]),
  mkM(87, [mkOct('p1', 87, 1, 5, -1, 2, { slur: 'start', lyric: '思' })]),
  mkM(88, [mkOct('p1', 88, 1, 5, -1, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(89, [mkNote('p1', 89, 1, 5, -1, 1, { lyric: '红' }), mkNote('p1', 89, 2, 5, 0, 1, { lyric: '豆' })]),
  mkM(90, [mkNote('p1', 90, 1, 5, 0, 1, { lyric: '生' }), mkNote('p1', 90, 2, 3, 0, 1, { lyric: '南' })]),
  mkM(91, [mkOct('p1', 91, 1, 2, 0, 2, { slur: 'start', lyric: '国' })]),
  mkM(92, [mkOct('p1', 92, 1, 2, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(93, [mkOct('p1', 93, 1, 5, 0, 1, { lyric: '春' }), mkNote('p1', 93, 2, 3, 0, 0.5, { technique: '托', beamWithNext: true, lyric: '来' }), mkNote('p1', 93, 3, 2, 0, 0.5, { technique: '托' })]),
  mkM(94, [mkNote('p1', 94, 1, 1, 0, 1, { technique: '托', lyric: '发' }), mkNote('p1', 94, 2, 6, -1, 0.5, { technique: '抹', beamWithNext: true, slur: 'start', lyric: '几' }), mkNote('p1', 94, 3, 1, 0, 0.5, { slur: 'stop' })]),
  mkM(95, [mkOct('p1', 95, 1, 2, 0, 2, { slur: 'start', lyric: '枝' })]),
  mkM(96, [mkOct('p1', 96, 1, 2, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(97, [mkOct('p1', 97, 1, 5, -1, 1.5, { dot: true, lyric: '劝' }), mkNote('p1', 97, 2, 6, -1, 0.5)]),
  mkM(98, [mkNote('p1', 98, 1, 1, 0, 2, { lyric: '君' })]),
  mkM(99, [mkOct('p1', 99, 1, 1, 0, 1, { lyric: '多' }), mkNote('p1', 99, 2, 6, -1, 0.5, { beamWithNext: true, slur: 'start', lyric: '采' }), mkNote('p1', 99, 3, 1, 0, 0.5, { slur: 'stop' })]),
  mkM(100, [mkNote('p1', 100, 1, 2, 0, 2, { lyric: '撷' })]),

  // ==================== 第 5 页 (M101 ~ M104) ====================
  mkM(101, [mkChord('p1', 101, 1, ARP3_LOW, 1.5, { dot: true, technique: '花指', lyric: '此' }), mkNote('p1', 101, 2, 6, -1, 0.5, { lyric: '物' })]),
  mkM(102, [mkNote('p1', 102, 1, 2, 0, 1, { lyric: '最' }), mkNote('p1', 102, 2, 1, 0, 1, { lyric: '相' })]),
  mkM(103, [mkOct('p1', 103, 1, 1, 0, 2, { slur: 'start', lyric: '思' })]),
  mkM(104, [mkOct('p1', 104, 1, 1, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
];

// 古筝 II 声部 (与原版谱面 100% 对应)
const guzhengPart2Measures: Measure[] = [
  // M1 ~ M8: 前奏休止
  { measureNumber: 1, notes: [{ id: 'p2_m1_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p2_m1_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 2, notes: [{ id: 'p2_m2_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p2_m2_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 3, notes: [{ id: 'p2_m3_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p2_m3_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 4, notes: [{ id: 'p2_m4_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p2_m4_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 5, showBoxNumber: true, notes: [{ id: 'p2_m5_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p2_m5_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 6, notes: [{ id: 'p2_m6_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p2_m6_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 7, notes: [{ id: 'p2_m7_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p2_m7_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 8, notes: [{ id: 'p2_m8_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p2_m8_n2', pitch: 0, octave: 0, duration: 1 }] },

  // M9 ~ M10: 古筝 I 领奏，古筝 II 休止准备
  { measureNumber: 9, notes: [{ id: 'p2_m9_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p2_m9_n2', pitch: 0, octave: 0, duration: 1 }] },
  { measureNumber: 10, showBoxNumber: true, notes: [{ id: 'p2_m10_n1', pitch: 0, octave: 0, duration: 1 }, { id: 'p2_m10_n2', pitch: 0, octave: 0, duration: 1 }] },

  // M11 ~ M12: 古筝 II 精彩呼应接奏！
  {
    measureNumber: 11,
    notes: [
      {
        id: 'p2_m11_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 1,
        technique: '大撮',
      },
      { id: 'p2_m11_n2', pitch: 5, octave: -1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'p2_m11_n3', pitch: 6, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },
  {
    measureNumber: 12,
    notes: [
      {
        id: 'p2_m12_n1',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 1,
        technique: '托',
      },
      { id: 'p2_m12_n2', pitch: 6, octave: -1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'p2_m12_n3', pitch: 5, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },

  // M13 ~ M14: 5: - (古筝 II 长音延音支撑)
  {
    measureNumber: 13,
    notes: [
      {
        id: 'p2_m13_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '托',
        slur: 'start',
      },
    ],
  },
  {
    measureNumber: 14,
    notes: [
      {
        id: 'p2_m14_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '托',
        slur: 'stop',
        tiedFromPrev: true,
      },
    ],
  },

  // M15 ~ M16: 古筝 II 再次接奏
  {
    measureNumber: 15,
    showBoxNumber: true,
    notes: [
      {
        id: 'p2_m15_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 1,
        technique: '托',
      },
      { id: 'p2_m15_n2', pitch: 5, octave: -1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'p2_m15_n3', pitch: 6, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },
  {
    measureNumber: 16,
    notes: [
      {
        id: 'p2_m16_n1',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 1,
        technique: '托',
      },
      { id: 'p2_m16_n2', pitch: 6, octave: -1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'p2_m16_n3', pitch: 5, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },

  // M17: 5: -
  {
    measureNumber: 17,
    notes: [
      {
        id: 'p2_m17_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '托',
      },
    ],
  },
  // M18: 5:. 6_
  {
    measureNumber: 18,
    notes: [
      {
        id: 'p2_m18_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 1.5,
        dot: true,
        technique: '托',
      },
      { id: 'p2_m18_n2', pitch: 6, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },
  // M19: 琶音 1/3/1. -
  {
    measureNumber: 19,
    notes: [
      {
        id: 'p2_m19_n1',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 3, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 2,
        technique: '花指',
      },
    ],
  },
  // M20: 2. 3_ 5_ (勾托抹)
  {
    measureNumber: 20,
    showBoxNumber: true,
    notes: [
      { id: 'p2_m20_n1', pitch: 2, octave: -1, duration: 1, technique: '勾' },
      { id: 'p2_m20_n2', pitch: 3, octave: -1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'p2_m20_n3', pitch: 5, octave: -1, duration: 0.5, technique: '抹' },
    ],
  },

  // M21: 2. 3. (抹托)
  {
    measureNumber: 21,
    notes: [
      { id: 'p2_m21_n1', pitch: 2, octave: -1, duration: 1, technique: '抹' },
      { id: 'p2_m21_n2', pitch: 3, octave: -1, duration: 1, technique: '托' },
    ],
  },
  // M22: 5. 3. (抹托)
  {
    measureNumber: 22,
    notes: [
      { id: 'p2_m22_n1', pitch: 5, octave: -1, duration: 1, technique: '抹' },
      { id: 'p2_m22_n2', pitch: 3, octave: -1, duration: 1, technique: '托' },
    ],
  },
  // M23: 2/2. 6.
  {
    measureNumber: 23,
    notes: [
      {
        id: 'p2_m23_n1',
        pitch: 2,
        octave: 0,
        chord: [{ pitch: 2, octave: 0 }, { pitch: 2, octave: -1 }],
        duration: 1,
        technique: '托',
      },
      { id: 'p2_m23_n2', pitch: 6, octave: -1, duration: 1, technique: '托' },
    ],
  },
  // M24: 5. -
  {
    measureNumber: 24,
    notes: [
      { id: 'p2_m24_n1', pitch: 5, octave: -1, duration: 2, technique: '托' },
    ],
  },
  // M25: 5: - (长音支撑，古筝 I 旋律)
  {
    measureNumber: 25,
    showBoxNumber: true,
    notes: [
      {
        id: 'p2_m25_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '托',
        slur: 'start',
      },
    ],
  },
  // M26: 5: -
  {
    measureNumber: 26,
    notes: [
      {
        id: 'p2_m26_n1',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '托',
        slur: 'stop',
        tiedFromPrev: true,
      },
    ],
  },
  // M27: 5. 5 (勾托)
  {
    measureNumber: 27,
    notes: [
      { id: 'p2_m27_n1', pitch: 5, octave: -1, duration: 1, technique: '勾' },
      { id: 'p2_m27_n2', pitch: 5, octave: 0, duration: 1, technique: '托' },
    ],
  },
  // M28: 5 3 (第1页收尾)
  {
    measureNumber: 28,
    notes: [
      { id: 'p2_m28_n1', pitch: 5, octave: 0, duration: 1, technique: '抹' },
      { id: 'p2_m28_n2', pitch: 3, octave: 0, duration: 1, technique: '托' },
    ],
  },

  // ==================== 第 2 页 (M29 ~ M52) ====================
  mkM(29, [mkOct('p2', 29, 1, 2, 0, 2)]),
  mkM(30, [mkOct('p2', 30, 1, 3, 0, 2)]),
  mkM(31, [mkOct('p2', 31, 1, 5, 0, 1), mkNote('p2', 31, 2, 3, 0, 0.5, { technique: '托', beamWithNext: true }), mkNote('p2', 31, 3, 2, 0, 0.5, { technique: '托' })]),
  mkM(32, [mkNote('p2', 32, 1, 1, 0, 1, { technique: '托' }), mkNote('p2', 32, 2, 6, -1, 0.5, { technique: '抹', beamWithNext: true, slur: 'start' }), mkNote('p2', 32, 3, 1, 0, 0.5, { slur: 'stop' })]),
  mkM(33, [mkOct('p2', 33, 1, 2, 0, 2)]),
  mkM(34, [mkOct('p2', 34, 1, 5, -1, 1.5, { dot: true }), mkNote('p2', 34, 2, 6, -1, 0.5, { technique: '托' })]),
  mkM(35, [mkNote('p2', 35, 1, 1, 0, 1, { technique: '托' }), mkNote('p2', 35, 2, 2, 0, 0.5, { technique: '托', beamWithNext: true, slur: 'start' }), mkNote('p2', 35, 3, 3, 0, 0.5, { slur: 'stop' })]),
  mkM(36, [mkNote('p2', 36, 1, 5, -1, 1, { technique: '勾' }), mkNote('p2', 36, 2, 3, 0, 0.5, { technique: '托', beamWithNext: true, slur: 'start' }), mkNote('p2', 36, 3, 5, 0, 0.5, { slur: 'stop' })]),
  mkM(37, [mkNote('p2', 37, 1, 6, -1, 1, { technique: '抹' }), mkNote('p2', 37, 2, 2, 0, 1, { technique: '上滑音' })]),
  mkM(38, [mkNote('p2', 38, 1, 5, -1, 1, { technique: '抹' }), mkNote('p2', 38, 2, 6, -1, 1, { technique: '托' })]),
  mkM(39, [mkOct('p2', 39, 1, 1, 0, 2, { slur: 'start' })]),
  mkM(40, [mkOct('p2', 40, 1, 1, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(41, [mkOct('p2', 41, 1, 5, -1, 1), mkNote('p2', 41, 2, 5, -1, 0.5, { technique: '抹', beamWithNext: true, slur: 'start' }), mkNote('p2', 41, 3, 6, -1, 0.5, { slur: 'stop' })]),
  mkM(42, [mkOct('p2', 42, 1, 1, 0, 1), mkNote('p2', 42, 2, 6, -1, 0.5, { technique: '抹', beamWithNext: true }), mkNote('p2', 42, 3, 5, -1, 0.5)]),
  mkM(43, [mkOct('p2', 43, 1, 5, -1, 2, { slur: 'start' })]),
  mkM(44, [mkOct('p2', 44, 1, 5, -1, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(45, [mkOct('p2', 45, 1, 5, -1, 1), mkNote('p2', 45, 2, 5, -1, 0.5, { beamWithNext: true, slur: 'start' }), mkNote('p2', 45, 3, 6, -1, 0.5, { slur: 'stop' })]),
  mkM(46, [mkOct('p2', 46, 1, 1, 0, 1), mkNote('p2', 46, 2, 6, -1, 0.5, { beamWithNext: true }), mkNote('p2', 46, 3, 5, -1, 0.5)]),
  mkM(47, [mkOct('p2', 47, 1, 5, -1, 2, { slur: 'start' })]),
  mkM(48, [mkOct('p2', 48, 1, 5, -1, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(49, [mkOct('p2', 49, 1, 5, -1, 1.5, { dot: true }), mkNote('p2', 49, 2, 6, -1, 0.5, { technique: '抹' })]),
  mkM(50, [mkNote('p2', 50, 1, 1, 0, 2, { technique: '托' })]),
  mkM(51, [mkOct('p2', 51, 1, 1, 0, 1), mkNote('p2', 51, 2, 6, -1, 0.5, { technique: '抹', beamWithNext: true, slur: 'start' }), mkNote('p2', 51, 3, 1, 0, 0.5, { slur: 'stop' })]),
  mkM(52, [mkNote('p2', 52, 1, 2, 0, 2, { technique: '托' })]),

  // ==================== 第 3 页 (M53 ~ M76) ====================
  mkM(53, [mkChord('p2', 53, 1, ARP3_LOW, 1.5, { dot: true, technique: '花指' }), mkNote('p2', 53, 2, 6, -1, 0.5, { technique: '抹' })]),
  mkM(54, [mkNote('p2', 54, 1, 1, 0, 1, { technique: '托' }), mkNote('p2', 54, 2, 6, -1, 0.5, { technique: '托', beamWithNext: true }), mkNote('p2', 54, 3, 5, -1, 0.5)]),
  mkM(55, [mkOct('p2', 55, 1, 5, -1, 2, { slur: 'start' })]),
  mkM(56, [mkOct('p2', 56, 1, 5, -1, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(57, [mkNote('p2', 57, 1, 5, -1, 1, { technique: '勾' }), mkNote('p2', 57, 2, 5, 0, 1, { technique: '托' })]),
  mkM(58, [mkNote('p2', 58, 1, 5, 0, 1, { technique: '抹' }), mkNote('p2', 58, 2, 3, 0, 1, { technique: '托' })]),
  mkM(59, [mkOct('p2', 59, 1, 2, 0, 2, { slur: 'start' })]),
  mkM(60, [mkOct('p2', 60, 1, 2, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(61, [mkOct('p2', 61, 1, 5, 0, 1), mkNote('p2', 61, 2, 3, 0, 0.5, { beamWithNext: true }), mkNote('p2', 61, 3, 2, 0, 0.5)]),
  mkM(62, [mkNote('p2', 62, 1, 1, 0, 1), mkNote('p2', 62, 2, 6, -1, 0.5, { beamWithNext: true, slur: 'start' }), mkNote('p2', 62, 3, 1, 0, 0.5, { slur: 'stop' })]),
  mkM(63, [mkOct('p2', 63, 1, 2, 0, 2, { slur: 'start' })]),
  mkM(64, [mkOct('p2', 64, 1, 2, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(65, [mkOct('p2', 65, 1, 5, -1, 1.5, { dot: true }), mkNote('p2', 65, 2, 6, -1, 0.5, { technique: '抹' })]),
  mkM(66, [mkNote('p2', 66, 1, 1, 0, 2, { technique: '托' })]),
  mkM(67, [mkOct('p2', 67, 1, 1, 0, 1), mkNote('p2', 67, 2, 6, -1, 0.5, { technique: '抹', beamWithNext: true, slur: 'start' }), mkNote('p2', 67, 3, 1, 0, 0.5, { slur: 'stop' })]),
  mkM(68, [mkNote('p2', 68, 1, 2, 0, 2, { technique: '托' })]),
  mkM(69, [mkChord('p2', 69, 1, ARP3_LOW, 1.5, { dot: true, technique: '花指' }), mkNote('p2', 69, 2, 6, -1, 0.5, { technique: '抹' })]),
  mkM(70, [mkNote('p2', 70, 1, 2, 0, 1, { technique: '托' }), mkNote('p2', 70, 2, 1, 0, 1, { technique: '下滑音' })]),
  mkM(71, [mkOct('p2', 71, 1, 1, 0, 2, { slur: 'start' })]),
  mkM(72, [mkOct('p2', 72, 1, 1, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(73, [mkOct('p2', 73, 1, 5, 0, 1, { technique: '花指' }), mkNote('p2', 73, 2, 5, 0, 0.5, { beamWithNext: true, slur: 'start' }), mkNote('p2', 73, 3, 6, 0, 0.5, { slur: 'stop' })]),
  mkM(74, [mkOct('p2', 74, 1, 1, 1, 1), mkNote('p2', 74, 2, 6, 0, 0.5, { beamWithNext: true }), mkNote('p2', 74, 3, 5, 0, 0.5)]),
  mkM(75, [mkOct('p2', 75, 1, 5, 0, 2, { slur: 'start' })]),
  mkM(76, [mkOct('p2', 76, 1, 5, 0, 2, { slur: 'stop', tiedFromPrev: true })]),

  // ==================== 第 4 页 (M77 ~ M100) ====================
  mkM(77, [mkOct('p2', 77, 1, 5, 0, 1), mkNote('p2', 77, 2, 5, 0, 0.5, { beamWithNext: true, slur: 'start' }), mkNote('p2', 77, 3, 6, 0, 0.5, { slur: 'stop' })]),
  mkM(78, [mkOct('p2', 78, 1, 1, 1, 1), mkNote('p2', 78, 2, 6, 0, 0.5, { beamWithNext: true }), mkNote('p2', 78, 3, 5, 0, 0.5)]),
  mkM(79, [mkOct('p2', 79, 1, 5, 0, 2, { slur: 'start' })]),
  mkM(80, [mkOct('p2', 80, 1, 5, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(81, [mkOct('p2', 81, 1, 5, 0, 1.5, { dot: true }), mkNote('p2', 81, 2, 6, 0, 0.5)]),
  mkM(82, [mkNote('p2', 82, 1, 1, 1, 2)]),
  mkM(83, [mkOct('p2', 83, 1, 1, 1, 1), mkNote('p2', 83, 2, 6, 0, 0.5, { beamWithNext: true, slur: 'start' }), mkNote('p2', 83, 3, 1, 1, 0.5, { slur: 'stop' })]),
  mkM(84, [mkNote('p2', 84, 1, 2, 1, 2)]),
  mkM(85, [mkChord('p2', 85, 1, ARP3_HIGH, 1.5, { dot: true, technique: '花指' }), mkNote('p2', 85, 2, 6, 0, 0.5)]),
  mkM(86, [mkNote('p2', 86, 1, 1, 1, 1), mkNote('p2', 86, 2, 6, 0, 0.5, { beamWithNext: true }), mkNote('p2', 86, 3, 5, 0, 0.5)]),
  mkM(87, [mkOct('p2', 87, 1, 5, 0, 2, { slur: 'start' })]),
  mkM(88, [mkOct('p2', 88, 1, 5, 0, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(89, [mkNote('p2', 89, 1, 5, 0, 1), mkNote('p2', 89, 2, 5, 1, 1)]),
  mkM(90, [mkNote('p2', 90, 1, 5, 1, 1), mkNote('p2', 90, 2, 3, 1, 1)]),
  mkM(91, [mkOct('p2', 91, 1, 2, 1, 2, { slur: 'start' })]),
  mkM(92, [mkOct('p2', 92, 1, 2, 1, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(93, [mkOct('p2', 93, 1, 5, 1, 1), mkNote('p2', 93, 2, 3, 1, 0.5, { beamWithNext: true }), mkNote('p2', 93, 3, 2, 1, 0.5)]),
  mkM(94, [mkNote('p2', 94, 1, 1, 1, 1), mkNote('p2', 94, 2, 6, 0, 0.5, { beamWithNext: true, slur: 'start' }), mkNote('p2', 94, 3, 1, 1, 0.5, { slur: 'stop' })]),
  mkM(95, [mkOct('p2', 95, 1, 2, 1, 2, { slur: 'start' })]),
  mkM(96, [mkOct('p2', 96, 1, 2, 1, 2, { slur: 'stop', tiedFromPrev: true })]),
  mkM(97, [mkOct('p2', 97, 1, 5, 0, 1.5, { dot: true }), mkNote('p2', 97, 2, 6, 0, 0.5)]),
  mkM(98, [mkNote('p2', 98, 1, 1, 1, 2)]),
  mkM(99, [mkOct('p2', 99, 1, 1, 1, 1), mkNote('p2', 99, 2, 6, 0, 0.5, { beamWithNext: true, slur: 'start' }), mkNote('p2', 99, 3, 1, 1, 0.5, { slur: 'stop' })]),
  mkM(100, [mkNote('p2', 100, 1, 2, 1, 2)]),

  // ==================== 第 5 页 (M101 ~ M104) ====================
  mkM(101, [mkChord('p2', 101, 1, ARP3_HIGH, 1.5, { dot: true, technique: '花指' }), mkNote('p2', 101, 2, 6, 0, 0.5)]),
  mkM(102, [mkNote('p2', 102, 1, 2, 1, 1), mkNote('p2', 102, 2, 1, 1, 1)]),
  mkM(103, [mkOct('p2', 103, 1, 1, 1, 2, { slur: 'start' })]),
  mkM(104, [mkOct('p2', 104, 1, 1, 1, 2, { slur: 'stop', tiedFromPrev: true })]),
];

// 前奏领唱导引旋律 ( 5. 6 | 1 1 | 1 6 1 | 2 - | 2. 6 | 2 1 | 1 - | 1. 0 )
const introMelodyMeasures: Measure[] = [
  { measureNumber: 1, notes: [{ id: 'in_1', pitch: 5, octave: 0, duration: 1.5, dot: true }, { id: 'in_2', pitch: 6, octave: 0, duration: 0.5 }] },
  { measureNumber: 2, notes: [{ id: 'in_3', pitch: 1, octave: 1, duration: 1 }, { id: 'in_4', pitch: 1, octave: 1, duration: 1 }] },
  { measureNumber: 3, notes: [{ id: 'in_5', pitch: 1, octave: 1, duration: 1 }, { id: 'in_6', pitch: 6, octave: 0, duration: 0.5 }, { id: 'in_7', pitch: 1, octave: 1, duration: 0.5 }] },
  { measureNumber: 4, notes: [{ id: 'in_8', pitch: 2, octave: 1, duration: 2 }] },
  { measureNumber: 5, showBoxNumber: true, notes: [{ id: 'in_9', pitch: 2, octave: 1, duration: 1.5, dot: true }, { id: 'in_10', pitch: 6, octave: 0, duration: 0.5 }] },
  { measureNumber: 6, notes: [{ id: 'in_11', pitch: 2, octave: 1, duration: 1 }, { id: 'in_12', pitch: 1, octave: 1, duration: 1 }] },
  { measureNumber: 7, notes: [{ id: 'in_13', pitch: 1, octave: 1, duration: 2 }] },
  { measureNumber: 8, notes: [{ id: 'in_14', pitch: 1, octave: 1, duration: 1.5, dot: true, tiedFromPrev: true }, { id: 'in_15', pitch: 0, octave: 0, duration: 0.5 }] },
];

export const tangshiScore: SheetMusic = {
  id: 'tangshi-lianchang',
  title: '唐 诗 联 唱',
  subtitle: '古筝重奏全本（5页 · 104小节原件画框同步 / 全本104小节21弦数字简谱）',
  author: '彭  野 曲 / 成莉 改编',
  key: '1=D',
  timeSignature: [2, 4],
  expression: '抒情地',
  defaultBpm: 78,
  beatUnit: 'quarter',
  difficulty: '考级',
  description: '经典古筝重奏与少儿考级曲目。完整收录 5 页 104 小节原版乐谱与画框扫拍同步，并已完整转义为全本 104 小节双声部数字简谱与 21 弦亮弦教学（含边弹边唱歌词）。',
  scoreMode: 'original',
  originalScore: TANGSHI_ORIGINAL_SCORE,
  measures: guzhengPart1Measures,
  parts: [
    { id: 'part1', name: '古筝 I', isMain: true, measures: guzhengPart1Measures },
    { id: 'part2', name: '古筝 II', isMain: false, measures: guzhengPart2Measures },
  ],
  introMelody: introMelodyMeasures,
};
