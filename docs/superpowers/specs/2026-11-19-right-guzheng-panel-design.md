# 右侧 21 弦拟真古筝伴练侧栏与三阶通关模式设计方案

**日期**：2026-11-19  
**工程**：古筝伴学大师 (`J:\WorkSpace\guzheng-sheet-master`)  
**约束**：严格遵循根目录 [design.md](../../../design.md)（Verdana Health Design System）与 Android Chrome 99 WebView 兼容规范。

---

## 1. 设计意图与背景（Why）
当前应用已具备出版级简谱排版、起手式引导、WebAudio 古筝原声与 AI 多页识谱能力，但在伴练过程中，低龄琴童在看到“第 2 小节跳到高音 3”或“大撮跳跃”时，仍需要低头在真实古筝上快速对照弦位。  
将 **1~21 根全弦拟真古筝侧栏** 固定在曲谱右侧（符合右手主弹者的视觉动线），并配套 **三阶通关伴练模式**，能够把“看谱 → 找弦 → 试音 → 分阶通关”完整串联在同一视口内。

---

## 2. 目标、非目标与反目标

### 目标（Goals）
1. **全弦一次可见**：一次性竖向排布 1~21 根全部琴弦（第 1 弦在最上方/靠怀侧，第 21 弦在最下方/靠外侧），无需滚动即可一眼定位跨八度跳跃。
2. **模拟真实古筝结构**：在侧栏内用矢量 + 物理层级还原古筝核心特征——右岳山、S 形斜排雁柱（琴码）、由细到粗的琴弦线径（1 弦最细 → 21 弦最粗）、第 3/8/13/18 根绿色标志 5 弦。
3. **实时联动与点弦试音**：播放或预备拍时，侧栏同步高亮当前音符对应的 1 根或 2 根琴弦并附带弦上振动动效与指法标签；待命或暂停时，点击任意一根弦可直接按当前曲谱调号（`store.currentSheet.key`）发出真实古筝拨弦音。
4. **三阶通关伴练**：提供「① 慢速拆句（70% 默认速度 + 示范原声）→ ② 原速合练（100% 默认速度 + 示范原声）→ ③ 纯拍挑战（100% 默认速度 + 仅节拍器）」一键切换，并记录每首曲目的通关阶段。

### 非目标（Non-Goals）
- 本阶段不包含麦克风实时拾音纠错（音高检测属于另一独立模块）。
- 不做横跨整个屏幕底部的钢琴式全宽琴键（已选定右侧固定侧栏方案 B）。

### 反目标（Anti-Goals）
- **绝不挤压主曲谱**：在平板横屏 / 桌面宽屏下，曲谱区必须保持 4 小节一行的舒展排版与清晰字号。
- **绝不使用刺眼霓虹色或厚重阴影**：所有容器边框、圆角（`8px`）、文字（`Plus Jakarta Sans` / `DM Sans` / `Fira Code`）与配色（`#0F172A`、`#64748B`、`#059669`、`#FFFFFF`、`#F8FAFC`）必须严格遵守 `design.md`。

---

## 3. 交互与布局结构

### 3.1 总体双栏布局（平板横屏 / 桌面 `lg:` 及以上）
- **外层容器**：`max-w-7xl mx-auto px-3 sm:px-6 py-6 flex flex-col lg:flex-row items-start gap-6 pb-28`。
- **左侧主区（`flex-1 min-w-0`）**：保持现有 `<ScoreRenderer />` 完整曲谱卡片（包含标题、头部信息、起手式提示卡与 4 小节一行谱面）。
- **右侧固定古筝侧栏（`w-full lg:w-[280px] xl:w-[300px] lg:sticky lg:top-[4.75rem] shrink-0`）**：
  - 采用 `.vh-card`（`#FFFFFF`、`1px solid #E2E8F0`、`8px` 圆角、`.vh-shadow-md`）。
  - 顶部带 `#0F172A` Navy 标题条（白色文字：`21 弦古筝实时指板` + 当前调号徽章如 `1=D`）。
  - 窄屏/竖屏（`< lg`）时自动位于曲谱下方或提供紧凑折叠开关，确保手机/竖屏不横向溢出。

