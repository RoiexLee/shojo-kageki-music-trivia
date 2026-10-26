# plan-003 — 游戏模式扩展：歌词 / 倒放 / 混合 / 难度矩阵与结算强化

- 状态：待实现（v3，独立复核补充资源路径与兼容性）
- 作者：orchestrator
- 日期：2026-10-26
- 前置：plan-002 已提交（38b4bf1；Question/DIFFICULTY_MAP 位于 apps/web/src/core，useAudioPlayer 单 src 形态）
- 修订：v2 — ①歌词数据管道选定 prepare-audio 产物路线（含 tools 修改授权）②lrc 解析与抽行规格完整化 ③Question discriminated union 与 judge 分派 ④难度矩阵成表 ⑤useAudioPlayer 队列化 ⑥混合模式交互细节 ⑦类型落点更正（core，shared 零改动）

## 背景与目标

plan-002 交付「开头猜歌」单模式闭环。本计划把玩法扩展到完整模式矩阵（对齐 MyGO 猜歌）：**歌词猜歌 / 倒放猜歌 / 混合连猜**，配套难度矩阵、结算强化与本地最佳成绩。

## 交付物清单

1. **歌词数据管道（tools/prepare-audio 扩展，修改授权见「涉及文件」）**：
   - 新增步骤：解析 `music/{folder}/{folder}.lrc` → 产出 `apps/web/public/assets/lyrics/{id}.json`，schema：`{ id, lines: [{ timeMs, text, translation? }] }`（translation 为剥离出的中文行，双语保留供提示用）
   - 解析规格：时间戳 `[mm:ss.mmm]`；` (翻译：…)` 后缀剥离为 translation（原文不含该后缀）；空时间戳行（纯间奏）跳过；无法解析的行跳过并计数警告；**单歌有效行（text 非空）< 8 行报错**（防间奏超长曲有效行不足）
   - `--verify` 覆盖：lyrics 文件存在、可解析、行数与生成时一致（存 lineCount 于 manifest 或文件内字段）
   - 幂等：纳入现有 params 比对（lrc 内容变化 → 重建该歌 lyrics 产物）
2. **`apps/web/src/core` 扩展（类型与纯函数）**：
   - **Question discriminated union**（全部在 core，shared 零改动）：
     - `IntroQuestion { mode:'intro'; segmentKey; answerSongId; optionSongIds }`（现有形态不变）
     - `LyricsQuestion { mode:'lyrics'; lyricText; translation?; originHint?; answerSongId; optionSongIds }`
     - `ReverseQuestion { mode:'reverse'; segmentKey:'reverse-8'; lyricHint?; answerSongId; optionSongIds }`
     - `MixQuestion { mode:'mix'; clips: { songId; segmentKey }[]; answerSongIds: string[]; optionSongIds: string[] }`
   - **judge 分派**：`judge(question, selected: string | string[])` —— 单选模式同现签名；mix 为**集合完全相等**才判对
   - **难度矩阵**（新增 MODE_DIFFICULTY_MAP + 单测全覆盖）`Record<QuizMode, Record<Difficulty, ModeSpec>>`；保留原 DIFFICULTY_MAP 为 intro 兼容常量，以保障现有测试零改动：

     | 模式 | 难度 | 片段 | 选项数 | 答案数 | 提示 |
     |---|---|---|---|---|---|
     | intro | 简单/普通/困难 | intro-15/10/5 | 3/4/6 | 1 | — |
     | lyrics | 简单 | —（无音频） | 3 | 1 | 显示出处（origin） |
     | lyrics | 普通/困难 | — | 4/6 | 1 | 无 |
     | reverse | 简单 | reverse-8 | 3 | 1 | 显示一句该歌歌词（lyricHint） |
     | reverse | 普通/困难 | reverse-8 | 4/6 | 1 | 无 |
     | mix | 简单 | chorus-10 ×2 首 | 4 | 2 | 已选 X/N 指示 |
     | mix | 普通 | chorus-10 ×2 首 | 6 | 2 | 同上 |
     | mix | 困难（噩梦） | chorus-10 ×3 首 | 8 | 3 | 同上 |

   - **buildQuiz 扩展**：按模式生成分支；lyrics 抽行规则——从该歌有效行中**种子随机**抽 1 行，过滤 `text.length < 6` 的碎片行与包含歌名子串的行（防题面自曝答案）；mix 从曲库种子抽 N 首不重复
   - **歌词数据获取**：web 侧 `fetch('/assets/lyrics/{id}.json')`（挂载时批量拉取或按需缓存）；类型定义在 core
   - Vitest：lrc 解析器（真实文件 ×10 + 构造异常行/空行/超短行用例）、矩阵全组合、judge 分派（mix 集合相等/多选少选错选均假）、抽行过滤规则、**intro 回归（现有 12 用例零改动通过）**
