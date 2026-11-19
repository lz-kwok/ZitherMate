import { SheetMusic, Measure } from '../../types/music';

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
  // 小节 28: 2/2. - (全曲华彩收尾)
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
  // M28: 5 3 (抹托收尾)
  {
    measureNumber: 28,
    notes: [
      { id: 'p2_m28_n1', pitch: 5, octave: 0, duration: 1, technique: '抹' },
      { id: 'p2_m28_n2', pitch: 3, octave: 0, duration: 1, technique: '托' },
    ],
  },
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
  subtitle: '古筝重奏 / 中国音乐学院考级曲目',
  author: '彭  野 曲 / 成莉 改编',
  key: '1=D',
  timeSignature: [2, 4],
  expression: '抒情地',
  defaultBpm: 78,
  beatUnit: 'quarter',
  difficulty: '考级',
  description: '经典古筝重奏与少儿考级曲目。重点训练大撮（八度双音）、托抹勾配合以及双手声部平衡与双古筝轮奏呼应。',
  measures: guzhengPart1Measures,
  parts: [
    { id: 'part1', name: '古筝 I', isMain: true, measures: guzhengPart1Measures },
    { id: 'part2', name: '古筝 II', isMain: false, measures: guzhengPart2Measures },
  ],
  introMelody: introMelodyMeasures,
};
