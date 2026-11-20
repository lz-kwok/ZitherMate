import { Measure, MeasureAnchorBox } from '../types/music';

export interface DetectedSystem {
  id: string;
  yTop: number;
  yBottom: number;
  xLeft: number;
  xRight: number;
  barlines: number[]; // strictly ascending [xLeft, ..., xRight], length = measureCount + 1
  beatsPerMeasure?: number;
  confidence?: 'high' | 'fallback' | 'ai' | 'hybrid' | 'manual';
}

export interface LayoutDetectionOptions {
  isFirstPage?: boolean;
  defaultMeasuresPerRow?: number;
}

export interface LocalBinaryContext {
  binaryInk: Uint8Array;
  width: number;
  height: number;
}

interface BarCluster {
  startX: number;
  endX: number;
  centerX: number;
  peakRun: number;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function round4(v: number): number {
  return Math.round(v * 10000) / 10000;
}

function makeSystemId(prefix: string = 'sys'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 对单个乐行矩形与内部小节线数组执行规范化与边界钳位，确保坐标严格合法且递增
 */
export function normalizeSystem(sys: DetectedSystem): DetectedSystem {
  const minHeight = 0.025;
  const minBarGap = 0.025;

  let yTop = clamp01(sys.yTop);
  let yBottom = clamp01(sys.yBottom);
  if (yBottom < yTop) {
    [yTop, yBottom] = [yBottom, yTop];
  }
  if (yBottom - yTop < minHeight) {
    if (yTop + minHeight <= 1) {
      yBottom = yTop + minHeight;
    } else {
      yTop = Math.max(0, 1 - minHeight);
      yBottom = 1;
    }
  }

  let xLeft = clamp01(sys.xLeft);
  let xRight = clamp01(sys.xRight);
  if (xRight < xLeft) {
    [xLeft, xRight] = [xRight, xLeft];
  }
  if (xRight - xLeft < 0.06) {
    xRight = Math.min(1, xLeft + 0.06);
    if (xRight - xLeft < 0.06) {
      xLeft = Math.max(0, xRight - 0.06);
    }
  }

  const rawInterior = (sys.barlines || [])
    .map((b) => clamp01(b))
    .filter((b) => b > xLeft + minBarGap && b < xRight - minBarGap)
    .sort((a, b) => a - b);

  const barlines: number[] = [round4(xLeft)];
  for (const bx of rawInterior) {
    const prev = barlines[barlines.length - 1];
    if (bx - prev >= minBarGap && xRight - bx >= minBarGap) {
      barlines.push(round4(bx));
    }
  }
  barlines.push(round4(xRight));

  return {
    ...sys,
    id: sys.id || makeSystemId(),
    yTop: round4(yTop),
    yBottom: round4(yBottom),
    xLeft: barlines[0],
    xRight: barlines[barlines.length - 1],
    barlines,
  };
}

/**
 * 将指定乐行均分为 N 个小节
 */
export function splitSystemEqually(sys: DetectedSystem, count: number): DetectedSystem {
  const safeCount = Math.max(1, Math.min(16, Math.round(count)));
  const norm = normalizeSystem(sys);
  const span = norm.xRight - norm.xLeft;
  const barlines: number[] = [];
  for (let i = 0; i <= safeCount; i++) {
    barlines.push(round4(norm.xLeft + (span * i) / safeCount));
  }
  return {
    ...norm,
    barlines,
    confidence: 'manual',
  };
}

/**
 * 在乐行指定归一化 X 处插入一条小节线
 */
export function insertBarlineInSystem(sys: DetectedSystem, normX: number): DetectedSystem {
  const norm = normalizeSystem(sys);
  const clamped = clamp01(normX);
  const next = normalizeSystem({
    ...norm,
    barlines: [...norm.barlines, clamped],
    confidence: 'manual',
  });
  return next;
}

/**
 * 删除乐行内部指定索引的小节线（忽略首尾边界索引）
 */
export function removeBarlineInSystem(sys: DetectedSystem, barlineIndex: number): DetectedSystem {
  const norm = normalizeSystem(sys);
  if (barlineIndex <= 0 || barlineIndex >= norm.barlines.length - 1) {
    return norm;
  }
  const nextBars = norm.barlines.filter((_, idx) => idx !== barlineIndex);
  return normalizeSystem({
    ...norm,
    barlines: nextBars,
    confidence: 'manual',
  });
}

/**
 * 合并相邻两行（例如古筝重奏、双手大括号上下行合并为同一联动高亮框）
 */
export function mergeAdjacentSystems(upper: DetectedSystem, lower: DetectedSystem): DetectedSystem {
  const u = normalizeSystem(upper);
  const l = normalizeSystem(lower);
  const yTop = Math.min(u.yTop, l.yTop);
  const yBottom = Math.max(u.yBottom, l.yBottom);

  const scoreConfidence = (s: DetectedSystem): number => {
    const base =
      s.confidence === 'hybrid'
        ? 4
        : s.confidence === 'high'
        ? 3
        : s.confidence === 'manual'
        ? 3
        : s.confidence === 'ai'
        ? 2
        : 1;
    return base * 10 + (s.barlines.length - 1);
  };

  const primary = scoreConfidence(u) >= scoreConfidence(l) ? u : l;
  const mergedLeft = Math.min(u.xLeft, l.xLeft);
  const mergedRight = Math.max(u.xRight, l.xRight);

  return normalizeSystem({
    id: u.id,
    yTop,
    yBottom,
    xLeft: mergedLeft,
    xRight: mergedRight,
    barlines: [mergedLeft, ...primary.barlines.slice(1, -1), mergedRight],
    beatsPerMeasure: primary.beatsPerMeasure,
    confidence: 'manual',
  });
}

/**
 * 使用积分图对灰度图像执行局部自适应二值化，适应拍照阴影、偏黄纸张与倾斜光照
 */
function buildAdaptiveBinaryInk(gray: Uint8Array, width: number, height: number): Uint8Array {
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));

  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    const rowOffset = y * width;
    const prevIntegralRow = y * stride;
    const currIntegralRow = (y + 1) * stride;
    for (let x = 0; x < width; x++) {
      rowSum += gray[rowOffset + x];
      integral[currIntegralRow + x + 1] = integral[prevIntegralRow + x + 1] + rowSum;
    }
  }

  const r = Math.max(10, Math.round(width * 0.025));
  const ink = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - r);
    const y2 = Math.min(height - 1, y + r);
    const rowBase = y * width;
    const iy1 = y1 * stride;
    const iy2 = (y2 + 1) * stride;

    for (let x = 0; x < width; x++) {
      const val = gray[rowBase + x];
      if (val >= 215) continue;
      const x1 = Math.max(0, x - r);
      const x2 = Math.min(width - 1, x + r);
      const area = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        integral[iy2 + x2 + 1] -
        integral[iy1 + x2 + 1] -
        integral[iy2 + x1] +
        integral[iy1 + x1];
      const localMean = sum / area;
      if (val < localMean - 18) {
        ink[rowBase + x] = 1;
      }
    }
  }

  // 清除外围 1.5% 扫描黑边（密度 > 60% 的边界条带）
  const bxMargin = Math.max(2, Math.round(width * 0.015));
  const byMargin = Math.max(2, Math.round(height * 0.015));

  for (let y = 0; y < height; y++) {
    if (y >= byMargin && y < height - byMargin) continue;
    let cnt = 0;
    const rowBase = y * width;
    for (let x = 0; x < width; x++) cnt += ink[rowBase + x];
    if (cnt / width > 0.6) {
      ink.fill(0, rowBase, rowBase + width);
    }
  }

  for (let x = 0; x < width; x++) {
    if (x >= bxMargin && x < width - bxMargin) continue;
    let cnt = 0;
    for (let y = 0; y < height; y++) cnt += ink[y * width + x];
    if (cnt / height > 0.6) {
      for (let y = 0; y < height; y++) ink[y * width + x] = 0;
    }
  }

  return ink;
}

