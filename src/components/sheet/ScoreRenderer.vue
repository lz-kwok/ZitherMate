<template>
  <div class="w-full">
    <!-- 乐谱卡片容器 (Verdana Health: #FFFFFF 表面 + 1px #E2E8F0 + 8px 圆角 + md 弥散阴影 + 24px/32px 内边距) -->
    <div
      class="bg-white rounded-[8px] border border-[#E2E8F0] vh-shadow-md p-6 md:p-8 text-[#0F172A] relative overflow-hidden"
      style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;"
    >
      <!-- 1. 乐谱标题与副标题 (Plus Jakarta Sans / #0F172A + #64748B) -->
      <div class="text-center mb-6">
        <h1 class="vh-headline text-3xl md:text-4xl font-bold tracking-[0.2em] text-[#0F172A] mb-2">
          {{ store.currentSheet.title }}
        </h1>
        <p v-if="store.currentSheet.subtitle" class="text-sm text-[#64748B] font-normal">
          {{ store.currentSheet.subtitle }}
        </p>
      </div>

      <!-- 2. 标准乐谱头部信息区 (Fira Code 数值 + Filter Chips 多声部切换) -->
      <div class="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-6 select-none">
        <!-- 左侧：调号、拍号、节拍器速度、表情术语 -->
        <div class="space-y-1.5">
          <div class="vh-mono flex items-baseline gap-4 text-xl md:text-2xl font-bold text-[#0F172A]">
            <span>{{ store.currentSheet.key }}</span>
            <span class="tracking-tight">{{ store.currentSheet.timeSignature[0] }}/{{ store.currentSheet.timeSignature[1] }}</span>
          </div>

          <div class="vh-mono flex items-center gap-2 text-sm md:text-base font-semibold text-[#0F172A]">
            <span class="text-xl leading-none font-sans">{{ store.beatUnitSymbol }}</span>
            <span>=</span>
            <span>{{ store.bpm }}</span>
          </div>

          <div v-if="store.currentSheet.expression" class="text-xs md:text-sm font-medium text-[#64748B]">
            {{ store.currentSheet.expression }}
          </div>
        </div>

        <!-- 中部：多声部切换 Filter Chips (4px 圆角, Active #0F172A) -->
        <div v-if="hasMultipleParts" class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            @click="store.setSelectedPartId('all')"
            class="vh-chip transition-all cursor-pointer"
            :class="store.selectedPartId === 'all' ? 'vh-chip-filter-active' : 'vh-chip-filter hover:border-[#0F172A]'"
            :style="
              store.selectedPartId === 'all'
                ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
            "
          >
            🎼 合奏双行对照
          </button>
          <button
            type="button"
            v-for="part in store.currentSheet.parts"
            :key="part.id"
            @click="store.setSelectedPartId(part.id)"
            class="vh-chip transition-all cursor-pointer"
            :class="store.selectedPartId === part.id ? 'vh-chip-filter-active' : 'vh-chip-filter hover:border-[#0F172A]'"
            :style="
              store.selectedPartId === part.id
                ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
            "
          >
            🪕 {{ part.name }}
          </button>
        </div>

        <!-- 右侧：作曲与改编者信息 -->
        <div class="text-right text-xs md:text-sm font-medium text-[#64748B] leading-relaxed">
          <div v-if="store.currentSheet.author">{{ store.currentSheet.author }}</div>
        </div>
      </div>

      <!-- 2.5 儿童古筝「起手式」引导卡 + 预备拍悬浮横幅 -->
      <StartingPostureGuide />

      <!-- 3. 曲谱主体展示区 -->
      <!-- 模式 A: 重奏双声部合奏排版 -->
      <div
        v-if="hasMultipleParts && store.selectedPartId === 'all'"
        class="space-y-10 pb-8"
        :class="{ 'standby-first-note': !store.isPlaying || store.isPreBeat }"
      >
        <div
          v-for="(rowMeasures, rIdx) in measureRows"
          :key="`duet-row-${rIdx}`"
          class="relative"
        >
          <!-- 引子领唱旋律 -->
          <div
            v-if="store.currentSheet.introMelody && rIdx < 2"
            class="flex items-center text-xs md:text-sm text-[#64748B] vh-mono font-semibold pl-16 md:pl-20 mb-1.5"
          >
            <div
              v-for="(inMeasure, inIdx) in getIntroRowMeasures(rIdx)"
              :key="`in-${inMeasure.measureNumber}`"
              class="flex-1 min-w-0 flex items-center justify-around px-1"
            >
              <span v-if="inMeasure.measureNumber === 1" class="text-base text-[#64748B] mr-0.5">(</span>
              <span
                v-for="inNote in inMeasure.notes"
                :key="inNote.id"
                :id="`note-${inNote.id}`"
                @click="handleNoteClick(inNote, getGlobalMeasureIndex(rIdx, inIdx))"
                class="inline-flex flex-col items-center px-1.5 py-0.5 rounded-[4px] cursor-pointer transition-all"
                :style="
                  store.isPlaying && !store.isPreBeat && store.currentNoteId === inNote.id
                    ? { backgroundColor: 'rgba(5, 150, 105, 0.14)', color: '#059669', boxShadow: '0 0 0 2px #059669' }
                    : undefined
                "
              >
                <span class="h-1 flex items-center justify-center">
                  <span v-if="inNote.octave >= 1" class="w-1 h-1 rounded-full bg-current" />
                </span>
                <span class="leading-none flex items-center">
                  <span>{{ inNote.pitch }}</span>
                  <span v-if="inNote.dot" class="ml-0.5">.</span>
                  <span v-if="inNote.duration >= 2" class="ml-1">-</span>
                </span>
              </span>
              <span v-if="inMeasure.measureNumber === 8" class="text-base text-[#64748B] ml-0.5">)</span>
            </div>
          </div>

          <!-- 双声部大行容器 -->
          <div class="flex items-stretch w-full min-w-0">
            <div class="w-16 md:w-20 shrink-0 flex flex-col justify-around py-2 pr-2 border-r-2 border-[#0F172A] text-xs md:text-sm font-semibold text-[#0F172A] select-none relative">
              <div class="absolute -left-1 top-2 bottom-2 w-2 border-l-2 border-t-2 border-b-2 border-[#0F172A] rounded-l-[2px]" />
              <div class="pl-2">古筝 I</div>
              <div class="pl-2">古筝 II</div>
            </div>

            <div class="flex-1 min-w-0 flex flex-col divide-y divide-[#E2E8F0]">
              <div class="flex items-stretch w-full min-w-0">
                <MeasureView
                  v-for="(measure, mIdx) in rowMeasures"
                  :key="`p1-m-${measure.measureNumber}`"
                  :measure="measure"
                  :measure-index="getGlobalMeasureIndex(rIdx, mIdx)"
                  :is-current-measure="store.currentMeasureIndex === getGlobalMeasureIndex(rIdx, mIdx) && store.isPlaying && !store.isPreBeat"
                  :is-in-loop-range="isInLoop(measure.measureNumber)"
                  :active-note-id="highlightedNoteId"
                  style="flex: 1 1 0%;"
                  @note-click="(note) => handleNoteClick(note, getGlobalMeasureIndex(rIdx, mIdx))"
                  @toggle-loop="(mNum) => store.toggleLoop(mNum)"
                />
              </div>

              <div class="flex items-stretch w-full min-w-0">
                <MeasureView
                  v-for="(measure, mIdx) in getPart2RowMeasures(rIdx)"
                  :key="`p2-m-${measure.measureNumber}`"
                  :measure="measure"
                  :measure-index="getGlobalMeasureIndex(rIdx, mIdx)"
                  :is-current-measure="store.currentMeasureIndex === getGlobalMeasureIndex(rIdx, mIdx) && store.isPlaying && !store.isPreBeat"
                  :is-in-loop-range="isInLoop(measure.measureNumber)"
                  :active-note-id="highlightedNoteId"
                  style="flex: 1 1 0%;"
                  @note-click="(note) => handleNoteClick(note, getGlobalMeasureIndex(rIdx, mIdx))"
                  @toggle-loop="(mNum) => store.toggleLoop(mNum)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 模式 B: 单声部精简专注排版 -->
      <div
        v-else
        class="space-y-8 pb-8"
        :class="{ 'standby-first-note': !store.isPlaying || store.isPreBeat }"
      >
        <div
          v-for="(rowMeasures, rIdx) in activeMeasureRows"
          :key="`single-row-${rIdx}`"
          class="flex items-stretch w-full min-w-0 border-l border-[#0F172A]"
        >
          <MeasureView
            v-for="(measure, mIdx) in rowMeasures"
            :key="measure.measureNumber"
            :measure="measure"
            :measure-index="getGlobalMeasureIndex(rIdx, mIdx)"
            :is-current-measure="store.currentMeasureIndex === getGlobalMeasureIndex(rIdx, mIdx) && store.isPlaying && !store.isPreBeat"
            :is-in-loop-range="isInLoop(measure.measureNumber)"
            :active-note-id="highlightedNoteId"
            :style="{ flex: `${Math.max(3, measure.notes.length)} 1 0%` }"
            @note-click="(note) => handleNoteClick(note, getGlobalMeasureIndex(rIdx, mIdx))"
            @toggle-loop="(mNum) => store.toggleLoop(mNum)"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSheetStore } from '../../stores/sheetStore';
import { Measure, Note } from '../../types/music';
import MeasureView from './MeasureView.vue';
import StartingPostureGuide, { extractStartingPosture } from './StartingPostureGuide.vue';
import { guzhengSynth } from '../../engine/GuzhengAudioSynth';

const store = useSheetStore();

const startingPosture = computed(() =>
  extractStartingPosture(store.currentSheet, store.selectedPartId, store.loopRange)
);

const highlightedNoteId = computed(() => {
  if (store.isPlaying && !store.isPreBeat) {
    return store.currentNoteId;
  }
  return startingPosture.value?.note.id ?? null;
});

function handleNoteClick(note: Note, measureIndex: number) {
  guzhengSynth.playNote(note, 0, store.currentSheet.key);
  store.openNoteEditor(note, measureIndex);
}

const MEASURES_PER_ROW = 4;

const hasMultipleParts = computed(() => {
  return !!store.currentSheet.parts && store.currentSheet.parts.length > 1;
});

const measureRows = computed(() => {
  const rows: Measure[][] = [];
  const allMeasures = store.currentSheet.measures;
  for (let i = 0; i < allMeasures.length; i += MEASURES_PER_ROW) {
    rows.push(allMeasures.slice(i, i + MEASURES_PER_ROW));
  }
  return rows;
});

const activeMeasureRows = computed(() => {
  let measures = store.currentSheet.measures;
  if (store.selectedPartId !== 'all' && store.currentSheet.parts) {
    const part = store.currentSheet.parts.find((p) => p.id === store.selectedPartId);
    if (part) {
      measures = part.measures;
    }
  }
  const rows: Measure[][] = [];
  for (let i = 0; i < measures.length; i += MEASURES_PER_ROW) {
    rows.push(measures.slice(i, i + MEASURES_PER_ROW));
  }
  return rows;
});

function getPart2RowMeasures(rowIndex: number): Measure[] {
  const p2 = store.currentSheet.parts?.[1];
  if (!p2) return [];
  const start = rowIndex * MEASURES_PER_ROW;
  return p2.measures.slice(start, start + MEASURES_PER_ROW);
}

function getIntroRowMeasures(rowIndex: number): Measure[] {
  const intro = store.currentSheet.introMelody || [];
  const start = rowIndex * MEASURES_PER_ROW;
  return intro.slice(start, start + MEASURES_PER_ROW);
}

function getGlobalMeasureIndex(rowIndex: number, colIndex: number): number {
  return rowIndex * MEASURES_PER_ROW + colIndex;
}

function isInLoop(measureNumber: number): boolean {
  if (!store.loopRange) return false;
  return measureNumber >= store.loopRange.start && measureNumber <= store.loopRange.end;
}
</script>

<style scoped>
.standby-first-note :deep([id^="note-"].ring-2) {
  background-color: rgba(34, 197, 94, 0.12) !important;
  color: #059669 !important;
  box-shadow: 0 0 0 2px #059669 !important;
}

.standby-first-note :deep([id^="note-"].ring-2 .animate-bounce) {
  background-color: #059669 !important;
}
</style>
