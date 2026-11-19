# 右侧 21 弦拟真古筝伴练侧栏与三阶通关模式 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed right-side realistic 21-string Guzheng interactive panel (showing strings 1–21 vertically with right bridge, diagonal S-curve bridges, green 5-strings, interactive plucking, and real-time duet-selectable highlighting) paired with a strict 3-stage mastery flow.

**Architecture:** Extend `sheetStore.ts` with `masteryStage`, `duetStringMode`, `activePartNotes`, and `completedScoreIds` (`localStorage`). Build `GuzhengStringPanel.vue` reusing `pitchToStringPos`/`stringNumToNoteTag` from `StartingPostureGuide.vue` and `guzhengSynth` for live plucking, and arrange `App.vue` into a responsive two-column workspace (left: `ScoreRenderer`, right: sticky `GuzhengStringPanel`).

**Tech Stack:** Vue 3 (`<script setup lang="ts">`), TypeScript, Pinia, Tailwind CSS v4 (Verdana Health `design.md` tokens, `chrome85` CSS target), WebAudio (`GuzhengAudioSynth`), Tauri v2 Android.

**Spec:** `docs/superpowers/specs/2026-11-19-right-guzheng-panel-design.md`

## Global Constraints

- Follow `design.md` (Verdana Health Design System): `#0F172A` Primary Navy, `#64748B` Secondary Slate, `#059669` Tertiary Sage, `#F8FAFC` background, `#FFFFFF` surface, `1px solid #E2E8F0` borders, `8px` card/button radius, `4px` chip radius, `Fira Code` (`vh-mono`) for tabular numerals.
- Maintain Android Chrome 99 WebView compatibility (avoid unfallback `oklch()`, keep explicit HEX/`:style` fallbacks on key interactive elements).
- Reuse `pitchToStringPos`, `stringNumToNoteTag`, and `extractStartingPosture` from `StartingPostureGuide.vue` without duplicating 21-string mapping logic.
- Strict Stage 3 (`challenge`) enforcement: lowering BPM below `defaultBpm` or switching `soundMode` away from `'metronome'` immediately cancels `'challenge'` mode.

## Review Focus

- 《唐诗联唱》 (`tangshi-lianchang`) opens in `'all'` duet mode with `introMelody` (measures 1–8): panel must hold Measure 9 starting posture during `introMelody` and respect user's `part1` vs `both` duet string toggle.
- Manual BPM decrease or `soundMode` switch during Stage 3 (`challenge`) must immediately clear `masteryStage` and prevent `✓ 已通关` award on `onPlayEnd`.
- Active `loopRange` during Stage 3 must NOT award full-song `✓ 已通关`.
- Clicking any string `1..21` on the panel must pluck the exact pitch in `store.currentSheet.key` without throwing on rapid clicks.
- Narrow/portrait viewports (`< lg`) must stack cleanly without horizontal overflow.

---

### Task 1: Extend `sheetStore.ts` with Mastery Stage, Strict Challenge Guards, Duet String Mode & Per-Part Active Notes

**Files:**
- Modify: `src/stores/sheetStore.ts`

**Interfaces:**
- Produces: `MasteryStage`, `DuetStringMode`, `masteryStage`, `duetStringMode`, `activePartNotes`, `completedScoreIds`, `applyMasteryStage`, `setDuetStringMode`, `markCurrentScoreMastered`, `isScoreMastered`, updated `setActiveNote(noteId, measureIdx, partId?, noteObj?)`.

- [ ] **Step 1: Add `MasteryStage`, `DuetStringMode`, `activePartNotes`, `completedScoreIds`, `applyMasteryStage`, and strict guards in `src/stores/sheetStore.ts`**
- [ ] **Step 2: Verify via Node TypeScript test script (`verify_mastery_store.mjs`) covering slow/normal/challenge transitions, strict challenge cancellation on BPM drop or `soundMode` change, `loopRange` exclusion, and `loadSheet` reset**

---

### Task 2: Propagate `partId` & Note Object and Enforce Mastery Completion in `MetronomeBar.vue`

**Files:**
- Modify: `src/components/player/MetronomeBar.vue`

**Interfaces:**
- Consumes: `store.setActiveNote`, `store.markCurrentScoreMastered`

- [ ] **Step 1: Update `metronome.onNoteTrigger` in `MetronomeBar.vue` to pass `(note.id, measureIdx, partId, note)`**
- [ ] **Step 2: Update `metronome.onPlayEnd` in `MetronomeBar.vue` to call `store.markCurrentScoreMastered()` when `!store.loopRange` before `store.setPlaying(false)`**

---

### Task 3: Build Realistic 21-String `GuzhengStringPanel.vue`

**Files:**
- Create: `src/components/sheet/GuzhengStringPanel.vue`

**Interfaces:**
- Consumes: `pitchToStringPos`, `stringNumToNoteTag`, `extractStartingPosture` from `StartingPostureGuide.vue`; `guzhengSynth.playNote` from `GuzhengAudioSynth.ts`; `useSheetStore`.

- [ ] **Step 1: Implement 3-stage mastery selector (`慢速拆句`, `原速合练`, `纯拍挑战`) and duet string mode toggle (`主声部`, `双声部同亮`)**
- [ ] **Step 2: Implement full 1–21 horizontal-strings-stacked-vertically SVG with soundboard, right 岳山, S-curve 21 雁柱 bridges, progressive string thickness, green 5-strings (`3, 8, 13, 18`), real-time active highlighting + finger badge, `introMelody` hold banner, and click-to-pluck audio**

---

### Task 4: Two-Column Responsive Layout & Library Mastery Badge

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/sheet/ScoreRenderer.vue`
- Modify: `src/components/library/ScoreLibraryModal.vue`

- [ ] **Step 1: Update `App.vue` main workspace to `flex-col lg:flex-row` with `ScoreRenderer` (left `flex-1 min-w-0`) and sticky `GuzhengStringPanel` (right `w-full lg:w-[290px] xl:w-[310px]`)**
- [ ] **Step 2: Adjust `ScoreRenderer.vue` outer wrapper padding for clean two-column alignment**
- [ ] **Step 3: Add `✓ 已通关` Status Success Chip to mastered score cards in `ScoreLibraryModal.vue`**

---

### Task 5: Full Build, Verification Tests & Android ARM64 APK Packaging

- [ ] **Step 1: Run `npm run build` (`vue-tsc --noEmit && vite build`)**
- [ ] **Step 2: Run all verification scripts (`verify_fix.mjs`, `verify_starting_posture.mjs`, `verify_mastery_store.mjs`)**
- [ ] **Step 3: Rebuild `libguzheng_sheet_master_lib.so`, assemble, align, and sign `guzheng-sheet-master-arm64.apk`**
