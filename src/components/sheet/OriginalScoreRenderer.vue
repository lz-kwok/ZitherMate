<template>
  <div class="w-full">
    <div
      class="bg-white rounded-[8px] border border-[#E2E8F0] vh-shadow-md p-4 sm:p-6 md:p-8 text-[#0F172A] relative"
      style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;"
    >
      <!-- 1. 顶部原件谱头控制条 -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 mb-5">
        <div class="space-y-1.5 min-w-0">
          <div class="flex flex-wrap items-center gap-2.5">
            <h1 class="vh-headline text-2xl sm:text-3xl font-bold tracking-wide text-[#0F172A] truncate">
              {{ store.currentSheet.title }}
            </h1>
            <span
              class="vh-chip font-semibold"
              style="background-color: rgba(5, 150, 105, 0.1); color: #059669;"
            >
              📄 原件画框谱
            </span>
          </div>

          <div class="vh-mono flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#475569] font-semibold">
            <span class="text-[#0F172A]">{{ store.currentSheet.key }}</span>
            <span>•</span>
            <span class="text-[#0F172A]">
              {{ store.currentSheet.timeSignature[0] }}/{{ store.currentSheet.timeSignature[1] }}
            </span>
            <span>•</span>
            <span class="text-[#0F172A]">
              <span class="font-sans">{{ store.beatUnitSymbol }}</span> = {{ store.bpm }}
            </span>
            <span>•</span>
            <span>{{ pageMetas.length }} 页 · {{ totalMeasures }} 小节</span>
            <span v-if="store.currentSheet.author" class="font-sans font-normal text-[#64748B]">
              · {{ store.currentSheet.author }}
            </span>
          </div>
        </div>

        <!-- 右侧视图与编辑控制工具 -->
        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            @click="showAllBoxes = !showAllBoxes"
            class="vh-chip cursor-pointer transition-colors"
            :class="showAllBoxes ? 'vh-chip-filter-active' : 'vh-chip-filter hover:border-[#0F172A]'"
            :style="
              showAllBoxes
                ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
            "
            title="显示或隐藏待命状态下的小节参考框线（隐藏后依然可点击原图任意小节设置 A-B 循环）"
          >
            👁️ {{ showAllBoxes ? '显示全部小节框' : '仅显高亮框' }}
          </button>

          <button
            type="button"
            @click="wideZoom = !wideZoom"
            class="vh-chip vh-chip-filter hover:border-[#0F172A] cursor-pointer transition-colors"
            :title="wideZoom ? '切换回适中阅读宽度' : '放大铺满整个工作区宽度'"
          >
            🔍 {{ wideZoom ? '适应宽度' : '宽屏放大' }}
          </button>

          <button
            v-if="hasDigitalVersion"
            type="button"
            @click="store.setScoreDisplayMode('digital')"
            class="vh-chip cursor-pointer transition-colors font-semibold"
            style="background-color: rgba(15, 23, 42, 0.06); color: #0F172A; border: 1px solid #CBD5E1;"
            title="切换至数字化简谱并开启右侧 21 弦亮弦教学"
          >
            🎼 切至数字简谱 (21弦)
          </button>

          <button
            v-else
            type="button"
            @click="$emit('transcribe-to-digital')"
            class="vh-chip cursor-pointer transition-colors font-semibold"
            style="background-color: rgba(5, 150, 105, 0.12); color: #059669; border: 1px solid rgba(5, 150, 105, 0.35);"
            title="使用视觉 AI 将原件曲谱转义为可跟弹发声的 21 弦数字简谱"
          >
            ✨ 转义为数字简谱 (21弦)
          </button>

          <button
            type="button"
            @click="$emit('edit-anchors')"
            class="vh-btn vh-btn-sm vh-btn-secondary text-xs font-semibold"
            style="border: 1px solid #0F172A; color: #0F172A; border-radius: 8px;"
          >
            ✏️ 调整埋点
          </button>
        </div>
      </div>

      <!-- 2. 预备拍提示横幅 / 待命起手提示 -->
      <div
        v-if="store.isPlaying && store.isPreBeat"
        class="mb-4 px-4 py-3 rounded-[8px] flex flex-wrap items-center justify-between gap-2 text-white vh-shadow-sm"
        style="background-color: #0F172A;"
      >
        <div class="flex items-center gap-2.5">
          <span class="vh-chip font-bold" style="background-color: #059669; color: #FFFFFF;">
            ⏱️ 预备拍准备
          </span>
          <span class="text-sm font-medium">
            请看准第 {{ standbyMeasureNumber }} 小节绿色虚线起奏框，预备拍结束立即开始扫拍跟随
          </span>
        </div>
        <span class="vh-mono text-lg font-bold text-[#34D399]">
          预备 {{ store.preBeatCount }} / {{ store.currentSheet.timeSignature[0] || 4 }}
        </span>
      </div>

      <div
        v-else-if="!store.isPerformanceActive"
        class="mb-4 px-3.5 py-2 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569]"
      >
        <span>
          💡 提示：点击原谱上任意小节可快速设置 / 扩展 <strong>A-B 循环练琴区间</strong>；底部点击「开始」或使用伴奏即可触发实时画框与扫拍光标。
        </span>
        <button
          v-if="store.loopRange"
          type="button"
          @click="store.loopRange = null"
          class="text-xs font-semibold text-[#0284C7] hover:underline cursor-pointer"
        >
          清除循环 ({{ store.loopRange.start }}~{{ store.loopRange.end }})
        </button>
      </div>

      <!-- 3. 加载异常 / 加载中提示 -->
      <div
        v-if="isLoadingPages"
        class="py-16 text-center text-sm text-[#64748B] flex flex-col items-center gap-2"
      >
        <span class="text-2xl animate-spin">🔄</span>
        <span>正在加载高清原版曲谱页面...</span>
      </div>

      <div
        v-else-if="missingImagesWarning"
        class="p-6 rounded-[8px] border border-[#FCA5A5] bg-[#FEF2F2] text-sm text-[#991B1B] text-center space-y-3"
      >
        <p>⚠️ 部分或全部原件页面图片未在当前设备图库中找到（可能来自仅含元数据的旧缓存）。</p>
        <button
          type="button"
          @click="$emit('edit-anchors')"
          class="vh-btn vh-btn-sm vh-btn-primary text-xs font-semibold"
        >
          重新导入原件图像
        </button>
      </div>

      <!-- 4. 多页原件曲谱纵向瀑布流 -->
      <div
        v-else
        class="mx-auto space-y-6 transition-all"
        :class="wideZoom ? 'max-w-full' : 'max-w-4xl'"
      >
        <div
          v-for="page in pageMetas"
          :key="page.id"
          class="relative rounded-[6px] border border-[#E2E8F0] bg-white overflow-hidden vh-shadow-sm"
        >
          <!-- 页码浮标 -->
          <div
            v-if="pageMetas.length > 1"
            class="vh-mono absolute top-2.5 right-2.5 z-20 px-2 py-0.5 rounded-[4px] bg-[#0F172A]/80 text-white text-[11px] font-medium pointer-events-none"
          >
            第 {{ page.pageIndex + 1 }} / {{ pageMetas.length }} 页
          </div>

          <div class="relative w-full select-none">
            <img
              v-if="pageUrls[page.id]"
              :src="pageUrls[page.id]"
              :alt="`${store.currentSheet.title} 第 ${page.pageIndex + 1} 页`"
              class="block w-full h-auto pointer-events-none select-none"
              draggable="false"
            />

            <!-- 原件上方的逐小节交互与高显扫拍覆层 -->
            <div class="absolute inset-0">
              <div
                v-for="box in getAnchorsForPage(page.pageIndex)"
                :id="`original-measure-${box.measureNumber - 1}`"
                :key="box.id"
                role="button"
                tabindex="0"
                :aria-label="`第 ${box.measureNumber} 小节`"
                @click="store.toggleLoop(box.measureNumber)"
                @keydown.enter.space.prevent="store.toggleLoop(box.measureNumber)"
                class="absolute cursor-pointer transition-colors duration-75"
                :style="getAnchorBoxStyle(box)"
              >
                <!-- 弹奏高亮态：从左到右 60fps 扫拍光带与导引竖线 -->
                <template v-if="isActiveBox(box.measureNumber)">
                  <div
                    class="absolute inset-y-0 left-0 pointer-events-none"
                    :style="{
                      width: `${Math.max(0, Math.min(100, store.currentMeasureProgress * 100))}%`,
                      backgroundColor: 'rgba(5, 150, 105, 0.16)',
                    }"
                  />
                  <div
                    class="absolute inset-y-0 w-[3px] -ml-[1.5px] pointer-events-none"
                    :style="{
                      left: `${Math.max(0, Math.min(100, store.currentMeasureProgress * 100))}%`,
                      backgroundColor: '#059669',
                      boxShadow: '0 0 8px rgba(5, 150, 105, 0.85)',
                    }"
                  />
                  <span
                    class="absolute -top-5 left-0 px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold vh-mono leading-none text-white shadow-sm pointer-events-none"
                    style="background-color: #059669;"
                  >
                    M{{ box.measureNumber }}
                  </span>
                </template>

                <!-- 待命起奏高亮框 -->
                <span
                  v-else-if="isStandbyStartBox(box.measureNumber)"
                  class="absolute -top-5 left-0 px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold vh-mono leading-none text-white shadow-sm pointer-events-none whitespace-nowrap"
                  style="background-color: #0F172A;"
                >
                  {{ accompanimentStore.isCalibrating ? `待打点 M${box.measureNumber}` : `起奏 M${box.measureNumber}` }}
                </span>

                <!-- A-B 循环标记（起止标记） -->
                <span
                  v-if="store.loopRange && box.measureNumber === store.loopRange.start"
                  class="absolute bottom-0.5 left-0.5 px-1 rounded-[3px] text-[9px] font-bold vh-mono text-white pointer-events-none"
                  style="background-color: #0284C7;"
                >
                  A
                </span>
                <span
                  v-if="store.loopRange && box.measureNumber === store.loopRange.end"
                  class="absolute bottom-0.5 right-0.5 px-1 rounded-[3px] text-[9px] font-bold vh-mono text-white pointer-events-none"
                  style="background-color: #0284C7;"
                >
                  B
                </span>

                <!-- 显示全部框线时的小节角标 -->
                <span
                  v-if="showAllBoxes && !isActiveBox(box.measureNumber) && !isStandbyStartBox(box.measureNumber)"
                  class="absolute top-0.5 left-0.5 px-1 rounded-[3px] text-[9px] font-medium vh-mono leading-tight pointer-events-none"
                  :style="
                    isInLoop(box.measureNumber)
                      ? { backgroundColor: 'rgba(14, 165, 233, 0.85)', color: '#FFFFFF' }
                      : { backgroundColor: 'rgba(15, 23, 42, 0.45)', color: '#FFFFFF' }
                  "
                >
                  {{ box.measureNumber }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useSheetStore } from '../../stores/sheetStore';
