<template>
  <!-- 形态 A：待命态儿童「古筝起手式」引导卡 (Verdana Health: #FFFFFF + 1px #E2E8F0 + #0F172A Header Strip) -->
  <div
    v-if="posture && !store.isPerformanceActive"
    class="mb-6 vh-card vh-shadow-sm overflow-hidden transition-all"
    style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;"
  >
    <!-- Navy Tinted Header Strip (#0F172A with #FFFFFF text) -->
    <div
      class="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2"
      style="background-color: #0f172a; color: #ffffff;"
    >
      <div class="flex flex-wrap items-center gap-2.5">
        <span
          class="vh-chip"
          style="background-color: #059669; color: #ffffff;"
        >
          <span>🙌</span>
          <span>起手式引导</span>
        </span>
        <span class="text-xs font-medium text-white">
          ① 坐琴凳前 1/3 · 身离琴一拳
        </span>
        <span class="hidden sm:inline text-[#64748B]">|</span>
        <span class="text-xs font-medium text-[#E2E8F0]">
          ② 右手握“小鸡蛋”轻贴首音弦
        </span>
        <span
          v-if="posture.isAfterRest"
          class="vh-chip"
          style="background-color: rgba(234, 179, 8, 0.2); color: #fef08a;"
        >
          🎵 第 {{ posture.startMeasure }}~{{ posture.measureNumber - 1 }} 小节先跟领唱听拍，第 {{ posture.measureNumber }} 小节起奏
        </span>
      </div>

      <button
        type="button"
        @click="collapsed = !collapsed"
        class="px-2.5 py-1 rounded-[4px] text-xs font-medium transition-colors"
        style="background-color: rgba(255, 255, 255, 0.12); color: #ffffff;"
      >
        {{ collapsed ? '展开图示 ▼' : '收起 ▲' }}
      </button>
    </div>

    <!-- 展开后的 24px 舒适呼吸区三栏引导 -->
    <div v-if="!collapsed" class="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-[#FFFFFF]">
      <!-- 1. 手型小卡片：半握拳握小鸡蛋 (#F8FAFC card) -->
      <div
        class="lg:col-span-3 flex items-center gap-3 p-3 rounded-[8px] border border-[#E2E8F0]"
        style="background-color: #f8fafc;"
      >
        <svg class="w-24 h-16 shrink-0" viewBox="0 0 112 72" aria-label="古筝小手握鸡蛋起手手型示意图">
          <line x1="6" y1="62" x2="106" y2="62" stroke="#059669" stroke-width="2" stroke-dasharray="3 2" />
          <circle cx="96" cy="62" r="3" fill="#059669" />
          <text x="8" y="70" font-size="7.5" font-weight="bold" fill="#059669">琴弦平面</text>
          <ellipse
            cx="54"
            cy="43"
            rx="15"
            ry="11"
            fill="#fef3c7"
            stroke="#ca8a04"
            stroke-width="1.6"
            stroke-dasharray="3 2"
          />
          <text x="41" y="46" font-size="8" font-weight="bold" fill="#92400e">小鸡蛋</text>
          <path
            d="M 10,36 Q 28,22 48,20 Q 70,18 82,36 Q 86,46 80,60"
            fill="none"
            stroke="#0f172a"
            stroke-width="3"
            stroke-linecap="round"
          />
          <path
            d="M 38,31 Q 34,47 38,60"
            fill="none"
            stroke="#0f172a"
            stroke-width="2.5"
            stroke-linecap="round"
          />
          <path
            d="M 73,26 Q 76,44 71,60"
            fill="none"
            stroke="#0f172a"
            stroke-width="2.4"
            stroke-linecap="round"
          />
          <circle cx="38" cy="60" r="3.2" fill="#059669" />
          <circle cx="71" cy="60" r="3.2" fill="#059669" />
          <circle cx="80" cy="60" r="3.2" fill="#059669" />
          <text x="10" y="16" font-size="8" font-weight="bold" fill="#64748b">手背微拱 · 掌心空</text>
        </svg>

        <div class="min-w-0">
          <div class="vh-headline text-xs font-semibold text-[#0F172A]">手型口诀</div>
          <div class="text-xs leading-relaxed text-[#64748B] mt-0.5">
            小手放松半握拳，掌心像含着<strong class="text-[#0F172A]">小鸡蛋</strong>，手腕放平。
          </div>
        </div>
      </div>

      <!-- 2. 21 弦古筝琴弦局部放大找弦定位图 (Navy + Slate + Sage) -->
      <div
        class="lg:col-span-5 rounded-[8px] p-3 border border-[#E2E8F0] flex flex-col justify-center"
        style="background-color: #f8fafc;"
      >
        <div class="flex items-center justify-between text-[11px] font-medium mb-1 px-1">
          <span style="color: #64748b;">▲ 靠外侧（音低 ↓）</span>
          <span style="color: #059669;">绿线 = 标志 5 弦</span>
          <span style="color: #0f172a;">▼ 靠怀里（音高 ↑）</span>
        </div>

        <svg class="w-full h-24" viewBox="0 0 260 112" aria-label="21弦古筝起手找弦定位图">
          <g v-for="(s, idx) in diagramStrings" :key="s.stringNumber">
            <rect
              v-if="s.isPrimary || s.isSecondary"
              x="44"
              :y="getStringY(idx, diagramStrings.length) - 7"
              width="174"
              height="14"
              rx="4"
              :fill="s.isPrimary ? 'rgba(15, 23, 42, 0.08)' : 'rgba(5, 150, 105, 0.12)'"
            />

            <text
              x="4"
              :y="getStringY(idx, diagramStrings.length) + 3.5"
              font-size="9"
              font-family="Fira Code, monospace"
              :font-weight="s.isPrimary || s.isSecondary || s.isGreen ? 'bold' : 'normal'"
              :fill="s.isPrimary ? '#0f172a' : s.isSecondary || s.isGreen ? '#059669' : '#64748b'"
            >
              第{{ s.stringNumber }}弦
            </text>

            <line
              x1="46"
              :y1="getStringY(idx, diagramStrings.length)"
              x2="216"
              :y2="getStringY(idx, diagramStrings.length)"
              :stroke="s.isPrimary ? '#0f172a' : s.isSecondary || s.isGreen ? '#059669' : '#cbd5e1'"
              :stroke-width="s.isPrimary || s.isSecondary ? 2.8 : s.isGreen ? 2.2 : 1.5"
              stroke-linecap="round"
            />

            <text
              x="222"
              :y="getStringY(idx, diagramStrings.length) + 3.5"
              font-size="9"
              font-family="Fira Code, monospace"
              font-weight="bold"
              :fill="s.isPrimary ? '#0f172a' : s.isGreen ? '#059669' : '#64748b'"
            >
              {{ s.noteTag }}{{ s.isGreen ? ' 绿' : '' }}
            </text>

            <g v-if="s.isPrimary">
              <rect
                x="108"
                :y="getStringY(idx, diagramStrings.length) - 8.5"
                width="70"
                height="17"
                rx="4"
                fill="#0f172a"
              />
              <text
                x="143"
                :y="getStringY(idx, diagramStrings.length) + 3"
                font-size="8.5"
                font-weight="bold"
                fill="#ffffff"
                text-anchor="middle"
              >
                {{ primaryFingerTag }}
              </text>
            </g>

            <g v-if="s.isSecondary">
              <rect
                x="78"
                :y="getStringY(idx, diagramStrings.length) - 8.5"
                width="70"
                height="17"
                rx="4"
                fill="#059669"
              />
              <text
                x="113"
                :y="getStringY(idx, diagramStrings.length) + 3"
                font-size="8.5"
                font-weight="bold"
                fill="#ffffff"
                text-anchor="middle"
              >
                {{ secondaryFingerTag }}
              </text>
            </g>
          </g>
        </svg>
      </div>

      <!-- 3. 右侧：首音定位结论 + 指法口诀 + 试听起手音按钮 -->
      <div
        class="lg:col-span-4 rounded-[8px] p-3 border border-[#E2E8F0] flex flex-col justify-between gap-2.5"
        style="background-color: #f8fafc;"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="vh-chip vh-chip-filter-active vh-mono">
                首音：{{ posture.primaryString.pitchLabel }}（第{{ posture.primaryString.stringNumber }}弦）
              </span>
              <span class="vh-chip vh-chip-success">
                {{ posture.fingerTitle }}
              </span>
            </div>
            <div class="text-xs font-semibold text-[#059669]">
              📍 找弦口诀：{{ posture.primaryString.relativeDesc }}
              <template v-if="posture.secondaryString">
                ；另一指搭第 {{ posture.secondaryString.stringNumber }} 弦（{{ posture.secondaryString.relativeDesc }}）
              </template>
            </div>
          </div>

          <button
            type="button"
            @click="previewFirstNote"
            class="vh-btn vh-btn-sm vh-btn-sage shrink-0 font-semibold"
            style="background-color: #059669; color: #ffffff; border-radius: 8px;"
            title="先听一下第一个起手音的音高"
          >
            🔊 听音
          </button>
        </div>

        <p class="text-xs text-[#64748B] leading-relaxed">
          {{ posture.kidFormula }}
        </p>
      </div>
    </div>
  </div>

  <!-- 形态 B：预备拍顶部悬浮轻巧倒计时胶囊 (12px md 圆角, vh-shadow-lg) -->
  <transition name="fade">
    <div
      v-if="store.isPreBeat"
      class="fixed top-[4.6rem] inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:min-w-[28rem] max-w-2xl z-40 vh-modal px-4 py-2.5 pointer-events-none"
      style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <span
            class="vh-chip shrink-0"
            style="background-color: #0f172a; color: #ffffff;"
          >
            🙌 预备拍 · 摆好起手式
          </span>
          <div v-if="posture" class="text-xs font-semibold text-[#059669] truncate vh-mono">
            {{ posture.compactBadgeText }}
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <div
            v-for="beat in totalPreBeats"
            :key="beat"
            class="vh-mono w-9 h-9 rounded-[8px] flex items-center justify-center text-base font-bold transition-all"
            :style="
              store.preBeatCount >= beat
                ? { backgroundColor: '#059669', color: '#ffffff', transform: 'scale(1.06)', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.28)' }
                : { backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }
            "
          >
            {{ beat }}
          </div>
          <span class="text-xs font-semibold ml-1 text-[#059669]">准备弹</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { GuzhengTechnique, Note, SheetMusic } from '../../types/music';

export interface GuzhengStringPos {
  stringNumber: number; // 1 ~ 21 (1 = 倍高音1 靠怀里, 21 = 倍低音1 最外侧)
  isGreen: boolean;     // 第 3, 8, 13, 18 弦为绿色标志 5 弦
  pitchLabel: string;
  shortNoteTag: string;
  solfege: number;
  octave: number;
  nearestGreen: number;
  relativeDesc: string;
  needsLeftPress?: boolean;
}

export interface StartingPostureInfo {
  note: Note;
  measureNumber: number;
  startMeasure: number;
  isAfterRest: boolean;
  primaryString: GuzhengStringPos;
  secondaryString: GuzhengStringPos | null;
  technique: GuzhengTechnique | '';
  techniqueSymbolChar: string;
  fingerTitle: string;
  primaryFingerName: string;
  secondaryFingerName: string;
  kidFormula: string;
  compactBadgeText: string;
}

const PENTATONIC_DEGREES = [1, 2, 3, 5, 6] as const;
const GREEN_STRINGS = [3, 8, 13, 18] as const;

const OCTAVE_LABEL_MAP: Record<number, string> = {
  2: '倍高音',
  1: '高音',
  0: '中音',
  [-1]: '低音',
  [-2]: '倍低音',
};

const TECHNIQUE_HINTS: Record<
  string,
  { symbol: string; title: string; primaryFinger: string; secondaryFinger: string; formula: string }
> = {
  托: {
    symbol: '𠃊',
    title: '大指托 (𠃊)',
    primaryFinger: '大指 𠃊',
    secondaryFinger: '中指',
    formula: '大指指尖轻轻贴在首音弦上，其余手指自然垂落掌心，准备好稳稳向外“托”出！',
  },
  抹: {
    symbol: '/',
    title: '食指抹 (/)',
    primaryFinger: '食指 /',
    secondaryFinger: '大指',
    formula: '小手像握小鸡蛋一样拱起，食指轻轻搭在这根弦上，准备向掌心“抹”进来～',
  },
  勾: {
    symbol: '⌒',
    title: '中指勾 (⌒)',
    primaryFinger: '中指 ⌒',
    secondaryFinger: '大指',
    formula: '中指微微弯起像小弯钩搭好琴弦，手腕保持平稳，准备轻盈向掌心“勾”响！',
  },
  打: {
    symbol: '𠃌',
    title: '无名指打 (𠃌)',
    primaryFinger: '无名指 𠃌',
    secondaryFinger: '大指',
    formula: '无名指自然弯曲贴弦，其余指头放松，准备轻轻向掌心“打”响琴音！',
  },
  大撮: {
    symbol: '⊓',
    title: '大撮 (⊓)',
    primaryFinger: '大指搭此弦',
    secondaryFinger: '中指搭此弦',
    formula: '大指搭高音弦、中指搭低音弦，像小钳子同时夹好这两根弦，准备一齐向里撮响！',
  },
  小撮: {
    symbol: 'ㄇ',
    title: '小撮 (ㄇ)',
    primaryFinger: '大指搭此弦',
    secondaryFinger: '食指搭此弦',
    formula: '大指和食指像小剪刀同时搭好两根弦，准备一齐轻快地向手心撮响！',
  },
  花指: {
    symbol: '≈',
    title: '花指 (≈)',
    primaryFinger: '食指连抹 ≈',
    secondaryFinger: '大指准备',
    formula: '食指先放到目标弦外侧两三根低音弦上，起拍时由外往怀里一气“刷”过来落音！',
  },
  摇指: {
    symbol: '彡',
    title: '摇指 (彡)',
    primaryFinger: '大指摇 彡',
    secondaryFinger: '中指护弦',
    formula: '大指贴稳目标弦，手腕稍微立起放松，准备好连续灵巧地“劈托”连绵发声！',
  },
  上滑音: {
    symbol: '↗',
    title: '右弹+左按滑',
    primaryFinger: '右手起音',
    secondaryFinger: '左手准备按弦',
    formula: '右手大指或食指先弹响琴弦，左手轻轻靠在码子左侧准备向上按滑出韵味～',
  },
  下滑音: {
    symbol: '↘',
    title: '左预按+右弹放',
    primaryFinger: '右手起音',
    secondaryFinger: '左手先按弦',
    formula: '左手先轻按琴弦左侧，右手弹响后左手慢慢松开回落，滑出温柔的余音！',
  },
  颤音: {
    symbol: '～',
    title: '右弹+左颤音',
    primaryFinger: '右手起音',
    secondaryFinger: '左手准备揉弦',
    formula: '右手搭好首音琴弦准备弹响，左手轻放在码子左侧准备像小波浪一样揉弦！',
  },
};

function findPentatonicBase(pitch: number): { pentIdx: number; needsLeftPress: boolean } {
  const safePitch = Math.max(1, Math.min(7, Math.round(pitch || 1)));
  if (safePitch === 4) {
    return { pentIdx: PENTATONIC_DEGREES.indexOf(3), needsLeftPress: true };
  }
  if (safePitch === 7) {
    return { pentIdx: PENTATONIC_DEGREES.indexOf(6), needsLeftPress: true };
  }
  const idx = PENTATONIC_DEGREES.indexOf(safePitch as (typeof PENTATONIC_DEGREES)[number]);
  return { pentIdx: idx >= 0 ? idx : 0, needsLeftPress: false };
}

function getShortNoteTag(pitch: number, octave: number): string {
  const dots = octave === 1 ? '·' : octave >= 2 ? '··' : octave === -1 ? '.' : octave <= -2 ? '..' : '';
  return `${pitch}${dots}`;
}

export function pitchToStringPos(pitch: number, octave: number): GuzhengStringPos {
  const safeOctave = Math.max(-2, Math.min(2, Math.round(octave || 0)));
  const safePitch = Math.max(1, Math.min(7, Math.round(pitch || 1)));
  const { pentIdx, needsLeftPress } = findPentatonicBase(safePitch);

  const rawString = 11 - (safeOctave * 5 + pentIdx);
  const stringNumber = Math.max(1, Math.min(21, rawString));
  const isGreen = stringNumber % 5 === 3;

  let nearestGreen: number = GREEN_STRINGS[0];
  let bestDist = Infinity;
  for (const g of GREEN_STRINGS) {
    const d = Math.abs(stringNumber - g);
    if (d < bestDist) {
      bestDist = d;
      nearestGreen = g;
    }
  }

  const diff = stringNumber - nearestGreen;
  let relativeDesc: string;
  if (diff === 0) {
    relativeDesc = `第 ${stringNumber} 根就是绿色标志弦（5 弦）`;
  } else if (diff < 0) {
    relativeDesc = `找到第 ${nearestGreen} 根绿弦，往怀里数 ${-diff} 根`;
  } else {
    relativeDesc = `找到第 ${nearestGreen} 根绿弦，往外侧数 ${diff} 根`;
  }
  if (needsLeftPress) {
    relativeDesc += `（弹响后左手轻按出 ${safePitch}）`;
  }

  const octLabel = OCTAVE_LABEL_MAP[safeOctave] ?? '中音';
  return {
    stringNumber,
    isGreen,
    pitchLabel: `${octLabel} ${safePitch}`,
    shortNoteTag: getShortNoteTag(safePitch, safeOctave),
    solfege: safePitch,
    octave: safeOctave,
    nearestGreen,
    relativeDesc,
    needsLeftPress,
  };
}

export function stringNumToNoteTag(stringNumber: number): { label: string; isGreen: boolean } {
  const offset = 11 - stringNumber;
  const idx = ((offset % 5) + 5) % 5;
  const pitch = PENTATONIC_DEGREES[idx];
  return {
    label: `${pitch}`,
    isGreen: stringNumber % 5 === 3,
  };
}

export function extractStartingPosture(
  sheet: SheetMusic,
  selectedPartId: string = 'all',
  loopRange: { start: number; end: number } | null = null
): StartingPostureInfo | null {
  let measures = sheet.measures;
  if (selectedPartId !== 'all' && sheet.parts && sheet.parts.length > 0) {
    const matched = sheet.parts.find((p) => p.id === selectedPartId);
    if (matched) measures = matched.measures;
  }
  if (!measures || measures.length === 0) return null;

  const startMeasure = loopRange ? Math.max(1, loopRange.start) : 1;
  const endMeasure = loopRange ? Math.min(measures.length, loopRange.end) : measures.length;

  let firstNote: Note | null = null;
  let firstMeasureNum = startMeasure;

  for (let i = startMeasure - 1; i < endMeasure; i++) {
    const m = measures[i];
    if (!m) continue;
    for (const n of m.notes) {
      const hasChord = Array.isArray(n.chord) && n.chord.length > 0;
      if ((Number(n.pitch) || 0) !== 0 || hasChord) {
        firstNote = n;
        firstMeasureNum = m.measureNumber;
        break;
      }
    }
    if (firstNote) break;
  }

  if (!firstNote) return null;

  const hasMultiChord = Array.isArray(firstNote.chord) && firstNote.chord.length >= 2;
  let primaryString: GuzhengStringPos;
  let secondaryString: GuzhengStringPos | null = null;

  if (hasMultiChord && firstNote.chord) {
    const mapped = firstNote.chord
      .map((p) => pitchToStringPos(p.pitch, p.octave))
      .sort((a, b) => a.stringNumber - b.stringNumber);
    primaryString = mapped[0];
    secondaryString = mapped[mapped.length - 1];
  } else {
    primaryString = pitchToStringPos(firstNote.pitch, firstNote.octave);
  }

  const tech = firstNote.technique || '';
  const hint = TECHNIQUE_HINTS[tech];
  const techniqueSymbolChar = hint?.symbol || '';
  const fingerTitle = hint?.title || '托/抹自然起手';
  const primaryFingerName = hint?.primaryFinger || '大指/食指';
  const secondaryFingerName =
    tech === '小撮' ? '食指搭此弦' : hint?.secondaryFinger || '中指搭此弦';
  const kidFormula =
    hint?.formula ||
    '小手像握着一颗小鸡蛋轻轻架在弦上，找准绿色 5 弦旁的目标弦准备开弹！';

  const stringBadge = secondaryString
    ? `第${primaryString.stringNumber}+${secondaryString.stringNumber}弦`
    : primaryString.isGreen
    ? `第${primaryString.stringNumber}弦(绿弦 ${primaryString.pitchLabel})`
    : `第${primaryString.stringNumber}弦(${primaryString.pitchLabel})`;

  const techBadge = hint ? `${tech || fingerTitle} ${techniqueSymbolChar}`.trim() : '起手就位';
  const compactBadgeText = `${stringBadge} · ${techBadge}`;

  return {
    note: firstNote,
    measureNumber: firstMeasureNum,
    startMeasure,
    isAfterRest: firstMeasureNum > startMeasure,
    primaryString,
    secondaryString,
    technique: tech,
    techniqueSymbolChar,
    fingerTitle,
    primaryFingerName,
    secondaryFingerName,
    kidFormula,
    compactBadgeText,
  };
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSheetStore } from '../../stores/sheetStore';
import { guzhengSynth } from '../../engine/GuzhengAudioSynth';

const store = useSheetStore();
const collapsed = ref(false);

const posture = computed(() =>
  extractStartingPosture(store.currentSheet, store.selectedPartId, store.loopRange)
);

const totalPreBeats = computed(() => store.currentSheet.timeSignature[0] || 2);

const primaryFingerTag = computed(() => {
  if (!posture.value) return '起手弦';
  if (posture.value.secondaryString) return '大指 搭这';
  if (posture.value.technique === '花指') return '花指落音';
  return `${posture.value.primaryFingerName.split(' ')[0]}搭这`;
});

const secondaryFingerTag = computed(() => {
  if (!posture.value) return '中指搭这';
  return posture.value.technique === '小撮' ? '食指 搭这' : '中指 搭这';
});

const diagramStrings = computed(() => {
  if (!posture.value) return [];
  const pNum = posture.value.primaryString.stringNumber;
  const sNum = posture.value.secondaryString?.stringNumber ?? null;
  const greenRef = posture.value.primaryString.nearestGreen;

  let minStr: number;
  let maxStr: number;
  if (sNum !== null) {
    minStr = Math.max(1, Math.min(pNum, sNum) - 1);
    maxStr = Math.min(21, Math.max(pNum, sNum) + 1);
  } else {
    minStr = Math.max(1, Math.min(pNum - 2, greenRef));
    maxStr = Math.min(21, Math.max(pNum + 2, greenRef));
    if (maxStr - minStr < 4) {
      minStr = Math.max(1, maxStr - 4);
      maxStr = Math.min(21, minStr + 4);
    }
  }

  const list: {
    stringNumber: number;
    isGreen: boolean;
    noteTag: string;
    isPrimary: boolean;
    isSecondary: boolean;
  }[] = [];

  for (let s = maxStr; s >= minStr; s--) {
    const info = stringNumToNoteTag(s);
    list.push({
      stringNumber: s,
      isGreen: info.isGreen,
      noteTag: info.label,
      isPrimary: s === pNum,
      isSecondary: sNum !== null && s === sNum,
    });
  }
  return list;
});

function getStringY(idx: number, total: number): number {
  if (total <= 1) return 56;
  const topY = 14;
  const bottomY = 98;
  return topY + (idx * (bottomY - topY)) / (total - 1);
}

function previewFirstNote() {
  if (!posture.value) return;
  guzhengSynth.playNote(posture.value.note, 0, store.currentSheet.key);
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
