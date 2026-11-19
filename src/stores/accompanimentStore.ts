import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  AccompanimentTrack,
  builtInAccompaniments,
  matchScoreForTrack,
  parseTrackMetadata,
} from '../data/accompaniments';
import { useSheetStore } from './sheetStore';
import { metronome } from '../engine/MetronomeEngine';
import {
  AccompanimentSyncMap,
  BUILT_IN_SYNC_MAPS,
  SyncAnchor,
  deleteCustomSyncMap,
  loadCustomSyncMaps,
  makeSyncMapKey,
  normalizeSyncAnchors,
  resolveSyncedFrame,
  saveCustomSyncMap,
} from '../engine/AccompanimentSyncEngine';
import { autoScroller } from '../engine/AutoScroller';

export const PLAYBACK_SPEED_OPTIONS = [0.6, 0.75, 0.85, 1.0, 1.15] as const;

export const useAccompanimentStore = defineStore('accompaniment', () => {
  const sheetStore = useSheetStore();

  const localTracks = ref<AccompanimentTrack[]>([]);
  const allTracks = computed<AccompanimentTrack[]>(() => [
    ...builtInAccompaniments,
    ...localTracks.value,
  ]);

  const activeTrack = ref<AccompanimentTrack | null>(null);
  const isAccompanimentMode = ref(false);

  const isPlaying = ref(false);
  const isLoadingAudio = ref(false);
  const audioError = ref('');

  const currentTime = ref(0);
  const duration = ref(0);
  const playbackRate = ref<number>(1.0);
  const volume = ref<number>(0.9);
  const isMuted = ref(false);

  const loopA = ref<number | null>(null);
  const loopB = ref<number | null>(null);

  // 曲谱高显实时同步与敲拍对齐校准状态
  const isSyncHighlightEnabled = ref(true);
  const customSyncMaps = ref<Record<string, AccompanimentSyncMap>>(loadCustomSyncMaps());

  const activeSyncMap = computed<AccompanimentSyncMap | null>(() => {
    if (!activeTrack.value) return null;
    const key = makeSyncMapKey(activeTrack.value.id, sheetStore.currentSheet.id);
    if (customSyncMaps.value[key]) {
      return customSyncMaps.value[key];
    }
    return (
      BUILT_IN_SYNC_MAPS.find(
        (m) => m.trackId === activeTrack.value!.id && m.scoreId === sheetStore.currentSheet.id
      ) || null
    );
  });

  const hasBuiltInSyncMap = computed(() => {
    if (!activeTrack.value) return false;
    return BUILT_IN_SYNC_MAPS.some(
      (m) => m.trackId === activeTrack.value!.id && m.scoreId === sheetStore.currentSheet.id
    );
  });

  const isCalibrating = ref(false);
  const calibrationStep = ref<1 | 4>(4);
  const draftAnchors = ref<SyncAnchor[]>([]);

  const nextTargetMeasure = computed<number>(() => {
    const total = sheetStore.currentSheet.measures.length;
    if (draftAnchors.value.length === 0) return 1;
    const lastM = draftAnchors.value[draftAnchors.value.length - 1].measure;
    if (lastM > total) return total + 1;
    const next = lastM + calibrationStep.value;
    return next > total ? total + 1 : next;
  });

  const isCalibrationComplete = computed<boolean>(() => {
    const total = sheetStore.currentSheet.measures.length;
    if (draftAnchors.value.length === 0) return false;
    return draftAnchors.value[draftAnchors.value.length - 1].measure > total;
  });

  const blobUrlCache = new Map<string, string>();
  let loadSequence = 0;
  let rafId: number | null = null;
  let lastFrameFingerprint = '';

  let audioEl: HTMLAudioElement | null = null;

  function applyPitchPreserve(el: HTMLAudioElement) {
    const ext = el as HTMLAudioElement & {
      preservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
      mozPreservesPitch?: boolean;
    };
    ext.preservesPitch = true;
    ext.webkitPreservesPitch = true;
    ext.mozPreservesPitch = true;
    el.playbackRate = playbackRate.value;
  }

  function syncOnceAtCurrentTime(scrollIntoView: boolean = true) {
    if (!isSyncHighlightEnabled.value || !activeSyncMap.value || !isAccompanimentMode.value) {
      if (sheetStore.isAccompanimentSyncing) {
        sheetStore.setAccompanimentSyncing(false);
      }
      lastFrameFingerprint = '';
      return;
    }

    const t = audioEl ? audioEl.currentTime : currentTime.value;
    const frame = resolveSyncedFrame(
      t,
      sheetStore.currentSheet,
      activeSyncMap.value.anchors,
      sheetStore.selectedPartId
    );

    if (!frame) {
      if (sheetStore.isAccompanimentSyncing) {
        sheetStore.setAccompanimentSyncing(false);
      }
      lastFrameFingerprint = '';
      return;
    }

    const p1Id = frame.partNotes.part1?.id ?? frame.partNotes.main?.id ?? '';
    const p2Id = frame.partNotes.part2?.id ?? '';
    const inId = frame.partNotes.intro?.id ?? '';
    const fp = `${frame.measureIndex}:${frame.primaryNoteId ?? ''}:${p1Id}:${p2Id}:${inId}`;

    if (!sheetStore.isAccompanimentSyncing) {
      sheetStore.setAccompanimentSyncing(true);
    }

    if (fp !== lastFrameFingerprint) {
      lastFrameFingerprint = fp;
      sheetStore.setSyncedFrame(frame.primaryNoteId, frame.measureIndex, frame.partNotes);
      if (scrollIntoView && frame.primaryNoteId) {
        autoScroller.scrollToActiveNote(frame.primaryNoteId);
      }
    }
  }

  function stopSyncLoop(clearHighlight: boolean = false) {
    if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (clearHighlight) {
      lastFrameFingerprint = '';
      sheetStore.setAccompanimentSyncing(false);
    }
  }

  function startSyncLoop() {
    stopSyncLoop(false);
    if (
      typeof requestAnimationFrame === 'undefined' ||
      !isPlaying.value ||
      !isSyncHighlightEnabled.value ||
      !activeSyncMap.value
    ) {
      return;
    }
    const tick = () => {
      if (!isPlaying.value) {
        stopSyncLoop(false);
        return;
      }
      syncOnceAtCurrentTime(true);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function ensureAudioElement(): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') return null;
    if (audioEl) return audioEl;

    const el = new Audio();
    el.preload = 'auto';

    el.addEventListener('loadedmetadata', () => {
      duration.value = Number.isFinite(el.duration) ? el.duration : 0;
      isLoadingAudio.value = false;
      applyPitchPreserve(el);
    });

    el.addEventListener('durationchange', () => {
      if (Number.isFinite(el.duration)) {
        duration.value = el.duration;
      }
    });

    el.addEventListener('canplay', () => {
      isLoadingAudio.value = false;
    });

    el.addEventListener('timeupdate', () => {
      if (loopA.value !== null && loopB.value !== null && el.currentTime >= loopB.value) {
        el.currentTime = loopA.value;
        currentTime.value = loopA.value;
        syncOnceAtCurrentTime(true);
        return;
      }
      currentTime.value = el.currentTime || 0;
    });

    el.addEventListener('ended', () => {
      if (loopA.value !== null && loopB.value !== null) {
        el.currentTime = loopA.value;
        currentTime.value = loopA.value;
        syncOnceAtCurrentTime(true);
        el.play().catch(() => {
          isPlaying.value = false;
          stopSyncLoop(true);
        });
        return;
      }
      isPlaying.value = false;
      currentTime.value = 0;
      stopSyncLoop(true);
    });

    el.addEventListener('error', () => {
      isLoadingAudio.value = false;
      isPlaying.value = false;
      stopSyncLoop(true);
      audioError.value = '伴奏音频加载或解码失败，请检查文件或重新选择';
    });

    audioEl = el;
    return el;
  }

  async function resolvePlayableUrl(track: AccompanimentTrack): Promise<string> {
    if (track.isLocal || track.url.startsWith('blob:')) {
      return track.url;
    }
    const cached = blobUrlCache.get(track.url);
    if (cached) return cached;

    try {
      const response = await fetch(track.url);
      if (!response.ok) {
        return track.url;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      blobUrlCache.set(track.url, objectUrl);
      return objectUrl;
    } catch {
      return track.url;
    }
  }

  function stopMetronomePlayback() {
    metronome.stop();
    if (sheetStore.isPlaying) {
      sheetStore.setPlaying(false);
    }
  }

  async function selectTrack(track: AccompanimentTrack, autoPlay: boolean = false) {
    const seq = ++loadSequence;
    stopMetronomePlayback();
    stopSyncLoop(true);

    const el = ensureAudioElement();
    if (el) {
      el.pause();
    }

    isPlaying.value = false;
    isCalibrating.value = false;
    draftAnchors.value = [];
    audioError.value = '';
    currentTime.value = 0;
    duration.value = 0;
    loopA.value = null;
    loopB.value = null;
    activeTrack.value = track;
    isAccompanimentMode.value = true;
    isLoadingAudio.value = true;

    const matched = matchScoreForTrack(track, sheetStore.allScores);
    if (matched && sheetStore.currentSheet.id !== matched.id) {
      sheetStore.loadSheet(matched);
    }

    const playableUrl = await resolvePlayableUrl(track);
    if (seq !== loadSequence) return;

    if (!el) {
      isLoadingAudio.value = false;
      return;
    }

    el.src = playableUrl;
    el.volume = isMuted.value ? 0 : volume.value;
    el.muted = isMuted.value;
    applyPitchPreserve(el);
    el.load();

    if (autoPlay) {
      await play();
    }
  }

  async function play() {
    stopMetronomePlayback();
    const el = ensureAudioElement();
    if (!el) return;

    if (!el.src && activeTrack.value) {
      await selectTrack(activeTrack.value, true);
      return;
    }

    audioError.value = '';
    applyPitchPreserve(el);
    el.volume = isMuted.value ? 0 : volume.value;
    el.muted = isMuted.value;

    try {
      await el.play();
      isPlaying.value = true;
      syncOnceAtCurrentTime(true);
      startSyncLoop();
    } catch (err) {
      isPlaying.value = false;
      stopSyncLoop(true);
      audioError.value =
        err instanceof Error ? `无法播放伴奏：${err.message}` : '伴奏启动失败，请点击播放重试';
    }
  }

  function pause() {
    if (audioEl) {
      audioEl.pause();
    }
    isPlaying.value = false;
    stopSyncLoop(true);
  }

  async function togglePlay() {
    if (isPlaying.value) {
      pause();
    } else {
      await play();
    }
  }

  function seek(seconds: number) {
    const maxSec = duration.value > 0 ? duration.value : Math.max(0, seconds);
    const clamped = Math.max(0, Math.min(maxSec, seconds));
    currentTime.value = clamped;
    if (audioEl) {
      audioEl.currentTime = clamped;
    }
    if (isPlaying.value) {
      syncOnceAtCurrentTime(true);
    }
  }

  function rewind(seconds: number = 5) {
    seek(currentTime.value - seconds);
  }

  function setPlaybackRate(rate: number) {
    const safe = Math.max(0.5, Math.min(1.5, rate));
    playbackRate.value = safe;
    if (audioEl) {
      applyPitchPreserve(audioEl);
    }
  }

  function setVolume(vol: number) {
    const safe = Math.max(0, Math.min(1, vol));
    volume.value = safe;
    if (safe > 0 && isMuted.value) {
      isMuted.value = false;
    }
    if (audioEl) {
      audioEl.volume = isMuted.value ? 0 : safe;
      audioEl.muted = isMuted.value;
    }
  }

  function toggleMute() {
    isMuted.value = !isMuted.value;
    if (audioEl) {
      audioEl.muted = isMuted.value;
      audioEl.volume = isMuted.value ? 0 : volume.value;
    }
  }

  function toggleLoopPoint() {
    if (loopA.value === null) {
      const upper = duration.value > 0.6 ? duration.value - 0.6 : currentTime.value;
      loopA.value = Math.max(0, Math.min(currentTime.value, upper));
    } else if (loopB.value === null) {
      const rawB = Math.max(currentTime.value, loopA.value + 0.5);
      const bPoint = duration.value > 0 ? Math.min(duration.value, rawB) : rawB;
      if (bPoint - loopA.value >= 0.4) {
        loopB.value = bPoint;
        seek(loopA.value);
      }
    } else {
      clearLoop();
    }
  }

  function clearLoop() {
    loopA.value = null;
    loopB.value = null;
  }

  function toggleSyncHighlight() {
    isSyncHighlightEnabled.value = !isSyncHighlightEnabled.value;
    if (!isSyncHighlightEnabled.value) {
      stopSyncLoop(true);
    } else if (isPlaying.value) {
      syncOnceAtCurrentTime(true);
      startSyncLoop();
    }
  }

  function startCalibration() {
    isCalibrating.value = true;
    draftAnchors.value = [];
  }

  function cancelCalibration() {
    isCalibrating.value = false;
    draftAnchors.value = [];
  }

  function setCalibrationStep(step: 1 | 4) {
    calibrationStep.value = step;
  }

  function recordCalibrationTap() {
    if (!isCalibrating.value || isCalibrationComplete.value) return;
    const rawT = audioEl ? audioEl.currentTime : currentTime.value;
    const prevT =
      draftAnchors.value.length > 0
        ? draftAnchors.value[draftAnchors.value.length - 1].timeSec
        : -0.05;
    const timeSec = Math.round(Math.max(prevT + 0.05, rawT) * 100) / 100;
    draftAnchors.value = normalizeSyncAnchors([
      ...draftAnchors.value,
      { measure: nextTargetMeasure.value, timeSec },
    ]);
  }

  function undoCalibrationTap() {
    if (draftAnchors.value.length === 0) return;
    draftAnchors.value = draftAnchors.value.slice(0, -1);
  }

  function saveCalibration() {
    if (!activeTrack.value || draftAnchors.value.length === 0) return;
    customSyncMaps.value = saveCustomSyncMap({
      trackId: activeTrack.value.id,
      scoreId: sheetStore.currentSheet.id,
      anchors: draftAnchors.value,
    });
    isCalibrating.value = false;
    isSyncHighlightEnabled.value = true;
    lastFrameFingerprint = '';
    if (isPlaying.value) {
      syncOnceAtCurrentTime(true);
      startSyncLoop();
    }
  }

  function resetToBuiltInSync() {
    if (!activeTrack.value) return;
    customSyncMaps.value = deleteCustomSyncMap(activeTrack.value.id, sheetStore.currentSheet.id);
    draftAnchors.value = [];
    isCalibrating.value = false;
    lastFrameFingerprint = '';
    if (isPlaying.value) {
      syncOnceAtCurrentTime(true);
      startSyncLoop();
    }
  }

  async function addLocalFiles(files: FileList) {
    const added: AccompanimentTrack[] = [];
    for (const file of Array.from(files)) {
      const isAudio =
        file.type.startsWith('audio/') || /\.(mp3|m4a|wav|aac|ogg)$/i.test(file.name);
      if (!isAudio) continue;
      const objUrl = URL.createObjectURL(file);
      const track = parseTrackMetadata(file.name, objUrl, true);
      const matched = matchScoreForTrack(track, sheetStore.allScores);
      if (matched) track.matchedScoreId = matched.id;
      added.push(track);
    }
    if (added.length > 0) {
      localTracks.value = [...added, ...localTracks.value];
      await selectTrack(added[0], false);
    }
  }

  function removeLocalTrack(id: string) {
    const target = localTracks.value.find((t) => t.id === id);
    if (target && target.url.startsWith('blob:')) {
      URL.revokeObjectURL(target.url);
    }
    localTracks.value = localTracks.value.filter((t) => t.id !== id);
    if (activeTrack.value?.id === id) {
      pause();
      activeTrack.value = null;
      isAccompanimentMode.value = false;
    }
  }

  function enterAccompanimentMode() {
    stopMetronomePlayback();
    isAccompanimentMode.value = true;
  }

  function exitAccompanimentMode() {
    pause();
    isAccompanimentMode.value = false;
  }

  return {
    localTracks,
    allTracks,
    activeTrack,
    isAccompanimentMode,
    isPlaying,
    isLoadingAudio,
    audioError,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    loopA,
    loopB,
    isSyncHighlightEnabled,
    customSyncMaps,
    activeSyncMap,
    hasBuiltInSyncMap,
    isCalibrating,
    calibrationStep,
    draftAnchors,
    nextTargetMeasure,
    isCalibrationComplete,
    selectTrack,
    play,
    pause,
    togglePlay,
    seek,
    rewind,
    setPlaybackRate,
    setVolume,
    toggleMute,
    toggleLoopPoint,
    clearLoop,
    toggleSyncHighlight,
    startCalibration,
    cancelCalibration,
    setCalibrationStep,
    recordCalibrationTap,
    undoCalibrationTap,
    saveCalibration,
    resetToBuiltInSync,
    addLocalFiles,
    removeLocalTrack,
    enterAccompanimentMode,
    exitAccompanimentMode,
  };
});
