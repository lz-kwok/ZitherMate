<template>
  <div
    class="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E2E8F0] vh-shadow-lg px-4 py-3"
    style="background-color: #ffffff; border-top: 1px solid #e2e8f0;"
  >
    <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 md:gap-4">
      
      <!-- 1. 左侧：48px lg Sage/Destructive 起手伴练按钮 + 状态标签 -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          aria-label="播放或暂停"
          class="vh-btn vh-btn-lg shrink-0 font-semibold"
          :style="
            store.isPlaying
              ? { backgroundColor: '#EF4444', color: '#FFFFFF', borderRadius: '8px', height: '48px', padding: '12px 24px' }
              : { backgroundColor: '#059669', color: '#FFFFFF', borderRadius: '8px', height: '48px', padding: '12px 24px' }
          "
          @click="togglePlay"
        >
          <svg
            v-if="!store.isPlaying"
            class="w-5 h-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path d="M5 4v16l10-8L5 4z" fill="currentColor" />
            <path d="M17.5 6.5c1.5 1.8 1.5 9.2 0 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <path d="M20.5 9c1 1.2 1 4.8 0 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <svg
            v-else
            class="w-5 h-5 shrink-0 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
          <span>{{ store.isPlaying ? '暂停' : '开始' }}</span>
        </button>

        <!-- 状态文本 + Status Success/Info Chips -->
        <div class="flex flex-col min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="vh-headline text-sm font-semibold text-[#0F172A]">
              {{
                store.isPlaying
                  ? (store.isPreBeat ? '🙌 预备拍 · 摆好起手式...' : (store.soundMode === 'guzheng' ? '🪕 正在聆听古筝原声' : '🎼 伴练跟弹中'))
                  : '准备就绪'
              }}
            </span>
            <span
              v-if="startingPosture && (!store.isPlaying || store.isPreBeat)"
              class="vh-chip vh-chip-success vh-mono truncate max-w-[14rem] sm:max-w-xs"
              :title="`起手找弦：${startingPosture.primaryString.relativeDesc}，${startingPosture.fingerTitle}`"
            >
              <span>🙌</span>
              <span class="truncate">{{ startingPosture.compactBadgeText }}</span>
            </span>
            <span
              v-if="store.loopRange"
              class="vh-chip vh-chip-info vh-mono"
            >
              <span>第{{ store.loopRange.start }}-{{ store.loopRange.end }}小节循环</span>
              <button
                type="button"
                class="hover:opacity-75 font-bold ml-0.5"
                @click.stop="store.loopRange = null"
                title="取消循环"
              >
                ✕
              </button>
            </span>
          </div>
          <span class="text-xs text-[#64748B] mt-0.5">
            {{
              store.isPlaying
                ? (store.isPreBeat ? '小手像握小鸡蛋搭好首音弦，马上开弹' : '视线跟随音符跳动光点')
                : '小手握“小鸡蛋”搭好起手弦，点击开始跟拍'
            }}
          </span>
        </div>
      </div>

      <!-- 2. 中间：节拍基准、Fira Code 调速器与发声选择 (#F8FAFC 容器 + Navy #0F172A 激活) -->
      <div class="flex flex-wrap items-center gap-2.5 md:gap-3">
        
        <!-- A. 节拍基准音符 (♩ / ♪ / ♩.) -->
        <div
          class="flex items-center p-1 rounded-[8px] border border-[#E2E8F0] gap-1"
          style="background-color: #f8fafc;"
        >
          <button
            v-for="unit in [
              { key: 'quarter', symbol: '♩', label: '四分' },
              { key: 'eighth', symbol: '♪', label: '八分' },
              { key: 'dotted-quarter', symbol: '♩.', label: '附点' }
            ]"
            :key="unit.key"
            type="button"
            class="px-2.5 py-1.5 rounded-[4px] font-medium transition-all text-xs flex items-center gap-1 cursor-pointer"
            :style="
              store.beatUnit === unit.key
                ? { backgroundColor: '#0F172A', color: '#FFFFFF' }
                : { backgroundColor: 'transparent', color: '#64748B' }
            "
            @click="selectBeatUnit(unit.key as BeatUnit)"
            :title="`以${unit.label}音符为一拍打拍（四分音符与八分音符打拍声不同）`"
          >
            <span class="text-base leading-none">{{ unit.symbol }}</span>
            <span class="hidden sm:inline text-[11px]">{{ unit.label }}</span>
          </button>
        </div>

        <!-- B. 速度步进与 Fira Code 展示 -->
        <div
          class="flex items-center p-1 rounded-[8px] border border-[#E2E8F0] gap-1"
          style="background-color: #f8fafc;"
        >
          <button
            type="button"
            class="w-8 h-8 rounded-[8px] bg-white border border-[#E2E8F0] hover:border-[#0F172A] text-[#0F172A] font-bold flex items-center justify-center transition-colors cursor-pointer"
            @click="changeBpm(store.bpm - 2)"
          >
            -
          </button>
          
          <div class="vh-mono px-2.5 text-center flex items-center gap-1 text-[#0F172A]" style="min-width: 4.5rem;">
            <span class="text-base font-bold font-sans">{{ store.beatUnitSymbol }}</span>
            <span class="text-xs text-[#64748B]">=</span>
            <span class="text-base font-bold">{{ store.bpm }}</span>
          </div>

          <button
            type="button"
            class="w-8 h-8 rounded-[8px] bg-white border border-[#E2E8F0] hover:border-[#0F172A] text-[#0F172A] font-bold flex items-center justify-center transition-colors cursor-pointer"
            @click="changeBpm(store.bpm + 2)"
          >
            +
          </button>
        </div>

        <!-- C. 发声模式选择器 (激活态 Primary Navy #0F172A) -->
        <div
          class="flex items-center p-1 rounded-[8px] border border-[#E2E8F0] gap-1"
          style="background-color: #f8fafc;"
        >
          <button
            v-for="mode in [
              { key: 'both', label: '节拍+原声', icon: '🎼', title: '边打节拍边播放古筝示范原声' },
              { key: 'guzheng', label: '聆听原声', icon: '🪕', title: '关闭打拍声，仅聆听纯净古筝原声示范' },
              { key: 'metronome', label: '仅节拍器', icon: '⏱️', title: '清脆滴滴节拍器，无原声干扰' }
            ]"
            :key="mode.key"
            type="button"
            class="px-2.5 py-1.5 rounded-[4px] font-medium transition-all text-xs flex items-center gap-1.5 cursor-pointer"
            :style="
              store.soundMode === mode.key
                ? { backgroundColor: '#0F172A', color: '#FFFFFF' }
                : { backgroundColor: 'transparent', color: '#64748B' }
            "
            @click="store.setSoundMode(mode.key as any)"
            :title="mode.title"
          >
            <span class="text-sm leading-none">{{ mode.icon }}</span>
            <span class="text-xs">{{ mode.label }}</span>
          </button>
        </div>
      </div>

      <!-- 3. 右侧：回滚顶部快捷按钮 -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="w-10 h-10 rounded-[8px] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] flex items-center justify-center transition-colors cursor-pointer"
          @click="autoScroller.resetToTop()"
          title="回滚到谱面顶部"
        >
          <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useSheetStore } from '../../stores/sheetStore';
