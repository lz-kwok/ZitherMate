<template>
  <div
    :id="`measure-${measure.measureNumber}`"
    class="relative flex-1 min-w-0 flex items-center justify-between px-1 sm:px-2 py-2.5 transition-all duration-150 select-none group border-r border-[#0F172A]"
    :style="
      isCurrentMeasure
        ? { backgroundColor: 'rgba(5, 150, 105, 0.06)', borderRadius: '4px', minHeight: '5.8rem' }
        : isInLoopRange
        ? { backgroundColor: 'rgba(14, 165, 233, 0.07)', borderRadius: '4px', minHeight: '5.8rem' }
        : { minHeight: '5.8rem' }
    "
  >
    <!-- 常规方框小节号 (4px sm 圆角，Fira Code 等宽字体，循环态 Info #0EA5E9) -->
    <div
      v-if="measure.showBoxNumber || isInLoopRange"
      class="vh-mono absolute -top-3.5 left-1 px-1.5 py-0.5 rounded-[4px] border text-[11px] font-bold tracking-tight vh-shadow-sm z-10 cursor-pointer flex items-center gap-0.5"
      :style="
        isInLoopRange
          ? { backgroundColor: '#0EA5E9', color: '#FFFFFF', borderColor: '#0EA5E9' }
          : { backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#0F172A' }
      "
      @click.stop="$emit('toggle-loop', measure.measureNumber)"
      title="点击切换段落慢练循环"
    >
      <span>{{ measure.measureNumber }}</span>
      <span v-if="isInLoopRange" class="text-[9px]">🔁</span>
    </div>

    <!-- 小节序号轻触控热区 -->
    <button
      type="button"
      v-else
      class="vh-mono absolute -top-3 left-1 opacity-0 group-hover:opacity-100 px-1.5 text-[10px] text-[#64748B] bg-white border border-[#E2E8F0] rounded-[4px] transition-opacity"
      @click.stop="$emit('toggle-loop', measure.measureNumber)"
    >
      #{{ measure.measureNumber }}
    </button>

    <!-- 小节内音符流式排版 -->
    <div class="flex items-center justify-around w-full min-w-0 px-0.5 gap-0.5">
      <NoteView
        v-for="note in measure.notes"
        :key="note.id"
        :note="note"
        :is-active="activeNoteId === note.id"
        @click="$emit('note-click', note)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Measure, Note } from '../../types/music';
import NoteView from './NoteView.vue';

defineProps<{
  measure: Measure;
  measureIndex: number;
  isCurrentMeasure: boolean;
  isInLoopRange: boolean;
  activeNoteId: string | null;
}>();

defineEmits<{
  (e: 'note-click', note: Note): void;
  (e: 'toggle-loop', measureNumber: number): void;
}>();
</script>
