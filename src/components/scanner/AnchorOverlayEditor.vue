<template>
  <div
    ref="overlayRef"
    class="relative inline-block w-full select-none"
    @pointermove="handlePointerMove"
    @pointerup="handlePointerUp"
    @pointercancel="handlePointerUp"
  >
    <img
      :src="imageUrl"
      alt="曲谱原件埋点编辑画布"
      class="block w-full h-auto pointer-events-none select-none rounded-[4px]"
      draggable="false"
    />

    <!-- 原件上方埋点框交互覆层 -->
    <div class="absolute inset-0">
      <div
        v-for="item in annotatedSystems"
        :key="item.system.id"
        class="absolute transition-colors"
        :style="getSystemBoxStyle(item.system)"
        @click="handleSystemClick($event, item.system)"
      >
        <!-- 行首/右下角状态标签 -->
        <div
          class="absolute -top-5 left-0 px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold vh-mono leading-none pointer-events-none whitespace-nowrap flex items-center gap-1 shadow-sm"
          :style="
            item.system.id === selectedSystemId
              ? { backgroundColor: '#059669', color: '#FFFFFF' }
              : { backgroundColor: '#0F172A', color: '#FFFFFF', opacity: 0.85 }
          "
        >
          <span>M{{ item.startMeasure }}~M{{ item.endMeasure }}</span>
          <span class="opacity-80">({{ item.measureCount }}小节)</span>
        </div>

        <!-- 小节切分格线与编号徽章 -->
        <div
          v-for="cell in item.cells"
          :key="`cell-${item.system.id}-${cell.measureNumber}`"
          class="absolute inset-y-0 border-r pointer-events-none"
          :style="{
            left: `${cell.leftPct}%`,
            width: `${cell.widthPct}%`,
            borderRightColor:
              cell.isLast ? 'transparent' : item.system.id === selectedSystemId ? '#059669' : 'rgba(15, 23, 42, 0.55)',
            borderRightWidth: cell.isLast ? '0px' : '1.5px',
            borderRightStyle: 'dashed',
          }"
        >
          <span
            class="absolute top-0.5 left-1 px-1 py-0.2 rounded-[3px] text-[9px] font-semibold vh-mono leading-tight"
            :style="
              item.system.id === selectedSystemId
                ? { backgroundColor: 'rgba(5, 150, 105, 0.88)', color: '#FFFFFF' }
                : { backgroundColor: 'rgba(15, 23, 42, 0.65)', color: '#FFFFFF' }
            "
          >
            {{ cell.measureNumber }}
          </span>
        </div>

        <!-- 内部小节分割竖线交互手柄（20px 宽松触控热区，touch-action: none 仅限手柄本身） -->
        <template v-for="barIdx in getInteriorBarIndices(item.system)" :key="`bar-${item.system.id}-${barIdx}`">
          <div
            v-if="toolMode === 'drag' && item.system.id === selectedSystemId"
            class="absolute inset-y-0 w-5 -ml-2.5 flex items-center justify-center cursor-ew-resize z-20"
            style="touch-action: none;"
            title="左右拖拽调整小节线位置"
            @pointerdown="startDrag($event, item.system, 'bar', barIdx)"
            @click.stop
          >
            <div class="w-1 h-full bg-[#059669] opacity-85 relative flex items-center justify-center">
              <span class="w-3.5 h-5 rounded-full bg-[#059669] border-2 border-white shadow flex items-center justify-center text-[8px] text-white font-bold">
                ↔
              </span>
            </div>
          </div>

          <button
            v-else-if="toolMode === 'remove-bar'"
            type="button"
            class="absolute inset-y-0 w-6 -ml-3 flex items-center justify-center cursor-pointer z-20 group"
            title="点击删除此小节分割线"
            @click.stop="handleRemoveBarline(item.system, barIdx)"
          >
            <span class="w-0.5 h-full bg-[#EF4444] group-hover:w-1 transition-all" />
            <span class="absolute w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center shadow border border-white">
              ✕
            </span>
          </button>
        </template>

        <!-- 选中乐行的四边缩放手柄 -->
        <template v-if="toolMode === 'drag' && item.system.id === selectedSystemId">
          <!-- 上边界手柄 -->
          <div
            class="absolute -top-2 inset-x-3 h-4 cursor-ns-resize z-20 flex items-center justify-center"
            style="touch-action: none;"
            title="上下拖拽调整乐行上边界"
            @pointerdown="startDrag($event, item.system, 'top')"
            @click.stop
          >
            <span class="w-10 h-2 rounded-full bg-[#059669] border border-white shadow" />
          </div>

          <!-- 下边界手柄 -->
          <div
            class="absolute -bottom-2 inset-x-3 h-4 cursor-ns-resize z-20 flex items-center justify-center"
            style="touch-action: none;"
            title="上下拖拽调整乐行下边界"
            @pointerdown="startDrag($event, item.system, 'bottom')"
            @click.stop
          >
            <span class="w-10 h-2 rounded-full bg-[#059669] border border-white shadow" />
          </div>

          <!-- 左边界手柄 -->
          <div
            class="absolute inset-y-2 -left-2 w-4 cursor-ew-resize z-20 flex items-center justify-center"
            style="touch-action: none;"
            title="左右拖拽调整乐行左边界"
            @pointerdown="startDrag($event, item.system, 'left')"
            @click.stop
          >
            <span class="w-2 h-8 rounded-full bg-[#0F172A] border border-white shadow" />
          </div>

          <!-- 右边界手柄 -->
          <div
            class="absolute inset-y-2 -right-2 w-4 cursor-ew-resize z-20 flex items-center justify-center"
            style="touch-action: none;"
            title="左右拖拽调整乐行右边界"
            @pointerdown="startDrag($event, item.system, 'right')"
            @click.stop
          >
            <span class="w-2 h-8 rounded-full bg-[#0F172A] border border-white shadow" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  DetectedSystem,
  insertBarlineInSystem,
  normalizeSystem,
  removeBarlineInSystem,
} from '../../engine/ScoreLayoutDetector';