import { BeatUnit } from '../../types/music';
import { metronome } from '../../engine/MetronomeEngine';
import { autoScroller } from '../../engine/AutoScroller';
import { extractStartingPosture } from '../sheet/StartingPostureGuide.vue';

const store = useSheetStore();

const startingPosture = computed(() =>
  extractStartingPosture(store.currentSheet, store.selectedPartId, store.loopRange)
);

watch(
  () => store.soundMode,
  (newMode) => {
    metronome.setSoundMode(newMode);
  }
);

watch(
  () => store.guzhengVolume,
  (vol) => {
    metronome.setGuzhengVolume(vol);
  }
);

watch(
  () => store.metronomeVolume,
  (vol) => {
    metronome.setMetronomeVolume(vol);
  }
);

watch(
  () => store.selectedPartId,
  (newPartId) => {
    if (store.isPlaying) {
      metronome.stop();
      metronome.prepareTimeline(store.currentSheet, store.loopRange, newPartId, store.beatUnit);
      metronome.start(store.bpm, store.beatUnit, false, store.soundMode);
    }
  }
);

watch(
  () => store.currentSheet,
  () => {
    metronome.stop();
  }
);

watch(
  [() => store.bpm, () => store.beatUnit],
  ([newBpm, newUnit]) => {
    metronome.updateBpm(newBpm, newUnit);
  }
);

function selectBeatUnit(unit: BeatUnit) {
  store.setBeatUnit(unit);
  metronome.previewBeatUnitSound(unit);
}

function startPlayback(withPreBeat: boolean) {
  metronome.prepareTimeline(store.currentSheet, store.loopRange, store.selectedPartId, store.beatUnit);

  metronome.onPreBeatTick = (count) => {
    store.isPreBeat = true;
    store.preBeatCount = count;
  };

  metronome.onNoteTrigger = (note, measureIdx, partId) => {
    store.isPreBeat = false;
    store.setActiveNote(note.id, measureIdx, partId, note);
    autoScroller.scrollToActiveNote(note.id);
  };

  metronome.onPlayEnd = () => {
    if (store.loopRange) {
      startPlayback(false);
    } else {
      store.markCurrentScoreMastered();
      store.setPlaying(false);
    }
  };

  store.setPlaying(true);
  metronome.start(store.bpm, store.beatUnit, withPreBeat, store.soundMode);
}

function togglePlay() {
  if (store.isPlaying) {
    metronome.stop();
    store.setPlaying(false);
  } else {
    startPlayback(true);
  }
}

function changeBpm(newBpm: number) {
  store.setBpm(newBpm);
  metronome.updateBpm(store.bpm, store.beatUnit);
}
</script>
