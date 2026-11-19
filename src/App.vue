<template>
  <main class="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans select-none antialiased">
    <!-- 顶部导航栏 (Verdana Health: 纯白表面 + #E2E8F0 边框 + 弥散微阴影) -->
    <header
      class="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] vh-shadow-sm px-4 md:px-8 py-3 flex items-center justify-between"
      style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;"
    >
      <!-- 左侧：App 品牌与图标 -->
      <div class="flex items-center gap-3">
        <img
          src="./assets/logo.png"
          alt="古筝伴学大师"
          class="w-10 h-10 rounded-[8px] border border-[#E2E8F0] vh-shadow-sm object-cover"
        />
        <div>
          <div class="flex items-center gap-2">
            <h1 class="vh-headline text-base md:text-lg font-bold text-[#0F172A] tracking-tight leading-none">
              古筝伴学大师
            </h1>
            <span class="vh-chip vh-chip-success">
              PRO
            </span>
          </div>
          <span class="text-xs text-[#64748B] font-medium">
            考级伴练 · 智能识谱 · 自动视线翻页
          </span>
        </div>
      </div>

      <!-- 右侧：Primary Navy & Secondary 规范按钮区 -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- 1. 曲谱典籍库入口 (Primary Navy #0F172A) -->
        <button
          type="button"
          @click="showLibraryModal = true"
          class="vh-btn vh-btn-md vh-btn-primary text-xs md:text-sm font-semibold"
          style="background-color: #0f172a; color: #ffffff; border-radius: 8px;"
        >
          <span>📖</span>
          <span>曲谱库 (名谱推荐)</span>
        </button>

        <!-- 2. 伴奏练习菜单入口 -->
        <button
          type="button"
          @click="showAccompanimentModal = true"
          class="vh-btn vh-btn-md text-xs md:text-sm font-semibold"
          :style="
            accompanimentStore.isAccompanimentMode
              ? { backgroundColor: '#059669', color: '#ffffff', border: '1px solid #059669', borderRadius: '8px' }
              : { backgroundColor: 'transparent', color: '#0f172a', border: '1px solid #0f172a', borderRadius: '8px' }
          "
        >
          <span>🎧</span>
          <span>伴奏</span>
        </button>

        <!-- 3. AI 识谱上传入口 (Secondary Outline #0F172A) -->
        <button
          type="button"
          @click="showScannerModal = true"
          class="vh-btn vh-btn-md vh-btn-secondary text-xs md:text-sm font-semibold"
          style="border: 1px solid #0f172a; color: #0f172a; border-radius: 8px;"
        >
          <span>📷</span>
          <span>拍摄/导入曲谱</span>
        </button>

        <!-- 4. 伴练状态指示胶囊 (full 9999px 圆角) -->
        <span
          class="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
          :style="
            store.isPlaying || accompanimentStore.isPlaying
              ? { backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a', borderColor: 'rgba(34, 197, 94, 0.3)' }
              : { backgroundColor: '#f8fafc', color: '#64748b', borderColor: '#e2e8f0' }
          "
        >
          <span
            class="w-2.5 h-2.5 rounded-full"
            :class="store.isPlaying || accompanimentStore.isPlaying ? 'animate-ping' : ''"
            :style="{ backgroundColor: store.isPlaying || accompanimentStore.isPlaying ? '#059669' : '#64748b' }"
          />
          <span>
            {{
              accompanimentStore.isPlaying
                ? '🎧 伴奏练习中'
                : store.isPlaying
                ? '节拍器伴练中'
                : '空闲待命'
            }}
          </span>
        </span>
      </div>
    </header>

    <!-- 谱面与右侧 21 弦拟真古筝双栏工作区 -->
    <section class="max-w-7xl mx-auto px-3 sm:px-6 py-6 flex flex-col lg:flex-row items-start gap-6 pb-28">
      <div class="flex-1 min-w-0 w-full">
        <ScoreRenderer />
      </div>
      <div class="w-full lg:w-[290px] xl:w-[310px] lg:sticky lg:top-[4.75rem] shrink-0">
        <GuzhengStringPanel />
      </div>
    </section>

    <!-- 底部悬浮控制栏：伴奏模式与节拍器模式互斥切换 -->
    <AccompanimentBar
      v-if="accompanimentStore.isAccompanimentMode"
      @open-modal="showAccompanimentModal = true"
    />
    <MetronomeBar v-else />

    <!-- 音符人工编辑微调弹窗 -->
    <NoteEditorModal />

    <!-- 曲谱库典籍弹窗 -->
    <ScoreLibraryModal
      v-if="showLibraryModal"
      @close="showLibraryModal = false"
    />

    <!-- MP3 伴奏选择弹窗 -->
    <AccompanimentModal
      v-if="showAccompanimentModal"
      @close="showAccompanimentModal = false"
    />

    <!-- 拍照与 PDF 识谱弹窗 -->
    <CameraCapture
      v-if="showScannerModal"
      @close="showScannerModal = false"
    />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSheetStore } from './stores/sheetStore';
import { useAccompanimentStore } from './stores/accompanimentStore';
import ScoreRenderer from './components/sheet/ScoreRenderer.vue';
import GuzhengStringPanel from './components/sheet/GuzhengStringPanel.vue';
import MetronomeBar from './components/player/MetronomeBar.vue';
import AccompanimentBar from './components/accompaniment/AccompanimentBar.vue';
import AccompanimentModal from './components/accompaniment/AccompanimentModal.vue';
import NoteEditorModal from './components/sheet/NoteEditorModal.vue';
import CameraCapture from './components/scanner/CameraCapture.vue';
import ScoreLibraryModal from './components/library/ScoreLibraryModal.vue';

const store = useSheetStore();
const accompanimentStore = useAccompanimentStore();
const showScannerModal = ref(false);
const showLibraryModal = ref(false);
const showAccompanimentModal = ref(false);
</script>