/**
 * 计算某个乐行水平投影带内的左右有效内容包络 [xLeft, xRight]
 * 过滤最外侧孤立噪点碎片，同时完整保留首尾小节线
 */
function measureBandHorizontalSpan(
  ink: Uint8Array,
  width: number,
  yTop: number,
  yBot: number,
  marginX: number
): { xLeft: number; xRight: number; totalInk: number } {
  const xMinBound = Math.max(0, marginX);
  const xMaxBound = Math.min(width - 1, width - 1 - marginX);
  const colCounts = new Int32Array(width);
  let totalInk = 0;

  for (let y = yTop; y <= yBot; y++) {
    const rowBase = y * width;
    for (let x = xMinBound; x <= xMaxBound; x++) {
      if (ink[rowBase + x]) {
        colCounts[x]++;
        totalInk++;
      }
    }
  }

  if (totalInk === 0) {
    return { xLeft: xMinBound, xRight: xMaxBound, totalInk: 0 };
  }

  const segments: { start: number; end: number; mass: number }[] = [];
  let inSeg = false;
  let segStart = 0;
  let segMass = 0;

  for (let x = xMinBound; x <= xMaxBound; x++) {
    if (colCounts[x] > 0) {
      if (!inSeg) {
        inSeg = true;
        segStart = x;
        segMass = colCounts[x];
      } else {
        segMass += colCounts[x];
      }
    } else if (inSeg) {
      segments.push({ start: segStart, end: x - 1, mass: segMass });
      inSeg = false;
    }
  }
  if (inSeg) {
    segments.push({ start: segStart, end: xMaxBound, mass: segMass });
  }

  const isolatedGapThreshold = Math.max(12, Math.round(width * 0.04));
  let firstIdx = 0;
  while (
    firstIdx < segments.length - 1 &&
    segments[firstIdx].end - segments[firstIdx].start <= 2 &&
    segments[firstIdx].mass < totalInk * 0.01 &&
    segments[firstIdx + 1].start - segments[firstIdx].end > isolatedGapThreshold
  ) {
    firstIdx++;
  }

  let lastIdx = segments.length - 1;
  while (
    lastIdx > firstIdx &&
    segments[lastIdx].end - segments[lastIdx].start <= 2 &&
    segments[lastIdx].mass < totalInk * 0.01 &&
    segments[lastIdx].start - segments[lastIdx - 1].end > isolatedGapThreshold
  ) {
    lastIdx--;
  }

  return {
    xLeft: segments[firstIdx].start,
    xRight: segments[lastIdx].end,
    totalInk,
  };
}

