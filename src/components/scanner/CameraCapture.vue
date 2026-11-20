<template>
  <div
    class="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
    @click.self="$emit('close')"
  >
    <div
      class="vh-modal max-w-6xl w-full max-h-[94vh] flex flex-col text-[#0F172A] overflow-hidden"
      style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;"
    >
      <!-- 顶部工作台标题栏 -->
      <header
        class="px-5 py-3.5 flex items-center justify-between shrink-0"
        style="background-color: #0f172a; color: #ffffff;"
      >
        <div>
          <h3 class="vh-headline text-base sm:text-lg font-semibold flex items-center gap-2 text-white">
            <span>🎯</span>
            <span>{{ editingSheet ? '调整原件曲谱埋点' : '原件曲谱埋点工作台' }}</span>
            <span class="vh-chip text-[10px]" style="background-color: #059669; color: #ffffff;">
              100% 原图读谱 · 混合精校
            </span>
          </h3>
          <p class="text-xs text-[#94A3B8] mt-0.5">
            导入 PDF 或拍照后离线自动切行找小节线，原图框内微调即可实现节拍器 / MP3 伴奏实时画框高显
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
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-[#F8FAFC]">
        <!-- ==================== 左侧：原件画布、埋点交互微调与多页缩略图 ==================== -->
        <div class="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 min-w-0">
          <!-- 工具栏 -->
          <div class="vh-card px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 vh-shadow-sm">
            <!-- 交互模式切换 -->
            <div class="flex items-center p-0.5 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] gap-1">
              <button
                v-for="tool in toolOptions"
                :key="tool.key"
                type="button"
                @click="toolMode = tool.key"
                class="px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer"
                :style="
                  toolMode === tool.key
                    ? { backgroundColor: '#0F172A', color: '#FFFFFF' }
                    : { color: '#475569' }
                "
              >
                {{ tool.label }}
              </button>
            </div>

            <!-- 识别与行操作快捷按钮 -->
            <div v-if="activePage" class="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                :disabled="isDetectingLocal"
                @click="runLocalDetectOnActivePage"
                class="vh-chip cursor-pointer transition-colors"
                style="background-color: rgba(5, 150, 105, 0.1); color: #059669; border: 1px solid rgba(5, 150, 105, 0.35);"
                title="使用本地离线算法重新识别当前页乐行与小节线"
              >
                <span>{{ isDetectingLocal ? '⏳ 识别中...' : '⚡ 本地自动识别' }}</span>
              </button>

              <button
                type="button"
                @click="addManualSystemRow"
                class="vh-chip vh-chip-filter hover:border-[#0F172A] cursor-pointer"
                title="在当前页新增一条可拖拽的乐行埋点"
              >
                ＋ 新增乐行
              </button>

              <button
                type="button"
                :disabled="!canMergeWithNext"
                @click="mergeSelectedWithNext"
                class="vh-chip vh-chip-filter hover:border-[#0F172A] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="将选中乐行与紧邻下行合并为双行合奏框（古筝重奏/双手大谱表适用）"
              >
                🔗 与下行合并(合奏)
              </button>
            </div>

            <!-- 多页全选/清空 -->
            <div v-if="pages.length > 0" class="flex items-center gap-1.5">
              <button
                type="button"
                @click="selectAllPages"
                class="vh-chip vh-chip-filter hover:border-[#0F172A] cursor-pointer"
              >
                全选({{ selectedPages.length }}/{{ pages.length }})
              </button>
              <button
                type="button"
                @click="clearAllPages"
                class="vh-chip vh-chip-error cursor-pointer"
              >
                清空
              </button>
            </div>
          </div>

          <!-- 选中乐行等分快捷条 -->
          <div
            v-if="activePage && selectedSystem"
            class="vh-card px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
            style="background-color: #f0fdf4; border-color: rgba(5, 150, 105, 0.35);"
          >
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="font-semibold text-[#065F46]">
                已选乐行（共 {{ selectedSystem.barlines.length - 1 }} 小节）：
              </span>
              <span class="text-[#047857]">本行等分:</span>
              <button
                v-for="cnt in [2, 3, 4, 5, 6]"
                :key="cnt"
                type="button"
                @click="splitSelectedSystem(cnt)"
                class="px-2 py-0.5 rounded-[4px] bg-white border border-[#059669]/40 hover:bg-[#059669] hover:text-white text-[#065F46] font-semibold vh-mono cursor-pointer transition-colors"
              >
                {{ cnt }}
              </button>
              <span class="text-[#047857]">小节</span>
            </div>

            <button
              type="button"
              @click="deleteSelectedSystem"
              class="px-2.5 py-0.5 rounded-[4px] bg-white border border-[#EF4444]/40 text-[#DC2626] hover:bg-[#EF4444] hover:text-white font-semibold cursor-pointer transition-colors"
            >
              🗑️ 删除此行
            </button>
          </div>

          <!-- 状态提示 -->
          <div v-if="isImportingFiles || isLoadingEditImages" class="vh-chip vh-chip-warning px-4 py-3 text-xs flex items-center gap-2.5">
            <span class="animate-spin text-base">🔄</span>
            <span>{{ isLoadingEditImages ? '正在从离线图库加载原件页面...' : '正在渲染高清原件并离线识别小节埋点，请稍候...' }}</span>
          </div>

          <!-- 主编辑画布 -->
          <div
            v-if="activePage"
            class="relative flex-1 min-h-[300px] max-h-[54vh] rounded-[8px] overflow-auto border border-[#CBD5E1] bg-[#0F172A] p-3 pt-7"
          >
            <AnchorOverlayEditor
              :image-url="activePage.dataUrl"
              :systems="activePage.systems"
              :selected-system-id="selectedSystemId"
              :tool-mode="toolMode"
              :measure-start-number="activePageStartMeasure"
              @update:systems="handleUpdateActiveSystems"
              @select-system="selectedSystemId = $event"
            />
          </div>

          <!-- 空状态上传引导 -->
          <label
            v-else
            class="flex-1 min-h-[300px] rounded-[8px] border-2 border-dashed border-[#CBD5E1] hover:border-[#0F172A] bg-white hover:bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors"
          >
            <span class="text-5xl mb-3">🎼</span>
            <span class="vh-headline text-sm font-semibold text-[#0F172A]">
              点击此处上传 PDF 曲谱或琴谱拍照（原图无损保存）
            </span>
            <span class="text-xs text-[#64748B] mt-1.5 max-w-md leading-relaxed">
              导入后自动识别每一乐行与小节线坐标；保留 100% 原版排版、指法记号、滑音颤音与老师批注，无需 AI 逐音符重排
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              class="hidden"
              @change="handleFileSelect"
            />
          </label>

          <!-- 多页缩略图胶片栏 -->
          <div v-if="pages.length > 0" class="vh-card p-3">
            <div class="flex items-center justify-between text-xs text-[#64748B] mb-2">
              <span>点击缩略图切换页面，复选框控制纳入最终曲谱的页面：</span>
              <span class="vh-mono font-semibold text-[#0F172A]">
                当前页第 {{ activePageIdx + 1 }} / {{ pages.length }} 页
              </span>
            </div>
            <div class="flex items-stretch gap-3 overflow-x-auto pb-1">
              <div
                v-for="(page, idx) in pages"
                :key="page.id"
                @click="switchActivePage(idx)"
                class="relative w-28 shrink-0 rounded-[8px] border p-1.5 cursor-pointer transition-all bg-[#F8FAFC] flex flex-col items-center"
                :style="
                  activePageIdx === idx
                    ? { borderColor: '#0F172A', borderWidth: '2px', backgroundColor: '#FFFFFF' }
                    : page.selected
                    ? { borderColor: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.04)' }
                    : { borderColor: '#E2E8F0', opacity: 0.7 }
                "
              >
                <div class="w-full h-24 overflow-hidden rounded-[4px] bg-white flex items-center justify-center border border-[#E2E8F0]">
                  <img :src="page.dataUrl" :alt="`第 ${idx + 1} 页`" class="w-full h-full object-contain" />
                </div>

                <label
                  class="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium cursor-pointer select-none"
                  :style="{ color: page.selected ? '#0F172A' : '#64748B' }"
                  @click.stop
                >
                  <input v-model="page.selected" type="checkbox" class="vh-checkbox" />
                  <span class="vh-mono">P{{ idx + 1 }}</span>
                </label>

                <div class="vh-mono text-[10px] text-[#64748B] mt-0.5">
                  {{ page.systems.length }} 行 · {{ countPageMeasures(page.systems) }} 节
                </div>

                <!-- 顺序微调与移除按钮 -->
                <div class="flex items-center gap-1 mt-1" @click.stop>
                  <button
                    type="button"
                    :disabled="idx === 0"
                    @click="movePage(idx, -1)"
                    class="px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] text-[10px] disabled:opacity-35 cursor-pointer"
                    title="前移一页"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    :disabled="idx === pages.length - 1"
                    @click="movePage(idx, 1)"
                    class="px-1.5 py-0.5 rounded bg-white border border-[#E2E8F0] text-[10px] disabled:opacity-35 cursor-pointer"
                    title="后移一页"
                  >
                    ▶
                  </button>
                </div>

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

        <!-- ==================== 右侧：导入、参数配置、保存与可选 AI 精校 ==================== -->
        <div class="lg:col-span-5 xl:col-span-4 flex flex-col gap-3.5 min-w-0">
          <!-- 1. 导入原件页面 -->
          <div class="vh-card p-3.5 vh-shadow-sm">
            <div class="vh-headline text-sm font-medium text-[#0F172A] mb-2.5 flex items-center gap-1.5">
              <span>📂</span>
              <span>1. 导入或追加原件页面</span>
            </div>
            <div class="grid grid-cols-2 gap-2.5">
              <label class="flex flex-col items-center justify-center py-2.5 px-2 border border-dashed border-[#0F172A] rounded-[8px] bg-[#F8FAFC] hover:bg-[#F1F5F9] cursor-pointer transition-colors text-center">
                <span class="text-lg mb-0.5">📸</span>
                <span class="text-xs font-semibold text-[#0F172A]">拍照添加一页</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  @change="handleFileSelect"
                />
              </label>

              <label class="flex flex-col items-center justify-center py-2.5 px-2 border border-[#E2E8F0] hover:border-[#0F172A] rounded-[8px] bg-white hover:bg-[#F8FAFC] cursor-pointer transition-colors text-center">
                <span class="text-lg mb-0.5">📁</span>
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

          <!-- 2. 原件曲谱参数与入库保存 -->
          <div class="vh-card p-3.5 vh-shadow-sm space-y-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="vh-headline text-sm font-medium text-[#0F172A] flex items-center gap-1.5">
                <span>💾</span>
                <span>2. 曲谱参数与保存</span>
              </span>
              <span class="vh-chip vh-chip-success vh-mono text-[11px]">
                共 {{ selectedPages.length }} 页 · {{ totalStats.rows }} 乐行 · {{ totalStats.measures }} 小节
              </span>
            </div>

            <div>
              <label class="block text-[#0F172A] font-medium mb-1">
                曲谱名称 <span class="text-[#EF4444]">*</span>
              </label>
              <input
                v-model="customTitle"
                type="text"
                placeholder="例如：渔舟唱晚 / 井冈山上太阳红"
                class="vh-input w-full font-medium"
              />
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-[#0F172A] font-medium mb-1">调号</label>
                <select v-model="customKey" class="vh-input w-full vh-mono font-semibold px-2">
                  <option value="1=D">1=D</option>
                  <option value="1=G">1=G</option>
                  <option value="1=C">1=C</option>
                  <option value="1=F">1=F</option>
                  <option value="1=A">1=A</option>
                  <option value="1=bB">1=bB</option>
                </select>
              </div>
              <div>
                <label class="block text-[#0F172A] font-medium mb-1">拍号</label>
                <select v-model="customTimeSigStr" class="vh-input w-full vh-mono font-semibold px-2">
                  <option value="4/4">4/4</option>
                  <option value="2/4">2/4</option>
                  <option value="3/4">3/4</option>
                  <option value="6/8">6/8</option>
                </select>
              </div>
              <div>
                <label class="block text-[#0F172A] font-medium mb-1">默认速度</label>
                <input
                  v-model.number="customBpm"
                  type="number"
                  min="30"
                  max="240"
                  class="vh-input vh-mono w-full font-semibold px-2 text-center"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[#0F172A] font-medium mb-1">作者 / 来源备注</label>
                <input
                  v-model="customAuthor"
                  type="text"
                  placeholder="例如：考级原谱 / PDF"
                  class="vh-input w-full"
                />
              </div>
              <div>
                <label class="block text-[#0F172A] font-medium mb-1">难度分类</label>
                <select v-model="customDifficulty" class="vh-input w-full font-medium">
                  <option value="入门">入门</option>
                  <option value="进阶">进阶</option>
                  <option value="考级">考级</option>
                  <option value="名曲演奏">名曲演奏</option>
                </select>
              </div>
            </div>

            <div
              v-if="errorMessage"
              class="p-2.5 rounded-[8px] vh-chip-error vh-mono text-[11px] whitespace-pre-wrap leading-relaxed"
            >
              {{ errorMessage }}
            </div>

            <div
              v-if="statusBanner"
              class="p-2.5 rounded-[8px] vh-chip-success text-[11px] font-medium leading-relaxed"
            >
              {{ statusBanner }}
            </div>

            <button
              type="button"
              class="vh-btn vh-btn-md vh-btn-sage w-full font-semibold"
              style="background-color: #059669; color: #FFFFFF; border-radius: 8px;"
              :disabled="!canSaveOriginalScore"
              @click="saveOriginalScore"
            >
              <span v-if="isSaving" class="animate-spin">🔄</span>
              <span v-else>💾</span>
              <span>{{ isSaving ? '正在写入离线图库...' : '保存原件曲谱并开始伴练' }}</span>
            </button>
          </div>

          <!-- 3. 可选：AI 视觉辅助精校（默认折叠） -->
          <div class="vh-card p-3.5 vh-shadow-sm space-y-3 text-xs">
            <div class="flex items-center justify-between cursor-pointer" @click="showAiAssist = !showAiAssist">
              <span class="vh-headline text-sm font-medium text-[#0F172A] flex items-center gap-1.5">
                <span>🤖</span>
                <span>3. 可选：AI 视觉辅助精校</span>
              </span>
              <span class="text-xs text-[#64748B] font-medium">{{ showAiAssist ? '收起 ▲' : '展开 ▼' }}</span>
            </div>

            <div v-if="showAiAssist" class="space-y-3 pt-1">
              <p class="text-[11px] text-[#64748B] leading-relaxed">
                遇到歪斜拍照、复杂手写谱或需要自动读取调号/拍号/BPM 时启用，结果将与本地竖线算法自动融合对齐。
              </p>

              <!-- 预设提供商 -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  v-for="preset in apiPresets"
                  :key="preset.key"
                  type="button"
                  class="px-2 py-1.5 rounded-[6px] text-left border transition-colors cursor-pointer"
                  :style="
                    apiConfig.model === preset.model
                      ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                      : { backgroundColor: '#F8FAFC', color: '#0F172A', borderColor: '#E2E8F0' }
                  "
                  @click="applyPreset(preset.key)"
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
                class="p-2 rounded-[8px] vh-mono text-[11px] whitespace-pre-wrap leading-relaxed"
                :class="testResult.startsWith('✅') ? 'vh-chip-success' : 'vh-chip-error'"
              >
                {{ testResult }}
              </div>

              <div>
                <label class="block text-[#0F172A] font-medium mb-1">视觉模型代号</label>
                <input
                  v-model="apiConfig.model"
                  type="text"
                  placeholder="qwen-vl-max"
                  class="vh-input vh-mono w-full"
                />
              </div>

              <!-- AI 埋点主按钮 -->
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  class="vh-btn vh-btn-md vh-btn-primary w-full font-semibold"
                  style="background-color: #0F172A; color: #FFFFFF; border-radius: 8px;"
                  :disabled="isAiProcessing || !activePage"
                  @click="runAiRefineCurrentPage"
                >
                  <span>{{ isAiProcessing ? aiProgress || 'AI 分析中...' : '🤖 AI 辅助识别埋点与拍号（当前页）' }}</span>
                </button>

                <button
                  v-if="selectedPages.length > 1"
                  type="button"
                  class="vh-btn vh-btn-sm vh-btn-secondary w-full font-semibold"
                  style="border: 1px solid #0F172A; color: #0F172A; border-radius: 8px;"
                  :disabled="isAiProcessing"
                  @click="runAiRefineSelectedPages"
                >
                  📚 批量 AI 精校已勾选全部 {{ selectedPages.length }} 页
                </button>
              </div>

              <!-- 备用：旧版 AI 转纯数字简谱 -->
              <div class="pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                <button
                  type="button"
                  :disabled="isAiProcessing || selectedPages.length === 0"
                  @click="runLegacyDigitalOmr"
                  class="text-[11px] text-[#64748B] hover:text-[#0F172A] underline cursor-pointer disabled:opacity-40"
                >
                  备用：转为旧版纯数字简谱（含 21 弦模拟弹奏）
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部快捷演示与关闭栏 -->
      <footer class="px-5 py-2.5 bg-white border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 shrink-0">
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
import { computed, onMounted, ref } from 'vue';
import { useSheetStore } from '../../stores/sheetStore';
import {
  VisionConfig,
  detectAnchorLayoutWithVision,
  parseSheetWithVision,
  testApiConnection,
} from './VisionParser';
import { Measure, OriginalScorePage, SheetMusic } from '../../types/music';
import { tangshiScore } from '../../data/scores/tangshi';
import { yuzhouScore } from '../../data/scores/yuzhou';
import { builtInScores } from '../../data/scores';
import {
  compressImageToOriginalPage,
  convertPdfToOriginalPages,
  downscaleDataUrlForVision,
} from '../../utils/pdfHelper';
import {
  DetectedSystem,
  compileSystemsToAnchors,
  detectScoreLayoutFromImage,
  fuseVisionWithImageDataUrl,
  generateSkeletonMeasures,
  mergeAdjacentSystems,
  normalizeSystem,
  reconstructSystemsFromAnchors,
  splitSystemEqually,
} from '../../engine/ScoreLayoutDetector';
import {
  deleteScoreImages,
  exportOriginalPagesDataUrls,
  savePageImages,
} from '../../utils/scoreImageStorage';
import AnchorOverlayEditor, { EditorToolMode } from './AnchorOverlayEditor.vue';

interface WorkbenchPage {
  id: string;
  dataUrl: string;
  width: number;
  height: number;
  selected: boolean;
  systems: DetectedSystem[];
  sourceTag: 'local' | 'ai' | 'hybrid' | 'manual';
}

const props = defineProps<{
  editingSheet?: SheetMusic | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useSheetStore();

const pages = ref<WorkbenchPage[]>([]);
const activePageIdx = ref(0);
const selectedSystemId = ref<string | null>(null);
const toolMode = ref<EditorToolMode>('drag');

const isImportingFiles = ref(false);
const isLoadingEditImages = ref(false);
const isDetectingLocal = ref(false);
const isSaving = ref(false);

const customTitle = ref('');
const customKey = ref('1=D');
const customTimeSigStr = ref('4/4');
const customBpm = ref(78);
const customAuthor = ref('');
const customDifficulty = ref<'入门' | '进阶' | '考级' | '名曲演奏'>('考级');

const showAiAssist = ref(false);
const isTestingConnection = ref(false);
const testResult = ref('');
const isAiProcessing = ref(false);
const aiProgress = ref('');
const errorMessage = ref('');
const statusBanner = ref('');

const apiConfig = ref<VisionConfig>({
  baseUrl: localStorage.getItem('omr_api_base') || 'https://api.deepseek.com/v1',
  apiKey: localStorage.getItem('omr_api_key') || '',
  model: localStorage.getItem('omr_api_model') || 'deepseek-v4-flash-vision-exp',
});

const toolOptions: { key: EditorToolMode; label: string }[] = [
  { key: 'drag', label: '👆 拖拽微调' },
  { key: 'add-bar', label: '➕ 点加小节线' },
  { key: 'remove-bar', label: '➖ 点删小节线' },
];

const apiPresets = [
  { key: 'deepseek', label: '🤖 DeepSeek', short: 'v4-flash-vision', model: 'deepseek-v4-flash-vision-exp' },
  { key: 'aliyun', label: '🇨🇳 通义千问', short: 'qwen-vl-max', model: 'qwen-vl-max' },
  { key: 'zhipu', label: '🇨🇳 智谱 AI', short: 'glm-4v-plus', model: 'glm-4v-plus' },
  { key: 'siliconflow', label: '⚡ 硅基流动', short: 'Qwen2-VL-72B', model: 'Qwen/Qwen2-VL-72B-Instruct' },
  { key: 'openai', label: '🌐 OpenAI', short: 'gpt-4o', model: 'gpt-4o' },
] as const;

const selectedPages = computed(() => pages.value.filter((p) => p.selected));
const activePage = computed(() => pages.value[activePageIdx.value] || null);

const sortedActiveSystems = computed(() => {
  if (!activePage.value) return [];
  return [...activePage.value.systems].sort((a, b) => a.yTop - b.yTop);
});

const selectedSystem = computed(() => {
  if (!activePage.value || !selectedSystemId.value) return null;
  return activePage.value.systems.find((s) => s.id === selectedSystemId.value) || null;
});

const canMergeWithNext = computed(() => {
  if (!selectedSystem.value) return false;
  const idx = sortedActiveSystems.value.findIndex((s) => s.id === selectedSystem.value!.id);
  return idx !== -1 && idx < sortedActiveSystems.value.length - 1;
});

const activePageStartMeasure = computed(() => {
  let count = 1;
  for (let i = 0; i < activePageIdx.value; i++) {
    const p = pages.value[i];
    if (p && p.selected) {
      count += countPageMeasures(p.systems);
    }
  }
  return count;
});

const totalStats = computed(() => {
  const targets = selectedPages.value;
  let rows = 0;
  let measures = 0;
  for (const p of targets) {
    rows += p.systems.length;
    measures += countPageMeasures(p.systems);
  }
  return { rows, measures };
});

const canSaveOriginalScore = computed(() => {
  return (
    !isSaving.value &&
    !isImportingFiles.value &&
    selectedPages.value.length > 0 &&
    totalStats.value.measures > 0 &&
    customTitle.value.trim().length > 0
  );
});

function countPageMeasures(systems: DetectedSystem[]): number {
  return systems.reduce((sum, s) => sum + Math.max(0, s.barlines.length - 1), 0);
}

function makePageId(): string {
  return `opg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseTimeSignatureInput(raw: string): [number, number] {
  const m = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return [4, 4];
  return [Math.max(1, parseInt(m[1], 10)), Math.max(1, parseInt(m[2], 10))];
}

function ensureSelectedSystemOnActivePage() {
  if (!activePage.value || activePage.value.systems.length === 0) {
    selectedSystemId.value = null;
    return;
  }
  const sorted = [...activePage.value.systems].sort((a, b) => a.yTop - b.yTop);
  selectedSystemId.value = sorted[0]?.id ?? null;
}

function switchActivePage(idx: number) {
  activePageIdx.value = idx;
  ensureSelectedSystemOnActivePage();
}

function selectAllPages() {
  pages.value.forEach((p) => {
    p.selected = true;
  });
}

function clearAllPages() {
  pages.value = [];
  activePageIdx.value = 0;
  selectedSystemId.value = null;
  errorMessage.value = '';
  statusBanner.value = '';
}

function removePage(idx: number) {
  pages.value.splice(idx, 1);
  if (activePageIdx.value >= pages.value.length) {
    activePageIdx.value = Math.max(0, pages.value.length - 1);
  }
  ensureSelectedSystemOnActivePage();
}

function movePage(idx: number, delta: -1 | 1) {
  const targetIdx = idx + delta;
  if (targetIdx < 0 || targetIdx >= pages.value.length) return;
  const list = [...pages.value];
  const [item] = list.splice(idx, 1);
  list.splice(targetIdx, 0, item);
  pages.value = list;
  activePageIdx.value = targetIdx;
}

function handleUpdateActiveSystems(nextSystems: DetectedSystem[]) {
  const page = activePage.value;
  if (!page) return;
  page.systems = nextSystems;
  page.sourceTag = 'manual';
}

async function runLocalDetectOnActivePage() {
  const page = activePage.value;
  if (!page) return;
  isDetectingLocal.value = true;
  errorMessage.value = '';
  try {
    const detected = await detectScoreLayoutFromImage(page.dataUrl, {
      isFirstPage: activePageIdx.value === 0,
      defaultMeasuresPerRow: 4,
    });
    page.systems = detected;
    page.sourceTag = 'local';
    ensureSelectedSystemOnActivePage();
    statusBanner.value =
      detected.length > 0
        ? `⚡ 本地识别完成：当前页共检出 ${detected.length} 行 · ${countPageMeasures(detected)} 个小节`
        : '⚠️ 当前页未自动检出有效乐行，可点击「＋ 新增乐行」手动拉框。';
  } catch (err: any) {
    errorMessage.value = `本地识别失败: ${err?.message || err}`;
  } finally {
    isDetectingLocal.value = false;
  }
}

function addManualSystemRow() {
  const page = activePage.value;
  if (!page) return;

  const sorted = sortedActiveSystems.value;
  let yTop = 0.2;
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1];
    yTop = Math.min(0.86, last.yBottom + 0.03);
  }
  const yBottom = Math.min(0.96, yTop + 0.085);

  const newRow = splitSystemEqually(
    normalizeSystem({
      id: `man-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      yTop,
      yBottom,
      xLeft: 0.06,
      xRight: 0.94,
      barlines: [0.06, 0.94],
      confidence: 'manual',
    }),
    4
  );

  page.systems = [...page.systems, newRow];
  page.sourceTag = 'manual';
  selectedSystemId.value = newRow.id;
}

function splitSelectedSystem(count: number) {
  const page = activePage.value;
  const target = selectedSystem.value;
  if (!page || !target) return;
  const updated = splitSystemEqually(target, count);
  page.systems = page.systems.map((s) => (s.id === target.id ? updated : s));
  page.sourceTag = 'manual';
}

function deleteSelectedSystem() {
  const page = activePage.value;
  const target = selectedSystem.value;
  if (!page || !target) return;
  page.systems = page.systems.filter((s) => s.id !== target.id);
  page.sourceTag = 'manual';
  ensureSelectedSystemOnActivePage();
}

function mergeSelectedWithNext() {
  const page = activePage.value;
  const cur = selectedSystem.value;
  if (!page || !cur) return;
  const sorted = sortedActiveSystems.value;
  const idx = sorted.findIndex((s) => s.id === cur.id);
  if (idx === -1 || idx >= sorted.length - 1) return;

  const nextRow = sorted[idx + 1];
  const merged = mergeAdjacentSystems(cur, nextRow);
  page.systems = page.systems
    .filter((s) => s.id !== nextRow.id)
    .map((s) => (s.id === cur.id ? merged : s));
  page.sourceTag = 'manual';
  selectedSystemId.value = merged.id;
}

async function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  if (files.length === 0) return;

  errorMessage.value = '';
  statusBanner.value = '';
  isImportingFiles.value = true;

  try {
    if (!customTitle.value.trim()) {
      const baseName = files[0].name.replace(/\.(pdf|png|jpe?g|webp|bmp)$/iu, '').trim();
      if (baseName) {
        customTitle.value = baseName;
      }
    }

    const startPageCount = pages.value.length;
    const newPages: WorkbenchPage[] = [];

    for (const file of files) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const assets = await convertPdfToOriginalPages(file, 2000, 0.88);
        if (assets.length === 0) {
          throw new Error(`未能在 PDF (${file.name}) 中找到可渲染页面`);
        }
        for (const asset of assets) {
          const globalPageIdx = startPageCount + newPages.length;
          let systems: DetectedSystem[] = [];
          try {
            systems = await detectScoreLayoutFromImage(asset.dataUrl, {
              isFirstPage: globalPageIdx === 0,
              defaultMeasuresPerRow: 4,
            });
          } catch {
            systems = [];
          }
          newPages.push({
            id: makePageId(),
            dataUrl: asset.dataUrl,
            width: asset.width,
            height: asset.height,
            selected: true,
            systems,
            sourceTag: 'local',
          });
        }
      } else {
        const asset = await compressImageToOriginalPage(file, 2000, 0.88);
        const globalPageIdx = startPageCount + newPages.length;
        let systems: DetectedSystem[] = [];
        try {
          systems = await detectScoreLayoutFromImage(asset.dataUrl, {
            isFirstPage: globalPageIdx === 0,
            defaultMeasuresPerRow: 4,
          });
        } catch {
          systems = [];
        }
        newPages.push({
          id: makePageId(),
          dataUrl: asset.dataUrl,
          width: asset.width,
          height: asset.height,
          selected: true,
          systems,
          sourceTag: 'local',
        });
      }
    }

    if (newPages.length > 0) {
      pages.value.push(...newPages);
      activePageIdx.value = startPageCount;
      ensureSelectedSystemOnActivePage();
      const totalM = newPages.reduce((sum, p) => sum + countPageMeasures(p.systems), 0);
      statusBanner.value = `⚡ 已导入 ${newPages.length} 页原件并自动定位 ${totalM} 个小节框，可直接拖拽微调后保存。`;
    }
  } catch (err: any) {
    errorMessage.value = '导入原件失败: ' + (err?.message || '请确保 PDF 或图片格式正确');
  } finally {
    isImportingFiles.value = false;
    target.value = '';
  }
}

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

