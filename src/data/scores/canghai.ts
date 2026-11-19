import { SheetMusic, Measure } from '../../types/music';

// 《沧海一声笑》 黄霑 词曲，1=D 4/4 ♩=76
// 100% 还原原曲五声音阶下行（6 5 3 2 1）与附点十六分豪迈律动
const canghaiMeasures: Measure[] = [
  // 小节 1: 6._ 5= 3_ 2_ | 1 - (沧海一声笑)
  {
    measureNumber: 1,
    showBoxNumber: true,
    notes: [
      { id: 'ch_m1_n1', pitch: 6, octave: 0, duration: 0.75, dot: true, technique: '花指', beamWithNext: true, lyric: '沧' },
      { id: 'ch_m1_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', lyric: '海' },
      { id: 'ch_m1_n3', pitch: 3, octave: 0, duration: 0.5, technique: '勾', beamWithNext: true, lyric: '一' },
      { id: 'ch_m1_n4', pitch: 2, octave: 0, duration: 0.5, technique: '托', lyric: '声' },
      {
        id: 'ch_m1_n5',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 2,
        technique: '大撮',
        lyric: '笑',
      },
    ],
  },
  // 小节 2: 3._ 2= 1_ 6̣_ | 5̣ - (滔滔两岸潮)
  {
    measureNumber: 2,
    notes: [
      { id: 'ch_m2_n1', pitch: 3, octave: 0, duration: 0.75, dot: true, technique: '托', beamWithNext: true, lyric: '滔' },
      { id: 'ch_m2_n2', pitch: 2, octave: 0, duration: 0.25, technique: '抹', lyric: '滔' },
      { id: 'ch_m2_n3', pitch: 1, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true, lyric: '两' },
      { id: 'ch_m2_n4', pitch: 6, octave: -1, duration: 0.5, technique: '勾', lyric: '岸' },
      {
        id: 'ch_m2_n5',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '大撮',
        lyric: '潮',
      },
    ],
  },
  // 小节 3: 5̣._ 6̣= 5̣_ 6̣_ | 1_ 2_ 3_ 5_ (浮沉随浪)
  {
    measureNumber: 3,
    notes: [
      { id: 'ch_m3_n1', pitch: 5, octave: -1, duration: 0.75, dot: true, technique: '勾', beamWithNext: true, lyric: '浮' },
      { id: 'ch_m3_n2', pitch: 6, octave: -1, duration: 0.25, technique: '抹', lyric: '沉' },
      { id: 'ch_m3_n3', pitch: 5, octave: -1, duration: 0.5, technique: '勾', beamWithNext: true, lyric: '随' },
      { id: 'ch_m3_n4', pitch: 6, octave: -1, duration: 0.5, technique: '托', lyric: '浪' },
      { id: 'ch_m3_n5', pitch: 1, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ch_m3_n6', pitch: 2, octave: 0, duration: 0.5, technique: '托' },
      { id: 'ch_m3_n7', pitch: 3, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ch_m3_n8', pitch: 5, octave: 0, duration: 0.5, technique: '托' },
    ],
  },
  // 小节 4: 6._ 5= 3_ 2_ | 2 - (只记今朝)
  {
    measureNumber: 4,
    notes: [
      { id: 'ch_m4_n1', pitch: 6, octave: 0, duration: 0.75, dot: true, technique: '托', beamWithNext: true, lyric: '只' },
      { id: 'ch_m4_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', lyric: '记' },
      { id: 'ch_m4_n3', pitch: 3, octave: 0, duration: 0.5, technique: '勾', beamWithNext: true, lyric: '今' },
      { id: 'ch_m4_n4', pitch: 2, octave: 0, duration: 0.5, technique: '托' },
      {
        id: 'ch_m4_n5',
        pitch: 2,
        octave: 0,
        chord: [{ pitch: 2, octave: 0 }, { pitch: 2, octave: -1 }],
        duration: 2,
        technique: '大撮',
        lyric: '朝',
      },
    ],
  },
  // 小节 5: [5] 6._ 5= 3_ 2_ | 1 - (苍天笑)
  {
    measureNumber: 5,
    showBoxNumber: true,
    notes: [
      { id: 'ch_m5_n1', pitch: 6, octave: 0, duration: 0.75, dot: true, technique: '花指', beamWithNext: true, lyric: '苍' },
      { id: 'ch_m5_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', lyric: '天' },
      { id: 'ch_m5_n3', pitch: 3, octave: 0, duration: 0.5, technique: '勾', beamWithNext: true, lyric: '一' },
      { id: 'ch_m5_n4', pitch: 2, octave: 0, duration: 0.5, technique: '托', lyric: '声' },
      {
        id: 'ch_m5_n5',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 2,
        technique: '大撮',
        lyric: '笑',
      },
    ],
  },
  // 小节 6: 3._ 2= 1_ 6̣_ | 5̣ - (纷纷世上潮)
  {
    measureNumber: 6,
    notes: [
      { id: 'ch_m6_n1', pitch: 3, octave: 0, duration: 0.75, dot: true, technique: '托', beamWithNext: true, lyric: '纷' },
      { id: 'ch_m6_n2', pitch: 2, octave: 0, duration: 0.25, technique: '抹', lyric: '纷' },
      { id: 'ch_m6_n3', pitch: 1, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true, lyric: '世' },
      { id: 'ch_m6_n4', pitch: 6, octave: -1, duration: 0.5, technique: '勾', lyric: '上' },
      {
        id: 'ch_m6_n5',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '大撮',
        lyric: '潮',
      },
    ],
  },
  // 小节 7: 5̣._ 6̣= 5̣_ 6̣_ | 1_ 2_ 3_ 5_ (谁负谁胜出)
  {
    measureNumber: 7,
    notes: [
      { id: 'ch_m7_n1', pitch: 5, octave: -1, duration: 0.75, dot: true, technique: '勾', beamWithNext: true, lyric: '谁' },
      { id: 'ch_m7_n2', pitch: 6, octave: -1, duration: 0.25, technique: '抹', lyric: '负' },
      { id: 'ch_m7_n3', pitch: 5, octave: -1, duration: 0.5, technique: '勾', beamWithNext: true, lyric: '谁' },
      { id: 'ch_m7_n4', pitch: 6, octave: -1, duration: 0.5, technique: '托', lyric: '胜' },
      { id: 'ch_m7_n5', pitch: 1, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true, lyric: '出' },
      { id: 'ch_m7_n6', pitch: 2, octave: 0, duration: 0.5, technique: '托' },
      { id: 'ch_m7_n7', pitch: 3, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ch_m7_n8', pitch: 5, octave: 0, duration: 0.5, technique: '托' },
    ],
  },
  // 小节 8: 6._ 5= 3_ 2_ | 1 - (天知晓)
  {
    measureNumber: 8,
    notes: [
      { id: 'ch_m8_n1', pitch: 6, octave: 0, duration: 0.75, dot: true, technique: '托', beamWithNext: true, lyric: '天' },
      { id: 'ch_m8_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', lyric: '知' },
      { id: 'ch_m8_n3', pitch: 3, octave: 0, duration: 0.5, technique: '勾', beamWithNext: true },
      { id: 'ch_m8_n4', pitch: 2, octave: 0, duration: 0.5, technique: '托' },
      {
        id: 'ch_m8_n5',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 2,
        technique: '大撮',
        lyric: '晓',
      },
    ],
  },
  // 小节 9: 6._ 5= 3_ 2_ | 1 - (江山笑 烟雨遥)
  {
    measureNumber: 9,
    notes: [
      { id: 'ch_m9_n1', pitch: 6, octave: 0, duration: 0.75, dot: true, technique: '花指', beamWithNext: true, lyric: '江' },
      { id: 'ch_m9_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', lyric: '山' },
      { id: 'ch_m9_n3', pitch: 3, octave: 0, duration: 0.5, technique: '勾', beamWithNext: true, lyric: '笑' },
      { id: 'ch_m9_n4', pitch: 2, octave: 0, duration: 0.5, technique: '托', lyric: '烟' },
      {
        id: 'ch_m9_n5',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 2,
        technique: '大撮',
        lyric: '雨',
      },
    ],
  },
  // 小节 10: [10] 3._ 2= 1_ 6̣_ | 5̣ - (涛浪淘尽)
  {
    measureNumber: 10,
    showBoxNumber: true,
    notes: [
      { id: 'ch_m10_n1', pitch: 3, octave: 0, duration: 0.75, dot: true, technique: '托', beamWithNext: true, lyric: '涛' },
      { id: 'ch_m10_n2', pitch: 2, octave: 0, duration: 0.25, technique: '抹', lyric: '浪' },
      { id: 'ch_m10_n3', pitch: 1, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true, lyric: '淘' },
      { id: 'ch_m10_n4', pitch: 6, octave: -1, duration: 0.5, technique: '勾', lyric: '尽' },
      {
        id: 'ch_m10_n5',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 2,
        technique: '大撮',
        lyric: '潮',
      },
    ],
  },
  // 小节 11: 5̣._ 6̣= 5̣_ 6̣_ | 1_ 2_ 3_ 5_ (豪情还剩了)
  {
    measureNumber: 11,
    notes: [
      { id: 'ch_m11_n1', pitch: 5, octave: -1, duration: 0.75, dot: true, technique: '勾', beamWithNext: true, lyric: '豪' },
      { id: 'ch_m11_n2', pitch: 6, octave: -1, duration: 0.25, technique: '抹', lyric: '情' },
      { id: 'ch_m11_n3', pitch: 5, octave: -1, duration: 0.5, technique: '勾', beamWithNext: true, lyric: '还' },
      { id: 'ch_m11_n4', pitch: 6, octave: -1, duration: 0.5, technique: '托', lyric: '剩' },
      { id: 'ch_m11_n5', pitch: 1, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true, lyric: '了' },
      { id: 'ch_m11_n6', pitch: 2, octave: 0, duration: 0.5, technique: '托' },
      { id: 'ch_m11_n7', pitch: 3, octave: 0, duration: 0.5, technique: '抹', beamWithNext: true },
      { id: 'ch_m11_n8', pitch: 5, octave: 0, duration: 0.5, technique: '托' },
    ],
  },
  // 小节 12: 6._ 5= 3_ 2_ | 1 - (一襟晚照)
  {
    measureNumber: 12,
    notes: [
      { id: 'ch_m12_n1', pitch: 6, octave: 0, duration: 0.75, dot: true, technique: '托', beamWithNext: true, lyric: '一' },
      { id: 'ch_m12_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', lyric: '襟' },
      { id: 'ch_m12_n3', pitch: 3, octave: 0, duration: 0.5, technique: '勾', beamWithNext: true, lyric: '晚' },
      { id: 'ch_m12_n4', pitch: 2, octave: 0, duration: 0.5, technique: '托' },
      {
        id: 'ch_m12_n5',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 2,
        technique: '大撮',
        lyric: '照',
      },
    ],
  },
];

export const canghaiScore: SheetMusic = {
  id: 'canghai-yisheng-xiao',
  title: '沧 海 一 声 笑',
  subtitle: '电影《笑傲江湖》主题曲 / 经典古筝入门必弹名曲',
  author: '黄  霑 词曲 / 古筝改编',
  key: '1=D',
  timeSignature: [4, 4],
  expression: '豪迈、从容不迫地',
  defaultBpm: 76,
  beatUnit: 'quarter',
  difficulty: '入门',
  description: '以中国传统“羽徵角商宫（6 5 3 2 1）”五声音阶谱写，豪情洒脱。重点练习花指连扫、附点十六分节奏与八度大撮的掌心支撑手型。',
  measures: canghaiMeasures,
};