/**
 * 在给定矩形行带内逐列追踪最长垂直连贯墨迹以提取小节线簇（兼容 ±3° 轻度倾斜拍照）
 */
function detectBarlineClustersInBand(
  ink: Uint8Array,
  width: number,
  _height: number,
  yTopPx: number,
  yBotPx: number,
  xLeftPx: number,
  xRightPx: number
): { clusters: BarCluster[]; minRunThreshold: number } {
  const bandH = Math.max(1, yBotPx - yTopPx + 1);
  const startX = Math.max(0, xLeftPx);
  const endX = Math.min(width - 1, xRightPx);
  const span = Math.max(1, endX - startX + 1);

  const maxRuns = new Int32Array(span);
  const glyphSamples: number[] = [];
  const allSamples: number[] = [];
  const glyphMinFilter = Math.max(5, Math.round(bandH * 0.1));

  for (let i = 0; i < span; i++) {
    const x = startX + i;
    const xm1 = x > 0 ? x - 1 : x;
    const xp1 = x + 1 < width ? x + 1 : x;

    let longest = 0;
    let current = 0;
    let gap = 0;

    for (let y = yTopPx; y <= yBotPx; y++) {
      const rowBase = y * width;
      const hasInk = ink[rowBase + x] || ink[rowBase + xm1] || ink[rowBase + xp1];
      if (hasInk) {
        if (current > 0 && gap === 1) {
          current += 2;
        } else {
          current += 1;
        }
        gap = 0;
        if (current > longest) longest = current;
      } else if (current > 0) {
        gap++;
        if (gap > 1) {
          current = 0;
        }
      }
    }

    maxRuns[i] = longest;
    if (longest > 0) {
      allSamples.push(longest);
      if (longest >= glyphMinFilter) {
        glyphSamples.push(longest);
      }
    }
  }

  if (allSamples.length === 0) {
    return { clusters: [], minRunThreshold: bandH };
  }

  allSamples.sort((a, b) => a - b);
  const baseForDigit = glyphSamples.length >= 6 ? [...glyphSamples].sort((a, b) => a - b) : allSamples;
  const sub85Len = Math.max(1, Math.floor(baseForDigit.length * 0.85));
  const hDigit = baseForDigit[Math.floor((sub85Len - 1) * 0.5)] || 0;
  const p92 = allSamples[Math.min(allSamples.length - 1, Math.floor(allSamples.length * 0.92))] || 0;
  const hBar = hDigit > 0 ? Math.min(p92, Math.round(hDigit * 2.2)) : p92;

  const minRunThreshold = Math.max(
    12,
    Math.round(bandH * 0.24),
    Math.round(hDigit * 1.25),
    Math.round(hBar * 0.65)
  );

  // 聚合相邻候选列为簇
  const rawClusters: BarCluster[] = [];
  let inCluster = false;
  let cStart = 0;
  let cPeak = 0;

  for (let i = 0; i < span; i++) {
    const run = maxRuns[i];
    if (run >= minRunThreshold) {
      if (!inCluster) {
        inCluster = true;
        cStart = startX + i;
        cPeak = run;
      } else if (run > cPeak) {
        cPeak = run;
      }
    } else if (inCluster) {
      const cEnd = startX + i - 1;
      rawClusters.push({
        startX: cStart,
        endX: cEnd,
        centerX: (cStart + cEnd) / 2,
        peakRun: cPeak,
      });
      inCluster = false;
    }
  }
  if (inCluster) {
    rawClusters.push({
      startX: cStart,
      endX: endX,
      centerX: (cStart + endX) / 2,
      peakRun: cPeak,
    });
  }

  // 剔除实心大色块（宽于正常竖线簇，避免方框小节号或印章误识别）
  const maxSingleClusterW = Math.max(8, Math.round(width * 0.014));
  const validSingles = rawClusters.filter((c) => c.endX - c.startX + 1 <= maxSingleClusterW);

  // 合并双纵线 || 或反复记号 |: 的紧邻竖线簇
  const mergeGapPx = Math.max(10, Math.round(width * 0.015));
  const merged: BarCluster[] = [];
  for (const c of validSingles) {
    const prev = merged[merged.length - 1];
    if (prev && c.startX - prev.endX <= mergeGapPx) {
      prev.endX = c.endX;
      prev.centerX = (prev.startX + prev.endX) / 2;
      prev.peakRun = Math.max(prev.peakRun, c.peakRun);
    } else {
      merged.push({ ...c });
    }
  }

  return { clusters: merged, minRunThreshold };
}