### 3.2 拟真 21 弦古筝面板细节（`GuzhengStringPanel.vue`）
1. **面板构造（SVG 精准绘制，height ~ `460px`~`500px`，21 根弦等距清晰可点）**：
   - **琴面底板**：柔和的浅原木米白渐变（`#FBF8F1` → `#F4EFE4`），边框 `1px solid #E2E8F0`，符合 Verdana Health 温和质感。
   - **左侧琴头与右侧岳山**：右侧边缘绘制立体实木色 **岳山条**（`#78350F` / `#92400E` 细木条 + 穿弦孔小点），左侧留出音区标注。
   - **S 形斜排雁柱（琴码）**：第 1 弦琴码靠右（约 `x = 76%`），随弦号增大平滑斜向左下（第 21 弦约 `x = 34%`），采用经典“人”字形小木码 SVG 图形，完美还原古筝标志性的雁柱弧线。
   - **21 根琴弦（第 1 弦在最上，第 21 弦在最下）**：
     - 线宽随弦号递增：`1.0px + (s - 1) * 0.065px`（1 弦 `1.0px` 纤细 → 21 弦 `2.3px` 厚实）。
     - **绿色标志 5 弦（第 3、8、13、18 弦）**：使用 Tertiary Sage `#059669` 着色（高亮时加粗发光），其余弦使用温润钢丝色 `#94A3B8`（低音缠弦略深 `#64748B`）。
     - 左侧显示 `Fira Code` 弦号（`1`~`21`），右侧岳山旁显示简谱音名（`1̇̇` ~ `1̣̣`，绿弦标 `5`）。
   - **高亮与拨弦动效**：
     - 当 `store.currentNoteId`（或待命/预备拍首音）激活某音符时，解析该音符主音与 `chord` 双音对应的弦号（复用 `pitchToStringPos`），对应琴弦切换为高对比度 **Primary Navy `#0F172A` / Sage `#059669` 亮弦光带**，并在琴码右侧弹出指法胶囊（如 `大指 𠃊`、`食指 /`、`大撮 ⊓`）。
     - **多声部合奏亮弦模式（由用户自选）**：当曲谱存在双声部且处于 `'all'` 合奏视图时，在右侧面板顶部提供简洁切换开关：**「主声部 (`古筝 I`)」**（默认，仅亮主旋律声部）或 **「双声部同亮」**（`古筝 I` 用 Navy `#0F172A`、伴奏 `古筝 II` 用 Info `#0EA5E9` 同时在 21 弦上亮弦与展示指法）。
     - **人声引子处理（设计默认）**：在《唐诗联唱》前 8 小节 `introMelody` 领唱期间（`partId === 'intro'`），右侧 21 弦面板保持第 9 小节古筝起手弦位待命状态并提示“领唱中·第9小节起奏”，避免人声旋律误导孩子提前下指。
     - 每行琴弦设置透明全宽热区（高度约 `20px`），点击/触摸即刻调用 `guzhengSynth.playNote(...)` 试音，并触发短促弦振动画。

### 3.3 三阶通关伴练条与严格通关规则（集成于右侧栏顶部）
在 21 弦古筝面板上方放置紧凑的三段式通关切换器（遵循 `design.md` Filter Chips / Navy 激活规范）：
1. **① 慢速拆句**：自动将速度设为 `Math.max(30, Math.round(sheet.defaultBpm * 0.7))`，发音模式设为 `'both'`（节拍 + 原声）。
2. **② 原速合练（启动/切歌默认状态，设计默认）**：`loadSheet()` 切歌时默认回到 `'normal'`，自动恢复 `sheet.defaultBpm` 并重置 `soundMode` 为 `'both'`。
3. **③ 纯拍挑战（严格限制）**：保持 `sheet.defaultBpm`，发音模式强制设为 `'metronome'`（关闭示范原声，仅保留节拍器）。
   - **严格防作弊规则**：在「③ 纯拍挑战」模式下，若用户在底部 `MetronomeBar` 手动把 BPM 调低于 `sheet.defaultBpm`，或手动将 `soundMode` 切回 `'both'` / `'guzheng'`，则立即自动退出挑战态（`masteryStage` 置为 `null` 自定义模式），不计入通关。
   - **通关认定**：仅当 `masteryStage === 'challenge'` 且未开启区间作弊循环（完整演奏 `onPlayEnd` 自然结束，支持主声部 `part1` / `'all'` / 单声部曲目，设计默认）时，才在 `localStorage`（`guzheng_mastery_v1`）记录该曲目为已通关，并在右侧栏与 `ScoreLibraryModal.vue` 曲库卡片上同时展示 `✓ 已通关` Status Success Chip。

---

## 4. 工程实现约束与文件范围（Builder 规划依据）
- **复用现有逻辑**：弦位映射 `pitchToStringPos`、`stringNumToNoteTag` 从 `StartingPostureGuide.vue` 抽离或复用，避免重复实现；音频发声复用 `guzhengSynth.playNote`。
- **关键文件**：
  - `src/components/sheet/GuzhengStringPanel.vue`（新增：21 弦拟真古筝侧栏 + 双声部亮弦模式开关 + 三阶通关切换）
  - `src/stores/sheetStore.ts`（扩展：`masteryStage` 状态机、`duetStringMode`、分声部实时激活音符记录 `activePartNotes`、`completedScoreIds` 持久化、以及在 `setBpm`/`setSoundMode` 中执行挑战严格限制）
  - `src/App.vue` / `src/components/sheet/ScoreRenderer.vue`（调整主布局为左谱右琴双栏响应式结构）
  - `src/components/player/MetronomeBar.vue`（透传 `partId` 到 store，并在 `onPlayEnd` 严格校验挑战通关状态）
  - `src/components/library/ScoreLibraryModal.vue`（曲目卡片展示 `✓ 已通关` 徽章）
- **兼容与校验**：保持 `vite.config.ts` 的 `chrome85` CSS 降级目标、避免 `oklch()`、通过 `vue-tsc --noEmit && vite build` 及 Android ARM64 APK 打包签名。