function persistApiConfig() {
  localStorage.setItem('omr_api_base', apiConfig.value.baseUrl);
  localStorage.setItem('omr_api_key', apiConfig.value.apiKey);
  localStorage.setItem('omr_api_model', apiConfig.value.model);
}

async function refineSinglePageWithAi(page: WorkbenchPage, applyMetadata: boolean) {
  const visionImg = await downscaleDataUrlForVision(page.dataUrl, 1400, 0.8);
  const res = await detectAnchorLayoutWithVision(visionImg, apiConfig.value);

  if (applyMetadata) {
    if (res.title && (!customTitle.value.trim() || customTitle.value.trim() === '未命名曲谱')) {
      customTitle.value = res.title;
    }
    if (res.author && !customAuthor.value.trim()) {
      customAuthor.value = res.author;
    }
    if (res.key && ['1=D', '1=G', '1=C', '1=F', '1=A', '1=bB'].includes(res.key)) {
      customKey.value = res.key;
    }
    if (res.timeSignature) {
      const tsStr = `${res.timeSignature[0]}/${res.timeSignature[1]}`;
      if (['4/4', '2/4', '3/4', '6/8'].includes(tsStr)) {
        customTimeSigStr.value = tsStr;
      }
    }
    if (res.defaultBpm) {
      customBpm.value = res.defaultBpm;
    }
  }

  if (res.systems.length > 0) {
    const fused = await fuseVisionWithImageDataUrl(page.dataUrl, res.systems);
    page.systems = fused.length > 0 ? fused : res.systems;
    page.sourceTag = fused.some((s) => s.confidence === 'hybrid') ? 'hybrid' : 'ai';
  }
}

