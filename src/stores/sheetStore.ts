import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SheetMusic, Note, BeatUnit, SoundMode, ScoreDisplayMode, Measure, ScorePart } from '../types/music';
import { standardGuzhengScore } from '../data/defaultScore';
import { builtInScores } from '../data/scores';
import { deleteScoreImages } from '../utils/scoreImageStorage';

export type MasteryStage = 'slow' | 'normal' | 'challenge' | null;
export type DuetStringMode = 'part1' | 'both';

const CUSTOM_SCORES_STORAGE_KEY = 'guzheng_custom_scores_v1';
const MASTERY_STORAGE_KEY = 'guzheng_mastery_v1';

function loadCustomScoresFromStorage(): SheetMusic[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SCORES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadCompletedScoreIdsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(MASTERY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export const useSheetStore = defineStore('sheet', () => {
  // 用户自建/AI识谱入库曲谱（持久化于 localStorage）
  const customScores = ref<SheetMusic[]>(loadCustomScoresFromStorage());

  // 全量曲谱库（自建置顶 + 馆藏内置名曲）
  const allScores = computed<SheetMusic[]>(() => [...customScores.value, ...builtInScores]);

  // 当前加载的曲谱
  const currentSheet = ref<SheetMusic>(standardGuzhengScore);

  // 当前选中的演奏/显示声部：'all' (合奏全谱对照), 或具体声部 id (如 'part1', 'part2')
  const selectedPartId = ref<string>('all');

  // 节拍器基准音符单位：'quarter' (♩=78) 或 'eighth' (♪=156)
  const beatUnit = ref<BeatUnit>(currentSheet.value.beatUnit || 'quarter');

  // 发音模式：原件画框谱默认 'metronome'（清脆节拍引导），数字化简谱默认 'both'（节拍+古筝原声）
  const soundMode = ref<SoundMode>(currentSheet.value.scoreMode === 'original' ? 'metronome' : 'both');
  const guzhengVolume = ref(0.85);
  const metronomeVolume = ref(0.75);

  // 播放与节拍器状态
  const isPlaying = ref(false);
  const isAccompanimentSyncing = ref(false); // 伴奏实时同步高显进行中
  const isPerformanceActive = computed(() => isPlaying.value || isAccompanimentSyncing.value);
  const bpm = ref(currentSheet.value.defaultBpm || 78);
  const isPreBeat = ref(false);          // 是否正在打预备铃
  const preBeatCount = ref(0);           // 预备拍计数 1, 2 (或 1, 2, 3, 4)
  const currentMeasureIndex = ref(0);    // 当前演奏的小节索引 (0-based)
  const currentMeasureProgress = ref(0); // 当前小节内播放进度 0~1（用于原件画框扫拍）
  const currentNoteId = ref<string | null>(null);

  // 三阶通关伴练与右侧 21 弦亮弦控制
  const masteryStage = ref<MasteryStage>('normal');
  const duetStringMode = ref<DuetStringMode>('part1');
  const activePartNotes = ref<Record<string, Note | null>>({});
  const completedScoreIds = ref<string[]>(loadCompletedScoreIdsFromStorage());

  // A-B 单小节/区间循环慢练模式
  const loopRange = ref<{ start: number; end: number } | null>(null);

  // 音符人工编辑弹窗状态
  const editingNote = ref<Note | null>(null);
  const editingMeasureIndex = ref<number | null>(null);

  // 当前小节计算属性
  const currentMeasure = computed(() => {
    return currentSheet.value.measures[currentMeasureIndex.value] || null;
  });

  // 音符单位符号展示
  const beatUnitSymbol = computed(() => {
    switch (beatUnit.value) {
      case 'eighth':
        return '♪';
      case 'dotted-quarter':
        return '♩.';
      case 'quarter':
      default:
        return '♩';
    }
  });

  // 切换节拍基准音符单位（仅切换打拍细分提示音模式，保持四分音符 BPM 基准恒定不变）
  function setBeatUnit(unit: BeatUnit) {
    if (beatUnit.value === unit) return;
    beatUnit.value = unit;
  }

  // 设置当前音符（同时记录分声部实时触发音符供 21 弦面板亮弦）
  function setActiveNote(noteId: string | null, measureIdx: number, partId?: string, noteObj?: Note) {
    currentNoteId.value = noteId;
    currentMeasureIndex.value = measureIdx;
    if (noteId === null) {
      activePartNotes.value = {};
    } else if (partId && noteObj) {
      activePartNotes.value = {
        ...activePartNotes.value,
        [partId]: noteObj,
      };
    }
  }

  // 切换播放/停止
  function setPlaying(status: boolean) {
    isPlaying.value = status;
    if (!status && !isAccompanimentSyncing.value) {
      isPreBeat.value = false;
      preBeatCount.value = 0;
      currentNoteId.value = null;
      currentMeasureProgress.value = 0;
      activePartNotes.value = {};
    }
  }

  // 伴奏联动高显状态与单帧原子刷新
  function setAccompanimentSyncing(active: boolean) {
    isAccompanimentSyncing.value = active;
    if (!active && !isPlaying.value) {
      currentNoteId.value = null;
      currentMeasureProgress.value = 0;
      activePartNotes.value = {};
    }
  }

  function setMeasureProgress(progress: number) {
    if (!Number.isFinite(progress)) {
      currentMeasureProgress.value = 0;
      return;
    }
    currentMeasureProgress.value = Math.max(0, Math.min(1, progress));
  }

  function setSyncedFrame(
    primaryNoteId: string | null,
    measureIdx: number,
    partNotes: Record<string, Note | null>
  ) {
    currentNoteId.value = primaryNoteId;
    currentMeasureIndex.value = measureIdx;
    activePartNotes.value = partNotes;
  }

  // 调整速度（纯拍挑战下若低于原速则严格退出挑战态）
  function setBpm(newBpm: number) {
    bpm.value = Math.max(30, Math.min(240, Math.round(newBpm)));
    const baseBpm = currentSheet.value.defaultBpm || 78;
    if (masteryStage.value === 'challenge' && bpm.value < baseBpm) {
      masteryStage.value = null;
    } else if (
      masteryStage.value === 'slow' &&
      bpm.value !== Math.max(30, Math.round(baseBpm * 0.7))
    ) {
      masteryStage.value = null;
    } else if (masteryStage.value === 'normal' && bpm.value !== baseBpm) {
      masteryStage.value = null;
    }
  }

  // 切换发音模式与音量（纯拍挑战下若切回有声模式则严格退出挑战态）
  function setSoundMode(mode: SoundMode) {
    soundMode.value = mode;
    if (masteryStage.value === 'challenge' && mode !== 'metronome') {
      masteryStage.value = null;
    } else if ((masteryStage.value === 'slow' || masteryStage.value === 'normal') && mode !== 'both') {
      masteryStage.value = null;
    }
  }

  // 一键应用三阶通关模式
  function applyMasteryStage(stage: Exclude<MasteryStage, null>) {
    const baseBpm = currentSheet.value.defaultBpm || 78;
    masteryStage.value = stage;
    if (stage === 'slow') {
      bpm.value = Math.max(30, Math.round(baseBpm * 0.7));
      soundMode.value = 'both';
    } else if (stage === 'normal') {
      bpm.value = baseBpm;
      soundMode.value = 'both';
    } else {
      bpm.value = baseBpm;
      soundMode.value = 'metronome';
    }
  }

  function setDuetStringMode(mode: DuetStringMode) {
    duetStringMode.value = mode;
  }

  function persistCompletedScoreIds() {
    try {
      localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(completedScoreIds.value));
    } catch {
      // 忽略存储限额异常
    }
  }

  function markCurrentScoreMastered() {
    const hasParts = Boolean(currentSheet.value.parts && currentSheet.value.parts.length > 0);
    const isValidPart =
      selectedPartId.value === 'all' || selectedPartId.value === 'part1' || !hasParts;
    if (masteryStage.value === 'challenge' && !loopRange.value && isValidPart) {
      if (!completedScoreIds.value.includes(currentSheet.value.id)) {
        completedScoreIds.value = [...completedScoreIds.value, currentSheet.value.id];
        persistCompletedScoreIds();
      }
    }
  }

  function isScoreMastered(id: string): boolean {
    return completedScoreIds.value.includes(id);
  }

  function setGuzhengVolume(vol: number) {
    guzhengVolume.value = Math.max(0, Math.min(1, vol));
  }

  function setMetronomeVolume(vol: number) {
    metronomeVolume.value = Math.max(0, Math.min(1, vol));
  }

  // 设置或取消循环区间
  function toggleLoop(measureNum: number) {
    if (!loopRange.value) {
      loopRange.value = { start: measureNum, end: measureNum };
    } else if (loopRange.value.start === measureNum && loopRange.value.end === measureNum) {
      loopRange.value = null;
    } else if (measureNum > loopRange.value.start) {
      loopRange.value.end = measureNum;
    } else {
      loopRange.value = { start: measureNum, end: measureNum };
    }
  }

  // 打开编辑音符弹窗
  function openNoteEditor(note: Note, measureIndex: number) {
    editingNote.value = JSON.parse(JSON.stringify(note));
    editingMeasureIndex.value = measureIndex;
  }

  function persistCustomScores() {
    try {
      localStorage.setItem(CUSTOM_SCORES_STORAGE_KEY, JSON.stringify(customScores.value));
    } catch {
      // 忽略存储限额异常
    }
  }

  // 保存音符编辑（同时覆盖主声部、重奏多声部与前奏导引旋律）
  function saveNoteEdit(updatedNote: Note) {
    if (editingMeasureIndex.value === null) return;
    const mIdx = editingMeasureIndex.value;

    const updateInMeasures = (measures?: SheetMusic['measures']) => {
      const m = measures?.[mIdx];
      if (!m) return false;
      const idx = m.notes.findIndex((n) => n.id === updatedNote.id);
      if (idx !== -1) {
        m.notes[idx] = updatedNote;
        return true;
      }
      return false;
    };

    updateInMeasures(currentSheet.value.measures);
    if (currentSheet.value.parts) {
      for (const part of currentSheet.value.parts) {
        updateInMeasures(part.measures);
      }
    }
    updateInMeasures(currentSheet.value.introMelody);

    // 若当前曲谱属于用户自建藏谱，则同步持久化修改
    const customIdx = customScores.value.findIndex((s) => s.id === currentSheet.value.id);
    if (customIdx !== -1) {
      customScores.value[customIdx] = JSON.parse(JSON.stringify(currentSheet.value));
      persistCustomScores();
    }

    editingNote.value = null;
    editingMeasureIndex.value = null;
  }

  // 载入新曲谱
  function loadSheet(newSheet: SheetMusic) {
    setPlaying(false);
    isAccompanimentSyncing.value = false;
    currentSheet.value = newSheet;
    bpm.value = newSheet.defaultBpm || 78;
    beatUnit.value = newSheet.beatUnit || 'quarter';
    soundMode.value = newSheet.scoreMode === 'original' ? 'metronome' : 'both';
    masteryStage.value = 'normal';
    currentMeasureIndex.value = 0;
    currentMeasureProgress.value = 0;
    currentNoteId.value = null;
    activePartNotes.value = {};
    loopRange.value = null;
    selectedPartId.value = 'all';
  }

  // 命名存储为新曲谱至本地曲库并立即载入伴练
  function saveScoreToLibrary(newSheet: SheetMusic) {
    const cleanCopy: SheetMusic = JSON.parse(JSON.stringify(newSheet));
    const idx = customScores.value.findIndex((s) => s.id === cleanCopy.id);
    if (idx !== -1) {
      customScores.value[idx] = cleanCopy;
    } else {
      customScores.value.unshift(cleanCopy);
    }
    persistCustomScores();
    loadSheet(cleanCopy);
  }

  // 从自建曲库删除曲谱
  function deleteCustomScore(id: string) {
    const target = customScores.value.find((s) => s.id === id);
    if (target?.scoreMode === 'original' || target?.originalScore?.pages?.length) {
      const pageIds = target.originalScore?.pages?.map((p) => p.id);
      void deleteScoreImages(id, pageIds);
    }
    customScores.value = customScores.value.filter((s) => s.id !== id);
    persistCustomScores();
    if (currentSheet.value.id === id) {
      loadSheet(standardGuzhengScore);
    }
  }

  function setSelectedPartId(partId: string) {
    selectedPartId.value = partId;
  }

  // 在原件画框谱与数字化简谱视图之间无损切换
  function setScoreDisplayMode(mode: ScoreDisplayMode) {
    if (mode === 'original' && !currentSheet.value.originalScore?.anchors?.length) {
      return;
    }
    setPlaying(false);
    isAccompanimentSyncing.value = false;
    currentSheet.value = {
      ...currentSheet.value,
      scoreMode: mode,
    };
    soundMode.value = mode === 'original' ? 'metronome' : 'both';
    loopRange.value = null;
    currentMeasureIndex.value = 0;
    currentMeasureProgress.value = 0;
    currentNoteId.value = null;
    activePartNotes.value = {};
  }

  // 为原件曲谱写入并持久化转义后的数字化简谱数据（保留 originalScore 不变并切至数字简谱模式）
  function attachDigitalTranscription(
    sheetId: string,
    payload: {
      measures: Measure[];
      parts?: ScorePart[];
      key?: string;
      timeSignature?: [number, number];
      defaultBpm?: number;
    }
  ) {
    const mergeSheet = (target: SheetMusic): SheetMusic => ({
      ...target,
      key: payload.key || target.key,
      timeSignature: payload.timeSignature || target.timeSignature,
      defaultBpm: payload.defaultBpm || target.defaultBpm,
      measures: JSON.parse(JSON.stringify(payload.measures)),
      parts: payload.parts ? JSON.parse(JSON.stringify(payload.parts)) : undefined,
      scoreMode: 'digital',
    });

    const customIdx = customScores.value.findIndex((s) => s.id === sheetId);
    let updatedSheet: SheetMusic | null = null;
    if (customIdx !== -1) {
      updatedSheet = mergeSheet(customScores.value[customIdx]);
      customScores.value[customIdx] = updatedSheet;
      persistCustomScores();
    }

    if (currentSheet.value.id === sheetId) {
      const nextCurrent = updatedSheet ? updatedSheet : mergeSheet(currentSheet.value);
      setPlaying(false);
      isAccompanimentSyncing.value = false;
      currentSheet.value = nextCurrent;
      bpm.value = nextCurrent.defaultBpm || bpm.value;
      soundMode.value = 'both';
      loopRange.value = null;
      currentMeasureIndex.value = 0;
      currentMeasureProgress.value = 0;
      currentNoteId.value = null;
      activePartNotes.value = {};
      selectedPartId.value = 'all';
    }
  }

  return {
    customScores,
    allScores,
    currentSheet,
    selectedPartId,
    beatUnit,
    beatUnitSymbol,
    soundMode,
    guzhengVolume,
    metronomeVolume,
    isPlaying,
    isAccompanimentSyncing,
    isPerformanceActive,
    bpm,
    isPreBeat,
    preBeatCount,
    currentMeasureIndex,
    currentMeasureProgress,
    currentNoteId,
    masteryStage,
    duetStringMode,
    activePartNotes,
    completedScoreIds,
    currentMeasure,
    loopRange,
    editingNote,
    editingMeasureIndex,
    loadSheet,
    saveScoreToLibrary,
    deleteCustomScore,
    setSelectedPartId,
    setScoreDisplayMode,
    attachDigitalTranscription,
    setBeatUnit,
    setSoundMode,
    applyMasteryStage,
    setDuetStringMode,
    markCurrentScoreMastered,
    isScoreMastered,
    setGuzhengVolume,
    setMetronomeVolume,
    setActiveNote,
    setPlaying,
    setAccompanimentSyncing,
    setMeasureProgress,
    setSyncedFrame,
    setBpm,
    toggleLoop,
    openNoteEditor,
    saveNoteEdit,
  };
});
