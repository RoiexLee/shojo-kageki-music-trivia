# plan-002 — 游戏核心引擎与基础答题流程

- 状态：返修中（v2，已按 plan-review.md 必改清单修订）
- 作者：orchestrator
- 日期：2026-10-26
- 前置：plan-001（shared 类型、prepare-audio 产物、workspace 结构）
- 修订：v2 — ①补依赖白名单与锁定策略 ②裁定纯函数落点 apps/web/src/core，消除涉及文件矛盾，声明占位类型处置 ③干扰项优先级改为「同 type 字段 + 种子随机补齐」 ④补齐 judge/summarize/formatTime 测试与 >10 首 fixture；并采纳建议项（数据接线、N 选一措辞、无时限无限重放、autoplay/workspace 风险、种子来源、构建判据、组件无内联规则的机械判据、契约偏差上报不静默适配）

## 背景与目标

在 plan-001 的数据基座上，创建 `apps/web` 游戏应用并实现**完整可玩的最小闭环**：主页 → 选择模式（本 plan 仅「开头猜歌」一种）→ 选择难度 → 答题（**N 选一**，听开头片段）→ 结算页。游戏规则核心（抽题/选项/计分）为纯函数并带 Vitest 单测，为 plan-003 扩展多模式打地基。

玩法规则对齐 MyGO 猜歌（从其前端 bundle 逆向确认）：
- 每局固定 10 题（曲库不足时取曲库数，见交付物 2）；进度条显示 X/10
- 每题：播放片段 → 从 N 个选项中选出正确歌曲 → 即时反馈对错 → 下一题
- **无回合时限；片段可无限次重放**（限时玩法留给后续 plan）
- 难度（简单/普通/困难）影响：片段时长（15/10/5 秒 → intro-15/intro-10/intro-5）与选项数（3/4/6）
- 结算页：答对数/10、总用时、逐题对错列表、「再玩一次」

## 交付物清单

1. **`apps/web/`**：Vite + React + TypeScript + Tailwind CSS（版本取当前稳定）。
   **依赖白名单**（仅允许下列新增；提交 package-lock.json 锁定）：runtime `react`、`react-dom`；dev `vite`、`@vitejs/plugin-react`、`typescript`、`tailwindcss`（v3 则含 postcss/autoprefixer，v4 则含 @tailwindcss/vite）、`vitest`、`@types/react`、`@types/react-dom`。之外的新依赖须在实现纪要中说明理由并回报。
   - 页面组件：`HomePage`（模式+难度选择）、`QuizPage`、`SummaryPage`
   - 状态机 hook：`useQuizEngine`（驱动 题目队列/作答/判定/翻页/计时）
   - 音频播放 hook：`useAudioPlayer`（HTMLAudioElement，支持无限重放；播放状态驱动波形动画 CSS class）。首次播放发生在用户点击「开始答题」之后（存在用户手势，规避 autoplay 拦截）
   - UI 骨架遵循「剧院/舞台」氛围的暗色主题即可，视觉打磨留给 plan-004
2. **核心纯函数 `apps/web/src/core/`**（落点裁定：不进 packages/shared——plan-001 拥有 shared 交付物，且 quiz 逻辑暂无 web 以外消费方；类型随函数同处演化）：
   - `shuffle`（mulberry32 种子随机）
   - `buildQuiz(songs, config): Question[]`——按种子随机不重复抽 10 题（曲库 < 题数时取 min 并不报错）；每题干扰项**优先同 `type` 字段**的歌曲，不足时从剩余曲库以同一 seeded rng 补齐；选项乱序
   - `judge(question, selectedId): boolean`（单数，单选）
   - `formatTime(ms)`、计分聚合 `summarize(results)`
   - core 自定义 `Question/QuizConfig` 等类型；**本 plan 不消费 shared 的占位类型**（QuizMode/Difficulty/Question/QuizConfig 原样保留），plan-003 视需要收敛回 shared
   - Vitest 用例（≥10 个）：种子可复现（同种子同卷面、不同种子不同卷面）、不重复抽题、干扰项不含正确项、干扰项优先同 type（构造 type 分组 fixture）、随机补齐可复现、难度→片段/选项数映射、`judge`、`summarize`、`formatTime`。**fixture 用 >10 首 mock 歌**覆盖真实抽样/去重路径（真实曲库恰 10 首会退化为全量洗牌）
3. **数据接线**：`songs.json` 走 Vite 静态 `import ... from '@starlight/shared/songs.json'`（不依赖 loadSongs 的运行时形态）；`manifest.json` 运行时 `fetch('/assets/manifest.json')`（整目录 gitignore，须先 `npm run assets`）；音频路径按难度选 intro-15/10/5；封面用于结算页。若 manifest/songs 实际结构与 plan-001 v2 契约不一致，**视为 plan-001 实现缺陷，回报 orchestrator 裁决，不做静默适配**
4. **测试与自测**：`npm test` 全绿；先 `npm run assets` 再手测一局完整流程（记录在 implementation.md）；`npm run build` 成功
5. 流程文档：`implementation.md`、`implementation-review.md`

## 涉及文件

新增：`apps/web/**`（含 `apps/web/package.json`；public/assets 为 plan-001 工具产物目录，本 plan 不提交其内容）
修改：`plans/README.md`、`plans/plan-002-game-core/**`
不动：根 `package.json`（dev/build 转发已由 plan-001 配好）、`packages/shared/**`（本 plan 对 shared 零改动）、`tools/**`、`music/`、`.gitignore`

## 实现步骤（建议）

1. Vite 脚手架 + Tailwind 接入 workspace；确认 workspace 链接包在 Vite 中可解析（shared exports 指向 TS 源，必要时配 alias）
2. 纯函数与单测（先于 UI）
3. useQuizEngine + useAudioPlayer + 三页面
4. 接 manifest.json，跑通完整一局
5. `npm run build` + 手测记录

## 验收标准

- [ ] `npm test` 全绿，core 纯函数用例 ≥ 10（含 judge/summarize/formatTime；fixture >10 首）
- [ ] 依赖清单与白名单一致（package.json 可审计），package-lock.json 已提交
- [ ] 先 `npm run assets` 后 `npm run build`：dist 中全部 mp3 位于 assets/audio/ 下且单文件 ≤ 300KB；manifest.json 与 50 个切片、10 张封面均进入 dist/assets
- [ ] 手测：完整玩一局 10 题；简单局选项恰 3 个且片段 URL 为 intro-15、困难局选项恰 6 个且为 intro-5；重放按钮可无限次使用；结算数据正确
- [ ] 抽题可复现（同种子同卷面）且有测试；每局随机生成种子，URL 参数 `?seed=` 可指定种子（bug 复现用）
- [ ] 组件内不出现 Math.random/Date.now/选项比较逻辑；计分与判定全部 import 自 core 模块
- [ ] 移动端 375px 宽度可正常游玩（无横向滚动）

## 风险与回滚

- workspace 链接包解析：shared 无构建产物、exports 指向 TS 源，Vite 依赖预构建可能需要 `optimizeDeps.exclude` 或 alias——实现时验证，失败则加 alias
- 浏览器自动播放策略：首次播放须在用户手势后；本流程「点开始 → 进答题 → 用户点播放或自动播（已有手势）」需实测确认
- Tailwind v3/v4 配置差异：用脚手架默认稳定版并锁定
- 回滚：单次 commit revert