/**
 * 基于已识别簇构建严格递增的像素级小节线列表（过滤前置“古筝 I”声部标注空白区与过密误分）
 */
function buildSystemBarlinesFromClusters(
  clusters: BarCluster[],
  xLeftPx: number,
  xRightPx: number
): { barlinesPx: number[]; trimmedLeftPx: number; trimmedRightPx: number; interiorCount: number } {
  const span = Math.max(1, xRightPx - xLeftPx);
  const edgeSnapPx = Math.max(6, Math.round(span * 0.032));

  let effectiveLeft = xLeftPx;
  let effectiveRight = xRightPx;
  const remaining: BarCluster[] = [...clusters];

  // 左边缘兜底贴合（起首线/大括号附近）
  if (remaining.length > 0 && remaining[0].centerX - effectiveLeft <= edgeSnapPx) {
    effectiveLeft = Math.round(remaining[0].centerX);
    remaining.shift();
  }

  // 检测并裁剪声部标注前导区域（如 "古筝 I" 后紧跟的起首竖线）
  if (remaining.length >= 2) {
    const firstDist = remaining[0].centerX - effectiveLeft;
    if (firstDist > edgeSnapPx && firstDist <= span * 0.16) {
      const restGaps: number[] = [];
      for (let i = 1; i < remaining.length; i++) {
        restGaps.push(remaining[i].centerX - remaining[i - 1].centerX);
      }
      restGaps.push(effectiveRight - remaining[remaining.length - 1].centerX);
      restGaps.sort((a, b) => a - b);
      const medianRest = restGaps[Math.floor(restGaps.length / 2)] || firstDist;
      if (firstDist < medianRest * 0.62) {
        effectiveLeft = Math.round(remaining[0].centerX);
        remaining.shift();
      }
    }
  }

  // 右边缘贴合终止双纵线
  if (remaining.length > 0 && effectiveRight - remaining[remaining.length - 1].centerX <= edgeSnapPx * 1.3) {
    effectiveRight = Math.round(remaining[remaining.length - 1].centerX);
    remaining.pop();
  }

  const effectiveSpan = Math.max(1, effectiveRight - effectiveLeft);
  const minMeasureGap = Math.max(24, Math.round(effectiveSpan * 0.065));

  const interior: number[] = [];
  for (const c of remaining) {
    const cx = Math.round(c.centerX);
    const prevX = interior.length > 0 ? interior[interior.length - 1] : effectiveLeft;
    if (cx - prevX >= minMeasureGap && effectiveRight - cx >= minMeasureGap) {
      interior.push(cx);
    }
  }

  return {
    barlinesPx: [effectiveLeft, ...interior, effectiveRight],
    trimmedLeftPx: effectiveLeft,
    trimmedRightPx: effectiveRight,
    interiorCount: interior.length,
  };
}