3. **`apps/web` UI 与 hooks**：
   - `useAudioPlayer` 队列化：`playQueue(srcs: string[], gapMs = 500)`（单播 = 长度 1 队列，内部统一）；暴露 `queueIndex`；片段加载失败跳过该片段并计数（不中断整题）
   - HomePage：四模式卡全部启用（文案对齐矩阵）
   - QuizPage 按模式渲染题面：lyrics 大字歌词卡（简单难度附出处）；reverse 波形 + 提示行；mix 连播进度（第 i/N 段）+ **toggle 多选**（可选中/取消、「已选 X/答案数」、选满才可点「确认判定」，对齐 MyGO 交互；单选模式保持点击即判不变）
   - SummaryPage 强化：逐题记录含模式信息与 mix 的多答案展示、**显示本局种子号**（?seed= 复现）、localStorage 最佳成绩（键 `best:{mode}:{difficulty}`，值 `{correct, total, elapsedMs}`，仅更高 correct 或同分更快时更新）
4. **测试与自测**：`npm test` 全绿；`npm run assets`（含新 lyrics 产物）+ `--verify`；`npm run build` + dist 检查（lyrics 10 个 json 进 dist）；dev 冒烟；游玩级手测仍标「待人工」（与 375px 视觉验收一并归 plan-004）
5. 流程文档四件套（implementation.md / implementation-review.md）

## 涉及文件

新增：`tools/prepare-audio/src/lyrics.mjs` + 其测试、`apps/web/public/assets/lyrics/**`（gitignored 产物）、apps/web 新组件/测试
修改：`tools/prepare-audio/src/cli.mjs`（**对 tools/prepare-audio 的修改由本计划显式授权**，范围仅限新增歌词产物步骤与 --verify 扩展）、`apps/web/src/core/**`、`apps/web/src/hooks/**`、`apps/web/src/pages/**`、`apps/web/src/data.ts`、`apps/web/src/App.tsx`、`plans/README.md`

独立复核补充：manifest 中音频与封面路径相对 assets 根，所有运行时 URL 必须按 BASE_URL + assets/ 拼接，修复基线缺失 assets/ 导致的 404。歌词候选需去重，候选为空时显示可恢复错误；资源 fetch 和 localStorage 都要校验及捕获错误。混合连播使用顺序片段，不宣称已实现参考游戏的同时叠音。
不动：`packages/shared/**`（零改动；Question 收敛回 shared 的议题移交 plan-005）、`music/`（lrc 只读）、根 `package.json`、`.gitignore`（lyrics/ 已被 assets/ 整目录规则覆盖）

## 实现步骤（建议）

1. tools：lrc 解析纯函数 + 测试 → cli 集成（产物/幂等/verify）→ 真实跑 `npm run assets` 生成 10 个 lyrics.json
2. core：Question union + judge 分派 + 难度矩阵 + buildQuiz 分支 + 测试（含 intro 回归）
3. hooks：useAudioPlayer 队列化（保持单播兼容）
4. 页面：模式卡/题面分支/混合多选交互/结算强化/最佳成绩
5. 全量自测 + 手测脚本清单（供人工）

## 验收标准

- [ ] `npm test` 全绿；lrc 解析对 10 首真实文件全部成功（含异常行容错用例）；矩阵全组合有测试
- [ ] `npm run assets` 产出 10 个 `lyrics/{id}.json` 且 `--verify` 通过（含 lyrics 覆盖）
- [ ] intro 回归：现有 core 用例**零改动**通过；intro 一局手测不回归
- [ ] 四模式 × 三难度均可成局游玩（可自动化的部分：buildQuiz 各组合产出结构断言）；mix 判定为集合相等（多选/少选/错选均假）有用例
- [ ] 混合模式 UI：toggle 取消可用、「已选 X/N」、选满才可确认；单选模式保持即点即判
- [ ] localStorage 最佳成绩按 模式×难度 独立读写（测试或控制台核验）
- [ ] 结算页显示种子号；`npm run build` 后 dist 含 lyrics JSON ×10
- [ ] 游玩级 UI 手测与 375px 验收：**本 plan 不重复**，归 plan-004 视觉走查（沿用 plan-002 遗留 ⚠️）

## 风险与回滚

- lrc 质量参差：解析器容错 + 阈值报错；有效行 <8 的歌在 assets 阶段即失败（不会带病进运行时）
- tools 扩展回归：现有 builders 测试不动、cli 测试扩展；`--only` 调试单歌
- Question union 是结构性改动：先扩展类型与判定（步骤 2 全测试），再动 UI；intro 分支测试零改动即回归证明
- 回滚：单 commit revert（横跨 tools+web 仍是一个 commit）
