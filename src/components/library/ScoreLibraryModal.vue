<template>
  <div class="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div
      class="vh-modal w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;"
    >
      <!-- 模态框顶部标头 (Primary Navy #0F172A) -->
      <header
        class="px-6 py-4 flex items-center justify-between shrink-0"
        style="background-color: #0f172a; color: #ffffff;"
      >
        <div class="flex items-center gap-3">
          <img src="../../assets/logo.png" alt="logo" class="w-8 h-8 rounded-[8px] border border-white/20 object-cover" />
          <div>
            <h2 class="vh-headline text-lg font-semibold tracking-tight text-white">
              古筝典籍曲谱库 · 馆藏名谱
            </h2>
            <p class="text-xs text-[#94A3B8]">
              内置考级必弹、古风传世名曲及个人识谱收藏，支持一键载入伴练
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('close')"
          class="w-8 h-8 rounded-[8px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
        >
          ✕
        </button>
      </header>

      <!-- 快捷分类筛选标签栏 (Filter Chips 4px 圆角) -->
      <div
        class="px-6 py-3 border-b border-[#E2E8F0] flex items-center justify-between flex-wrap gap-2"
        style="background-color: #f8fafc;"
      >
        <div class="flex items-center flex-wrap gap-2">
          <button
            type="button"
            v-for="cat in categories"
            :key="cat"
            @click="selectedCategory = cat"
            class="vh-chip cursor-pointer transition-all"
            :class="selectedCategory === cat ? 'vh-chip-filter-active' : 'vh-chip-filter hover:border-[#0F172A]'"
            :style="
              selectedCategory === cat
                ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#0F172A' }
                : { backgroundColor: '#FFFFFF', color: '#0F172A', borderColor: '#E2E8F0' }
            "
          >
            {{ cat }}
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="triggerImportJson"
            class="vh-btn vh-btn-sm vh-btn-secondary text-xs font-medium"
            style="border: 1px solid #0F172A; color: #0F172A; border-radius: 8px;"
          >
            <span>📥 导入本地曲谱</span>
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleFileUpload"
          />

          <button
            type="button"
            @click="exportCurrentScore"
            class="vh-btn vh-btn-sm vh-btn-ghost text-xs font-medium border border-[#E2E8F0]"
            style="background-color: #ffffff; color: #475569; border-radius: 8px;"
          >
            <span>📤 导出当前谱</span>
          </button>
        </div>
      </div>

      <!-- 曲目卡片列表展示区 (24px padding, 8px radius cards) -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]">
        <div
          v-for="score in filteredScores"
          :key="score.id"
          class="p-6 rounded-[8px] border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 vh-shadow-sm"
          :style="
            store.currentSheet.id === score.id
              ? { backgroundColor: '#FFFFFF', borderColor: '#059669', boxShadow: '0 0 0 1px #059669, 0 4px 16px rgba(15, 23, 42, 0.07)' }
              : { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }
          "
        >
          <!-- 曲目主要信息 -->
          <div class="space-y-2 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="vh-headline text-xl font-semibold text-[#0F172A] tracking-tight">
                {{ score.title }}
              </h3>
              
              <span
                v-if="score.scoreMode === 'original'"
                class="vh-chip"
                style="background-color: rgba(5, 150, 105, 0.12); color: #059669;"
              >
                📄 原件画框谱
              </span>

              <span
                v-if="isCustomScore(score.id)"
                class="vh-chip vh-chip-info"
              >
                ✨ 自建藏谱
              </span>

              <span
                v-if="score.difficulty"
                class="vh-chip"
                :class="getDifficultyBadgeClass(score.difficulty)"
              >
                {{ score.difficulty }}
              </span>

              <span
                v-if="store.currentSheet.id === score.id"
                class="vh-chip vh-chip-success"
              >
                ✓ 当前弹奏
              </span>

              <span
                v-if="store.isScoreMastered(score.id)"
                class="vh-chip vh-chip-success"
              >
                🏆 已通关
              </span>
            </div>

            <p v-if="score.subtitle" class="text-sm text-[#64748B]">
              {{ score.subtitle }}
            </p>

            <div class="vh-mono flex items-center flex-wrap gap-3 text-xs text-[#64748B]">
              <span class="font-sans">{{ score.author || '用户收录' }}</span>
              <span>•</span>
              <span class="font-semibold text-[#0F172A]">{{ score.key }}</span>
              <span>•</span>
              <span class="font-semibold text-[#0F172A]">{{ score.timeSignature[0] }}/{{ score.timeSignature[1] }}</span>
              <span>•</span>
              <span class="font-semibold text-[#0F172A]">♩={{ score.defaultBpm }}</span>
              <span v-if="score.expression" class="font-sans">• {{ score.expression }}</span>
            </div>

            <p v-if="score.description" class="text-xs text-[#64748B] leading-relaxed pt-1 line-clamp-2">
              💡 {{ score.description }}
            </p>
          </div>

          <!-- 载入与删除操作按钮 -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              v-if="isCustomScore(score.id)"
              type="button"
              @click.stop="removeCustomScore(score)"
              class="vh-btn vh-btn-md vh-btn-destructive text-xs font-semibold"
              style="background-color: #EF4444; color: #FFFFFF; border-radius: 8px;"
              title="从自建曲库移除"
            >
              🗑️ 删除
            </button>

            <button
              type="button"
              @click="selectScore(score)"
              class="vh-btn vh-btn-md text-xs font-semibold"
              :style="
                store.currentSheet.id === score.id
                  ? { backgroundColor: '#059669', color: '#FFFFFF', borderRadius: '8px' }
                  : { backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '8px' }
              "
            >
              <span>{{ store.currentSheet.id === score.id ? '✓ 当前正在弹奏' : '🎵 载入开始伴练' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { SheetMusic } from '../../types/music';
import { useSheetStore } from '../../stores/sheetStore';
import { builtInScores } from '../../data/scores';
import { exportOriginalPagesDataUrls, savePageImages } from '../../utils/scoreImageStorage';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useSheetStore();
const fileInputRef = ref<HTMLInputElement | null>(null);

const builtInIdSet = new Set(builtInScores.map((s) => s.id));

function isCustomScore(id: string): boolean {
  return !builtInIdSet.has(id);
}

function removeCustomScore(score: SheetMusic) {
  store.deleteCustomScore(score.id);
}

const categories = ['全部曲谱', '自建藏谱', '入门', '进阶', '考级', '名曲演奏'];
const selectedCategory = ref('全部曲谱');

const filteredScores = computed(() => {
  if (selectedCategory.value === '全部曲谱') {
    return store.allScores;
  }
  if (selectedCategory.value === '自建藏谱') {
    return store.customScores;
  }
  return store.allScores.filter((s) => s.difficulty === selectedCategory.value);
});

function getDifficultyBadgeClass(difficulty: string): string {
  switch (difficulty) {
    case '入门':
      return 'vh-chip-success';
    case '进阶':
      return 'vh-chip-info';
    case '考级':
      return 'vh-chip-warning';
    case '名曲演奏':
      return 'vh-chip-error';
    default:
      return 'vh-chip-filter';
  }
}

function selectScore(score: SheetMusic) {
  store.loadSheet(score);
  emit('close');
}

function triggerImportJson() {
  fileInputRef.value?.click();
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      const parsed = JSON.parse(content) as SheetMusic & {
        _embeddedPageImages?: Record<string, string>;
      };
      if (!parsed.title || !parsed.measures) {
        alert('文件格式不正确，缺少 title 或 measures 数据！');
        return;
      }

      const embeddedImages = parsed._embeddedPageImages;
      delete parsed._embeddedPageImages;

      if (!parsed.id || builtInIdSet.has(parsed.id)) {
        parsed.id = `${parsed.scoreMode === 'original' ? 'orig' : 'custom'}-${Date.now()}`;
      }

      if (parsed.scoreMode === 'original' && parsed.originalScore && embeddedImages) {
        const pageEntries = parsed.originalScore.pages
          .map((p) => ({ id: p.id, dataUrl: embeddedImages[p.id] || '' }))
          .filter((item) => Boolean(item.dataUrl));
        if (pageEntries.length > 0) {
          await savePageImages(parsed.id, pageEntries);
        }
      }

      store.saveScoreToLibrary(parsed);
      alert(`成功导入并保存曲谱至曲库：《${parsed.title}》！`);
      emit('close');
    } catch (err) {
      alert(`导入失败，请确保是合法的 JSON 曲谱文件：${err}`);
    }
  };
  reader.readAsText(file);
  target.value = '';
}

async function exportCurrentScore() {
  const current = store.currentSheet;
  let exportPayload: Record<string, unknown> = { ...current };

  if (current.scoreMode === 'original' && current.originalScore?.pages?.length) {
    const dataUrls = await exportOriginalPagesDataUrls(current.originalScore.pages);
    exportPayload = {
      ...current,
      _embeddedPageImages: dataUrls,
    };
  }

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${current.title.replace(/\s+/g, '_')}_古筝谱.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>
