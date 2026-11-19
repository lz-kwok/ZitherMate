<template>
  <div
    class="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div
      class="vh-modal w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden"
      style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;"
    >
      <!-- 顶部 Primary Navy 标题栏 -->
      <header
        class="px-6 py-4 flex items-center justify-between shrink-0"
        style="background-color: #0f172a; color: #ffffff;"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-9 h-9 rounded-[8px] flex items-center justify-center text-lg shrink-0"
            style="background-color: rgba(5, 150, 105, 0.25); color: #86efac;"
          >
            🎧
          </div>
          <div class="min-w-0">
            <h2 class="vh-headline text-lg font-semibold tracking-tight text-white truncate">
              伴奏练习曲库 · MP3 伴奏菜单
            </h2>
            <p class="text-xs text-[#94A3B8] truncate">
              选中内置伴奏即自动联动同名古筝曲谱，支持慢速不变调与 A-B 片段复读
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="w-8 h-8 rounded-[8px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors cursor-pointer shrink-0"
        >
          ✕
        </button>
      </header>

      <!-- 工具条：数量统计 + 导入本地 MP3 -->
      <div
        class="px-6 py-3 border-b border-[#E2E8F0] flex items-center justify-between flex-wrap gap-2"
        style="background-color: #f8fafc;"
      >
        <div class="flex items-center gap-2 text-xs font-medium text-[#64748B]">
          <span>🎵</span>
          <span>
            共 <strong class="vh-mono text-[#0F172A]">{{ accompanimentStore.allTracks.length }}</strong> 首可用伴奏
            （含 <strong class="vh-mono text-[#059669]">{{ builtInCount }}</strong> 首内置目录音频）
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="triggerLocalImport"
            class="vh-btn vh-btn-sm vh-btn-secondary text-xs font-semibold"
            style="border: 1px solid #0F172A; color: #0F172A; border-radius: 8px;"
          >
            <span>📁 导入本地 MP3 伴奏</span>
          </button>
          <input
            ref="audioInputRef"
            type="file"
            accept="audio/mpeg,.mp3,audio/*"
            multiple
            class="hidden"
            @change="handleLocalFiles"
          />
        </div>
      </div>

      <!-- 曲目列表展示区 -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]">
        <div
          v-if="accompanimentStore.allTracks.length === 0"
          class="vh-card p-8 text-center space-y-2"
        >
          <div class="text-3xl">🎧</div>
          <div class="vh-headline text-base font-semibold text-[#0F172A]">暂无可用伴奏文件</div>
          <p class="text-xs text-[#64748B]">
            请将 .mp3 音频放入工程 accompaniment 目录，或点击右上角临时导入本地 MP3。
          </p>
        </div>

        <div
          v-for="track in accompanimentStore.allTracks"
          :key="track.id"
          class="p-5 rounded-[8px] border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 vh-shadow-sm"
          :style="
            accompanimentStore.activeTrack?.id === track.id
              ? {
                  backgroundColor: '#FFFFFF',
                  borderColor: '#059669',
                  boxShadow: '0 0 0 1px #059669, 0 4px 16px rgba(15, 23, 42, 0.07)',
                }
              : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }
          "
        >
          <!-- 曲目信息区 -->
          <div class="space-y-1.5 flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                v-if="track.trackNumber"
                class="vh-chip vh-mono"
                style="background-color: #0F172A; color: #FFFFFF;"
              >
                #{{ track.trackNumber }}
              </span>

              <h3 class="vh-headline text-lg font-semibold text-[#0F172A] tracking-tight">
                {{ track.title }}
              </h3>

              <span v-if="track.tag" class="vh-chip vh-chip-info">
                {{ track.tag }}
              </span>

              <span v-if="track.isLocal" class="vh-chip vh-chip-warning">
                本地导入
              </span>

              <span
                v-if="accompanimentStore.activeTrack?.id === track.id"
                class="vh-chip vh-chip-success"
              >
                ✓ 当前伴奏
              </span>
            </div>

            <div class="flex items-center flex-wrap gap-2 text-xs text-[#64748B]">
              <span class="vh-mono truncate">{{ track.fileName }}</span>
              <span
                v-if="getMatchedScore(track)"
                class="vh-chip vh-chip-success"
              >
                🎼 自动联动曲谱：《{{ getMatchedScore(track)?.title }}》
              </span>
              <span v-else class="text-[11px] text-[#64748B]">
                （未匹配同名简谱，将保留当前谱面）
              </span>
            </div>
          </div>

          <!-- 右侧操作按钮 -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              v-if="track.isLocal"
              type="button"
              @click.stop="accompanimentStore.removeLocalTrack(track.id)"
              class="vh-btn vh-btn-md vh-btn-destructive text-xs font-semibold"
              style="background-color: #EF4444; color: #FFFFFF; border-radius: 8px;"
            >
              🗑️ 移除
            </button>

            <button
              type="button"
              @click="useTrack(track)"
              class="vh-btn vh-btn-md text-xs font-semibold"
              :style="
                accompanimentStore.activeTrack?.id === track.id && accompanimentStore.isPlaying
                  ? { backgroundColor: '#059669', color: '#FFFFFF', borderRadius: '8px' }
                  : { backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '8px' }
              "
            >
              <span>
                {{
                  accompanimentStore.activeTrack?.id === track.id && accompanimentStore.isPlaying
                    ? '🎵 正在伴奏 · 回到练习'
                    : '🎧 使用伴奏开始练习'
                }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AccompanimentTrack,
  builtInAccompaniments,
  matchScoreForTrack,
} from '../../data/accompaniments';
import { useAccompanimentStore } from '../../stores/accompanimentStore';
import { useSheetStore } from '../../stores/sheetStore';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const accompanimentStore = useAccompanimentStore();
const sheetStore = useSheetStore();
const audioInputRef = ref<HTMLInputElement | null>(null);

const builtInCount = computed(() => builtInAccompaniments.length);

function getMatchedScore(track: AccompanimentTrack) {
  return matchScoreForTrack(track, sheetStore.allScores);
}

function triggerLocalImport() {
  audioInputRef.value?.click();
}

async function handleLocalFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    await accompanimentStore.addLocalFiles(input.files);
    input.value = '';
  }
}

async function useTrack(track: AccompanimentTrack) {
  if (accompanimentStore.activeTrack?.id === track.id && accompanimentStore.isPlaying) {
    accompanimentStore.enterAccompanimentMode();
    emit('close');
    return;
  }
  await accompanimentStore.selectTrack(track, true);
  emit('close');
}
</script>