import { useAccompanimentStore } from '../../stores/accompanimentStore';
import { MeasureAnchorBox, OriginalScorePage } from '../../types/music';
import { loadScorePageUrls } from '../../utils/scoreImageStorage';

defineEmits<{
  (e: 'edit-anchors'): void;
  (e: 'transcribe-to-digital'): void;
}>();

const store = useSheetStore();
const accompanimentStore = useAccompanimentStore();

const pageUrls = ref<Record<string, string>>({});
const isLoadingPages = ref(false);
const showAllBoxes = ref(true);
const wideZoom = ref(false);

const pageMetas = computed<OriginalScorePage[]>(() => {
  const raw = store.currentSheet.originalScore?.pages || [];
  return [...raw].sort((a, b) => a.pageIndex - b.pageIndex);
});

const allAnchors = computed<MeasureAnchorBox[]>(() => {
  return store.currentSheet.originalScore?.anchors || [];
});

const anchorsByPage = computed(() => {
  const map = new Map<number, MeasureAnchorBox[]>();
  for (const anc of allAnchors.value) {
    const list = map.get(anc.pageIndex) || [];
    list.push(anc);
    map.set(anc.pageIndex, list);
  }
  return map;
});

const totalMeasures = computed(() => {
  return allAnchors.value.length > 0 ? allAnchors.value.length : store.currentSheet.measures.length;
});

