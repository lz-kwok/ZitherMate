import { SheetMusic, Measure } from '../../types/music';

// 《青花瓷》 周杰伦 曲 / 流行古筝抒情改编，1=D 2/4 ♩=68
// 采用原曲十六分音符 (0.25 拍，一拍四字 ≈ 0.22s/音) 的流畅江南国风律动
const qinghuaciMeasures: Measure[] = [
  // 小节 1: 2= 1= 6̣= 1= | 1= 6̣= 1_ (素胚勾勒出青花)
  {
    measureNumber: 1,
    showBoxNumber: true,
    notes: [
      { id: 'qhc_m1_n1', pitch: 2, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '素' },
      { id: 'qhc_m1_n2', pitch: 1, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '胚' },
      { id: 'qhc_m1_n3', pitch: 6, octave: -1, duration: 0.25, technique: '勾', beamWithNext: true, lyric: '勾' },
      { id: 'qhc_m1_n4', pitch: 1, octave: 0, duration: 0.25, technique: '抹', lyric: '勒' },
      { id: 'qhc_m1_n5', pitch: 1, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '出' },
      { id: 'qhc_m1_n6', pitch: 6, octave: -1, duration: 0.25, technique: '勾', beamWithNext: true, lyric: '青' },
      { id: 'qhc_m1_n7', pitch: 1, octave: 0, duration: 0.5, technique: '托', lyric: '花' },
    ],
  },
  // 小节 2: 1= 6̣= 1= 6̣= | 5̣ (笔锋浓转淡)
  {
    measureNumber: 2,
    notes: [
      { id: 'qhc_m2_n1', pitch: 1, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '笔' },
      { id: 'qhc_m2_n2', pitch: 6, octave: -1, duration: 0.25, technique: '勾', beamWithNext: true, lyric: '锋' },
      { id: 'qhc_m2_n3', pitch: 1, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '浓' },
      { id: 'qhc_m2_n4', pitch: 6, octave: -1, duration: 0.25, technique: '抹', lyric: '转' },
      {
        id: 'qhc_m2_n5',
        pitch: 5,
        octave: -1,
        chord: [{ pitch: 5, octave: -1 }, { pitch: 5, octave: -2 }],
        duration: 1,
        technique: '大撮',
        lyric: '淡',
      },
    ],
  },
  // 小节 3: 2= 1= 6̣= 1= | 1= 6̣= 1_ (瓶身描绘的牡丹)
  {
    measureNumber: 3,
    notes: [
      { id: 'qhc_m3_n1', pitch: 2, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '瓶' },
      { id: 'qhc_m3_n2', pitch: 1, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '身' },
      { id: 'qhc_m3_n3', pitch: 6, octave: -1, duration: 0.25, technique: '勾', beamWithNext: true, lyric: '描' },
      { id: 'qhc_m3_n4', pitch: 1, octave: 0, duration: 0.25, technique: '抹', lyric: '绘' },
      { id: 'qhc_m3_n5', pitch: 1, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '的' },
      { id: 'qhc_m3_n6', pitch: 6, octave: -1, duration: 0.25, technique: '勾', beamWithNext: true, lyric: '牡' },
      { id: 'qhc_m3_n7', pitch: 1, octave: 0, duration: 0.5, technique: '托', lyric: '丹' },
    ],
  },
  // 小节 4: 5̣= 3= 2= 1= | 1 (一如你初妆)
  {
    measureNumber: 4,
    notes: [
      { id: 'qhc_m4_n1', pitch: 5, octave: -1, duration: 0.25, technique: '勾', beamWithNext: true, lyric: '一' },
      { id: 'qhc_m4_n2', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '如' },
      { id: 'qhc_m4_n3', pitch: 2, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '你' },
      { id: 'qhc_m4_n4', pitch: 1, octave: 0, duration: 0.25, technique: '托', lyric: '初' },
      {
        id: 'qhc_m4_n5',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 1,
        technique: '大撮',
        lyric: '妆',
      },
    ],
  },
  // 小节 5: [5] 5= 5= 3= 2= | 3= 6̣= 2_ (天青色等烟雨)
  {
    measureNumber: 5,
    showBoxNumber: true,
    notes: [
      { id: 'qhc_m5_n1', pitch: 5, octave: 0, duration: 0.25, technique: '花指', beamWithNext: true, lyric: '天' },
      { id: 'qhc_m5_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '青' },
      { id: 'qhc_m5_n3', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '色' },
      { id: 'qhc_m5_n4', pitch: 2, octave: 0, duration: 0.25, technique: '抹', lyric: '等' },
      { id: 'qhc_m5_n5', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '烟' },
      { id: 'qhc_m5_n6', pitch: 6, octave: -1, duration: 0.25, technique: '勾', beamWithNext: true, lyric: '雨' },
      { id: 'qhc_m5_n7', pitch: 2, octave: 0, duration: 0.5, technique: '上滑音' },
    ],
  },
  // 小节 6: 3= 5= 3= 2= | 1 (而我在等你)
  {
    measureNumber: 6,
    notes: [
      { id: 'qhc_m6_n1', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '而' },
      { id: 'qhc_m6_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '我' },
      { id: 'qhc_m6_n3', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '在' },
      { id: 'qhc_m6_n4', pitch: 2, octave: 0, duration: 0.25, technique: '抹', lyric: '等' },
      {
        id: 'qhc_m6_n5',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 1,
        technique: '大撮',
        lyric: '你',
      },
    ],
  },
  // 小节 7: 5= 5= 3= 2= | 3= 5= 6_ (炊烟袅袅升起)
  {
    measureNumber: 7,
    notes: [
      { id: 'qhc_m7_n1', pitch: 5, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '炊' },
      { id: 'qhc_m7_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '烟' },
      { id: 'qhc_m7_n3', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '袅' },
      { id: 'qhc_m7_n4', pitch: 2, octave: 0, duration: 0.25, technique: '抹', lyric: '袅' },
      { id: 'qhc_m7_n5', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '升' },
      { id: 'qhc_m7_n6', pitch: 5, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '起' },
      { id: 'qhc_m7_n7', pitch: 6, octave: 0, duration: 0.5, technique: '颤音' },
    ],
  },
  // 小节 8: 3= 5= 3= 2= | 1 (隔江千万里)
  {
    measureNumber: 8,
    notes: [
      { id: 'qhc_m8_n1', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '隔' },
      { id: 'qhc_m8_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '江' },
      { id: 'qhc_m8_n3', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '千' },
      { id: 'qhc_m8_n4', pitch: 2, octave: 0, duration: 0.25, technique: '抹', lyric: '万' },
      {
        id: 'qhc_m8_n5',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 1,
        technique: '大撮',
        lyric: '里',
      },
    ],
  },
  // 小节 9: 5= 5= 3= 2= | 3= 6̣= 2_ (在瓶底书汉隶仿前朝的飘逸)
  {
    measureNumber: 9,
    notes: [
      { id: 'qhc_m9_n1', pitch: 5, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '在' },
      { id: 'qhc_m9_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '瓶' },
      { id: 'qhc_m9_n3', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '底' },
      { id: 'qhc_m9_n4', pitch: 2, octave: 0, duration: 0.25, technique: '抹', lyric: '书' },
      { id: 'qhc_m9_n5', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '汉' },
      { id: 'qhc_m9_n6', pitch: 6, octave: -1, duration: 0.25, technique: '勾', beamWithNext: true, lyric: '隶' },
      { id: 'qhc_m9_n7', pitch: 2, octave: 0, duration: 0.5, technique: '上滑音', lyric: '逸' },
    ],
  },
  // 小节 10: [10] 3= 5= 3= 2= | 1 (就当我为遇见你伏笔)
  {
    measureNumber: 10,
    showBoxNumber: true,
    notes: [
      { id: 'qhc_m10_n1', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '就' },
      { id: 'qhc_m10_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '当' },
      { id: 'qhc_m10_n3', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '我' },
      { id: 'qhc_m10_n4', pitch: 2, octave: 0, duration: 0.25, technique: '抹', lyric: '伏' },
      {
        id: 'qhc_m10_n5',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 1,
        technique: '大撮',
        lyric: '笔',
      },
    ],
  },
  // 小节 11: 5= 5= 3= 2= | 3= 5= 6_ (月色被打捞起)
  {
    measureNumber: 11,
    notes: [
      { id: 'qhc_m11_n1', pitch: 5, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '月' },
      { id: 'qhc_m11_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '色' },
      { id: 'qhc_m11_n3', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '被' },
      { id: 'qhc_m11_n4', pitch: 2, octave: 0, duration: 0.25, technique: '抹', lyric: '打' },
      { id: 'qhc_m11_n5', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '捞' },
      { id: 'qhc_m11_n6', pitch: 5, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '起' },
      { id: 'qhc_m11_n7', pitch: 6, octave: 0, duration: 0.5, technique: '颤音' },
    ],
  },
  // 小节 12: 3= 5= 3= 2= | 1 (晕开了结局)
  {
    measureNumber: 12,
    notes: [
      { id: 'qhc_m12_n1', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '晕' },
      { id: 'qhc_m12_n2', pitch: 5, octave: 0, duration: 0.25, technique: '抹', beamWithNext: true, lyric: '开' },
      { id: 'qhc_m12_n3', pitch: 3, octave: 0, duration: 0.25, technique: '托', beamWithNext: true, lyric: '了' },
      { id: 'qhc_m12_n4', pitch: 2, octave: 0, duration: 0.25, technique: '抹', lyric: '结' },
      {
        id: 'qhc_m12_n5',
        pitch: 1,
        octave: 0,
        chord: [{ pitch: 1, octave: 0 }, { pitch: 1, octave: -1 }],
        duration: 1,
        technique: '大撮',
        lyric: '局',
      },
    ],
  },
];

export const qinghuaciScore: SheetMusic = {
  id: 'qinghuaci',
  title: '青 花 瓷',
  subtitle: '周杰伦 曲 / 方文山 词 / 流行古筝抒情名曲',
  author: '周杰伦 曲 / 古筝改编',
  key: '1=D',
  timeSignature: [2, 4],
  expression: '温婉、十六分音符抒情地',
  defaultBpm: 68,
  beatUnit: 'quarter',
  difficulty: '入门',
  description: '现代国风流行金曲，采用原曲 2/4 拍（♩=68）十六分音符密字律动与八度大撮，流畅再现江南烟雨韵味。',
  measures: qinghuaciMeasures,
};
