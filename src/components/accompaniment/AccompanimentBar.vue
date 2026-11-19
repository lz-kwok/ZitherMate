<template>
  <div
    class="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E2E8F0] vh-shadow-lg px-4 py-3"
    style="background-color: #ffffff; border-top: 1px solid #e2e8f0;"
  >
    <div class="max-w-7xl mx-auto flex flex-col gap-2.5">
      <!-- 零门槛敲拍对齐打点面板 (Tap-to-Sync) -->
      <div
        v-if="store.isCalibrating"
        class="rounded-[8px] border border-[#059669] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5"
        style="background-color: #f0fdf4;"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="vh-chip" style="background-color: #0F172A; color: #FFFFFF;">
            🎯 敲拍对齐打点
          </span>

          <!-- 步进模式 -->
          <div class="flex items-center p-0.5 rounded-[6px] border border-[#CBD5E1] bg-white gap-0.5">
            <button
              type="button"
              @click="store.setCalibrationStep(4)"
              class="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold cursor-pointer transition-colors"
              :style="
                store.calibrationStep === 4
                  ? { backgroundColor: '#0F172A', color: '#FFFFFF' }
                  : { color: '#64748B' }
              "
            >
              行首 (+4小节)
            </button>
            <button
              type="button"
              @click="store.setCalibrationStep(1)"
              class="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold cursor-pointer transition-colors"
              :style="
                store.calibrationStep === 1
                  ? { backgroundColor: '#0F172A', color: '#FFFFFF' }
                  : { color: '#64748B' }
              "
            >
              逐小节 (+1)
            </button>
          </div>

          <span class="vh-mono text-[11px] font-medium text-[#065F46]">
            已打点 {{ store.draftAnchors.length }} 处
            <template v-if="lastAnchor">
              （最近: M{{ lastAnchor.measure }} @ {{ lastAnchor.timeSec.toFixed(2) }}s）
            </template>
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            :disabled="store.isCalibrationComplete"
            @click="store.recordCalibrationTap()"
            class="vh-btn vh-btn-sm font-semibold cursor-pointer"
            style="background-color: #059669; color: #FFFFFF; border-radius: 8px;"
          >
            <span v-if="!store.isCalibrationComplete">
              👇 敲击记录 {{ nextTargetLabel }} (空格)
            </span>
            <span v-else>✅ 全曲打点已满，请保存</span>
          </button>

          <button
            type="button"
            :disabled="store.draftAnchors.length === 0"
            @click="store.undoCalibrationTap()"
            class="vh-btn vh-btn-sm vh-btn-ghost border border-[#CBD5E1] bg-white text-xs"
          >
            ↩ 撤销
          </button>

          <button
            type="button"
            :disabled="store.draftAnchors.length === 0"
            @click="store.saveCalibration()"
            class="vh-btn vh-btn-sm vh-btn-primary text-xs font-semibold"
            style="background-color: #0F172A; color: #FFFFFF; border-radius: 8px;"
          >
            💾 保存对齐
          </button>

          <button
            v-if="store.hasBuiltInSyncMap"
            type="button"
            @click="store.resetToBuiltInSync()"
            class="px-2 py-1 text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          >
            恢复内置
          </button>

          <button
            type="button"
            @click="store.cancelCalibration()"
            class="px-2 py-1 text-xs font-bold text-[#64748B] hover:text-[#EF4444] cursor-pointer"
            title="退出打点模式"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- 第一行：播放控制 + 进度条与 A-B 复读指示 -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            aria-label="播放或暂停伴奏"
            class="vh-btn vh-btn-lg shrink-0 font-semibold"
            :style="
              store.isPlaying
                ? { backgroundColor: '#EF4444', color: '#FFFFFF', borderRadius: '8px', height: '44px', padding: '10px 20px' }
                : { backgroundColor: '#059669', color: '#FFFFFF', borderRadius: '8px', height: '44px', padding: '10px 20px' }
            "
            @click="store.togglePlay()"
          >
            <svg v-if="!store.isPlaying" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg v-else class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            <span class="text-sm">{{ store.isPlaying ? '暂停' : '伴奏' }}</span>
          </button>

          <button
            type="button"
            @click="store.rewind(5)"
            class="h-[44px] px-3 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#0F172A] text-[#0F172A] text-xs font-semibold vh-mono transition-colors cursor-pointer"
            title="回退 5 秒重练本句"
          >
            ↺ -5s
          </button>
        </div>

        <div class="flex-1 min-w-[200px] flex flex-col gap-1">
          <div class="flex items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2 min-w-0">
              <span class="vh-chip vh-chip-success shrink-0">🎧 伴奏模式</span>
              <span class="vh-headline font-semibold text-[#0F172A] truncate">
                {{ store.activeTrack ? store.activeTrack.title : '未选择伴奏' }}
              </span>
              <span v-if="store.activeTrack?.tag" class="text-[11px] text-[#64748B] shrink-0">
                ({{ store.activeTrack.tag }})
              </span>
              <span v-if="store.isLoadingAudio" class="text-[11px] text-[#0EA5E9] font-medium shrink-0">
                音频缓冲中...
              </span>
              <span v-if="store.audioError" class="text-[11px] text-[#EF4444] font-medium truncate">
                {{ store.audioError }}
              </span>
            </div>

            <div class="vh-mono text-xs font-semibold text-[#0F172A] shrink-0">
              {{ formatSec(store.currentTime) }} / {{ formatSec(store.duration) }}
            </div>
          </div>

          <!-- 自定义高亮进度条 -->
          <div class="relative h-5 flex items-center">
            <div class="w-full h-2 rounded-full bg-[#E2E8F0] relative overflow-hidden">
              <div
                v-if="loopRangePercent"
                class="absolute top-0 bottom-0"
                :style="loopRangePercent"
              />
              <div
                class="h-full rounded-full transition-all duration-100"
                style="background-color: #059669;"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>

            <input
              type="range"
              :min="0"
              :max="Math.max(1, store.duration)"
              step="0.1"
              :value="store.currentTime"
              @input="onSeekInput"
              aria-label="伴奏播放进度"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <!-- 第二行：变速不变调 + 联动高显/打点 + A-B 复读 + 音量 + 换曲/切回节拍 -->
      <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F1F5F9]">
        <!-- A. 变速不变调档位 -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[11px] font-medium text-[#64748B]">变速:</span>
          <div
            class="flex items-center p-0.5 rounded-[8px] border border-[#E2E8F0] gap-0.5"
            style="background-color: #f8fafc;"
          >
            <button
              v-for="rate in PLAYBACK_SPEED_OPTIONS"
              :key="rate"
              type="button"
              @click="store.setPlaybackRate(rate)"
              class="vh-mono px-2 py-1 rounded-[4px] text-[11px] font-semibold transition-all cursor-pointer"
              :style="
                store.playbackRate === rate
                  ? { backgroundColor: '#0F172A', color: '#FFFFFF' }
                  : { backgroundColor: 'transparent', color: '#64748B' }
              "
            >
              {{ rate }}x
            </button>
          </div>

          <!-- 谱面高显联动开关 + 打点校准入口 -->
          <button
            v-if="store.activeSyncMap"
            type="button"
            @click="store.toggleSyncHighlight()"
            class="px-2.5 py-1 rounded-[8px] text-xs font-semibold border transition-all cursor-pointer"
            :style="
              store.isSyncHighlightEnabled
                ? { backgroundColor: 'rgba(34, 197, 94, 0.14)', color: '#16A34A', borderColor: '#22C55E' }
                : { backgroundColor: '#F8FAFC', color: '#64748B', borderColor: '#E2E8F0' }
            "
            title="播放伴奏时同步高显简谱音符并亮起右侧 21 弦"
          >
            {{ store.isSyncHighlightEnabled ? '✨ 谱面高显已联动' : '✨ 开启谱面高显' }}
          </button>

          <button
            type="button"
            @click="toggleCalibrationPanel()"
            class="px-2.5 py-1 rounded-[8px] text-xs font-semibold border transition-all cursor-pointer"
            :style="
              store.isCalibrating
                ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
            "
            title="边听伴奏边点击或按空格键记录小节时间锚点"
          >
            {{ store.activeSyncMap ? '🎯 微调打点' : '🎯 敲拍对齐曲谱' }}
          </button>
        </div>

        <!-- B. A-B 片段复读 -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="store.toggleLoopPoint()"
            class="px-3 py-1 rounded-[8px] text-xs font-semibold border transition-all cursor-pointer vh-mono"
            :style="
              store.loopA !== null && store.loopB !== null
                ? { backgroundColor: '#0EA5E9', color: '#FFFFFF', borderColor: '#0EA5E9' }
                : store.loopA !== null
                ? { backgroundColor: 'rgba(14, 165, 233, 0.12)', color: '#0284C7', borderColor: '#0EA5E9' }
                : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
            "
          >
            <template v-if="store.loopA === null">🔁 设 A 点</template>
            <template v-else-if="store.loopB === null">
              🔁 A={{ formatSec(store.loopA) }} · 点设 B 点
            </template>
            <template v-else>
              🔁 {{ formatSec(store.loopA) }}~{{ formatSec(store.loopB) }} · 清除
            </template>
          </button>

          <button
            v-if="store.loopA !== null && store.loopB === null"
            type="button"
            @click="store.clearLoop()"
            class="text-xs text-[#64748B] hover:text-[#EF4444] cursor-pointer"
          >
            取消
          </button>
        </div>

        <!-- C. 音量 + 换曲 + 切回节拍模式 -->
        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-2 py-1">
            <button
              type="button"
              @click="store.toggleMute()"
              class="text-sm cursor-pointer"
              :title="store.isMuted ? '取消静音' : '静音'"
            >
              {{ store.isMuted || store.volume === 0 ? '🔇' : '🔊' }}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="store.isMuted ? 0 : store.volume"
              @input="onVolumeInput"
              aria-label="伴奏音量"
              class="w-16 accent-[#059669] cursor-pointer"
            />
          </div>

          <button
            type="button"
            @click="$emit('open-modal')"
            class="vh-btn vh-btn-sm vh-btn-secondary text-xs font-semibold"
            style="border: 1px solid #0F172A; color: #0F172A; border-radius: 8px;"
          >
            🎧 换伴奏
          </button>

          <button
            type="button"
            @click="store.exitAccompanimentMode()"
            class="vh-btn vh-btn-sm vh-btn-ghost text-xs font-semibold border border-[#E2E8F0]"
            style="color: #475569; border-radius: 8px;"
          >
            🎼 切回节拍
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { PLAYBACK_SPEED_OPTIONS, useAccompanimentStore } from '../../stores/accompanimentStore';
import { useSheetStore } from '../../stores/sheetStore';

defineEmits<{
  (e: 'open-modal'): void;
}>();

const store = useAccompanimentStore();
const sheetStore = useSheetStore();

const lastAnchor = computed(() =>
  store.draftAnchors.length > 0 ? store.draftAnchors[store.draftAnchors.length - 1] : null
);

const nextTargetLabel = computed(() => {
  const total = sheetStore.currentSheet.measures.length;
  return store.nextTargetMeasure > total
    ? '结束位置'
    : `第 ${store.nextTargetMeasure} 小节`;
});

const progressPercent = computed(() => {
  if (!store.duration || store.duration <= 0) return 0;
  return Math.max(0, Math.min(100, (store.currentTime / store.duration) * 100));
});

const loopRangePercent = computed(() => {
  if (!store.duration || store.duration <= 0 || store.loopA === null) return null;
  const startPct = Math.max(0, Math.min(100, (store.loopA / store.duration) * 100));
  const endPct =
    store.loopB !== null
      ? Math.max(startPct, Math.min(100, (store.loopB / store.duration) * 100))
      : Math.min(100, startPct + 1.2);
  return {
    left: `${startPct}%`,
    width: `${Math.max(0.8, endPct - startPct)}%`,
    backgroundColor: 'rgba(14, 165, 233, 0.35)',
  };
});

function formatSec(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const total = Math.floor(sec);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function toggleCalibrationPanel() {
  if (store.isCalibrating) {
    store.cancelCalibration();
  } else {
    store.startCalibration();
  }
}

function onSeekInput(event: Event) {
  const val = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(val)) {
    store.seek(val);
  }
}

function onVolumeInput(event: Event) {
  const val = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(val)) {
    store.setVolume(val);
  }
}

function onGlobalKeyDown(event: KeyboardEvent) {
  if (!store.isCalibrating || event.code !== 'Space') return;
  const tag = (event.target as HTMLElement | null)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  event.preventDefault();
  store.recordCalibrationTap();
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeyDown);
});
</script>