const hasDigitalVersion = computed(() => {
  return store.currentSheet.measures.some((m) => m.notes && m.notes.length > 0);
});

const standbyMeasureNumber = computed(() => {
  if (accompanimentStore.isCalibrating) {
    return Math.max(1, Math.min(accompanimentStore.nextTargetMeasure, totalMeasures.value));
  }
  if (store.loopRange) {
    return store.loopRange.start;
  }
  return 1;
});

const missingImagesWarning = computed(() => {
  if (isLoadingPages.value || pageMetas.value.length === 0) return false;
  return pageMetas.value.some((p) => !pageUrls.value[p.id]);
});

function getAnchorsForPage(pageIndex: number): MeasureAnchorBox[] {
  return anchorsByPage.value.get(pageIndex) || [];
}

function isActiveBox(measureNumber: number): boolean {
  return (
    store.isPerformanceActive &&
    !store.isPreBeat &&
    store.currentMeasureIndex === measureNumber - 1
  );
}

function isStandbyStartBox(measureNumber: number): boolean {
  if (store.isPerformanceActive && !store.isPreBeat) return false;
  return measureNumber === standbyMeasureNumber.value;
}

function isInLoop(measureNumber: number): boolean {
  if (!store.loopRange) return false;
  return measureNumber >= store.loopRange.start && measureNumber <= store.loopRange.end;
}

