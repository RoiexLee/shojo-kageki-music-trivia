# Plan 007 实现评阅

VERDICT: FIX

## 已核对内容

已对照 `AGENTS.md`、`plans/plan-007-quiz-playback/plan.md` 和实现纪要检查当前工作树。规则、资源管道、中文歌词和成绩版本的主要改动已落地：`apps/web/src/core/quiz.ts:14-16,53-55,136-151` 使用 `clip-5/10/15`、三档双曲混合和中文译文过滤；`tools/prepare-audio/src/util.mjs:1-30`、`apps/web/src/data.ts:9-26` 及 fixtures 覆盖八种片段；`apps/web/src/core/best.ts:10-11` 为片段、歌词和混合模式隔离 `best:v2` 并保留倒放旧键。歌词题面和揭晓试听的正常路径位于 `apps/web/src/pages/QuizPage.tsx:18-36,61-77`，Web Audio 全部解码后统一排程、增益缩放、暂停/继续/取消及手势恢复位于 `apps/web/src/hooks/audioQueue.ts:51-165`。

资源与本地自动化验证均通过：`npm test --workspaces --if-present`（web 32、shared 8、prepare-audio 26，共 66 项）、`npm run build`、`npm run assets -- --verify`（10 首 × 8 片段）。工作树中的 `music/` 未变化，生成的 `apps/web/public/assets/` 与 `dist/` 被 `.gitignore` 忽略，未见新增依赖。README、首页、分享、工具说明和 `apps/web/index.html` 已同步新玩法文案；历史 plan/研究文档中的旧玩法描述属于历史记录，不作为当前 UI 文案。

## 必须修复

1. **混合题缺失轨道会静默降级为单曲，违反整体失败约束。** `apps/web/src/pages/QuizPage.tsx:20-24` 将 `question.clips` 映射后直接 `.filter(Boolean)`。当任一歌曲在 manifest 中缺少目标片段或 path 为空时，`audioSources` 仍会保留另一条 URL，`:34` 调用 `playQueue` 后 `audioQueue.ts:95-103` 会只解码并播放剩余轨道；页面还会显示“两轨同刻开始”，而不是报告混合题整体失败。计划和验收要求明确“任一失败整组停止、不能降级成单曲”。应在生成 audioSources 时保留缺失项并显式进入可恢复错误状态，或至少在 `question.mode === 'mix'` 且路径数量不等于 `question.clips.length` 时不调用播放、将失败计数/提示设为整组失败；补充组件或播放器测试证明单轨缺失不会创建或启动任何轨道。

实现纪要声称已覆盖“整组失败”，但现有 `apps/web/src/hooks/audioQueue.test.ts` 只覆盖 fetch 返回错误（播放器输入本来就有两条 URL），未覆盖页面 manifest 缺 path 的过滤场景，因此不能抵销上述缺陷。

## 复核与未测风险

修复后请由本 reviewer 追加 `RECHECK: PASS/FIX`，再由编排者提交。根 agent 仍需补充计划要求的桌面与 375px 浏览器真实交互、实际 Web Audio 两个 `BufferSource.start` 的同一时间/重叠证据、歌词作答前静音及答错后正确歌曲试听、无横向溢出和控制台检查；本次未执行这些浏览器验收。另建议在实现测试中覆盖暂停后立即点击继续的异步 `suspend()` 竞态，避免恢复播放后被迟到的暂停承诺再次挂起，但该项不是本次阻塞结论的唯一依据。

## RECHECK: PASS

实现者已在 `apps/web/src/pages/QuizPage.tsx:15-24,29-40,81` 增加 `resolveAudioSources`：混合题任一轨缺失时返回空路径、阻止 `playQueue`，并展示“混合题已整体停止”的可读错误；不再通过 `.filter(Boolean)` 静默播放单轨。`apps/web/src/pages/QuizPage.test.tsx:41-45` 新增缺轨回归，验证 `missing`、空路径及页面提示。修复后重新执行 `npm test --workspaces --if-present`（web 33、shared 8、prepare-audio 26，共 67 项）、`npm run build` 与 `npm run assets -- --verify`，均通过。

本次复核仍未替代根 agent 负责的桌面/375px 真实浏览器验收、Web Audio 实际输出轨道重叠证据和控制台检查；这些风险已在实现纪要中声明，待根 agent 补齐后方可提交。

## RECHECK: PASS

追加复核确认两项可见流程已补齐：`apps/web/src/pages/QuizPage.tsx:32-40` 将题目标题焦点与音频 effect 分离，焦点仅随 `question.id` 变化，不会因作答或播放器状态夺焦；`apps/web/src/pages/QuizPage.tsx:83` 缺轨错误入口改为 `props.onExit` 的“返回首页重试”，不再调用空 `playQueue([])`。`apps/web/src/pages/QuizPage.test.tsx:41-46` 同步断言新入口。修复后 `npm test --workspace apps/web --if-present` 通过（33 tests）。此前整库测试、构建与资源 verify 结果仍有效。