export type EditorToolMode = 'drag' | 'add-bar' | 'remove-bar';

const props = defineProps<{
  imageUrl: string;
  systems: DetectedSystem[];
  selectedSystemId: string | null;
  toolMode: EditorToolMode;
  measureStartNumber: number;
}>();

const emit = defineEmits<{
  (e: 'update:systems', value: DetectedSystem[]): void;
  (e: 'select-system', id: string): void;
}>();

const overlayRef = ref<HTMLElement | null>(null);

interface DragState {
  systemId: string;
  handle: 'top' | 'bottom' | 'left' | 'right' | 'bar';
  barIndex?: number;
  pointerId: number;
}

const activeDrag = ref<DragState | null>(null);

const annotatedSystems = computed(() => {
  const sorted = [...props.systems].sort((a, b) => a.yTop - b.yTop);
  let cursor = props.measureStartNumber;

  return sorted.map((sys) => {
    const span = Math.max(0.01, sys.xRight - sys.xLeft);
    const count = Math.max(1, sys.barlines.length - 1);
    const startMeasure = cursor;
    const cells = [];

    for (let i = 0; i < count; i++) {
      const leftPct = ((sys.barlines[i] - sys.xLeft) / span) * 100;
      const widthPct = ((sys.barlines[i + 1] - sys.barlines[i]) / span) * 100;
      cells.push({
        measureNumber: cursor,
        leftPct,
        widthPct,
        isLast: i === count - 1,
      });
      cursor++;
    }

    return {
      system: sys,
      startMeasure,
      endMeasure: cursor - 1,
      measureCount: count,
      cells,
    };
  });
});

function getSystemBoxStyle(sys: DetectedSystem) {
  const isSelected = sys.id === props.selectedSystemId;
  return {
    left: `${sys.xLeft * 100}%`,
    top: `${sys.yTop * 100}%`,
    width: `${Math.max(0.02, sys.xRight - sys.xLeft) * 100}%`,
    height: `${Math.max(0.02, sys.yBottom - sys.yTop) * 100}%`,
    border: isSelected ? '2px solid #059669' : '1.5px solid rgba(15, 23, 42, 0.5)',
    backgroundColor: isSelected ? 'rgba(5, 150, 105, 0.07)' : 'rgba(15, 23, 42, 0.03)',
    borderRadius: '4px',
    cursor: props.toolMode === 'add-bar' ? 'crosshair' : 'pointer',
  };
}