function getAnchorBoxStyle(box: MeasureAnchorBox) {
  const active = isActiveBox(box.measureNumber);
  const standby = isStandbyStartBox(box.measureNumber);
  const inLoop = isInLoop(box.measureNumber);

  const base = {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.w * 100}%`,
    height: `${box.h * 100}%`,
    borderRadius: '4px',
  };

  if (active) {
    return {
      ...base,
      border: '2.5px solid #059669',
      backgroundColor: 'rgba(5, 150, 105, 0.08)',
      boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.22)',
      zIndex: 15,
    };
  }

  if (standby) {
    return {
      ...base,
      border: '2px dashed #059669',
      backgroundColor: 'rgba(5, 150, 105, 0.05)',
      zIndex: 10,
    };
  }

  if (inLoop) {
    return {
      ...base,
      border: '2px solid rgba(14, 165, 233, 0.85)',
      backgroundColor: 'rgba(14, 165, 233, 0.08)',
      zIndex: 8,
    };
  }

  if (showAllBoxes.value) {
    return {
      ...base,
      border: '1px dashed rgba(15, 23, 42, 0.20)',
      backgroundColor: 'transparent',
      zIndex: 5,
    };
  }

  return {
    ...base,
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    zIndex: 5,
  };
}

let loadSeq = 0;

watch(
  () => store.currentSheet,
  async () => {
    const seq = ++loadSeq;
    const metas = pageMetas.value;
    if (metas.length === 0) {
      pageUrls.value = {};
      return;
    }

    const staticUrls: Record<string, string> = {};
    const idbIds: string[] = [];
    for (const meta of metas) {
      if (meta.staticUrl) {
        staticUrls[meta.id] = meta.staticUrl;
      } else {
        idbIds.push(meta.id);
      }
    }

    if (idbIds.length === 0) {
      pageUrls.value = staticUrls;
      isLoadingPages.value = false;
      return;
    }

    isLoadingPages.value = true;
    try {
      const idbUrls = await loadScorePageUrls(idbIds);
      if (seq === loadSeq) {
        pageUrls.value = { ...staticUrls, ...idbUrls };
      }
    } finally {
      if (seq === loadSeq) {
        isLoadingPages.value = false;
      }
    }
  },
  { immediate: true }
);
</script>
