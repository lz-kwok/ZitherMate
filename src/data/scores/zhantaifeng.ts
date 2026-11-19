import { SheetMusic, Measure } from '../../types/music';

// 《战台风》 王昌元 作曲，1=D 2/4 ♩=120
// 古筝当代独奏现代奠基之作，还原经典第一主题铿锵豪迈的劳动号子节奏
const zhantaifengMeasures: Measure[] = [
  // 小节 1: 3 2_ 3_ (1.0 + 0.5 + 0.5 = 2.0)
  {
    measureNumber: 1,
    showBoxNumber: true,
    notes: [
      { id: 'ztf_m1_n1', pitch: 3, octave: 0, duration: 1, technique: '花指' },
      { id: 'ztf_m1_n2', pitch: 2, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ztf_m1_n3', pitch: 3, octave: 0, duration: 0.5, technique: '托' },
    ],
  },
  // 小节 2: 5 6_ 1*_ (1.0 + 0.5 + 0.5 = 2.0)
  {
    measureNumber: 2,
    notes: [
      { id: 'ztf_m2_n1', pitch: 5, octave: 0, duration: 1, technique: '托' },
      { id: 'ztf_m2_n2', pitch: 6, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ztf_m2_n3', pitch: 1, octave: 1, duration: 0.5, technique: '托' },
    ],
  },
  // 小节 3: 6_ 1*_ 6_ 5_ (0.5 * 4 = 2.0)
  {
    measureNumber: 3,
    notes: [
      { id: 'ztf_m3_n1', pitch: 6, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ztf_m3_n2', pitch: 1, octave: 1, duration: 0.5, technique: '托' },
      { id: 'ztf_m3_n3', pitch: 6, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ztf_m3_n4', pitch: 5, octave: 0, duration: 0.5, technique: '勾' },
    ],
  },
  // 小节 4: 6 - (2.0 八度摇指)
  {
    measureNumber: 4,
    notes: [
      {
        id: 'ztf_m4_n1',
        pitch: 6,
        octave: 0,
        chord: [{ pitch: 6, octave: 0 }, { pitch: 6, octave: -1 }],
        duration: 2,
        technique: '摇指',
      },
    ],
  },
  // 小节 5: [5] 5 3_ 5_ (1.0 + 0.5 + 0.5 = 2.0)
  {
    measureNumber: 5,
    showBoxNumber: true,
    notes: [
      { id: 'ztf_m5_n1', pitch: 5, octave: 0, duration: 1, technique: '托' },
      { id: 'ztf_m5_n2', pitch: 3, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ztf_m5_n3', pitch: 5, octave: 0, duration: 0.5, technique: '托' },
    ],
  },
  // 小节 6: 6_ 1*_ 6_ 5_ (0.5 * 4 = 2.0)
  {
    measureNumber: 6,
    notes: [
      { id: 'ztf_m6_n1', pitch: 6, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ztf_m6_n2', pitch: 1, octave: 1, duration: 0.5, technique: '托' },
      { id: 'ztf_m6_n3', pitch: 6, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ztf_m6_n4', pitch: 5, octave: 0, duration: 0.5, technique: '勾' },
    ],
  },
  // 小节 7: 3_ 5_ 3_ 2_ (0.5 * 4 = 2.0)
  {
    measureNumber: 7,
    notes: [
      { id: 'ztf_m7_n1', pitch: 3, octave: 0, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'ztf_m7_n2', pitch: 5, octave: 0, duration: 0.5, technique: '托' },
      { id: 'ztf_m7_n3', pitch: 3, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ztf_m7_n4', pitch: 2, octave: 0, duration: 0.5, technique: '勾' },
    ],
  },
  // 小节 8: 1 - (2.0 八度大撮)
  {
    measureNumber: 8,
    notes: [
      {
        id: 'ztf_m8_n1',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 2,
        technique: '大撮',
      },
    ],
  },
  // 小节 9: 2. 3_ (1.5 + 0.5 = 2.0)
  {
    measureNumber: 9,
    notes: [
      {
        id: 'ztf_m9_n1',
        pitch: 2,
        octave: 0,
        chord: [{ pitch: 2, octave: 0 }, { pitch: 5, octave: -1 }, { pitch: 2, octave: -1 }],
        duration: 1.5,
        dot: true,
        technique: '花指',
      },
      { id: 'ztf_m9_n2', pitch: 3, octave: 0, duration: 0.5, technique: '抹' },
    ],
  },
  // 小节 10: [10] 2_ 1_ 6̣_ 1_ (0.5 * 4 = 2.0)
  {
    measureNumber: 10,
    showBoxNumber: true,
    notes: [
      { id: 'ztf_m10_n1', pitch: 2, octave: 0, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'ztf_m10_n2', pitch: 1, octave: 0, duration: 0.5, technique: '抹' },
      { id: 'ztf_m10_n3', pitch: 6, octave: -1, duration: 0.5, technique: '勾', beamWithNext: true },
      { id: 'ztf_m10_n4', pitch: 1, octave: 0, duration: 0.5, technique: '托' },
    ],
  },
  // 小节 11: 2_ 3_ 2_ 1_ (0.5 * 4 = 2.0)
  {
    measureNumber: 11,
    notes: [
      { id: 'ztf_m11_n1', pitch: 2, octave: 0, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'ztf_m11_n2', pitch: 3, octave: 0, duration: 0.5, technique: '托' },
      { id: 'ztf_m11_n3', pitch: 2, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ztf_m11_n4', pitch: 1, octave: 0, duration: 0.5, technique: '勾' },
    ],
  },
  // 小节 12: 6̣ - (2.0 八度大撮强收)
  {
    measureNumber: 12,
    notes: [
      {
        id: 'ztf_m12_n1',
        pitch: 6,
        octave: -1,
        chord: [{ pitch: 6, octave: -1 }, { pitch: 6, octave: -2 }],
        duration: 2,
        technique: '大撮',
      },
    ],
  },
];

export const zhantaifengScore: SheetMusic = {
  id: 'zhan-taifeng',
  title: '战 台 风',
  subtitle: '王昌元 作曲 / 中国古筝现代经典名曲',
  author: '王昌元 作曲',
  key: '1=D',
  timeSignature: [2, 4],
  expression: '激昂、豪迈雄壮地',
  defaultBpm: 120,
  beatUnit: 'quarter',
  difficulty: '名曲演奏',
  description: '古筝里程碑级高阶独奏名曲。生动表现码头工人勇战台风的豪情壮举。重点练习花指扫弦、快节奏托抹勾连奏以及强劲摇指与八度大撮爆发力。',
  measures: zhantaifengMeasures,
};
