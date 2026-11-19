<template>
  <aside
    class="vh-card vh-shadow-md overflow-hidden w-full"
    style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;"
  >
    <!-- 1. Navy 标题条 -->
    <div
      class="px-4 py-3 flex items-center justify-between gap-2"
      style="background-color: #0f172a; color: #ffffff;"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-base">🪕</span>
        <h2 class="vh-headline text-sm font-semibold text-white truncate">
          21 弦古筝实时指板
        </h2>
        <span
          class="vh-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px]"
          style="background-color: rgba(255, 255, 255, 0.14); color: #e2e8f0;"
        >
          {{ store.currentSheet.key }}
        </span>
      </div>

      <span
        v-if="store.isScoreMastered(store.currentSheet.id)"
        class="vh-chip shrink-0"
        style="background-color: rgba(34, 197, 94, 0.22); color: #86efac;"
      >
        ✓ 已通关
      </span>
    </div>

    <!-- 2. 三阶通关伴练模式切换器 -->
    <div class="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-[#64748B] uppercase tracking-[0.5px]">
          三阶通关伴练
        </span>
        <span
          v-if="store.masteryStage === null"
          class="text-[11px] font-medium text-[#64748B]"
        >
          自定义调速中
        </span>
      </div>

      <div class="grid grid-cols-3 gap-1.5">
        <button
          v-for="stage in [
            { key: 'slow', label: '① 慢速70%', title: '70% 慢速 + 示范原声' },
            { key: 'normal', label: '② 原速合练', title: '100% 原速 + 示范原声' },
            { key: 'challenge', label: '③ 纯拍挑战', title: '100% 原速 + 仅节拍器（严格通关）' },
          ]"
          :key="stage.key"
          type="button"
          :title="stage.title"
          @click="selectStage(stage.key as 'slow' | 'normal' | 'challenge')"
          class="px-1.5 py-1.5 rounded-[4px] text-[11px] font-semibold border transition-all cursor-pointer text-center"
          :style="
            store.masteryStage === stage.key
              ? stage.key === 'challenge'
                ? { backgroundColor: '#059669', color: '#FFFFFF', borderColor: '#059669' }
                : { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
              : { backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#E2E8F0' }
          "
        >
          {{ stage.label }}
        </button>
      </div>

      <p
        v-if="store.masteryStage === 'challenge'"
        class="text-[11px] text-[#059669] font-medium leading-snug"
      >
        🏆 严格挑战中：保持原速且不开启示范原声完整弹完即可获「✓ 已通关」
      </p>

      <!-- 双声部合奏时由用户自选亮弦模式 -->
      <div
        v-if="hasMultipleParts && store.selectedPartId === 'all'"
        class="pt-2 border-t border-[#E2E8F0] flex items-center justify-between gap-2"
      >
        <span class="text-[11px] font-medium text-[#64748B] shrink-0">亮弦声部：</span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            @click="store.setDuetStringMode('part1')"
            class="px-2 py-0.5 rounded-[4px] text-[11px] font-medium border cursor-pointer transition-colors"
            :style="
              store.duetStringMode === 'part1'
                ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                : { backgroundColor: '#FFFFFF', color: '#64748B', borderColor: '#E2E8F0' }
            "
          >
            主声部 I
          </button>
          <button
            type="button"
            @click="store.setDuetStringMode('both')"
            class="px-2 py-0.5 rounded-[4px] text-[11px] font-medium border cursor-pointer transition-colors"
            :style="
              store.duetStringMode === 'both'
                ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                : { backgroundColor: '#FFFFFF', color: '#64748B', borderColor: '#E2E8F0' }
            "
          >
            双声部同亮
          </button>
        </div>
      </div>

      <div
        v-if="hasMultipleParts && store.selectedPartId === 'all' && store.duetStringMode === 'both'"
        class="flex items-center gap-3 text-[10px] font-medium text-[#64748B]"
      >
        <span class="inline-flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-[2px] inline-block" style="background-color: #059669;" />
          <span>古筝 I</span>
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-[2px] inline-block" style="background-color: #0EA5E9;" />
          <span>古筝 II</span>
        </span>
      </div>
    </div>

    <!-- 3. 领唱待命提示（仅在人声引子期间显示） -->
    <div
      v-if="isVocalIntroHolding"
      class="px-3 py-1.5 text-[11px] font-medium text-center border-b border-[#E2E8F0]"
      style="background-color: rgba(234, 179, 8, 0.12); color: #92400e;"
    >
      🎵 领唱进行中 · 保持第 {{ startingPosture?.measureNumber }} 小节起手弦待命
    </div>

    <!-- 4. 拟真 21 弦古筝竖排全弦面板 (21 弦在最上靠外 → 1 弦在最下靠怀，含右岳山 + 斜排雁柱 + 点击试音) -->
    <div class="p-2.5 bg-white">
      <div class="flex items-center justify-between text-[10px] font-medium text-[#64748B] px-1 mb-1">
        <span>21 弦（倍低音·靠外）</span>
        <span class="text-[#059669]">点弦可试音</span>
      </div>

      <svg
        class="w-full h-auto select-none"
        viewBox="0 0 264 476"
        aria-label="21弦拟真古筝琴弦指板"
      >
        <defs>
          <linearGradient id="gzWoodBoard" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#FBF8F1" />
            <stop offset="55%" stop-color="#F6EFE2" />
            <stop offset="100%" stop-color="#EFE5D4" />
          </linearGradient>
        </defs>

        <!-- 古筝共鸣箱面板 -->
        <rect
          x="24"
          y="6"
          width="214"
          height="464"
          rx="8"
          fill="url(#gzWoodBoard)"
          stroke="#D6C7B2"
          stroke-width="1.2"
        />
        <!-- 微妙木纹线 -->
        <line x1="78" y1="10" x2="78" y2="466" stroke="#E5DAC7" stroke-width="0.8" opacity="0.65" />
        <line x1="138" y1="10" x2="138" y2="466" stroke="#E5DAC7" stroke-width="0.8" opacity="0.65" />
        <line x1="196" y1="10" x2="196" y2="466" stroke="#E5DAC7" stroke-width="0.8" opacity="0.65" />

        <!-- 右侧岳山（固定弦枕木条） -->
        <rect
          x="227"
          y="10"
          width="7"
          height="456"
          rx="3"
          fill="#78350F"
        />
        <line x1="227" y1="10" x2="227" y2="466" stroke="#FDE68A" stroke-width="0.8" opacity="0.55" />

        <!-- 逐弦绘制 1~21 弦、S形斜排雁柱与交互高亮 -->
        <g v-for="s in stringsList" :key="s.stringNumber">
          <!-- 高亮背景光带 -->
          <rect
            v-if="s.activeRole !== null"
            x="25"
            :y="s.y - 9.5"
            width="202"
            height="19"
            rx="4"
            :fill="
              s.activeRole === 'part2'
                ? 'rgba(14, 165, 233, 0.16)'
                : s.activeRole === 'pluck'
                ? 'rgba(15, 23, 42, 0.12)'
                : 'rgba(5, 150, 105, 0.16)'
            "
          />

          <!-- 左侧弦号 (Fira Code) -->
          <rect
            v-if="s.activeRole !== null"
            x="1"
            :y="s.y - 7.5"
            width="20"
            height="15"
            rx="3"
            :fill="s.activeRole === 'part2' ? '#0EA5E9' : '#0F172A'"
          />
          <text
            x="11"
            :y="s.y + 3.5"
            font-size="9.5"
            font-family="Fira Code, monospace"
            text-anchor="middle"
            :font-weight="s.activeRole !== null || s.isGreen ? '700' : '500'"
            :fill="s.activeRole !== null ? '#FFFFFF' : s.isGreen ? '#059669' : '#64748B'"
          >
            {{ s.stringNumber }}
          </text>

          <!-- 琴弦线段 -->
          <line
            x1="26"
            :y1="s.y"
            x2="230"
            :y2="s.y"
            :stroke="
              s.activeRole === 'part2'
                ? '#0284C7'
                : s.activeRole !== null
                ? '#059669'
                : s.isGreen
                ? '#059669'
                : s.stringNumber >= 16
                ? '#64748B'
                : '#94A3B8'
            "
            :stroke-width="s.activeRole !== null ? s.strokeWidth + 1.3 : s.isGreen ? s.strokeWidth + 0.5 : s.strokeWidth"
            stroke-linecap="round"
            :class="{ 'string-vibrate': s.activeRole !== null }"
          />

          <!-- 岳山穿弦孔小点 -->
          <circle
            cx="230.5"
            :cy="s.y"
            r="1.4"
            fill="#FDE68A"
          />

          <!-- 古筝人字形斜排雁柱 (琴码) -->
          <g :transform="`translate(${s.bridgeX}, ${s.y})`">
            <polygon
              points="-4.5,5.5 0,-5.5 4.5,5.5"
              :fill="s.activeRole !== null ? '#0F172A' : '#92400E'"
              stroke="#451A03"
              stroke-width="0.6"
            />
            <!-- 琴码顶部白色象牙码槽 -->
            <rect x="-1.6" y="-6.2" width="3.2" height="2.2" rx="0.6" fill="#FFFBEB" />
          </g>

          <!-- 拨弦指法胶囊标签（仅在亮弦时显示在琴码右侧或左侧空白处） -->
          <g v-if="s.badgeLabel">
            <rect
              :x="s.badgeX"
              :y="s.y - 7.5"
              :width="s.badgeWidth"
              height="15"
              rx="4"
              :fill="s.activeRole === 'part2' ? '#0284C7' : '#0F172A'"
            />
            <text
              :x="s.badgeX + s.badgeWidth / 2"
              :y="s.y + 3"
              font-size="8.5"
              font-weight="600"
              fill="#FFFFFF"
              text-anchor="middle"
            >
              {{ s.badgeLabel }}
            </text>
          </g>

          <!-- 右侧简谱音名（含高低音点） -->
          <circle
            v-if="s.octave >= 1"
            cx="248"
            :cy="s.y - 5.5"
            r="1.2"
            :fill="s.activeRole !== null ? '#059669' : s.isGreen ? '#059669' : '#64748B'"
          />
          <circle
            v-if="s.octave >= 2"
            cx="252"
            :cy="s.y - 5.5"
            r="1.2"
            :fill="s.activeRole !== null ? '#059669' : s.isGreen ? '#059669' : '#64748B'"
          />
          <text
            x="250"
            :y="s.y + 3.5"
            font-size="10"
            font-family="Fira Code, monospace"
            text-anchor="middle"
            :font-weight="s.activeRole !== null || s.isGreen ? '700' : '500'"
            :fill="s.activeRole !== null ? '#059669' : s.isGreen ? '#059669' : '#0F172A'"
          >
            {{ s.pitch }}
          </text>
          <circle
            v-if="s.octave <= -1"
            cx="248"
            :cy="s.y + 6.5"
            r="1.2"
            :fill="s.activeRole !== null ? '#059669' : s.isGreen ? '#059669' : '#64748B'"
          />
          <circle
            v-if="s.octave <= -2"
            cx="252"
            :cy="s.y + 6.5"
            r="1.2"
            :fill="s.activeRole !== null ? '#059669' : s.isGreen ? '#059669' : '#64748B'"
          />

          <!-- 透明点击试音热区 -->
          <rect
            x="24"
            :y="s.y - 10.5"
            width="234"
            height="21"
            fill="transparent"
            class="cursor-pointer"
            @click="pluckString(s.stringNumber, s.pitch, s.octave)"
          />
        </g>
      </svg>

      <div class="flex items-center justify-between text-[10px] font-medium text-[#64748B] px-1 mt-1">
        <span>1 弦（高音·靠怀）</span>
        <span class="text-[#059669]">绿弦 = 3 / 8 / 13 / 18 弦</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSheetStore } from '../../stores/sheetStore';
import { Note } from '../../types/music';
import { guzhengSynth } from '../../engine/GuzhengAudioSynth';
import { extractStartingPosture, pitchToStringPos } from './StartingPostureGuide.vue';

const PENTATONIC = [1, 2, 3, 5, 6] as const;

const store = useSheetStore();
const pluckedString = ref<number | null>(null);
let pluckTimer: number | null = null;

const hasMultipleParts = computed(() => {
  return Boolean(store.currentSheet.parts && store.currentSheet.parts.length > 1);
});

const startingPosture = computed(() =>
  extractStartingPosture(store.currentSheet, store.selectedPartId, store.loopRange)
);

function getNoteStrings(note: Note): { stringNum: number; finger: string }[] {
  const tech = note.technique || '';
  if (Array.isArray(note.chord) && note.chord.length >= 2) {
    const mapped = note.chord
      .map((p) => pitchToStringPos(p.pitch, p.octave).stringNumber)
      .sort((a, b) => a - b);
    const highStr = mapped[0];
    const lowStr = mapped[mapped.length - 1];
    return [
      { stringNum: highStr, finger: tech === '花指' ? '花指' : '大指' },
      { stringNum: lowStr, finger: tech === '小撮' ? '食指' : '中指' },
    ];
  }
  const s = pitchToStringPos(note.pitch, note.octave).stringNumber;
  const fingerMap: Record<string, string> = {
    托: '大指 𠃊',
    抹: '食指 /',
    勾: '中指 ⌒',
    打: '无名指 𠃌',
    花指: '花指 ≈',
    摇指: '摇指 彡',
    颤音: '颤音 ～',
    上滑音: '上滑 ↗',
    下滑音: '下滑 ↘',
  };
  return [{ stringNum: s, finger: fingerMap[tech] || '弹奏' }];
}

const isVocalIntroHolding = computed(() => {
  if (!store.isPerformanceActive || store.isPreBeat) return false;
  const active = store.activePartNotes;
  const hasGuzhengActive = Boolean(active.part1 || active.part2 || active.main);
  return Boolean(active.intro) && !hasGuzhengActive;
});

const highlightedStringsMap = computed(() => {
  const map = new Map<number, { role: 'primary' | 'part2' | 'pluck'; label: string }>();

  // 1. 手动点击试音闪亮优先
  if (pluckedString.value !== null) {
    map.set(pluckedString.value, { role: 'pluck', label: '试音 ♪' });
  }

  // 2. 待命 / 预备拍 / 人声引子期：高亮起手首音弦
  if (!store.isPerformanceActive || store.isPreBeat || isVocalIntroHolding.value) {
    const posture = startingPosture.value;
    if (posture) {
      if (posture.secondaryString) {
        if (!map.has(posture.primaryString.stringNumber)) {
          map.set(posture.primaryString.stringNumber, { role: 'primary', label: '大指 起手' });
        }
        if (!map.has(posture.secondaryString.stringNumber)) {
          map.set(posture.secondaryString.stringNumber, {
            role: 'primary',
            label: posture.technique === '小撮' ? '食指 起手' : '中指 起手',
          });
        }
      } else if (!map.has(posture.primaryString.stringNumber)) {
        map.set(posture.primaryString.stringNumber, {
          role: 'primary',
          label: posture.technique ? `${posture.technique} 起手` : '起手音',
        });
      }
    }
    return map;
  }

  // 3. 正式演奏中：按声部亮弦
  const active = store.activePartNotes;
  const mainNote = active.part1 || active.main;
  const part2Note = active.part2;

  const showPart2 =
    hasMultipleParts.value &&
    (store.selectedPartId === 'part2' ||
      (store.selectedPartId === 'all' && store.duetStringMode === 'both'));

  if (showPart2 && part2Note && (part2Note.pitch !== 0 || (part2Note.chord && part2Note.chord.length > 0))) {
    for (const item of getNoteStrings(part2Note)) {
      if (!map.has(item.stringNum)) {
        map.set(item.stringNum, {
          role: store.selectedPartId === 'part2' ? 'primary' : 'part2',
          label: store.selectedPartId === 'part2' ? item.finger : `II ${item.finger}`,
        });
      }
    }
  }

  if (
    store.selectedPartId !== 'part2' &&
    mainNote &&
    (mainNote.pitch !== 0 || (mainNote.chord && mainNote.chord.length > 0))
  ) {
    for (const item of getNoteStrings(mainNote)) {
      map.set(item.stringNum, { role: 'primary', label: item.finger });
    }
  }

  return map;
});

function stringToPitchOctave(stringNumber: number): { pitch: number; octave: number } {
  const offset = 11 - stringNumber;
  const octave = Math.floor(offset / 5);
  const idx = ((offset % 5) + 5) % 5;
  return { pitch: PENTATONIC[idx], octave };
}

const stringsList = computed(() => {
  const list = [];
  for (let s = 21; s >= 1; s--) {
    const y = 18 + (21 - s) * 21.8;
    const bridgeX = 198 - Math.pow((s - 1) / 20, 0.85) * 114;
    const { pitch, octave } = stringToPitchOctave(s);
    const active = highlightedStringsMap.value.get(s) || null;
    const badgeLabel = active ? active.label : '';
    const badgeWidth = badgeLabel ? Math.max(38, badgeLabel.length * 8.5 + 10) : 0;
    // 徽章优先放在琴码空白侧，防止遮挡雁柱
    const badgeX = bridgeX < 145 ? bridgeX + 12 : Math.max(28, bridgeX - badgeWidth - 10);

    list.push({
      stringNumber: s,
      y,
      bridgeX,
      pitch,
      octave,
      isGreen: s % 5 === 3,
      strokeWidth: 1.0 + (s - 1) * 0.065,
      activeRole: active?.role ?? null,
      badgeLabel,
      badgeWidth,
      badgeX,
    });
  }
  return list;
});

function selectStage(stage: 'slow' | 'normal' | 'challenge') {
  store.applyMasteryStage(stage);
}

function pluckString(stringNumber: number, pitch: number, octave: number) {
  guzhengSynth.playNote(
    {
      id: `pluck_${stringNumber}`,
      pitch,
      octave,
      duration: 1,
      technique: '托',
    },
    0,
    store.currentSheet.key
  );

  pluckedString.value = stringNumber;
  if (pluckTimer !== null) {
    clearTimeout(pluckTimer);
  }
  pluckTimer = window.setTimeout(() => {
    pluckedString.value = null;
    pluckTimer = null;
  }, 260);
}
</script>

<style scoped>
@keyframes string-shake {
  0% { transform: translateY(0); }
  25% { transform: translateY(-1.2px); }
  50% { transform: translateY(1.2px); }
  75% { transform: translateY(-0.8px); }
  100% { transform: translateY(0); }
}

.string-vibrate {
  animation: string-shake 0.18s ease-in-out 2;
}
</style>
