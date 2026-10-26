# Plan 008 计划评阅（Starlight Grand Revue 华丽歌剧舞台前端完全重构）

- **评阅角色**：独立只读 Reviewer
- **评阅对象**：`plans/plan-008-grand-revue-frontend/plan.md`
- **结论**：`VERDICT: PASS`

---

## 一、规范与结构合规性检查（对照 `AGENTS.md`）

1. **计划书要素完备性**：`plan.md` 完整包含「背景与目标」「交付物清单（可验证）」「涉及文件」「实现步骤」「验收标准（逐条可勾选）」「风险与回滚」六大核心板块。
2. **硬性约束遵守情况**：
   - **不动 `music/`**：计划第 10、55 行明确声明不修改 `music/`、`packages/shared/`、`tools/prepare-audio/`。
   - **不新增第三方运行时依赖**：全部视觉、SVG 星象仪、Web Audio 实时频谱与 Canvas 纪念票根均基于原生 Web API 与 CSS 实现。
   - **纯函数核心**：新增的本机最佳成绩读取 `loadBest(mode, difficulty)`、舞台评级计算 `computeStageRank(summary)`、连击与最快用时统计 `computeStreaks(results)` 及九九组角色元数据 `TROUPE_MEMBERS` 均落位在 `apps/web/src/core/`，与 React/DOM 解耦并配有 Vitest 单元测试计划。

---

## 二、技术可行性与代码库对齐核查

### 1. 纯函数层（`apps/web/src/core/best.ts` & `apps/web/src/core/quiz.ts`）
- **存储键一致性**：现有 `best.ts:11` 采用 `mode === 'reverse' ? 'best:reverse:<difficulty>' : 'best:v2:<mode>:<difficulty>'` 隔离新版规则成绩。新增 `loadBest` 复用同一键名计算与字段合法性校验逻辑，可在首页零副作用读取各模式历史最佳。
- **元数据扩展兼容性**：`packages/shared/src/songs.json` 已具备 `romaji`、`aliases`、`singers`、`description` 等完整字段，但 `apps/web/src/core/quiz.ts:64-70` 的 `Song` 接口目前仅声明了最小字段集（`id, title, type, origin, aliases?`）。在扩展 `Song` 接口以支撑曲库图鉴与揭晓典藏卡时，将 `romaji?: string`、`singers?: string[]`、`description?: string` 设为**可选字段**即可无缝兼容 `quiz.test.ts` 与 `QuizPage.test.tsx` 中的测试桩数据。

### 2. Web Audio 频谱与进度扩展（`apps/web/src/hooks/audioQueue.ts`）
- **测试桩安全降级**：`apps/web/src/hooks/audioQueue.test.ts:9-23` 的 `AudioContext` 桩对象仅实现了 `createBufferSource`、`createGain`、`decodeAudioData` 等方法，未提供 `createAnalyser`。计划第 22、79 行已准确识别该风险，明确通过 `typeof ctx.createAnalyser === 'function'` 特性检测挂载 `AnalyserNode`，确保既有 6 项音频生命周期单测不破损。
- **进度计算**：`audioQueue.ts` 内部已维护 `startedAt`、`offset`、`duration` 与 `ctx.currentTime`，导出 `getPlaybackProgress()` 无需引入额外定时器状态，逻辑清晰可靠。

### 3. 页面重构与测试契约（`QuizPage.tsx`、`HomePage.tsx`、`SummaryPage.tsx`）
- **SSR 静态断言兼容**：`apps/web/src/pages/QuizPage.test.tsx` 使用 `renderToStaticMarkup` 对答题页进行断言，依赖以下精确文案与行为：
  - `选错了。答案：歌曲a、歌曲b` / `答对了！` / `0 分`
  - `1 段音频加载失败` / `重新加载并播放` / `暂未播放，可重放` / `两首歌曲正在同步混合`
  - `本题音频资源不完整` / `返回首页重试`
  计划第 23、32、78 行已明确要求保留上述核心文本节点及 `.wave` / `.is-playing` 选择器。
- **无障碍与响应式**：计划明确保留 `aria-pressed`、`role="progressbar"`、`role="alert"`、`role="status"` 与切题 `h1[tabIndex=-1]` 焦点管理，并包含 `prefers-reduced-motion: reduce` 动效降级与 1440px / 375px 零横向溢出验收。

---

## 三、实现阶段建议（非阻塞提醒）

供 Implementer 在编码时参考，以防边界遗漏：
1. **`QuizPage` 新增 Props 的向后兼容**：若为渲染顶部十幕星轨的正误状态与连击徽章而向 `QuizPage` 传入 `results?: QuestionResult[]`，请将该属性设为可选（默认 `[]`），并在调用 `audio.sampleFrequency?.(...)` / `audio.getPlaybackProgress?.()` 时做可选链保护或同步更新 `QuizPage.test.tsx:17` 的 `audio` 测试桩。
2. **首页曲库图鉴封面路径**：首页尚未点击「开始答题」前，`App.tsx` 可能尚未请求 `manifest.json`；根据 `apps/web/src/data.ts:19` 的约定，封面路径固定为 `assetUrl(\`covers/${song.id}.jpg\`)`，`JukeboxModal.tsx` 可优先使用 `entryById.get(song.id)?.coverPath ?? \`covers/${song.id}.jpg\`` 并配合 `<img onError>` 优雅降级。
3. **九九组代表色对比度**：在 `TROUPE_MEMBERS` 中定义九九组 9 人代表色（含天堂真矢的纯白/银灰与大场奈奈的亮黄）时，建议配合深色天鹅绒底板与鎏金描边使用，确保文本对比度清晰可读。

---

**最终判定**：计划详实、风险识别精准、架构边界清晰，准予进入实现阶段。
`VERDICT: PASS`