function getInteriorBarIndices(sys: DetectedSystem): number[] {
  const indices: number[] = [];
  for (let i = 1; i < sys.barlines.length - 1; i++) {
    indices.push(i);
  }
  return indices;
}

function handleSystemClick(e: MouseEvent, sys: DetectedSystem) {
  emit('select-system', sys.id);

  if (props.toolMode === 'add-bar' && overlayRef.value) {
    const rect = overlayRef.value.getBoundingClientRect();
    if (rect.width <= 0) return;
    const normX = (e.clientX - rect.left) / rect.width;
    const updated = insertBarlineInSystem(sys, normX);
    emit(
      'update:systems',
      props.systems.map((s) => (s.id === sys.id ? updated : s))
    );
  }
}

function handleRemoveBarline(sys: DetectedSystem, barIdx: number) {
  emit('select-system', sys.id);
  const updated = removeBarlineInSystem(sys, barIdx);
  emit(
    'update:systems',
    props.systems.map((s) => (s.id === sys.id ? updated : s))
  );
}

function startDrag(
  e: PointerEvent,
  sys: DetectedSystem,
  handle: DragState['handle'],
  barIndex?: number
) {
  e.preventDefault();
  e.stopPropagation();
  const target = e.currentTarget as HTMLElement | null;
  if (target && typeof target.setPointerCapture === 'function') {
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // ignore if synthetic event
    }
  }
  emit('select-system', sys.id);
  activeDrag.value = {
    systemId: sys.id,
    handle,
    barIndex,
    pointerId: e.pointerId,
  };
}

function handlePointerMove(e: PointerEvent) {
  const drag = activeDrag.value;
  if (!drag || drag.pointerId !== e.pointerId || !overlayRef.value) return;

  const rect = overlayRef.value.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

  const targetSys = props.systems.find((s) => s.id === drag.systemId);
  if (!targetSys) return;

  let next: DetectedSystem = {
    ...targetSys,
    barlines: [...targetSys.barlines],
    confidence: 'manual',
  };

  const minH = 0.025;
  const minW = 0.025;

  if (drag.handle === 'top') {
    next.yTop = Math.min(normY, next.yBottom - minH);
  } else if (drag.handle === 'bottom') {
    next.yBottom = Math.max(normY, next.yTop + minH);
  } else if (drag.handle === 'left') {
    const upperBound = next.barlines.length > 1 ? next.barlines[1] - minW : next.xRight - 0.06;
    const clampedLeft = Math.min(normX, upperBound);
    next.xLeft = clampedLeft;
    next.barlines[0] = clampedLeft;
  } else if (drag.handle === 'right') {
    const lowerBound =
      next.barlines.length > 1 ? next.barlines[next.barlines.length - 2] + minW : next.xLeft + 0.06;
    const clampedRight = Math.max(normX, lowerBound);
    next.xRight = clampedRight;
    next.barlines[next.barlines.length - 1] = clampedRight;
  } else if (drag.handle === 'bar' && drag.barIndex !== undefined) {
    const idx = drag.barIndex;
    if (idx > 0 && idx < next.barlines.length - 1) {
      const low = next.barlines[idx - 1] + minW;
      const high = next.barlines[idx + 1] - minW;
      if (high >= low) {
        next.barlines[idx] = Math.max(low, Math.min(high, normX));
      }
    }
  }

  next = normalizeSystem(next);
  emit(
    'update:systems',
    props.systems.map((s) => (s.id === next.id ? next : s))
  );
}

function handlePointerUp(e: PointerEvent) {
  if (activeDrag.value && activeDrag.value.pointerId === e.pointerId) {
    activeDrag.value = null;
  }
}
</script>