/**
 * 纯像素矩阵乐行与小节线识别核心算法（不依赖 DOM，支持服务端与单元测试直接验证）
 */
export function detectLayoutFromGrayscale(
  gray: Uint8Array,
  width: number,
  height: number,
  options: LayoutDetectionOptions = {}
): { systems: DetectedSystem[]; binaryInk: Uint8Array } {
  const binaryInk = buildAdaptiveBinaryInk(gray, width, height);
  if (width <= 0 || height <= 0 || gray.length < width * height) {
    return { systems: [], binaryInk };
  }

  const marginX = Math.max(2, Math.round(width * 0.01));
  const rowInkCounts = new Int32Array(height);
  for (let y = 0; y < height; y++) {
    const rowBase = y * width;
    let cnt = 0;
    for (let x = marginX; x < width - marginX; x++) {
      cnt += binaryInk[rowBase + x];
    }
    rowInkCounts[y] = cnt;
  }

  // 1. 水平投影提取连续墨迹带
  const rowThreshold = Math.max(2, Math.floor(width * 0.004));
  const rawBands: { yTop: number; yBot: number }[] = [];
  let inBand = false;
  let bStart = 0;

  for (let y = 0; y < height; y++) {
    if (rowInkCounts[y] > rowThreshold) {
      if (!inBand) {
        inBand = true;
        bStart = y;
      }
    } else if (inBand) {
      rawBands.push({ yTop: bStart, yBot: y - 1 });
      inBand = false;
    }
  }
  if (inBand) {
    rawBands.push({ yTop: bStart, yBot: height - 1 });
  }

  // 2. 合并间隙较小的上下邻近带（确保高音点、低音点、指法符号与减时线与音符归入同一乐行）
  const mergeGapY = Math.max(7, Math.round(height * 0.013));
  const mergedBands: { yTop: number; yBot: number }[] = [];
  for (const band of rawBands) {
    const prev = mergedBands[mergedBands.length - 1];
    if (prev && band.yTop - prev.yBot <= mergeGapY) {
      prev.yBot = band.yBot;
    } else {
      mergedBands.push({ ...band });
    }
  }

  const minBandH = Math.max(8, Math.round(height * 0.014));
  const isFirstPage = options.isFirstPage ?? true;

  interface CandidateBand {
    yTopPx: number;
    yBotPx: number;
    xLeftPx: number;
    xRightPx: number;
    barlinesPx: number[];
    interiorCount: number;
  }

  const candidates: CandidateBand[] = [];

  for (const band of mergedBands) {
    const bandH = band.yBot - band.yTop + 1;
    if (bandH < minBandH) continue;

    const spanRes = measureBandHorizontalSpan(binaryInk, width, band.yTop, band.yBot, marginX);
    const spanPx = spanRes.xRight - spanRes.xLeft + 1;
    const normTop = band.yTop / height;
    const normSpan = spanPx / width;

    // 剔除底部窄幅页码脚标
    if (normTop > 0.92 && normSpan < 0.25) continue;

    // 宽度需达到基本行宽阈值
    if (normSpan < 0.45) continue;

    const { clusters } = detectBarlineClustersInBand(
      binaryInk,
      width,
      height,
      band.yTop,
      band.yBot,
      spanRes.xLeft,
      spanRes.xRight
    );

    const built = buildSystemBarlinesFromClusters(clusters, spanRes.xLeft, spanRes.xRight);

    // 首页顶部无小节线且偏窄的标题/副标题过滤
    if (isFirstPage && normTop <= 0.18 && built.interiorCount === 0 && normSpan < 0.68) {
      continue;
    }

    const qualifies =
      built.interiorCount >= 1 ||
      ((!isFirstPage || normTop > 0.18) && normSpan >= 0.62 && bandH >= height * 0.025);

    if (!qualifies) continue;

    candidates.push({
      yTopPx: band.yTop,
      yBotPx: band.yBot,
      xLeftPx: built.trimmedLeftPx,
      xRightPx: built.trimmedRightPx,
      barlinesPx: built.barlinesPx,
      interiorCount: built.interiorCount,
    });
  }

  // 计算页内已有乐行的中位数每行小节数，供无小节线兜底行使用
  const measureCounts = candidates
    .filter((c) => c.interiorCount >= 1)
    .map((c) => c.barlinesPx.length - 1)
    .sort((a, b) => a - b);
  const fallbackMeasuresPerRow =
    measureCounts.length > 0
      ? measureCounts[Math.floor(measureCounts.length / 2)]
      : Math.max(1, options.defaultMeasuresPerRow ?? 4);

  const padY = Math.max(2, Math.round(height * 0.004));
  const systems: DetectedSystem[] = candidates.map((c, idx) => {
    const prevBot = idx > 0 ? candidates[idx - 1].yBotPx : 0;
    const nextTop = idx + 1 < candidates.length ? candidates[idx + 1].yTopPx : height - 1;
    const paddedTop = Math.max(idx > 0 ? Math.floor((prevBot + c.yTopPx) / 2) + 1 : 0, c.yTopPx - padY);
    const paddedBot = Math.min(
      idx + 1 < candidates.length ? Math.floor((c.yBotPx + nextTop) / 2) : height - 1,
      c.yBotPx + padY
    );

    const sysBase: DetectedSystem = {
      id: makeSystemId(`r${idx + 1}`),
      yTop: paddedTop / height,
      yBottom: Math.max(paddedTop + 1, paddedBot) / height,
      xLeft: c.xLeftPx / width,
      xRight: c.xRightPx / width,
      barlines: c.barlinesPx.map((bx) => bx / width),
      confidence: c.interiorCount >= 1 ? 'high' : 'fallback',
    };

    if (c.interiorCount === 0) {
      const split = splitSystemEqually(sysBase, fallbackMeasuresPerRow);
      return { ...split, confidence: 'fallback' };
    }
    return normalizeSystem(sysBase);
  });

  return { systems, binaryInk };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('加载曲谱图像失败'));
    img.src = src;
  });
}