async function runAiRefineCurrentPage() {
  if (!activePage.value) return;
  if (!apiConfig.value.apiKey.trim()) {
    errorMessage.value = '请先填写视觉大模型 API Key 后再执行 AI 精校！';
    return;
  }

  persistApiConfig();
  isAiProcessing.value = true;
  errorMessage.value = '';
  aiProgress.value = 'AI 识别当前页中...';

  try {
    await refineSinglePageWithAi(activePage.value, true);
    ensureSelectedSystemOnActivePage();
    statusBanner.value = `🤖 当前页已完成 AI 视觉 + 本地竖线吸附精校（${activePage.value.systems.length} 行 · ${countPageMeasures(activePage.value.systems)} 小节）。`;
  } catch (err: any) {
    errorMessage.value = err?.message || 'AI 辅助精校失败';
  } finally {
    isAiProcessing.value = false;
    aiProgress.value = '';
  }
}

async function runAiRefineSelectedPages() {
  const targets = selectedPages.value;
  if (targets.length === 0) return;
  if (!apiConfig.value.apiKey.trim()) {
    errorMessage.value = '请先填写视觉大模型 API Key 后再执行批量精校！';
    return;
  }

  persistApiConfig();
  isAiProcessing.value = true;
  errorMessage.value = '';

  try {
    for (let i = 0; i < targets.length; i++) {
      aiProgress.value = `AI 精校第 ${i + 1} / ${targets.length} 页...`;
      await refineSinglePageWithAi(targets[i], i === 0);
    }
    ensureSelectedSystemOnActivePage();
    statusBanner.value = `🤖 已完成全部 ${targets.length} 页 AI 视觉 + 本地像素融合精校。`;
  } catch (err: any) {
    errorMessage.value = err?.message || 'AI 批量精校失败';
  } finally {
    isAiProcessing.value = false;
    aiProgress.value = '';
  }
}

