# 筝伴 · 古筝伴学大师 (Guzheng Sheet Master)

![Version](https://img.shields.io/badge/version-0.1.0-0F172A)
![Tauri](https://img.shields.io/badge/Tauri-v2-059669)
![Vue](https://img.shields.io/badge/Vue-3.5-059669)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-0EA5E9)
![Android](https://img.shields.io/badge/Android-ARM64-22C55E)

## 项目简介

**古筝伴学大师（筝伴）** 是一款面向古筝学习者（尤其是少儿考级与日常平板伴练场景）的跨平台智能伴练与简谱工作台，基于 **Tauri v2 + Vue 3 + TypeScript + WebAudio** 构建，同时支持桌面 Web 端与 Android 平板端运行。

应用集**出版级简谱双声部排版**、**右侧 21 弦拟真古筝实时指板**、**儿童友好型起手式引导**、**严格三阶通关伴练**、**WebAudio 合成原声与电子节拍器**，以及**多页 PDF / 拍照 AI 智能识谱**于一体，帮助琴童在真实练琴时“看得清谱、找得准弦、跟得稳拍”。

---

## 演示视频

https://github.com/user-attachments/assets/c0cbdac9-2200-40a6-bbc2-951610b53430

---

## 功能特性

- 🎼 **出版级简谱排版与双声部合奏**
  - 严格按照每行 4 小节规范排版，支持自适应音符间距防溢出、局部方框小节号、连音线、延音线与歌词下方居中对齐。
  - 采用古筝考级标准图形指法记号（`托 𠃊`、`抹 /`、`勾 ⌒`、`打 𠃌`、`大撮 ⊓`、`小撮 ㄇ`、`花指 ≈`、`摇指 彡`、`颤音 ～`、`上/下滑音`），**绝不使用汉字替代指法符号**。
  - 支持重奏双声部（如《唐诗联唱》`古筝 I` / `古筝 II` 合奏对照与引子领唱旋律），点击任意音符即可发声试听并弹出纠错微调面板。

- 🪕 **右侧 21 弦拟真古筝实时指板**
  - 贴合右手主弹者视角的 **左谱右琴** 响应式双栏布局，一次性竖排呈现 **1~21 根全部琴弦**（`21 弦倍低音·靠外` 在上方 → `1 弦倍高音·靠怀` 在下方）。
  - 矢量还原古筝共鸣木纹面板、右侧 **岳山**、经典 S 形斜排 **人字形雁柱（琴码）**、随弦号递增的琴弦线径，以及 **第 3 / 8 / 13 / 18 根绿色标志 5 弦**。
  - 伴练时实时亮弦振动并展示指法胶囊，双声部曲目支持用户自选 **「主声部 I」** 或 **「双声部同亮」**；待命时点击任意琴弦可按当前调号实时拨弦试音。

- 🙌 **儿童友好型古筝起手式引导**
  - 待命状态下自动计算当前曲谱（或所选声部 / 循环区间）的首个古筝起手音，提供坐姿口诀、SVG“小手握鸡蛋”手型示意图、21 弦绿弦找弦口诀与首音试听按钮。
  - 预备拍采用顶部轻巧悬浮倒计时条，绝不遮盖曲谱首小节音符，谱面首音同步亮起准备光环。

- 🏆 **严格三阶通关伴练与 A-B 区间循环**
  - 支持一键切换 **「① 慢速 70%」**（70% 速度 + 示范原声）、**「② 原速合练」**（100% 默认速度 + 示范原声）与 **「③ 纯拍挑战」**（100% 原速 + 仅节拍器）。
  - **严格防作弊机制**：处于「③ 纯拍挑战」时，若在底部栏调慢 BPM 或重新开启示范原声，则立即退出挑战状态；仅在关闭小节循环并完整演奏结束后，方记录并持久化 `✓ 已通关` 徽章。
  - 点击任意小节号即可快速设置/取消 A-B 单小节或段落循环慢练。

- ⏱️ **高精度 WebAudio 节拍器与古筝音色合成**
  - 采用 Lookahead 毫秒级音频时钟调度，**BPM 严格代表每分钟四分音符拍数（`♩ = 60` 恒为 `1.000 秒/拍`）**，支持四分“滴”与八分“滴-嘀”提示音区分，支持“节拍+原声 / 聆听原声 / 仅节拍器”三模式切换。
  - 纯 WebAudio 实时合成古筝泛音、八度大撮/三度小撮双音、花指上行扫弦、摇指、揉弦与上下滑音效果。

- 📷 **多页 PDF / 拍照 AI 识谱工作台与曲谱库**
  - 内置 `pdfjs-dist` 支持多页 PDF 自动拆页与图片压缩，左侧支持多页预览与勾选拼接，右侧支持视觉大模型配置、连通性测试、批量识别与命名保存至个人藏谱库。
  - 预置 DeepSeek（`deepseek-v4-flash-vision-exp`）、通义千问（`qwen-vl-max`）、智谱 AI（`glm-4v-plus`）、硅基流动与 OpenAI 等配置预设，支持 JSON 曲谱导入/导出。

---

## 技术栈

| 层级 | 核心技术与依赖 |
| :--- | :--- |
| **跨端外壳** | Tauri v2 (`tauri = "2"`, `tauri-plugin-opener = "2"`), Rust (Edition 2024) |
| **前端框架** | Vue `3.5.13` (`<script setup>`), TypeScript `~6.0.3`, Pinia `4.1.0` |
| **构建与样式** | Vite `8.0.16`, Tailwind CSS `4.3.5` (`@tailwindcss/vite`), `vue-tsc` `3.3.5` |
| **设计系统** | Verdana Health Design System（详见 [design.md](design.md)），兼容 Android Chrome 85+ / 99 WebView |
| **音频与文档解析** | 原生 WebAudio API, `pdfjs-dist`, `lucide-vue-next` |

---

## 内置曲谱一览

| 曲目名称 | 调号 | 拍号 | 默认速度 | 难度 | 特点说明 |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **《唐诗联唱》** | `1=D` | `2/4` | `♩ = 78` | 考级 | 28 小节双声部重奏（`古筝 I` + `古筝 II`）+ 8 小节前奏领唱 |
| **《沧海一声笑》** | `1=D` | `4/4` | `♩ = 76` | 入门 | 12 小节五声音阶下行与附点十六分律动 |
| **《战台风》** | `1=D` | `2/4` | `♩ = 120` | 名曲演奏 | 12 小节经典第一主题，含八度摇指与大撮 |
| **《渔舟唱晚》** | `1=D` | `4/4` | `♩ = 66` | 进阶 | 8 小节慢板“老八板”主题，含颤音与大撮 |
| **《青花瓷》** | `1=D` | `2/4` | `♩ = 68` | 入门 | 12 小节十六分音符密字国风旋律与八度大撮 |

---

## 快速开始

### 环境要求

- **Node.js**：建议 v20+（当前验证环境为 `v24.13.0`）
- **Rust 工具链**（仅构建桌面/Android 原生端需要）：`rustup` + `cargo`（Android 需安装 `aarch64-linux-android` target）
- **Android 构建环境**（可选）：JDK 17、Android SDK、NDK `26.1.10909125`

### 安装与前端开发

```bash
# 1. 安装前端依赖
npm install

# 2. 启动前端开发服务器 (默认端口 1420)
npm run dev

# 3. 类型检查与生产构建 (输出至 dist/)
npm run build
```

### Tauri 桌面与 Android 调试/打包

```bash
# 启动桌面端调试
npm run tauri dev

# 启动 Android 设备实时调试（需连接开启 USB 调试的设备并配置 JAVA_HOME / ANDROID_HOME / NDK_HOME）
npm run tauri android dev
```

Android Release ARM64 原生库与 APK 打包流程：
1. 先执行 `npm run build` 生成前端静态产物（`target: 'chrome85'`，`cssTarget: 'chrome85'`）。
2. 在 `src-tauri/` 下执行 `cargo build --target aarch64-linux-android --release`，将生成的 `libguzheng_sheet_master_lib.so` 拷贝至 `src-tauri/gen/android/app/src/main/jniLibs/arm64-v8a/libguzheng_sheet_master_lib.so`。
3. 在 `src-tauri/gen/android/` 下执行 `./gradlew assembleArm64Release -x rustBuildArm64Release`，并使用 `zipalign` 与 `apksigner` 对齐签名。

---

## 项目结构

```text
guzheng-sheet-master/
├── design.md                               # Verdana Health 前端设计系统规范约束
├── docs/superpowers/
│   ├── specs/                              # 功能设计文档
│   └── plans/                              # 实施计划文档
├── index.html                              # 入口页面（引入 Plus Jakarta Sans / DM Sans / Fira Code）
├── package.json                            # 前端脚本与依赖配置
├── vite.config.ts                          # Vite 配置（含 Chrome 85 兼容编译目标）
├── src/
│   ├── App.vue                             # 顶部导航与左谱右琴双栏主布局
│   ├── main.ts                             # Vue / Pinia 初始化入口
│   ├── style.css                           # 设计系统 CSS Tokens 与全局组件样式
│   ├── assets/                             # 应用图标与静态资源
│   ├── types/
│   │   └── music.ts                        # 曲谱、小节、音符、古筝指法类型定义
│   ├── stores/
│   │   └── sheetStore.ts                   # 全局状态管理（曲谱、声部、三阶通关、藏谱持久化）
│   ├── data/
│   │   ├── defaultScore.ts                 # 默认加载曲谱导出
│   │   └── scores/                         # 内置经典曲谱数据（tangshi / canghai / zhantaifeng / yuzhou / qinghuaci）
│   ├── engine/
│   │   ├── GuzhengAudioSynth.ts            # WebAudio 古筝物理泛音与技法音频合成器
│   │   ├── MetronomeEngine.ts              # Lookahead 毫秒级节拍器与音符调度引擎
│   │   └── AutoScroller.ts                 # 伴练视线自动滚屏控制器
│   ├── utils/
│   │   └── pdfHelper.ts                    # PDF 多页转图与图像压缩工具
│   └── components/
│       ├── sheet/
│       │   ├── ScoreRenderer.vue           # 简谱卡片头部与主曲谱网格渲染
│       │   ├── MeasureView.vue             # 小节容器与循环角标
│       │   ├── NoteView.vue                # 简谱单音/叠排大撮、减时线与图形指法渲染
│       │   ├── GuzhengStringPanel.vue      # 右侧 21 弦拟真古筝实时指板与三阶通关栏
│       │   ├── StartingPostureGuide.vue    # 儿童古筝起手式引导卡与 21 弦定位算法
│       │   ├── NoteEditorModal.vue         # 音符纠错/微调弹窗
│       │   └── techniqueSymbols.ts         # 古筝标准指法 SVG 符号映射
│       ├── player/
│       │   └── MetronomeBar.vue            # 底部播放、拍号基准、BPM 与发声模式控制栏
│       ├── library/
│       │   └── ScoreLibraryModal.vue       # 曲谱库典籍弹窗（分类筛选、JSON 导入导出、通关标识）
│       └── scanner/
│           ├── CameraCapture.vue           # 多页 PDF / 拍照智能识谱工作台
│           └── VisionParser.ts             # 视觉大模型 API 调用与简谱 JSON 解析
└── src-tauri/                              # Tauri v2 Rust 宿主工程与 Android 原生配置
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── src/                                # Rust 入口与平台逻辑
    └── gen/android/                        # Tauri 生成的 Android Gradle 工程
```

---

## 本地存储与配置说明

应用运行时的用户配置与自定义数据全部持久化于浏览器 / WebView 的 `localStorage` 中，无需额外后端服务：

| Key | 说明 | 默认值 / 格式 |
| :--- | :--- | :--- |
| `guzheng_custom_scores_v1` | 用户拍照/PDF 识别或 JSON 导入的自建曲谱库 | `[]` (`SheetMusic[]`) |
| `guzheng_mastery_v1` | 已严格通过「③ 纯拍挑战」的曲目 ID 列表 | `[]` (`string[]`) |
| `omr_api_base` | 视觉大模型 API Base URL | `https://api.deepseek.com/v1` |
| `omr_api_key` | 视觉大模型 API Key（仅存本地） | `""` |
| `omr_api_model` | 视觉模型代号 | `deepseek-v4-flash-vision-exp` |

---

## 贡献指南

1. Fork 本仓库并创建特性分支（`git checkout -b feat/your-feature`）
2. 遵循 [design.md](design.md) 中的视觉与组件规范进行前端开发
3. 提交前确保 `npm run build`（含 `vue-tsc --noEmit`）零报错通过
4. 提交变更并创建 Pull Request
