export type GuzhengTechnique = 
  | '托' // 拇指由外向内弹（食指方向）
  | '抹' // 食指由外向内弹
  | '勾' // 中指由外向内弹
  | '打' // 无名指由外向内弹
  | '大撮' // 拇指中指同时向内弹八度或五度
  | '小撮' // 拇指食指同时向内弹三度
  | '花指' // 连抹或连托快速扫弦
  | '摇指' // 拇指快速连续劈托
  | '历音' // 由低到高或高到低滑弹
  | '上滑音' // 左手按弦使音升高
  | '下滑音' // 左手预按后放开
  | '颤音' // 左手轻微均匀颤音
  | '';

// 节拍器基准音符单位：四分音符(♩)、八分音符(♪)、附点四分音符(♩.)
export type BeatUnit = 'quarter' | 'eighth' | 'dotted-quarter';

// 发音模式：'both' 节拍器+古筝原声 (推荐伴练), 'guzheng' 仅古筝原声 (示范聆听), 'metronome' 仅节拍器 (传统打拍), 'silent' 静音跟谱
export type SoundMode = 'both' | 'guzheng' | 'metronome' | 'silent';

export interface SinglePitch {
  pitch: number;   // 0: 休止符, 1~7: 简谱音符
  octave: number;  // -2: 倍低音, -1: 低音, 0: 中音, 1: 高音, 2: 倍高音
}

export interface Note {
  id: string;              // 唯一标识符，如 "m1_n1"
  pitch: number;           // 主音符唱名 0~7
  octave: number;          // 主音符音区
  chord?: SinglePitch[];   // 多音/和弦/双音大撮（如低音5与高音5叠排）
  duration: number;        // 时值（以四分音符为1）：0.25:十六分, 0.5:八分, 1:四分, 2:二分, 4:全音符
  dot?: boolean;           // 是否带有附点
  beamWithNext?: boolean;  // 是否与后一个音符合并减时线横梁(Beam)
  slur?: 'start' | 'stop' | 'single'; // 连音弧线标记
  tiedFromPrev?: boolean;  // 是否为前一小节/前一音符的延音线延续（视觉高亮但不重复拨弦）
  technique?: GuzhengTechnique; // 古筝指法标记
  lyric?: string;          // 歌词或小注
}

export interface Measure {
  measureNumber: number;   // 小节序号
  notes: Note[];           // 小节内的音符
  timeSignature?: [number, number]; // 局部拍号
  showBoxNumber?: boolean; // 是否在小节上方显示方框小节号（如 [6], [10]）
}

export interface ScorePart {
  id: string;
  name: string;             // 如 "古筝 I", "古筝 II"
  isMain?: boolean;
  measures: Measure[];
}

export type ScoreDisplayMode = 'digital' | 'original';

export interface OriginalScorePage {
  id: string;
  pageIndex: number;
  width: number;
  height: number;
  staticUrl?: string; // 内置原件曲谱直接指向打包静态资源路径，无需写入 IndexedDB
}

export interface MeasureAnchorBox {
  id: string;
  measureNumber: number;
  pageIndex: number;
  rowIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  beats?: number;
}

export interface OriginalScoreData {
  pages: OriginalScorePage[];
  anchors: MeasureAnchorBox[];
  detectedBy?: 'local' | 'ai' | 'hybrid' | 'manual';
}

export interface SheetMusic {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  key: string;             // 调号，如 "1=D"
  timeSignature: [number, number]; // 拍号，如 [2, 4] 或 [4, 4]
  expression?: string;     // 表情术语，如 "抒情地"、"欢快地"
  defaultBpm: number;      // 标准速度
  beatUnit?: BeatUnit;     // 默认节拍单位，默认 'quarter'
  difficulty?: '入门' | '进阶' | '考级' | '名曲演奏';
  description?: string;    // 曲目背景或弹奏要领
  measures: Measure[];     // 主声部小节（默认播放/伴练声部）
  parts?: ScorePart[];     // 多声部重奏扩展（如古筝I、古筝II）
  introMelody?: Measure[]; // 前奏领唱/引子旋律
  scoreMode?: ScoreDisplayMode; // 'digital' 数字化简谱（默认） | 'original' 原件画框谱
  originalScore?: OriginalScoreData; // 原件曲谱页与小节埋点框数据
}
