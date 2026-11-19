<template>
  <div
    class="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
    @click.self="$emit('close')"
  >
    <div
      class="vh-modal max-w-6xl w-full max-h-[92vh] flex flex-col text-[#0F172A] overflow-hidden"
      style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;"
    >
      <!-- 弹窗顶部标头 (Primary Navy #0F172A) -->
      <header
        class="px-6 py-4 flex items-center justify-between shrink-0"
        style="background-color: #0f172a; color: #ffffff;"
      >
        <div>
          <h3 class="vh-headline text-base sm:text-lg font-semibold flex items-center gap-2 text-white">
            <span>📷</span>
            <span>多页 PDF / 拍照智能识谱工作台</span>
          </h3>
          <p class="text-xs text-[#94A3B8] mt-0.5">
            左侧预览与勾选曲谱页，右侧配置大模型识别并命名保存至个人曲谱库
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

      <!-- 主体双栏工作区 -->
      <div class="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#F8FAFC]">
        
        <!-- ==================== 左侧栏：导入曲谱多页预览与勾选区 ==================== -->
        <div class="md:col-span-7 flex flex-col gap-3 min-w-0">
          <!-- 页码统计与多选 Filter/Action 控制条 -->
          <div class="vh-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 vh-shadow-sm">
            <div class="text-xs font-medium text-[#64748B] flex items-center gap-2">
              <span>📄</span>
              <span v-if="pages.length > 0">
                共 <span class="vh-mono text-[#0F172A] font-bold">{{ pages.length }}</span> 页 · 已勾选
                <span class="vh-mono text-[#059669] font-bold">{{ selectedPages.length }}</span> 页参与识别
              </span>
              <span v-else class="text-[#64748B]">尚未导入曲谱页面</span>
            </div>

            <div v-if="pages.length > 0" class="flex items-center gap-1.5">
              <button
                type="button"
                @click="selectAllPages"
                class="vh-chip vh-chip-filter hover:border-[#0F172A] cursor-pointer transition-colors"
              >
                全选所有页
              </button>
              <button
                type="button"
                @click="selectOnlyActivePage"
                class="vh-chip vh-chip-filter hover:border-[#0F172A] cursor-pointer transition-colors"
              >
                仅选当前页
              </button>
              <button
                type="button"
                @click="clearAllPages"
                class="vh-chip vh-chip-error cursor-pointer transition-colors"
              >
                清空重选
              </button>
            </div>
          </div>

          <!-- PDF 转图加载状态 -->
          <div v-if="isConvertingPdf" class="vh-chip vh-chip-warning px-4 py-3 text-xs flex items-center gap-3">
            <span class="animate-spin text-base">🔄</span>
            <span>正在解析并优化曲谱为高清图像，请稍候...</span>
          </div>

          <!-- 识别完成摘要条 -->
          <div
            v-if="recognizedSheet"
            class="vh-card px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
            style="background-color: rgba(34, 197, 94, 0.085); border-color: rgba(34, 197, 94, 0.35); color: #16a34a;"
          >
            <div class="flex items-center gap-2 font-semibold">
              <span>✅</span>
              <span>已合并识别出《{{ customTitle || recognizedSheet.title }}》</span>
            </div>
            <div class="vh-mono flex items-center gap-3 text-[11px] font-semibold">
              <span>调号: {{ recognizedSheet.key }}</span>
              <span>拍号: {{ recognizedSheet.timeSignature[0] }}/{{ recognizedSheet.timeSignature[1] }}</span>
              <span>{{ recognizedSheet.measures.length }} 小节 / {{ totalRecognizedNotes }} 音符</span>
            </div>
          </div>

          <!-- 当前页高清大图预览 -->
          <div
            v-if="activePage"
            class="relative flex-1 min-h-[260px] max-h-[46vh] rounded-[8px] overflow-auto border border-[#E2E8F0] bg-[#0F172A] flex items-start justify-center p-3"
          >
            <img
              :src="activePage.dataUrl"
              :alt="`第 ${activePage.pageNum} 页预览`"
              class="max-w-full h-auto object-contain rounded-[4px]"
            />
            <div class="vh-mono sticky top-2 right-2 px-2.5 py-1 rounded-[4px] bg-[#0F172A]/85 border border-white/15 text-white text-[11px] font-medium ml-auto self-start">
              第 {{ activePage.pageNum }} / {{ pages.length }} 页
            </div>
          </div>

          <!-- 空状态上传引导 -->
          <label
            v-else
            class="flex-1 min-h-[280px] rounded-[8px] border-2 border-dashed border-[#CBD5E1] hover:border-[#0F172A] bg-white hover:bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors"
          >
            <span class="text-5xl mb-3">🎼</span>
            <span class="vh-headline text-sm font-semibold text-[#0F172A]">点击此处或右侧“导入 PDF / 多张图片”</span>
            <span class="text-xs text-[#64748B] mt-1.5 max-w-sm leading-relaxed">
              支持单份多页古筝 PDF 曲谱自动拆页，也可连续拍照或一次选取多张琴谱照片拼合识别
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              class="hidden"
              @change="handleFileSelect"
            />
          </label>

          <!-- 多页缩略图勾选胶片栏 (18px x 18px, 4px radius Checkbox) -->
          <div v-if="pages.length > 0" class="vh-card p-3.5">
            <div class="text-xs font-medium text-[#64748B] mb-2.5">
              点击缩略图切换预览，勾选复选框决定哪些页参与 AI 拼接识别：
            </div>
            <div class="flex items-stretch gap-3 overflow-x-auto pb-1">
              <div
                v-for="(page, idx) in pages"
                :key="page.id"
                @click="activePageIdx = idx"
                class="relative w-24 shrink-0 rounded-[8px] border p-1.5 cursor-pointer transition-all bg-[#F8FAFC] flex flex-col items-center"
                :style="
                  activePageIdx === idx
                    ? { borderColor: '#0F172A', borderWidth: '2px', backgroundColor: '#FFFFFF' }
                    : page.selected
                    ? { borderColor: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.04)' }
                    : { borderColor: '#E2E8F0', opacity: 0.72 }
                "
              >
                <div class="w-full h-24 overflow-hidden rounded-[4px] bg-white flex items-center justify-center border border-[#E2E8F0]">
                  <img :src="page.dataUrl" :alt="`第 ${page.pageNum} 页`" class="w-full h-full object-contain" />
                </div>

                <label
                  class="mt-2 flex items-center gap-2 text-xs font-medium cursor-pointer select-none"
                  :style="{ color: page.selected ? '#0F172A' : '#64748B' }"
                  @click.stop
                >
                  <input
                    v-model="page.selected"
                    type="checkbox"
                    class="vh-checkbox"
                  />
                  <span class="vh-mono text-[11px]">第 {{ page.pageNum }} 页</span>
                </label>

                <button
                  type="button"
                  @click.stop="removePage(idx)"
                  title="移除此页"
                  class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0F172A] hover:bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== 右侧栏：导入操作、大模型设置与命名存库 ==================== -->
        <div class="md:col-span-5 flex flex-col gap-4 min-w-0">
          
          <!-- 1. 导入/追加曲谱页按钮区 -->
          <div class="vh-card p-4 vh-shadow-sm">
            <div class="vh-headline text-sm font-medium text-[#0F172A] mb-3 flex items-center gap-1.5">
              <span>📂</span>
              <span>1. 导入或追加曲谱页面</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col items-center justify-center py-3 px-2 border border-dashed border-[#0F172A] rounded-[8px] bg-[#F8FAFC] hover:bg-[#F1F5F9] cursor-pointer transition-colors text-center">
                <span class="text-xl mb-1">📸</span>
                <span class="text-xs font-semibold text-[#0F172A]">拍照添加一页</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  @change="handleFileSelect"
                />
              </label>

              <label class="flex flex-col items-center justify-center py-3 px-2 border border-[#E2E8F0] hover:border-[#0F172A] rounded-[8px] bg-white hover:bg-[#F8FAFC] cursor-pointer transition-colors text-center">
                <span class="text-xl mb-1">📁</span>
                <span class="text-xs font-semibold text-[#0F172A]">导入 PDF / 多图</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  class="hidden"
                  @change="handleFileSelect"
                />
              </label>
            </div>
          </div>

          <!-- 2. 视觉大模型 API 配置 -->
          <div class="vh-card p-4 vh-shadow-sm space-y-3">
            <div class="flex items-center justify-between cursor-pointer" @click="showApiConfig = !showApiConfig">
              <span class="vh-headline text-sm font-medium text-[#0F172A] flex items-center gap-1.5">
                <span>⚙️</span>
                <span>2. 视觉大模型设置</span>
              </span>
              <span class="text-xs text-[#64748B] font-medium">{{ showApiConfig ? '收起 ▲' : '展开 ▼' }}</span>
            </div>

            <div v-if="showApiConfig" class="space-y-3 pt-1 text-xs">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  class="px-2.5 py-2 rounded-[8px] text-left border transition-colors cursor-pointer"
                  :style="
                    apiConfig.model === 'deepseek-v4-flash-vision-exp'
                      ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                      : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
                  "
                  @click="applyPreset('deepseek')"
                >
                  <div class="font-semibold text-[11px]">🤖 DeepSeek</div>
                  <div class="vh-mono text-[9px] opacity-75 truncate">v4-flash-vision-exp</div>
                </button>
                <button
                  type="button"
                  class="px-2.5 py-2 rounded-[8px] text-left border transition-colors cursor-pointer"
                  :style="
                    apiConfig.model === 'qwen-vl-max'
                      ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                      : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
                  "
                  @click="applyPreset('aliyun')"
                >
                  <div class="font-semibold text-[11px]">🇨🇳 通义千问</div>
                  <div class="vh-mono text-[9px] opacity-75 truncate">qwen-vl-max</div>
                </button>
                <button
                  type="button"
                  class="px-2.5 py-2 rounded-[8px] text-left border transition-colors cursor-pointer"
                  :style="
                    apiConfig.model === 'glm-4v-plus'
                      ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                      : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
                  "
                  @click="applyPreset('zhipu')"
                >
                  <div class="font-semibold text-[11px]">🇨🇳 智谱 AI</div>
                  <div class="vh-mono text-[9px] opacity-75 truncate">glm-4v-plus</div>
                </button>
                <button
                  type="button"
                  class="px-2.5 py-2 rounded-[8px] text-left border transition-colors cursor-pointer"
                  :style="
                    apiConfig.model.includes('Qwen2-VL')
                      ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                      : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
                  "
                  @click="applyPreset('siliconflow')"
                >
                  <div class="font-semibold text-[11px]">⚡ 硅基流动</div>
                  <div class="vh-mono text-[9px] opacity-75 truncate">Qwen2-VL-72B</div>
                </button>
                <button
                  type="button"
                  class="px-2.5 py-2 rounded-[8px] text-left border transition-colors cursor-pointer"
                  :style="
                    apiConfig.model === 'gpt-4o'
                      ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                      : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
                  "
                  @click="applyPreset('openai')"
                >
                  <div class="font-semibold text-[11px]">🌐 OpenAI</div>
                  <div class="vh-mono text-[9px] opacity-75 truncate">gpt-4o</div>
                </button>
              </div>

              <div>
                <label class="block text-[#0F172A] font-medium mb-1.5 text-xs">API Base URL</label>
                <input
                  v-model="apiConfig.baseUrl"
                  type="text"
                  placeholder="https://api.deepseek.com/v1"
                  class="vh-input vh-mono w-full"
                />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-[#0F172A] font-medium text-xs">API Key</label>
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
                <label class="block text-[#0F172A] font-medium mb-1.5 text-xs">视觉模型代号 (Vision Model)</label>
                <input
                  v-model="apiConfig.model"
                  type="text"
                  placeholder="deepseek-v4-flash-vision-exp"
                  class="vh-input vh-mono w-full"
                />
              </div>
            </div>
          </div>

          <!-- 3. 批量识别 & 命名保存至曲谱库 -->
          <div class="vh-card p-4 vh-shadow-sm space-y-3">
            <div class="vh-headline text-sm font-medium text-[#0F172A] flex items-center gap-1.5">
              <span>💾</span>
              <span>3. 多页识别并命名存入曲谱库</span>
            </div>

            <!-- 识别操作按钮 (Primary Navy #0F172A, disabled 0.4) -->
            <button
              type="button"
              class="vh-btn vh-btn-md vh-btn-primary w-full font-semibold"
              style="background-color: #0F172A; color: #FFFFFF; border-radius: 8px;"
              :disabled="isProcessing || selectedPages.length === 0 || isConvertingPdf"
              @click="startBatchRecognition"
            >
              <span v-if="isProcessing" class="animate-spin">🔄</span>
              <span>
                {{
                  isProcessing
                    ? recognitionProgress || 'AI 多页智能识谱中...'
                    : `🚀 开始识别所选页面 (共 ${selectedPages.length} 页)`
                }}
              </span>
            </button>

            <div
              v-if="errorMessage"
              class="p-3 rounded-[8px] vh-chip-error vh-mono text-xs whitespace-pre-wrap leading-relaxed"
            >
              {{ errorMessage }}
            </div>

            <!-- 命名与入库属性表单 -->
            <div class="space-y-3 pt-2 border-t border-[#F1F5F9] text-xs">
              <div>
                <label class="block text-[#0F172A] font-medium mb-1.5 text-xs">
                  新曲谱名称 <span class="text-[#EF4444]">*</span>
                </label>
                <input
                  v-model="customTitle"
                  type="text"
                  placeholder="例如：高山流水 / 井冈山上太阳红"
                  class="vh-input w-full font-medium"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[#0F172A] font-medium mb-1.5 text-xs">作者 / 来源备注</label>
                  <input
                    v-model="customAuthor"
                    type="text"
                    placeholder="例如：古筝考级 / PDF导入"
                    class="vh-input w-full"
                  />
                </div>
                <div>
                  <label class="block text-[#0F172A] font-medium mb-1.5 text-xs">难度分类</label>
                  <select
                    v-model="customDifficulty"
                    class="vh-input w-full font-medium"
                  >
                    <option value="入门">入门</option>
                    <option value="进阶">进阶</option>
                    <option value="考级">考级</option>
                    <option value="名曲演奏">名曲演奏</option>
                  </select>
                </div>
              </div>

              <!-- 命名保存按钮 (Tertiary Sage #059669, disabled 0.4) -->
              <button
                type="button"
                class="vh-btn vh-btn-md vh-btn-sage w-full font-semibold"
                style="background-color: #059669; color: #FFFFFF; border-radius: 8px;"
                :disabled="!recognizedSheet || !customTitle.trim() || isProcessing"
                @click="saveRecognizedScore"
              >
                <span>💾</span>
                <span>命名并保存至曲谱库</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- 底部快捷演示与关闭栏 -->
      <footer class="px-6 py-3 bg-white border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-3 text-xs">
          <span class="text-[#64748B] hidden sm:inline">快速体验内置示范谱：</span>
          <button
            type="button"
            class="font-semibold text-[#059669] hover:underline cursor-pointer"
            @click="loadPresetDemo('tangshi')"
          >
            《唐诗联唱》
          </button>
          <span class="text-[#E2E8F0]">|</span>
          <button
            type="button"
            class="font-semibold text-[#0F172A] hover:underline cursor-pointer"
            @click="loadPresetDemo('yuzhou')"
          >
            《渔舟唱晚》
          </button>
        </div>

        <button
          type="button"
          class="vh-btn vh-btn-sm vh-btn-ghost font-medium border border-[#E2E8F0]"
          @click="$emit('close')"
        >
          关闭窗口
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSheetStore } from '../../stores/sheetStore';
import { VisionConfig, parseSheetWithVision, testApiConnection } from './VisionParser';
import { SheetMusic, Measure } from '../../types/music';
import { tangshiScore } from '../../data/scores/tangshi';
import { yuzhouScore } from '../../data/scores/yuzhou';
import { convertPdfToImages, compressImageToDataUrl } from '../../utils/pdfHelper';

interface ImportedPage {
  id: string;
  dataUrl: string;
  selected: boolean;
  pageNum: number;
}

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useSheetStore();

const pages = ref<ImportedPage[]>([]);
const activePageIdx = ref(0);
const isConvertingPdf = ref(false);

const isProcessing = ref(false);
const recognitionProgress = ref('');
const recognizedSheet = ref<SheetMusic | null>(null);

const customTitle = ref('');
const customAuthor = ref('');
const customDifficulty = ref<'入门' | '进阶' | '考级' | '名曲演奏'>('考级');

const isTestingConnection = ref(false);
const testResult = ref('');
const errorMessage = ref('');
const showApiConfig = ref(true);

const apiConfig = ref<VisionConfig>({
  baseUrl: localStorage.getItem('omr_api_base') || 'https://api.deepseek.com/v1',
  apiKey: localStorage.getItem('omr_api_key') || '',
  model: localStorage.getItem('omr_api_model') || 'deepseek-v4-flash-vision-exp',
});

const selectedPages = computed(() => pages.value.filter((p) => p.selected));
const activePage = computed(() => pages.value[activePageIdx.value] || null);
const totalRecognizedNotes = computed(() => {
  if (!recognizedSheet.value) return 0;
  return recognizedSheet.value.measures.reduce((sum, m) => sum + (m.notes?.length || 0), 0);
});

function renumberPages() {
  pages.value.forEach((p, idx) => {
    p.pageNum = idx + 1;
  });
}

function selectAllPages() {
  pages.value.forEach((p) => {
    p.selected = true;
  });
}

function selectOnlyActivePage() {
  const cur = activePage.value;
  pages.value.forEach((p) => {
    p.selected = Boolean(cur && p.id === cur.id);
  });
}

function clearAllPages() {
  pages.value = [];
  activePageIdx.value = 0;
  recognizedSheet.value = null;
  errorMessage.value = '';
}

function removePage(idx: number) {
  pages.value.splice(idx, 1);
  renumberPages();
  if (activePageIdx.value >= pages.value.length) {
    activePageIdx.value = Math.max(0, pages.value.length - 1);
  }
}

// 预设配置快速应用
function applyPreset(provider: 'deepseek' | 'aliyun' | 'zhipu' | 'siliconflow' | 'openai') {
  testResult.value = '';
  switch (provider) {
    case 'deepseek':
      apiConfig.value.baseUrl = 'https://api.deepseek.com/v1';
      apiConfig.value.model = 'deepseek-v4-flash-vision-exp';
      break;
    case 'aliyun':
      apiConfig.value.baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
      apiConfig.value.model = 'qwen-vl-max';
      break;
    case 'zhipu':
      apiConfig.value.baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
      apiConfig.value.model = 'glm-4v-plus';
      break;
    case 'siliconflow':
      apiConfig.value.baseUrl = 'https://api.siliconflow.cn/v1';
      apiConfig.value.model = 'Qwen/Qwen2-VL-72B-Instruct';
      break;
    case 'openai':
      apiConfig.value.baseUrl = 'https://api.openai.com/v1';
      apiConfig.value.model = 'gpt-4o';
      break;
  }
}

async function runConnectionTest() {
  if (!apiConfig.value.apiKey) {
    testResult.value = '⚠️ 请先输入 API Key 再进行测试';
    return;
  }

  isTestingConnection.value = true;
  testResult.value = '';
  try {
    const res = await testApiConnection(apiConfig.value);
    testResult.value = res.message;
  } catch (err: any) {
    testResult.value = `❌ 测试异常: ${err.message || err}`;
  } finally {
    isTestingConnection.value = false;
  }
}

async function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  if (files.length === 0) return;

  errorMessage.value = '';
  isConvertingPdf.value = true;

  try {
    // 若用户尚未输入名称，从首个文件名自动去除扩展名填充
    if (!customTitle.value.trim()) {
      const baseName = files[0].name.replace(/\.(pdf|png|jpe?g|webp|bmp)$/iu, '').trim();
      if (baseName) {
        customTitle.value = baseName;
      }
    }

    const added: ImportedPage[] = [];
    for (const file of files) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const images = await convertPdfToImages(file);
        if (images.length === 0) {
          throw new Error(`未能在 PDF (${file.name}) 中找到可渲染页面`);
        }
        images.forEach((imgUrl, idx) => {
          added.push({
            id: `pg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${idx}`,
            dataUrl: imgUrl,
            selected: true,
            pageNum: pages.value.length + added.length + 1,
          });
        });
      } else {
        let compressedUrl = '';
        try {
          compressedUrl = await compressImageToDataUrl(file);
        } catch {
          compressedUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string) || '');
            reader.readAsDataURL(file);
          });
        }
        if (compressedUrl) {
          added.push({
            id: `pg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            dataUrl: compressedUrl,
            selected: true,
            pageNum: pages.value.length + added.length + 1,
          });
        }
      }
    }

    if (added.length > 0) {
      const firstNewIdx = pages.value.length;
      pages.value.push(...added);
      renumberPages();
      activePageIdx.value = firstNewIdx;
      recognizedSheet.value = null;
    }
  } catch (err: any) {
    errorMessage.value = '导入解析失败: ' + (err.message || '请确保 PDF/图片格式正确');
  } finally {
    isConvertingPdf.value = false;
    target.value = '';
  }
}

async function startBatchRecognition() {
  const targets = selectedPages.value;
  if (targets.length === 0) return;

  if (!apiConfig.value.apiKey.trim()) {
    errorMessage.value = '请先展开“视觉大模型设置”填写有效的 API Key！';
    showApiConfig.value = true;
    return;
  }

  // 记忆配置到本地
  localStorage.setItem('omr_api_base', apiConfig.value.baseUrl);
  localStorage.setItem('omr_api_key', apiConfig.value.apiKey);
  localStorage.setItem('omr_api_model', apiConfig.value.model);

  isProcessing.value = true;
  errorMessage.value = '';
  recognitionProgress.value = `准备识别共 ${targets.length} 页曲谱...`;

  try {
    let baseMeta: SheetMusic | null = null;
    const mergedMeasures: Measure[] = [];

    for (let i = 0; i < targets.length; i++) {
      const page = targets[i];
      recognitionProgress.value = `正在识别第 ${i + 1} / ${targets.length} 页 (原第 ${page.pageNum} 页)...`;
      const pageResult = await parseSheetWithVision(page.dataUrl, apiConfig.value);

      if (!baseMeta) {
        baseMeta = pageResult;
      }

      if (Array.isArray(pageResult.measures)) {
        for (const m of pageResult.measures) {
          const nextNum = mergedMeasures.length + 1;
          const cleanNotes = Array.isArray(m.notes)
            ? m.notes.map((n, nIdx) => {
                const pitchNum = Math.round(Number(n.pitch) || 0);
                const octNum = Math.max(-2, Math.min(2, Math.round(Number(n.octave) || 0)));
                const durNum = Number(n.duration) > 0 ? Number(n.duration) : 1;
                return {
                  ...n,
                  id: `p_m${nextNum}_n${nIdx + 1}`,
                  pitch: pitchNum >= 1 && pitchNum <= 7 ? pitchNum : 0,
                  octave: octNum,
                  duration: durNum,
                  chord: Array.isArray(n.chord)
                    ? n.chord.map((c) => ({
                        pitch: Math.round(Number(c.pitch) || 0),
                        octave: Math.max(-2, Math.min(2, Math.round(Number(c.octave) || 0))),
                      }))
                    : undefined,
                };
              })
            : [];

          mergedMeasures.push({
            measureNumber: nextNum,
            showBoxNumber: nextNum === 1 || nextNum % 5 === 0,
            notes: cleanNotes,
          });
        }
      }
    }

    if (!baseMeta || mergedMeasures.length === 0) {
      throw new Error('所选页面未能识别出有效小节，请确认图片清晰度或模型支持视觉识图。');
    }

    const finalTitle = customTitle.value.trim() || baseMeta.title || '新识别古筝曲谱';
    customTitle.value = finalTitle;
    if (!customAuthor.value.trim() && baseMeta.author) {
      customAuthor.value = baseMeta.author;
    }

    recognizedSheet.value = {
      id: `custom-${Date.now()}`,
      title: finalTitle,
      subtitle: baseMeta.subtitle || `多页 AI 智能识谱收录（共 ${targets.length} 页）`,
      author: customAuthor.value.trim() || baseMeta.author || 'AI 识谱收录',
      key: baseMeta.key || '1=D',
      timeSignature: Array.isArray(baseMeta.timeSignature) && baseMeta.timeSignature.length === 2
        ? [Number(baseMeta.timeSignature[0]) || 4, Number(baseMeta.timeSignature[1]) || 4]
        : [4, 4],
      expression: baseMeta.expression || '抒情地',
      defaultBpm: Number(baseMeta.defaultBpm) || 78,
      beatUnit: 'quarter',
      difficulty: customDifficulty.value,
      description: `由 ${targets.length} 页琴谱图片智能识别生成，共 ${mergedMeasures.length} 小节。`,
      measures: mergedMeasures,
    };
  } catch (err: any) {
    errorMessage.value = err.message || '识别失败，请检查网络连通性或模型设置';
  } finally {
    isProcessing.value = false;
    recognitionProgress.value = '';
  }
}

function saveRecognizedScore() {
  if (!recognizedSheet.value || !customTitle.value.trim()) return;

  const finalSheet: SheetMusic = {
    ...recognizedSheet.value,
    id: `custom-${Date.now()}`,
    title: customTitle.value.trim(),
    author: customAuthor.value.trim() || recognizedSheet.value.author || 'AI 识谱收录',
    difficulty: customDifficulty.value,
  };

  store.saveScoreToLibrary(finalSheet);
  emit('close');
}

function loadPresetDemo(which: 'tangshi' | 'yuzhou') {
  store.loadSheet(which === 'tangshi' ? tangshiScore : yuzhouScore);
  emit('close');
}
</script>