async function runLegacyDigitalOmr() {
  const targets = selectedPages.value;
  if (targets.length === 0) return;
  if (!apiConfig.value.apiKey.trim()) {
    errorMessage.value = '请先填写视觉大模型 API Key 再转为数字化简谱！';
    return;
  }

  persistApiConfig();
  isAiProcessing.value = true;
  errorMessage.value = '';

  try {
    let baseMeta: SheetMusic | null = null;
    const mergedMeasures: Measure[] = [];

    for (let i = 0; i < targets.length; i++) {
      aiProgress.value = `数字化转换第 ${i + 1} / ${targets.length} 页...`;
      const compactUrl = await downscaleDataUrlForVision(targets[i].dataUrl, 1400, 0.8);
      const pageRes = await parseSheetWithVision(compactUrl, apiConfig.value);
      if (!baseMeta) baseMeta = pageRes;

      if (Array.isArray(pageRes.measures)) {
        for (const m of pageRes.measures) {
          const nextNum = mergedMeasures.length + 1;
          const cleanNotes = Array.isArray(m.notes)
            ? m.notes.map((n, nIdx) => ({
                ...n,
                id: `p_m${nextNum}_n${nIdx + 1}`,
                pitch: Math.round(Number(n.pitch) || 0),
                octave: Math.max(-2, Math.min(2, Math.round(Number(n.octave) || 0))),
                duration: Number(n.duration) > 0 ? Number(n.duration) : 1,
              }))
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
      throw new Error('未能识别出数字化简谱小节');
    }

    const finalSheet: SheetMusic = {
      id: `custom-${Date.now()}`,
      title: customTitle.value.trim() || baseMeta.title || 'AI 数字化古筝谱',
      subtitle: baseMeta.subtitle || `AI 全谱转换（共 ${targets.length} 页）`,
      author: customAuthor.value.trim() || baseMeta.author || 'AI 识谱收录',
      key: baseMeta.key || customKey.value,
      timeSignature: Array.isArray(baseMeta.timeSignature) && baseMeta.timeSignature.length === 2
        ? [Number(baseMeta.timeSignature[0]) || 4, Number(baseMeta.timeSignature[1]) || 4]
        : parseTimeSignatureInput(customTimeSigStr.value),
      expression: baseMeta.expression || '抒情地',
      defaultBpm: Number(baseMeta.defaultBpm) || customBpm.value || 78,
      beatUnit: 'quarter',
      difficulty: customDifficulty.value,
      description: `由 ${targets.length} 页原图 AI 转换为数字化简谱，共 ${mergedMeasures.length} 小节。`,
      scoreMode: 'digital',
      measures: mergedMeasures,
    };

    store.saveScoreToLibrary(finalSheet);
    emit('close');
  } catch (err: any) {
    errorMessage.value = err?.message || '转换数字简谱失败';
  } finally {
    isAiProcessing.value = false;
    aiProgress.value = '';
  }
}

async function saveOriginalScore() {
  const targets = selectedPages.value;
  if (targets.length === 0 || !customTitle.value.trim()) return;

  isSaving.value = true;
  errorMessage.value = '';

  try {
    const isEditingBuiltIn = Boolean(
      props.editingSheet?.id && builtInScores.some((s) => s.id === props.editingSheet?.id)
    );
    const scoreId =
      props.editingSheet?.id && !isEditingBuiltIn ? props.editingSheet.id : `orig-${Date.now()}`;
    const timeSig = parseTimeSignatureInput(customTimeSigStr.value);
    const safeBpm = Math.max(30, Math.min(240, Math.round(Number(customBpm.value) || 78)));

    // 若基于内置曲谱微调另存为自建藏谱，为所有页面生成独立 ID，避免与内置资源冲突
    const finalTargets = isEditingBuiltIn
      ? targets.map((p) => ({ ...p, id: makePageId() }))
      : targets;

    const pageMetas: OriginalScorePage[] = finalTargets.map((p, idx) => ({
      id: p.id,
      pageIndex: idx,
      width: p.width,
      height: p.height,
    }));

    const anchors = compileSystemsToAnchors(
      finalTargets.map((p, idx) => ({
        pageIndex: idx,
        systems: p.systems,
      }))
    );

    if (anchors.length === 0) {
      throw new Error('请至少在一个乐行中保留至少 1 个小节埋点框后再保存');
    }

    const skeletonMeasures = generateSkeletonMeasures(anchors, timeSig);

    let detectedBy: 'local' | 'ai' | 'hybrid' | 'manual' = 'local';
    if (finalTargets.some((p) => p.sourceTag === 'hybrid')) {
      detectedBy = 'hybrid';
    } else if (finalTargets.some((p) => p.sourceTag === 'ai')) {
      detectedBy = 'ai';
    } else if (finalTargets.some((p) => p.sourceTag === 'manual')) {
      detectedBy = 'manual';
    }

    if (props.editingSheet?.id && !isEditingBuiltIn) {
      await deleteScoreImages(scoreId, props.editingSheet.originalScore?.pages.map((p) => p.id));
    }

    await savePageImages(
      scoreId,
      finalTargets.map((p) => ({ id: p.id, dataUrl: p.dataUrl }))
    );

    const sheetToSave: SheetMusic = {
      id: scoreId,
      title: customTitle.value.trim(),
      subtitle: `原件画框同步谱 · 共 ${finalTargets.length} 页 ${anchors.length} 小节`,
      author: customAuthor.value.trim() || '原件录入',
      key: customKey.value,
      timeSignature: timeSig,
      expression: props.editingSheet?.expression || '跟框精练',
      defaultBpm: safeBpm,
      beatUnit: 'quarter',
      difficulty: customDifficulty.value,
      description: `原版曲谱直显伴练，已在原图精确定位 ${anchors.length} 个小节高显与扫拍坐标。`,
      measures: skeletonMeasures,
      scoreMode: 'original',
      originalScore: {
        pages: pageMetas,
        anchors,
        detectedBy,
      },
    };

    store.saveScoreToLibrary(sheetToSave);
    emit('close');
  } catch (err: any) {
    errorMessage.value = '保存原件曲谱失败: ' + (err?.message || err);
  } finally {
    isSaving.value = false;
  }
}

function loadPresetDemo(which: 'tangshi' | 'yuzhou') {
  store.loadSheet(which === 'tangshi' ? tangshiScore : yuzhouScore);
  emit('close');
}

onMounted(async () => {
  const sheet = props.editingSheet;
  if (!sheet || sheet.scoreMode !== 'original' || !sheet.originalScore) {
    return;
  }

  customTitle.value = sheet.title;
  customKey.value = sheet.key || '1=D';
  customTimeSigStr.value = `${sheet.timeSignature?.[0] || 4}/${sheet.timeSignature?.[1] || 4}`;
  customBpm.value = sheet.defaultBpm || 78;
  customAuthor.value = sheet.author || '';
  customDifficulty.value = sheet.difficulty || '考级';

  isLoadingEditImages.value = true;
  try {
    const pageMetas = [...sheet.originalScore.pages].sort((a, b) => a.pageIndex - b.pageIndex);
    const dataUrls = await exportOriginalPagesDataUrls(pageMetas);
    const sysPerPage = reconstructSystemsFromAnchors(sheet.originalScore.anchors, pageMetas.length);

    pages.value = pageMetas
      .filter((pm) => Boolean(dataUrls[pm.id]))
      .map((pm, idx) => ({
        id: pm.id,
        dataUrl: dataUrls[pm.id],
        width: pm.width,
        height: pm.height,
        selected: true,
        systems: sysPerPage[pm.pageIndex] || sysPerPage[idx] || [],
        sourceTag: sheet.originalScore?.detectedBy || 'manual',
      }));

    activePageIdx.value = 0;
    ensureSelectedSystemOnActivePage();
  } catch (err: any) {
    errorMessage.value = '读取已有原件页失败: ' + (err?.message || err);
  } finally {
    isLoadingEditImages.value = false;
  }
});
</script>
