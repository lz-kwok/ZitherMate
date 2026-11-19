import { SheetMusic, Measure } from '../../types/music';

// 《渔舟唱晚》 娄树华 改编，1=D 4/4 ♩=66
// 中国古筝传统十大名曲之一，还原经典慢板主题“老八板”悠扬韵律
const yuzhouMeasures: Measure[] = [
  // 小节 1: 3. 6_ 5 - (1.5 + 0.5 + 2.0 = 4.0)
  {
    measureNumber: 1,
    showBoxNumber: true,
    notes: [
      { id: 'yz_m1_n1', pitch: 3, octave: 1, duration: 1.5, dot: true, technique: '托' },
      { id: 'yz_m1_n2', pitch: 6, octave: 0, duration: 0.5, technique: '抹' },
      { id: 'yz_m1_n3', pitch: 5, octave: 0, duration: 2, technique: '颤音' },
    ],
  },
  // 小节 2: 3._ 5= 3_ 2_ 1 - (0.75 + 0.25 + 0.5 + 0.5 + 2.0 = 4.0)
  {
    measureNumber: 2,
    notes: [
      { id: 'yz_m2_n1', pitch: 3, octave: 1, duration: 0.75, dot: true, technique: '托', beamWithNext: true },
      { id: 'yz_m2_n2', pitch: 5, octave: 1, duration: 0.25, technique: '抹' },
      { id: 'yz_m2_n3', pitch: 3, octave: 1, duration: 0.5, technique: '勾', beamWithNext: true },
      { id: 'yz_m2_n4', pitch: 2, octave: 1, duration: 0.5, technique: '托' },
      {
        id: 'yz_m2_n5',
        pitch: 1,
        octave: 1,
        chord: [{ pitch: 1, octave: 1 }, { pitch: 1, octave: 0 }],
        duration: 2,
        technique: '大撮',
      },
    ],
  },
  // 小节 3: 6̣. 1_ 2_ 3_ 5 - (0.75 + 0.25 + 0.5 + 0.5 + 2.0 = 4.0)
  {
    measureNumber: 3,
    notes: [
      { id: 'yz_m3_n1', pitch: 6, octave: 0, duration: 0.75, dot: true, technique: '勾', beamWithNext: true },
      { id: 'yz_m3_n2', pitch: 1, octave: 1, duration: 0.25, technique: '抹' },
      { id: 'yz_m3_n3', pitch: 2, octave: 1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'yz_m3_n4', pitch: 3, octave: 1, duration: 0.5, technique: '抹' },
      { id: 'yz_m3_n5', pitch: 5, octave: 1, duration: 2, technique: '颤音' },
    ],
  },
  // 小节 4: 2._ 3= 2_ 1_ 6̣ - (0.75 + 0.25 + 0.5 + 0.5 + 2.0 = 4.0)
  {
    measureNumber: 4,
    notes: [
      { id: 'yz_m4_n1', pitch: 2, octave: 1, duration: 0.75, dot: true, technique: '托', beamWithNext: true },
      { id: 'yz_m4_n2', pitch: 3, octave: 1, duration: 0.25, technique: '抹' },
      { id: 'yz_m4_n3', pitch: 2, octave: 1, duration: 0.5, technique: '勾', beamWithNext: true },
      { id: 'yz_m4_n4', pitch: 1, octave: 1, duration: 0.5, technique: '抹' },
      {
        id: 'yz_m4_n5',
        pitch: 6,
        octave: 0,
        chord: [{ pitch: 6, octave: 0 }, { pitch: 6, octave: -1 }],
        duration: 2,
        technique: '大撮',
      },
    ],
  },
  // 小节 5: [5] 5̣. 6̣_ 1_ 2_ 3 - (0.75 + 0.25 + 0.5 + 0.5 + 2.0 = 4.0)
  {
    measureNumber: 5,
    showBoxNumber: true,
    notes: [
      { id: 'yz_m5_n1', pitch: 5, octave: 0, duration: 0.75, dot: true, technique: '花指', beamWithNext: true },
      { id: 'yz_m5_n2', pitch: 6, octave: 0, duration: 0.25, technique: '抹' },
      { id: 'yz_m5_n3', pitch: 1, octave: 1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'yz_m5_n4', pitch: 2, octave: 1, duration: 0.5, technique: '抹' },
      { id: 'yz_m5_n5', pitch: 3, octave: 1, duration: 2, technique: '颤音' },
    ],
  },
  // 小节 6: 5. 6_ 1*_ 6_ 5 - (0.75 + 0.25 + 0.5 + 0.5 + 2.0 = 4.0)
  {
    measureNumber: 6,
    notes: [
      { id: 'yz_m6_n1', pitch: 5, octave: 1, duration: 0.75, dot: true, technique: '托', beamWithNext: true },
      { id: 'yz_m6_n2', pitch: 6, octave: 1, duration: 0.25, technique: '抹' },
      { id: 'yz_m6_n3', pitch: 1, octave: 2, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'yz_m6_n4', pitch: 6, octave: 1, duration: 0.5, technique: '抹' },
      { id: 'yz_m6_n5', pitch: 5, octave: 1, duration: 2, technique: '颤音' },
    ],
  },
  // 小节 7: 3._ 5= 3_ 2_ 1_ 6̣_ 2_ 6̣_ (0.75 + 0.25 + 0.5*6 = 4.0)
  {
    measureNumber: 7,
    notes: [
      { id: 'yz_m7_n1', pitch: 3, octave: 1, duration: 0.75, dot: true, technique: '托', beamWithNext: true },
      { id: 'yz_m7_n2', pitch: 5, octave: 1, duration: 0.25, technique: '抹' },
      { id: 'yz_m7_n3', pitch: 3, octave: 1, duration: 0.5, technique: '勾', beamWithNext: true },
      { id: 'yz_m7_n4', pitch: 2, octave: 1, duration: 0.5, technique: '托' },
      { id: 'yz_m7_n5', pitch: 1, octave: 1, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'yz_m7_n6', pitch: 6, octave: 0, duration: 0.5, technique: '勾' },
      { id: 'yz_m7_n7', pitch: 2, octave: 1, duration: 0.5, technique: '托', beamWithNext: true },
      { id: 'yz_m7_n8', pitch: 6, octave: 0, duration: 0.5, technique: '勾' },
    ],
  },
  // 小节 8: 5̣ - - - (4.0 拍八度大撮收尾)
  {
    measureNumber: 8,
    notes: [
      {
        id: 'yz_m8_n1',
        pitch: 5,
        octave: 0,
        chord: [{ pitch: 5, octave: 0 }, { pitch: 5, octave: -1 }],
        duration: 4,
        technique: '大撮',
      },
    ],
  },
];

export const yuzhouScore: SheetMusic = {
  id: 'yuzhou-changwan',
  title: '渔 舟 唱 晚',
  subtitle: '中国古筝传统十大名曲 / 河南筝派代表作',
  author: '娄树华 改编',
  key: '1=D',
  timeSignature: [4, 4],
  expression: '悠扬、如诗如画地',
  defaultBpm: 66,
  beatUnit: 'quarter',
  difficulty: '进阶',
  description: '取自唐代王勃《滕王阁序》“渔舟唱晚，响穷彭蠡之滨”。重点训练连抹花指、附点十六分韵味以及左手揉按微颤的河南筝韵。',
  measures: yuzhouMeasures,
};
