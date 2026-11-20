<template>
  <div
    class="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    @click.self="$emit('close')"
  >
    <div
      class="vh-modal max-w-xl w-full max-h-[90vh] flex flex-col text-[#0F172A] overflow-hidden"
      style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;"
    >
      <!-- 顶部标头 -->
      <header
        class="px-5 py-4 flex items-center justify-between shrink-0"
        style="background-color: #0f172a; color: #ffffff;"
      >
        <div>
          <h3 class="vh-headline text-base sm:text-lg font-semibold flex items-center gap-2 text-white">
            <span>🎼</span>
            <span>原件曲谱转义为数字简谱</span>
          </h3>
          <p class="text-xs text-[#94A3B8] mt-0.5">
            识别原件音符、八度点、减时线与古筝指法，转义后可切换 21 弦亮弦与古筝示范发声
          </p>
        </div>

        <button
          type="button"
          class="w-8 h-8 rounded-[8px] bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center transition-colors cursor-pointer"
          @click="$emit('close')"
        >
          ✕
        </button>
      </header>

      <!-- 主体表单区 -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC] text-xs">
        <!-- 当前原件摘要 -->
        <div
          class="vh-card p-3.5 flex flex-wrap items-center justify-between gap-2"
          style="background-color: #f0fdf4; border-color: rgba(5, 150, 105, 0.35);"
        >
          <div class="space-y-0.5">
            <div class="font-semibold text-sm text-[#0F172A]">
              《{{ sheet.title }}》
            </div>
            <div class="text-[#047857] vh-mono">
              共 {{ pageCount }} 页原件 · {{ anchorCount }} 个小节埋点
            </div>
          </div>
          <span class="vh-chip vh-chip-success font-semibold">
            保留原件可随时切回
          </span>
        </div>

        <!-- 提供商预设 -->
        <div class="vh-card p-4 space-y-3">
          <div class="vh-headline text-sm font-semibold text-[#0F172A]">
            选择视觉识谱大模型（API 参数与工作台同步记忆）
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="preset in VISION_PROVIDER_PRESETS"
              :key="preset.key"
              type="button"
              class="px-2.5 py-2 rounded-[8px] text-left border transition-colors cursor-pointer"
              :style="
                apiConfig.model === preset.model
                  ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                  : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
              "
              @click="applyPreset(preset.baseUrl, preset.model)"
            >
              <div class="font-semibold text-[11px]">{{ preset.label }}</div>
              <div class="vh-mono text-[9px] opacity-75 truncate">{{ preset.short }}</div>
            </button>
          </div>

          <div>
            <label class="block text-[#0F172A] font-medium mb-1">API Base URL</label>
            <input
              v-model="apiConfig.baseUrl"
              type="text"
              placeholder="https://api.deepseek.com/v1"
              class="vh-input vh-mono w-full"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[#0F172A] font-medium">API Key</label>
              <button
                type="button"
                class="text-xs font-semibold text-[#059669] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                :disabled="isTestingConnection"
                @click="runConnectionTest"
              >
                <span v-if="isTestingConnection" class="animate-spin">🔄</span>
                <span>{{ isTestingConnection ? '测试中...' : '🔍 测试连通性' }}</span>
              </button>
            </div>
            <input
              v-model="apiConfig.apiKey"
              type="password"
              placeholder="sk-..."
              class="vh-input vh-mono w-full"
            />
          </div>

          <div
            v-if="testResult"
            class="p-2.5 rounded-[8px] vh-mono text-[11px] whitespace-pre-wrap leading-relaxed"
            :class="testResult.startsWith('✅') ? 'vh-chip-success' : 'vh-chip-error'"
          >
            {{ testResult }}
          </div>

          <div>
            <label class="block text-[#0F172A] font-medium mb-1">视觉模型代号 (Vision Model)</label>
            <input
              v-model="apiConfig.model"
              type="text"
              placeholder="qwen-vl-max"
              class="vh-input vh-mono w-full"
            />
          </div>
        </div>

        <!-- 进度与报错 -->
        <div
          v-if="isTranscribing"
          class="vh-card p-3.5 space-y-2 border-[#059669]"
          style="background-color: #f0fdf4;"
        >
          <div class="flex items-center justify-between font-semibold text-[#065F46]">
            <span>🔄 {{ progressText }}</span>
            <span class="vh-mono">{{ progressPercent }}%</span>
          </div>
          <div class="w-full h-2 rounded-full bg-white overflow-hidden border border-[#A7F3D0]">
            <div
              class="h-full transition-all duration-300"
              style="background-color: #059669;"
              :style="{ width: `${progressPercent}%` }"
            />
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="p-3 rounded-[8px] vh-chip-error vh-mono text-[11px] whitespace-pre-wrap leading-relaxed"
        >
          {{ errorMessage }}
        </div>
      </div>

      <!-- 底部操作栏 -->
      <footer class="px-5 py-3 bg-white border-t border-[#E2E8F0] flex items-center justify-end gap-2.5 shrink-0">
        <button
          type="button"
          class="vh-btn vh-btn-md vh-btn-ghost font-medium border border-[#E2E8F0]"
          :disabled="isTranscribing"
          @click="$emit('close')"
        >
          取消
        </button>

        <button
          type="button"
          class="vh-btn vh-btn-md vh-btn-sage font-semibold"
          style="background-color: #059669; color: #FFFFFF; border-radius: 8px;"
          :disabled="isTranscribing || pageCount === 0"
          @click="startTranscription"
        >
          <span v-if="isTranscribing" class="animate-spin">🔄</span>
          <span v-else>🚀</span>
          <span>{{ isTranscribing ? '转义生成中...' : '开始转义为数字简谱' }}</span>
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { SheetMusic } from '../../types/music';
import { useSheetStore } from '../../stores/sheetStore';
import {
  VISION_PROVIDER_PRESETS,
  VisionConfig,
  normalizeTranscribedMeasures,
  parseSheetWithVision,
  testApiConnection,
} from '../scanner/VisionParser';
import { exportOriginalPagesDataUrls } from '../../utils/scoreImageStorage';
import { downscaleDataUrlForVision } from '../../utils/pdfHelper';

const props = defineProps<{
  sheet: SheetMusic;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useSheetStore();

const pageCount = computed(() => props.sheet.originalScore?.pages?.length || 0);
const anchorCount = computed(() => props.sheet.originalScore?.anchors?.length || 0);

const apiConfig = ref<VisionConfig>({
  baseUrl: localStorage.getItem('omr_api_base') || 'https://api.deepseek.com/v1',
  apiKey: localStorage.getItem('omr_api_key') || '',
  model: localStorage.getItem('omr_api_model') || 'deepseek-v4-flash-vision-exp',
});

const isTestingConnection = ref(false);
const testResult = ref('');
const isTranscribing = ref(false);
const currentStep = ref(0);
const totalSteps = ref(1);
const progressText = ref('');
const errorMessage = ref('');

const progressPercent = computed(() => {
  if (totalSteps.value <= 0) return 0;
  return Math.min(100, Math.round((currentStep.value / totalSteps.value) * 100));
});

function applyPreset(baseUrl: string, model: string) {
  testResult.value = '';
  apiConfig.value.baseUrl = baseUrl;
  apiConfig.value.model = model;
}

async function runConnectionTest() {
  if (!apiConfig.value.apiKey.trim()) {
    testResult.value = '⚠️ 请先输入 API Key 再进行测试';
    return;
  }
  isTestingConnection.value = true;
  testResult.value = '';
  try {
    const res = await testApiConnection(apiConfig.value);
    testResult.value = res.message;
  } catch (err: any) {
    testResult.value = `❌ 测试异常: ${err?.message || err}`;
  } finally {
    isTestingConnection.value = false;
  }
}

async function startTranscription() {
  const original = props.sheet.originalScore;
  if (!original || original.pages.length === 0) {
    errorMessage.value = '当前曲谱缺少原件页面数据，无法执行转义。';
    return;
  }
  if (!apiConfig.value.apiKey.trim()) {
    errorMessage.value = '请先填写有效的视觉大模型 API Key！';
    return;
  }

  localStorage.setItem('omr_api_base', apiConfig.value.baseUrl);
  localStorage.setItem('omr_api_key', apiConfig.value.apiKey);
  localStorage.setItem('omr_api_model', apiConfig.value.model);

  isTranscribing.value = true;
  errorMessage.value = '';
  currentStep.value = 0;

  try {
    const sortedPages = [...original.pages].sort((a, b) => a.pageIndex - b.pageIndex);
    totalSteps.value = sortedPages.length;
    progressText.value = '正在读取高清原件图片...';

    const dataUrls = await exportOriginalPagesDataUrls(sortedPages);
    const pageResults: SheetMusic[] = [];

    for (let i = 0; i < sortedPages.length; i++) {
      const page = sortedPages[i];
      const rawUrl = dataUrls[page.id];
      if (!rawUrl) {
        throw new Error(`第 ${i + 1} 页原件图像丢失，请先重新导入原件。`);
      }

      progressText.value = `正在转义第 ${i + 1} / ${sortedPages.length} 页简谱...`;
      const compactUrl = await downscaleDataUrlForVision(rawUrl, 1400, 0.8);
      const parsed = await parseSheetWithVision(compactUrl, apiConfig.value);
      pageResults.push(parsed);
      currentStep.value = i + 1;
    }

    const { measures, parts } = normalizeTranscribedMeasures(
      pageResults,
      original.anchors.length,
      props.sheet.timeSignature
    );

    const firstMeta = pageResults[0];
    const parsedTimeSig: [number, number] | undefined =
      Array.isArray(firstMeta?.timeSignature) && firstMeta.timeSignature.length === 2
        ? [
            Math.max(1, Number(firstMeta.timeSignature[0]) || 2),
            Math.max(1, Number(firstMeta.timeSignature[1]) || 4),
          ]
        : undefined;

    store.attachDigitalTranscription(props.sheet.id, {
      measures,
      parts,
      key: firstMeta?.key || props.sheet.key,
      timeSignature: parsedTimeSig || props.sheet.timeSignature,
      defaultBpm: Number(firstMeta?.defaultBpm) || props.sheet.defaultBpm,
    });

    emit('close');
  } catch (err: any) {
    errorMessage.value = err?.message || '转义失败，请检查网络或视觉模型配置。';
  } finally {
    isTranscribing.value = false;
  }
}
</script>
