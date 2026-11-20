<template>
  <div
    :id="`note-${note.id}`"
    @click="$emit('click')"
    class="relative inline-flex flex-col items-center justify-end px-0.5 sm:px-1 py-1 mx-0 rounded-[8px] transition-all duration-150 cursor-pointer select-none min-w-0"
    :class="[
      isActive
        ? 'ring-2 shadow-xs note-active'
        : 'hover:bg-[#F8FAFC] text-[#0F172A]',
      note.duration >= 4
        ? 'flex-[2] max-w-[6.5rem]'
        : note.duration >= 2
        ? 'flex-[1.5] max-w-[4.5rem]'
        : 'flex-1 max-w-[3.2rem]'
    ]"
    :style="
      isActive
        ? { backgroundColor: 'rgba(34, 197, 94, 0.14)', color: '#059669', boxShadow: '0 0 0 2px #059669' }
        : undefined
    "
  >
    <!-- 1. 伴练音符跳动提示点 (Tertiary Sage #059669) -->
    <div
      v-if="isActive"
      class="absolute -top-3 w-2.5 h-2.5 rounded-full shadow-sm animate-bounce ring-1 ring-white"
      style="background-color: #059669;"
    />

    <!-- 2. 连音弧线 (Slur / Tie Arc) -->
    <div v-if="note.slur" class="absolute -top-2.5 inset-x-0 h-3 flex items-center justify-center pointer-events-none">
      <svg class="w-full h-full overflow-visible" viewBox="0 0 40 10">
        <path
          d="M 2,8 Q 20,0 38,8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
    </div>

    <!-- 3. 古筝专业指法图形符号 -->
    <div class="h-5 flex items-center justify-center mb-0.5" :title="techSymbol ? `${techSymbol.name}` : ''">
      <template v-if="techSymbol">
        <svg
          v-if="techSymbol.type === 'svg'"
          class="w-4 h-4 overflow-visible"
          :viewBox="techSymbol.viewBox || '0 0 16 16'"
          :style="{ color: isActive ? '#059669' : '#0F172A' }"
        >
          <path
            :d="techSymbol.svgPath"
            fill="none"
            stroke="currentColor"
            :stroke-width="techSymbol.strokeWidth || 2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <span
          v-else-if="techSymbol.type === 'text'"
          class="text-sm font-bold musical-font leading-none select-none"
          :style="{ color: isActive ? '#059669' : '#0F172A' }"
        >
          {{ techSymbol.char }}
        </span>
      </template>
    </div>

    <!-- 4. 音符主体区 (Fira Code tabular-nums) -->
    <div class="flex flex-col items-center justify-center">
      <!-- A. 双音/大撮八度和弦叠排 -->
      <div v-if="note.chord && note.chord.length > 0" class="flex items-center justify-center leading-none">
        <div class="flex flex-col items-center">
          <div
            v-for="(p, pIdx) in note.chord"
            :key="pIdx"
            class="flex flex-col items-center my-[1px]"
          >
            <div v-if="p.octave >= 1" class="flex items-center gap-0.5 mb-[2px]">
              <span class="w-1.5 h-1.5 rounded-full bg-current" />
              <span v-if="p.octave >= 2" class="w-1.5 h-1.5 rounded-full bg-current" />
            </div>
            <span
              class="font-bold musical-font tracking-tight leading-none"
              :class="
                note.chord.length >= 4
                  ? 'text-sm md:text-base'
                  : note.chord.length === 3
                  ? 'text-base md:text-lg'
                  : 'text-xl md:text-2xl'
              "
            >
              {{ p.pitch }}
            </span>
            <div v-if="p.octave <= -1" class="flex items-center gap-0.5 mt-[2px]">
              <span class="w-1.5 h-1.5 rounded-full bg-current" />
              <span v-if="p.octave <= -2" class="w-1.5 h-1.5 rounded-full bg-current" />
            </div>
          </div>
        </div>

        <span
          v-if="note.dot"
          class="text-base md:text-lg font-bold ml-0.5 leading-none select-none"
        >
          ·
        </span>

        <span
          v-if="note.duration >= 2"
          class="text-base md:text-lg font-semibold ml-1 tracking-tight whitespace-nowrap select-none text-[#0F172A]"
        >
          {{ getDashes(note.duration) }}
        </span>
      </div>

      <!-- B. 常规单音 -->
      <div v-else class="flex flex-col items-center leading-none">
        <div class="h-2 flex items-center justify-center gap-0.5 mb-[2px]">
          <span
            v-if="note.octave >= 1"
            class="w-1.5 h-1.5 rounded-full bg-current"
          />
          <span
            v-if="note.octave >= 2"
            class="w-1.5 h-1.5 rounded-full bg-current"
          />
        </div>

        <div class="flex items-baseline justify-center">
          <span class="text-xl md:text-2xl font-bold musical-font tracking-tight leading-none">
            {{ note.pitch === 0 ? '0' : note.pitch }}
          </span>

          <span
            v-if="note.dot"
            class="text-base md:text-lg font-bold ml-0.5 leading-none select-none"
          >
            ·
          </span>

          <span
            v-if="note.duration >= 2"
            class="text-base md:text-lg font-semibold ml-1 tracking-tight whitespace-nowrap select-none text-[#0F172A]"
          >
            {{ getDashes(note.duration) }}
          </span>
        </div>

        <div class="h-2 flex items-center justify-center gap-0.5 mt-[2px]">
          <span
            v-if="note.octave <= -1"
            class="w-1.5 h-1.5 rounded-full bg-current"
          />
          <span
            v-if="note.octave <= -2"
            class="w-1.5 h-1.5 rounded-full bg-current"
          />
        </div>
      </div>

      <!-- 5. 减时线下划线与横梁 Beam -->
      <div class="w-full flex flex-col items-center gap-[2px] mt-1">
        <div
          v-if="note.duration <= 0.75"
          class="h-[2px] bg-current rounded-full"
          :class="note.beamWithNext ? 'w-[125%] -mr-1' : 'w-full'"
        />
        <div
          v-if="note.duration <= 0.25"
          class="h-[2px] bg-current rounded-full"
          :class="note.beamWithNext ? 'w-[125%] -mr-1' : 'w-full'"
        />
      </div>
    </div>

    <!-- 6. 歌词或小注 (Secondary Slate #64748B / 激活为 Sage #059669) -->
    <div
      v-if="note.lyric"
      class="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] leading-none font-medium select-none pointer-events-none"
      :style="{ color: isActive ? '#059669' : '#64748B' }"
    >
      {{ note.lyric }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Note } from '../../types/music';
import { getTechniqueSymbol } from './techniqueSymbols';

const props = defineProps<{
  note: Note;
  isActive: boolean;
}>();

defineEmits<{
  (e: 'click'): void;
}>();

const techSymbol = computed(() => getTechniqueSymbol(props.note.technique));

function getDashes(duration: number): string {
  if (duration >= 4) return '— — —';
  if (duration >= 3) return '— —';
  if (duration >= 2) return '—';
  return '';
}
</script>
