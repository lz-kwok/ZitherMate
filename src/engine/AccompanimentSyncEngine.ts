import { Note, SheetMusic } from '../types/music';

export interface SyncAnchor {
  measure: number; // 1-based 小节号 (totalMeasures + 1 表示全曲结束时间边界)
  timeSec: number; // 音频绝对时间戳 (秒)
}

export interface RepeatRemapRule {
  fromMeasure: number; // 音频时间轴上重复段的起始逻辑小节号（如 105）
  toMeasure: number; // 音频时间轴上重复段的结束逻辑小节号（如 112）
  targetStartMeasure: number; // 映射回原曲谱实际小节号起点（如 97）
}

export interface AccompanimentSyncMap {
  trackId: string;
  scoreId: string;
  anchors: SyncAnchor[];
  repeatRemap?: RepeatRemapRule[];
  isCustom?: boolean;
}

export interface SyncedScoreFrame {
  measureIndex: number; // 0-based 小节索引
  measureProgress: number; // 小节内进度 0~1（用于原件画框扫拍）
  primaryNoteId: string | null;
  primaryNote: Note | null;
  partNotes: Record<string, Note | null>;
}

const SYNC_STORAGE_KEY = 'guzheng_accompaniment_sync_v1';
export const SYNC_OFFSET_STORAGE_KEY = 'guzheng_accompaniment_sync_offset_v1';
export const MIN_SYNC_OFFSET_MS = -600;
export const MAX_SYNC_OFFSET_MS = 600;

export function clampSyncOffsetMs(offsetMs: number): number {
  const num = Number(offsetMs);
  if (!Number.isFinite(num)) return 0;
  return Math.max(MIN_SYNC_OFFSET_MS, Math.min(MAX_SYNC_OFFSET_MS, Math.round(num)));
}

/**
 * 将视觉高显偏移（毫秒）叠加到音频当前播放时间。
 * 负值表示延后高显（高显偏快时用），正值表示提前高显（高显偏慢时用）。
 */
export function applySyncOffset(timeSec: number, offsetMs: number): number {
  const base = Number.isFinite(timeSec) ? timeSec : 0;
  return Math.max(0, base + clampSyncOffsetMs(offsetMs) / 1000);
}

export function loadSyncOffsetMs(): number {
  try {
    if (typeof localStorage === 'undefined') return 0;
    const raw = localStorage.getItem(SYNC_OFFSET_STORAGE_KEY);
    if (raw === null) return 0;
    return clampSyncOffsetMs(Number(raw));
  } catch {
    return 0;
  }
}

export function saveSyncOffsetMs(offsetMs: number): number {
  const clamped = clampSyncOffsetMs(offsetMs);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SYNC_OFFSET_STORAGE_KEY, String(clamped));
    }
  } catch {
    // 忽略存储异常
  }
  return clamped;
}

// 基于全曲声学起音与 Chroma 回归实测的内置伴奏同步轴（M1~M108 恒定 96 BPM / 1.250s/小节，M109~M112 反复后渐慢）
export const BUILT_IN_SYNC_MAPS: AccompanimentSyncMap[] = [
  {
    trackId: 'builtin-13.唐诗联唱（示范）.mp3',
    scoreId: 'tangshi-lianchang',
    anchors: [
      { measure: 1, timeSec: 0.86 },
      { measure: 9, timeSec: 10.86 },
      { measure: 17, timeSec: 20.86 },
      { measure: 29, timeSec: 35.86 },
      { measure: 41, timeSec: 50.86 },
      { measure: 53, timeSec: 65.86 },
      { measure: 65, timeSec: 80.86 },
      { measure: 73, timeSec: 90.86 },
      { measure: 89, timeSec: 110.86 },
      { measure: 97, timeSec: 120.86 },
      { measure: 101, timeSec: 125.86 },
      { measure: 105, timeSec: 130.86 },
      { measure: 109, timeSec: 135.86 },
      { measure: 110, timeSec: 137.50 },
      { measure: 111, timeSec: 139.20 },
      { measure: 112, timeSec: 141.30 },
      { measure: 113, timeSec: 143.55 },
    ],
    repeatRemap: [
      { fromMeasure: 105, toMeasure: 112, targetStartMeasure: 97 },
    ],
  },
];

