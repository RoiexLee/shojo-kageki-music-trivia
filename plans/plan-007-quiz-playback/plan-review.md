# Plan 007 计划评阅

VERDICT: PASS

## 评阅范围与结论

已完整阅读 `AGENTS.md`、本计划及规则、页面、播放器、成绩与资源生成的现有实现。以 `8a62890` 为基线评阅。计划完整覆盖片段猜歌、中文歌词揭晓试听、双曲同步混合及成绩兼容，交付物、验收与回滚均明确；无阻塞实施的计划缺项。

## 实现与验收核对点

1. **中文必须按实际展示文本判定。** `apps/web/src/core/quiz.ts:126` 当前候选逻辑仅针对日文原句。中文候选应针对 `translation` 做 NFKC 归一化、长度限制、去重、歌名及 aliases 泄漏过滤；要求含汉字且无假名，不能把非空纯英文译文字段当中文。研究统计 526 行中 524 行有 translation，但含纯英文内容；按中文约束后各歌仍有 22–45 条候选。`apps/web/src/core/quiz.ts:175` 的倒放提示与歌词共用候选逻辑，实现时需避免意外改变倒放模式的可用曲库。
2. **歌词揭晓音频依赖答题状态，但不能被旧停止效果立即中断。** `apps/web/src/pages/QuizPage.tsx:18` 当前歌词模式没有音源，`:22` 的换题播放效果和 `:27` 的 answered 停止效果需要一起调整。答错也应试听正确歌曲；下一题、退出、卸载和 StrictMode 清理必须停止旧播放。题目焦点不能随播放状态更新反复触发，揭晓前不能渲染或触发试听控制。
3. **混合轨道完整性与同时排程必须可验证。** `apps/web/src/pages/QuizPage.tsx:20` 当前 `.filter(Boolean)` 会静默丢弃缺失音源；双曲模式必须整体报错。`apps/web/src/hooks/audioQueue.ts:47` 当前为顺序队列，需由同一 AudioContext 在两轨均解码成功后按相同未来时刻启动，等增益缩放。测试应覆盖双轨开始时间、暂停后共同偏移恢复、重放归零、单轨失败整组停止、迟到 fetch/decode/onended 不跨题生效；浏览器记录实际调度证据。
4. **手势恢复需覆盖真实浏览器语义。** `apps/web/src/hooks/audioQueue.ts:59` 当前处理 HTMLAudioElement 的 NotAllowedError，新控制器不能照搬为只捕获 `resume()` 拒绝。AudioContext 处于 suspended 时应提供恢复入口，并在用户点击调用链内发起 resume，避免等待 fetch/decode 后丢失手势或永远停留在加载中。
5. **15 秒曲中片段需扩大源时长下限。** `tools/prepare-audio/src/util.mjs:26` 当前只要求 `chorusStartSec + 10`，新增 `clip-15` 后必须调整为覆盖最长片段。同步更新 `apps/web/src/data.ts:9`、shared 类型、fixtures、资源验证器及 `tools/prepare-audio/test/builders.test.mjs:52` 的固定片段清单和 `:63` 的时长断言。`tools/prepare-audio/src/cli.mjs:196` 附近验证输出不应继续硬编码五个片段。使用全新 clip key 可避免旧 intro 缓存误中，保留旧切片符合回滚目标。
6. **规则和成绩版本必须一起变化。** `apps/web/src/core/quiz.ts:52` 当前困难混合为三首，应三个难度都固定两首互异，仍保持 4/6/8 选项及全部选对计分。`apps/web/src/core/best.ts:10` 当前键没有版本；测试须证明改版三个模式不会读旧成绩、旧记录仍保留，未改玩法的倒放成绩行为保持兼容。

## 验证边界

本次为计划评阅，仅写入本文件；未修改代码、素材或生成资源，未执行实现阶段测试。实现评阅仍须检查 `npm test`、构建、资源重建与 verify，以及桌面和 375px 的真实播放与交互证据。
