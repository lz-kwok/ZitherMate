import { MeasureAnchorBox, OriginalScoreData, OriginalScorePage } from '../../types/music';

interface RowSpec {
  pageIndex: number;
  yTop: number;
  yBottom: number;
  barlines: number[];
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

const TANGSHI_PAGES: OriginalScorePage[] = [
  { id: 'tangshi-orig-p0', pageIndex: 0, width: 750, height: 888, staticUrl: '/scores/tangshi/page1.jpg' },
  { id: 'tangshi-orig-p1', pageIndex: 1, width: 752, height: 934, staticUrl: '/scores/tangshi/page2.jpg' },
  { id: 'tangshi-orig-p2', pageIndex: 2, width: 759, height: 887, staticUrl: '/scores/tangshi/page3.jpg' },
  { id: 'tangshi-orig-p3', pageIndex: 3, width: 738, height: 888, staticUrl: '/scores/tangshi/page4.png' },
  { id: 'tangshi-orig-p4', pageIndex: 4, width: 738, height: 276, staticUrl: '/scores/tangshi/page5.png' },
];

// 严格对应《唐诗联唱》5页原谱实测像素坐标（共 17 乐行，M1 ~ M104 全本小节）
const TANGSHI_ROW_SPECS: RowSpec[] = [
  // Page 0 (750x888): 4 rows x 7 measures = M1..M28
  { pageIndex: 0, yTop: 0.1577, yBottom: 0.3333, barlines: [0.116, 0.2267, 0.3333, 0.4387, 0.5613, 0.6747, 0.7853, 0.9173] },
  { pageIndex: 0, yTop: 0.3716, yBottom: 0.5541, barlines: [0.056, 0.1733, 0.2987, 0.424, 0.5467, 0.6693, 0.7933, 0.9173] },
  { pageIndex: 0, yTop: 0.5901, yBottom: 0.7635, barlines: [0.056, 0.176, 0.2973, 0.4293, 0.5587, 0.6693, 0.7947, 0.916] },
  { pageIndex: 0, yTop: 0.8063, yBottom: 0.9775, barlines: [0.056, 0.176, 0.2973, 0.4293, 0.5547, 0.6693, 0.792, 0.9147] },

  // Page 1 (752x934): 4 rows x 6 measures = M29..M52
  { pageIndex: 1, yTop: 0.0621, yBottom: 0.2377, barlines: [0.0678, 0.2101, 0.3564, 0.4973, 0.6423, 0.7846, 0.9282] },
  { pageIndex: 1, yTop: 0.3019, yBottom: 0.469, barlines: [0.0691, 0.2114, 0.3564, 0.4973, 0.6423, 0.7846, 0.9335] },
  { pageIndex: 1, yTop: 0.531, yBottom: 0.7259, barlines: [0.0691, 0.2114, 0.3564, 0.4973, 0.6423, 0.7846, 0.9282] },
  { pageIndex: 1, yTop: 0.8051, yBottom: 0.9722, barlines: [0.0705, 0.2128, 0.3564, 0.5, 0.6436, 0.7846, 0.9309] },

  // Page 2 (759x887): 4 rows x 6 measures = M53..M76
  { pageIndex: 2, yTop: 0.009, yBottom: 0.2097, barlines: [0.0764, 0.2187, 0.3597, 0.502, 0.6443, 0.7852, 0.9275] },
  { pageIndex: 2, yTop: 0.2616, yBottom: 0.4645, barlines: [0.0777, 0.2187, 0.361, 0.5033, 0.6443, 0.7852, 0.9275] },
  { pageIndex: 2, yTop: 0.5321, yBottom: 0.708, barlines: [0.0777, 0.2187, 0.361, 0.5033, 0.6443, 0.7852, 0.9275] },
  { pageIndex: 2, yTop: 0.7892, yBottom: 0.9786, barlines: [0.0777, 0.2187, 0.361, 0.5033, 0.6456, 0.7852, 0.9275] },

  // Page 3 (738x888): 4 rows x 6 measures = M77..M100
  { pageIndex: 3, yTop: 0.018, yBottom: 0.2117, barlines: [0.0569, 0.2033, 0.3496, 0.4959, 0.6423, 0.7886, 0.935] },
  { pageIndex: 3, yTop: 0.2568, yBottom: 0.455, barlines: [0.0569, 0.2033, 0.3496, 0.4959, 0.6423, 0.7873, 0.9336] },
  { pageIndex: 3, yTop: 0.5248, yBottom: 0.705, barlines: [0.0556, 0.2033, 0.3496, 0.4959, 0.6423, 0.7873, 0.935] },
  { pageIndex: 3, yTop: 0.777, yBottom: 0.964, barlines: [0.0569, 0.2033, 0.3442, 0.4959, 0.6423, 0.7859, 0.9336] },

  // Page 4 (738x276): 1 row x 4 measures = M101..M104
  { pageIndex: 4, yTop: 0.2609, yBottom: 0.9058, barlines: [0.0664, 0.2846, 0.5027, 0.7222, 0.9472] },
];

function buildAnchors(): MeasureAnchorBox[] {
  const anchors: MeasureAnchorBox[] = [];
  let measureNum = 1;
  let lastPageIdx = -1;
  let rowIndex = 0;

  for (const row of TANGSHI_ROW_SPECS) {
    if (row.pageIndex !== lastPageIdx) {
      lastPageIdx = row.pageIndex;
      rowIndex = 0;
    } else {
      rowIndex++;
    }

    const h = round4(row.yBottom - row.yTop);
    for (let i = 0; i < row.barlines.length - 1; i++) {
      const x = round4(row.barlines[i]);
      const w = round4(row.barlines[i + 1] - row.barlines[i]);
      anchors.push({
        id: `tangshi-anc-p${row.pageIndex}-m${measureNum}`,
        measureNumber: measureNum,
        pageIndex: row.pageIndex,
        rowIndex,
        x,
        y: round4(row.yTop),
        w,
        h,
      });
      measureNum++;
    }
  }

  return anchors;
}

export const TANGSHI_ORIGINAL_SCORE: OriginalScoreData = {
  pages: TANGSHI_PAGES,
  anchors: buildAnchors(),
  detectedBy: 'hybrid',
};