export function makeSyncMapKey(trackId: string, scoreId: string): string {
  return `${trackId}::${scoreId}`;
}

export function normalizeSyncAnchors(anchors: SyncAnchor[]): SyncAnchor[] {
  const byMeasure = new Map<number, SyncAnchor>();
  for (const raw of anchors) {
    const m = Math.round(Number(raw.measure) || 0);
    const t = Number(raw.timeSec);
    if (m >= 1 && Number.isFinite(t) && t >= 0) {
      byMeasure.set(m, { measure: m, timeSec: Math.round(t * 1000) / 1000 });
    }
  }
  return Array.from(byMeasure.values()).sort((a, b) => a.measure - b.measure);
}

function isPlayableNote(note: Note): boolean {
  const pitch = Number(note.pitch) || 0;
  const hasChord = Array.isArray(note.chord) && note.chord.length > 0;
  return pitch !== 0 || hasChord;
}

function findActiveNoteAtBeat(notes: Note[], beatInMeasure: number): Note | null {
  let cursor = 0;
  for (const note of notes) {
    const dur = Math.max(0.05, Number(note.duration) || 1);
    if (beatInMeasure >= cursor - 1e-6 && beatInMeasure < cursor + dur) {
      return isPlayableNote(note) ? note : null;
    }
    cursor += dur;
  }
  return null;
}