async function extractGrayscaleFromDataUrl(
  dataUrl: string,
  maxWorkWidth: number = 900
): Promise<{ gray: Uint8Array; width: number; height: number }> {
  const img = await loadImageElement(dataUrl);
  const scale = img.width > maxWorkWidth ? maxWorkWidth / img.width : 1.0;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法初始化图像画布上下文');
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h).data;
  const gray = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    // 感知亮度加权灰度
    gray[i] = Math.round(imgData[p] * 0.299 + imgData[p + 1] * 0.587 + imgData[p + 2] * 0.114);
  }

  return { gray, width: w, height: h };
}

/**
 * 浏览器端一键对单页原件图像进行本地离线乐行与小节线自动埋点
 */
export async function detectScoreLayoutFromImage(
  dataUrl: string,
  options: LayoutDetectionOptions = {}
): Promise<DetectedSystem[]> {
  const { gray, width, height } = await extractGrayscaleFromDataUrl(dataUrl, 900);
  const { systems } = detectLayoutFromGrayscale(gray, width, height, options);
  return systems;
}

/**
 * 混合方案核心融合：保留 AI 语义识别出的乐行/合奏合行结构与小节数量，
 * 同时用本地像素级小节线检测将其 X 坐标精准吸附对齐到真实竖线上
 */
