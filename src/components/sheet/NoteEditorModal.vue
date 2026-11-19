<template>
  <div
    v-if="store.editingNote"
    class="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-4"
    @click.self="store.editingNote = null"
  >
    <div
      class="vh-modal max-w-lg w-full overflow-hidden text-[#0F172A]"
      style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;"
    >
      <!-- 顶部 Navy 标题条 -->
      <div
        class="px-6 py-4 flex items-center justify-between"
        style="background-color: #0f172a; color: #ffffff;"
      >
        <div>
          <h3 class="vh-headline text-lg font-semibold text-white">音符快速纠错 / 微调</h3>
          <p class="text-xs text-[#94A3B8] mt-0.5">点击下方选项可实时修改音高、指法与拍数</p>
        </div>

        <!-- 实时效果预览卡片 -->
        <div class="px-4 py-1.5 bg-white rounded-[8px] border border-[#E2E8F0]">
          <NoteView :note="draftNote" :is-active="true" />
        </div>
      </div>

      <!-- 编辑主体表单 (24px padding) -->
      <div class="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
        <!-- 1. 音高数字选择 (0 ~ 7) -->
        <div>
          <label class="block text-xs font-medium text-[#64748B] uppercase tracking-[0.5px] mb-2">
            1. 唱名数字 (Pitch)
          </label>
          <div class="grid grid-cols-8 gap-2">
            <button
              v-for="p in [1, 2, 3, 4, 5, 6, 7, 0]"
              :key="p"
              type="button"
              class="vh-mono h-11 rounded-[8px] text-lg font-bold transition-all cursor-pointer border"
              :style="
                draftNote.pitch === p
                  ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                  : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
              "
              @click="setDraftPitch(p)"
            >
              {{ p }}
            </button>
          </div>
        </div>

        <!-- 2. 音区 (高低音点) -->
        <div>
          <label class="block text-xs font-medium text-[#64748B] uppercase tracking-[0.5px] mb-2">
            2. 音区选择 (Octave)
          </label>
          <div class="grid grid-cols-4 gap-2 text-sm font-medium">
            <button
              v-for="item in [
                { label: '低音 ̣', val: -1 },
                { label: '中音', val: 0 },
                { label: '高音 ̇', val: 1 },
                { label: '倍高音 ̈', val: 2 },
              ]"
              :key="item.val"
              type="button"
              class="py-2.5 rounded-[8px] transition-all cursor-pointer border"
              :style="
                draftNote.octave === item.val
                  ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                  : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
              "
              @click="setDraftOctave(item.val)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- 3. 古筝指法标注 -->
        <div>
          <label class="block text-xs font-medium text-[#64748B] uppercase tracking-[0.5px] mb-2">
            3. 古筝指法 (Technique)
          </label>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs font-medium">
            <button
              v-for="tech in techniques"
              :key="tech.label"
              type="button"
              class="py-2.5 px-2 rounded-[8px] transition-all cursor-pointer border"
              :style="
                draftNote.technique === tech.val
                  ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                  : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
              "
              @click="setDraftTechnique(tech.val as any)"
            >
              {{ tech.label }}
            </button>
          </div>
        </div>

        <!-- 4. 时值 (拍数) -->
        <div>
          <label class="block text-xs font-medium text-[#64748B] uppercase tracking-[0.5px] mb-2">
            4. 时值拍数 (Duration)
          </label>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs font-medium">
            <button
              v-for="d in [
                { label: '1/4 拍', val: 0.25 },
                { label: '半拍', val: 0.5 },
                { label: '1 拍', val: 1 },
                { label: '2 拍', val: 2 },
                { label: '4 拍', val: 4 },
              ]"
              :key="d.val"
              type="button"
              class="vh-mono py-2.5 px-1.5 rounded-[8px] transition-all cursor-pointer border"
              :style="
                draftNote.duration === d.val
                  ? { backgroundColor: '#059669', color: '#FFFFFF', borderColor: '#059669' }
                  : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
              "
              @click="draftNote.duration = d.val"
            >
              {{ d.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="px-6 py-4 bg-[#F8FAFC] flex items-center justify-between border-t border-[#E2E8F0]">
        <button
          type="button"
          class="vh-btn vh-btn-sm vh-btn-secondary text-xs font-semibold"
          style="border: 1px solid #0F172A; color: #0F172A; border-radius: 8px;"
          @click="previewCurrentNote"
        >
          <span>🪕</span>
          <span>试听原声</span>
        </button>

        <div class="flex items-center gap-2.5">
          <button
            type="button"
            class="vh-btn vh-btn-md vh-btn-ghost font-medium"
            style="color: #475569; border-radius: 8px;"
            @click="store.editingNote = null"
          >
            取消
          </button>
          <button
            type="button"
            class="vh-btn vh-btn-md vh-btn-primary font-semibold"
            style="background-color: #0F172A; color: #FFFFFF; border-radius: 8px;"
            @click="handleSave"
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSheetStore } from '../../stores/sheetStore';
import { GuzhengTechnique, Note } from '../../types/music';
import NoteView from './NoteView.vue';
import { guzhengSynth } from '../../engine/GuzhengAudioSynth';

const store = useSheetStore();

const draftNote = ref<Note>({
  id: '',
  pitch: 1,
  octave: 0,
  duration: 1,
  technique: '托',
});

const techniques = [
  { label: '𠃊 托 (拇指)', val: '托' },
  { label: '/ 抹 (食指)', val: '抹' },
  { label: '⌒ 勾 (中指)', val: '勾' },
  { label: '𠃌 打 (无名指)', val: '打' },
  { label: '⊓ 大撮 (八度)', val: '大撮' },
  { label: 'ㄇ 小撮 (三度)', val: '小撮' },
  { label: '≈ 花指 (扫弦)', val: '花指' },
  { label: '彡 摇指', val: '摇指' },
  { label: '～ 颤音', val: '颤音' },
  { label: '无指法', val: '' },
];

function syncOctaveChord(pitch: number, octave: number) {
  if (pitch <= 0) {
    draftNote.value.chord = undefined;
    return;
  }
  const lowerOct = octave > -2 ? octave - 1 : -1;
  draftNote.value.chord = [
    { pitch, octave },
    { pitch, octave: lowerOct },
  ];
}

function setDraftPitch(p: number) {
  draftNote.value.pitch = p;
  if (p === 0) {
    draftNote.value.chord = undefined;
  } else if (draftNote.value.chord && draftNote.value.chord.length > 0) {
    syncOctaveChord(p, draftNote.value.octave);
  }
}

function setDraftOctave(oct: number) {
  draftNote.value.octave = oct;
  if (draftNote.value.pitch > 0 && draftNote.value.chord && draftNote.value.chord.length > 0) {
    syncOctaveChord(draftNote.value.pitch, oct);
  }
}

function setDraftTechnique(tech: GuzhengTechnique) {
  draftNote.value.technique = tech;
  if (tech === '大撮' && draftNote.value.pitch > 0) {
    syncOctaveChord(draftNote.value.pitch, draftNote.value.octave);
  } else if (tech === '托' || tech === '抹' || tech === '勾' || tech === '打' || tech === '') {
    draftNote.value.chord = undefined;
  }
}

function previewCurrentNote() {
  guzhengSynth.playNote(draftNote.value, 0, store.currentSheet.key);
}

watch(
  () => store.editingNote,
  (val) => {
    if (val) {
      draftNote.value = JSON.parse(JSON.stringify(val));
    }
  },
  { immediate: true }
);

function handleSave() {
  store.saveNoteEdit(draftNote.value);
}
</script>