export function resolveSyncedFrame(
  timeSec: number,
  sheet: SheetMusic,
  anchors: SyncAnchor[],
  selectedPartId: string = 'all',
  repeatRemap?: RepeatRemapRule[]
): SyncedScoreFrame | null {
  const sorted = normalizeSyncAnchors(anchors);
  const isOriginalMode =
    sheet.scoreMode === 'original' && Boolean(sheet.originalScore?.anchors?.length);
  const totalMeasures = isOriginalMode
    ? sheet.originalScore!.anchors.length
    : sheet.measures.length;
  if (sorted.length === 0 || totalMeasures <= 0) return null;

  if (timeSec < sorted[0].timeSec) {
    return null;
  }

  const activeRemap = (repeatRemap || []).filter((r) => r.targetStartMeasure <= totalMeasures);
  const timelineEndMeasure =
    activeRemap.length > 0
      ? Math.max(totalMeasures, ...activeRemap.map((r) => r.toMeasure))
      : totalMeasures;

  const last = sorted[sorted.length - 1];
  if (last.measure > timelineEndMeasure && timeSec >= last.timeSec) {
    return null;
  }

  let exactMeasureFloat = sorted[0].measure;
  let matchedInterval = false;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a0 = sorted[i];
    const a1 = sorted[i + 1];
    if (timeSec >= a0.timeSec && timeSec < a1.timeSec) {
      const dt = Math.max(0.001, a1.timeSec - a0.timeSec);
      const dm = Math.max(1, a1.measure - a0.measure);
      exactMeasureFloat = a0.measure + ((timeSec - a0.timeSec) / dt) * dm;
      matchedInterval = true;
      break;
    }
  }

  if (!matchedInterval) {
    let secPerMeasure: number;
    if (sorted.length >= 2) {
      const prev = sorted[sorted.length - 2];
      const dm = Math.max(1, last.measure - prev.measure);
      secPerMeasure = Math.max(0.2, (last.timeSec - prev.timeSec) / dm);
    } else {
      const beatsPerM = sheet.timeSignature?.[0] || 2;
      secPerMeasure = (60 / (sheet.defaultBpm || 78)) * beatsPerM;
    }
    exactMeasureFloat = last.measure + (timeSec - last.timeSec) / secPerMeasure;
  }

  const rawMeasureNumber = Math.floor(exactMeasureFloat);
  let measureNumber = rawMeasureNumber;
  if (activeRemap.length > 0) {
    for (const r of activeRemap) {
      if (rawMeasureNumber >= r.fromMeasure && rawMeasureNumber <= r.toMeasure) {
        measureNumber = r.targetStartMeasure + (rawMeasureNumber - r.fromMeasure);
        break;
      }
    }
  }

  if (measureNumber < 1 || measureNumber > totalMeasures) {
    return null;
  }

  const measureIdx = measureNumber - 1;
  const fraction = Math.max(0, exactMeasureFloat - rawMeasureNumber);
  const measureProgress = Math.max(0, Math.min(1, fraction));

  if (isOriginalMode) {
    return {
      measureIndex: measureIdx,
      measureProgress,
      primaryNoteId: null,
      primaryNote: null,
      partNotes: {},
    };
  }

  const beatsPerMeasure =
    sheet.measures[measureIdx]?.timeSignature?.[0] || sheet.timeSignature?.[0] || 2;
  const beatInMeasure = fraction * beatsPerMeasure;

  const partNotes: Record<string, Note | null> = {};

  if (sheet.introMelody && sheet.introMelody[measureIdx]) {
    const introHit = findActiveNoteAtBeat(sheet.introMelody[measureIdx].notes, beatInMeasure);
    if (introHit) {
      partNotes.intro = introHit;
    }
  }

  if (sheet.parts && sheet.parts.length > 0) {
    if (selectedPartId === 'all') {
      for (const part of sheet.parts) {
        const m = part.measures[measureIdx];
        if (!m) continue;
        const hit = findActiveNoteAtBeat(m.notes, beatInMeasure);
        if (hit) {
          partNotes[part.id] = hit;
        }
      }
    } else {
      const targetPart = sheet.parts.find((p) => p.id === selectedPartId);
      const m = targetPart?.measures[measureIdx];
      if (m && targetPart) {
        const hit = findActiveNoteAtBeat(m.notes, beatInMeasure);
        if (hit) {
          partNotes[targetPart.id] = hit;
        }
      }
    }
  } else {
    const mainMeasure = sheet.measures[measureIdx];
    if (mainMeasure) {
      const hit = findActiveNoteAtBeat(mainMeasure.notes, beatInMeasure);
      if (hit) {
        partNotes.main = hit;
      }
    }
  }

  let primaryNote: Note | null = null;
  if (selectedPartId !== 'all') {
    primaryNote = partNotes[selectedPartId] ?? partNotes.main ?? partNotes.intro ?? null;
  } else {
    primaryNote =
      partNotes.part1 ??
      partNotes.main ??
      partNotes.part2 ??
      partNotes.intro ??
      Object.values(partNotes).find((n) => n !== null) ??
      null;
  }

  return {
    measureIndex: measureIdx,
    measureProgress,
    primaryNoteId: primaryNote?.id ?? null,
    primaryNote,
    partNotes,
  };
}

export function loadCustomSyncMaps(): Record<string, AccompanimentSyncMap> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(SYNC_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCustomSyncMap(
  map: AccompanimentSyncMap
): Record<string, AccompanimentSyncMap> {
  const current = loadCustomSyncMaps();
  const key = makeSyncMapKey(map.trackId, map.scoreId);
  const updated: Record<string, AccompanimentSyncMap> = {
    ...current,
    [key]: {
      ...map,
      anchors: normalizeSyncAnchors(map.anchors),
      isCustom: true,
    },
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // 忽略存储异常
  }
  return updated;
}

export function deleteCustomSyncMap(
  trackId: string,
  scoreId: string
): Record<string, AccompanimentSyncMap> {
  const current = loadCustomSyncMaps();
  const key = makeSyncMapKey(trackId, scoreId);
  const next = { ...current };
  delete next[key];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(next));
    }
  } catch {
    // 忽略存储异常
  }
  return next;
}