export function fuseLocalAndVisionLayout(
  visionSystems: DetectedSystem[],
  localSnapContext: LocalBinaryContext | DetectedSystem[]
): DetectedSystem[] {
  const snapTolerance = 0.038;
  const isPixelContext = !Array.isArray(localSnapContext);

  return visionSystems.map((rawSys, idx) => {
    const vSys = normalizeSystem({
      ...rawSys,
      id: rawSys.id || makeSystemId(`hyb${idx + 1}`),
    });

    let candidateLocalBarsNorm: number[] = [];

    if (isPixelContext) {
      const ctx = localSnapContext as LocalBinaryContext;
      const yTopPx = Math.max(0, Math.floor(vSys.yTop * ctx.height));
      const yBotPx = Math.min(ctx.height - 1, Math.ceil(vSys.yBottom * ctx.height));
      const xLeftPx = Math.max(0, Math.floor(Math.max(0, vSys.xLeft - 0.02) * ctx.width));
      const xRightPx = Math.min(ctx.width - 1, Math.ceil(Math.min(1, vSys.xRight + 0.02) * ctx.width));
      const { clusters } = detectBarlineClustersInBand(
        ctx.binaryInk,
        ctx.width,
        ctx.height,
        yTopPx,
        yBotPx,
        xLeftPx,
        xRightPx
      );
      candidateLocalBarsNorm = clusters.map((c) => c.centerX / ctx.width);
    } else {
      const localSystems = localSnapContext as DetectedSystem[];
      let bestOverlapSys: DetectedSystem | null = null;
      let bestScore = 0;
      const vMid = (vSys.yTop + vSys.yBottom) / 2;

      for (const lSys of localSystems) {
        const interTop = Math.max(vSys.yTop, lSys.yTop);
        const interBot = Math.min(vSys.yBottom, lSys.yBottom);
        const inter = Math.max(0, interBot - interTop);
        const minH = Math.max(0.001, Math.min(vSys.yBottom - vSys.yTop, lSys.yBottom - lSys.yTop));
        const ratio = inter / minH;
        const lMid = (lSys.yTop + lSys.yBottom) / 2;
        const dist = Math.abs(vMid - lMid);
        if (ratio > 0.3 || dist < 0.08) {
          const score = ratio - dist;
          if (score > bestScore || !bestOverlapSys) {
            bestScore = score;
            bestOverlapSys = lSys;
          }
        }
      }
      if (bestOverlapSys) {
        candidateLocalBarsNorm = bestOverlapSys.barlines.slice();
      }
    }

    if (candidateLocalBarsNorm.length === 0) {
      return { ...vSys, confidence: 'ai' };
    }

    const snappedBars = [...vSys.barlines];
    // 吸附边界与内部小节线
    for (let i = 0; i < snappedBars.length; i++) {
      const bx = snappedBars[i];
      const tol = i === 0 || i === snappedBars.length - 1 ? 0.025 : snapTolerance;
      let bestLocal = bx;
      let bestDiff = tol + 1e-6;
      for (const lx of candidateLocalBarsNorm) {
        const diff = Math.abs(lx - bx);
        if (diff <= bestDiff) {
          bestDiff = diff;
          bestLocal = lx;
        }
      }
      if (bestDiff <= tol) {
        snappedBars[i] = bestLocal;
      }
    }

    const normalized = normalizeSystem({
      ...vSys,
      xLeft: snappedBars[0],
      xRight: snappedBars[snappedBars.length - 1],
      barlines: snappedBars,
      confidence: 'hybrid',
    });

    // 若吸附导致局部过近丢失了某条内部线，退回确保小节数严格与 AI 语义小节数一致
    if (normalized.barlines.length !== vSys.barlines.length) {
      return { ...vSys, confidence: 'ai' };
    }
    return normalized;
  });
}

/**
 * 浏览器端混合融合入口：使用当前原图像素对 VLM 返回的乐行小节线执行像素吸附
 */
export async function fuseVisionWithImageDataUrl(
  dataUrl: string,
  visionSystems: DetectedSystem[]
): Promise<DetectedSystem[]> {
  if (visionSystems.length === 0) return [];
  const { gray, width, height } = await extractGrayscaleFromDataUrl(dataUrl, 900);
  const binaryInk = buildAdaptiveBinaryInk(gray, width, height);
  return fuseLocalAndVisionLayout(visionSystems, { binaryInk, width, height });
}

/**
 * 将各页乐行编译为连续编号的全曲小节埋点列表
 */
export function compileSystemsToAnchors(
  pagesSystems: { pageIndex: number; systems: DetectedSystem[] }[]
): MeasureAnchorBox[] {
  const anchors: MeasureAnchorBox[] = [];
  let measureCounter = 1;

  const sortedPages = [...pagesSystems].sort((a, b) => a.pageIndex - b.pageIndex);

  for (const page of sortedPages) {
    const sortedRows = [...page.systems]
      .map((s) => normalizeSystem(s))
      .sort((a, b) => a.yTop - b.yTop);

    sortedRows.forEach((sys, rIdx) => {
      const bars = sys.barlines;
      for (let bIdx = 0; bIdx < bars.length - 1; bIdx++) {
        const x1 = bars[bIdx];
        const x2 = bars[bIdx + 1];
        const w = Math.max(0.01, round4(x2 - x1));
        anchors.push({
          id: `anc-p${page.pageIndex}-m${measureCounter}`,
          measureNumber: measureCounter,
          pageIndex: page.pageIndex,
          rowIndex: rIdx,
          x: round4(x1),
          y: round4(sys.yTop),
          w,
          h: round4(sys.yBottom - sys.yTop),
          beats: sys.beatsPerMeasure,
        });
        measureCounter++;
      }
    });
  }

  return anchors;
}

/**
 * 为原件曲谱生成同步骨架小节数组（供节拍器、伴奏时间轴、A-B 循环与自动进度复用）
 */
export function generateSkeletonMeasures(
  anchors: MeasureAnchorBox[],
  timeSignature: [number, number]
): Measure[] {
  const defaultTop = timeSignature?.[0] || 4;
  const defaultBottom = timeSignature?.[1] || 4;
  return anchors.map((anc) => ({
    measureNumber: anc.measureNumber,
    showBoxNumber: anc.measureNumber === 1 || anc.measureNumber % 5 === 0,
    timeSignature:
      anc.beats && anc.beats !== defaultTop ? [anc.beats, defaultBottom] : undefined,
    notes: [],
  }));
}

/**
 * 将已保存的 MeasureAnchorBox 列表无损反解回按页分行的 DetectedSystem[][]，支持随时重新打开微调埋点
 */
export function reconstructSystemsFromAnchors(
  anchors: MeasureAnchorBox[],
  pageCount: number
): DetectedSystem[][] {
  const pages: DetectedSystem[][] = Array.from({ length: Math.max(0, pageCount) }, () => []);

  const byPage = new Map<number, MeasureAnchorBox[]>();
  for (const anc of anchors) {
    const list = byPage.get(anc.pageIndex) || [];
    list.push(anc);
    byPage.set(anc.pageIndex, list);
  }

  for (const [pageIdx, pageAnchors] of byPage.entries()) {
    while (pages.length <= pageIdx) {
      pages.push([]);
    }

    const byRow = new Map<number, MeasureAnchorBox[]>();
    for (const a of pageAnchors) {
      const rList = byRow.get(a.rowIndex) || [];
      rList.push(a);
      byRow.set(a.rowIndex, rList);
    }

    const sortedRowKeys = Array.from(byRow.keys()).sort((a, b) => a - b);
    pages[pageIdx] = sortedRowKeys.map((rKey) => {
      const boxes = [...(byRow.get(rKey) || [])].sort((a, b) => a.measureNumber - b.measureNumber);
      const yTop = Math.min(...boxes.map((b) => b.y));
      const yBottom = Math.max(...boxes.map((b) => b.y + b.h));
      const barlines: number[] = [boxes[0].x];
      for (let i = 0; i < boxes.length; i++) {
        barlines.push(boxes[i].x + boxes[i].w);
      }
      return normalizeSystem({
        id: makeSystemId(`p${pageIdx}r${rKey}`),
        yTop,
        yBottom,
        xLeft: barlines[0],
        xRight: barlines[barlines.length - 1],
        barlines,
        beatsPerMeasure: boxes[0]?.beats,
        confidence: 'manual',
      });
    });
  }

  return pages;
}
