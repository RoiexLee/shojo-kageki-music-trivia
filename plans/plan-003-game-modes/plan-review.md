# plan-003 计划评阅

- 评阅人：orchestrator（说明：评审 agent 派发后停滞，按既定先例由 orchestrator 完成评阅；plan-003 草案亦为 orchestrator 所写，独立性缺口同前两份实现评阅，已显式声明，接受后续独立复核）
- 日期：2026-10-26
- 评阅对象：plans/plan-003-game-modes/plan.md（草案，自称「待 plan-002 落地后细化」——plan-002 已提交 38b4bf1，细化条件成立）
- 事实基线：apps/web/src/core/quiz.ts（Question 单模式形态、DIFFICULTY_MAP 为 Record<Difficulty, Spec>）、useAudioPlayer（单 src）、music/ 实测 lrc 格式 `[mm:ss.mmm]日文 (翻译：中文)`，含空时间戳行（纯间奏），2 首含 yrc（逐字级，超出本 plan 范围）

## 逐项意见

### 交付物

1. **（交付物 1）歌词数据管道缺失——本评阅最重要发现，必改**。草案要求「lrc 解析器为纯函数」「lrc 解析器对 10 首歌全部 lrc 解析成功」，但 **lrc 文件在 `music/`，web 运行时无法访问**（music/ 不进构建产物，manifest 也只含音频/封面）。歌词题面需要数据进入 `apps/web/public/assets/`。可选路径：
   - (a) `tools/prepare-audio` 新增歌词产物：解析 lrc → `assets/lyrics/{id}.json`（或并入 manifest 条目），幂等纳入现有管道 ✅ 推荐
   - (b) web 构建时直接读 music/ —— 构建耦合素材目录、破坏「产物可由 assets 工具重建」的既定架构 ❌
   - (c) 内嵌 songs.json —— 职责与体积都不合理 ❌
   选 (a) 则**必须显式声明对 `tools/prepare-audio/**` 的修改授权**（AGENTS.md 硬性约束：plan 明确要求 + orchestrator 批准——本评阅即批准凭据，但计划书要写清改哪些文件、产物 schema、`--verify` 是否覆盖新产物）。
2. **（交付物 1）lrc 解析与抽行规格不完整，必改**。实测格式含三类行：带词行（`[00:14.000]躊躇う暇はない … (翻译：…)`）、空时间戳行（`[00:09.280]`，间奏标记）、（抽查未见但需防御的）无标签行。计划需写明：时间戳解析 `mm:ss.mmm`；翻译剥离为**可选开关**（保留双语供困难模式提示用）；空行跳过；异常行跳过并计数（≥1 首歌有效行数 < 阈值时报错）。**抽行规则缺失**：种子随机选行？过滤超短行（如日文 < 6 字符，避免「ハイ」级碎片）？连续行去重？需给出可测试的规则。
3. **（交付物 2）Question 类型扩展路径未细化，必改**。现为单模式形态 `{id, mode:'intro', answerSongId, optionSongIds, segmentKey}`。需明确 discriminated union 设计：`IntroQuestion | LyricsQuestion | ReverseQuestion | MixQuestion`；**mix 的答案与选项是多集合**（answerSongIds: string[]，judge 为集合相等），与现有单选 judge 签名如何共存（重载或按模式分派函数）；现有 12 个用例的迁移策略（intro 用例零改动应成立——向后兼容验收项的真正含义）。
4. **（交付物 1）难度矩阵未成表，必改**。现 `DIFFICULTY_MAP` 是 `Record<Difficulty, Spec>`。多模式下需 `Record<QuizMode, Record<Difficulty, ModeSpec>>`。草案只写了混合模式困难=3 首。需给完整矩阵表（各模式 × 各难度的 片段键/选项数/答案数/提示与否），例：reverse 模式 easy 是否显示歌词提示行（草案提了 MyGO hint 设计，要落进矩阵）；lyrics 模式 easy 的「出处提示」具体形态。
5. **（交付物 3）useAudioPlayer 连播接口未定义，必改**。现状单 `play(src)`/`replay()`。mix 需要队列播放（片段序列 + 间距 0.5s 静音 + 播放索引状态）。需写明新接口（如 `playQueue(srcs: string[], gapMs)`）与现有单播的兼容（单播 = 长度 1 的队列即可统一）。
6. **（交付物 2）混合模式交互细节缺失，建议必改**。多选「全对才计分」已写，但交互未定义：选项按钮 toggle（选中/取消）、「已选 X/N」指示、**确认按钮**（选满 N 个才可确认，MyGO 同款）——单选模式保持「点击即判」不变。一句话可写清，避免实现者自由发挥。
7. **（涉及文件）引用了错误的类型落点，必改**。草案写「shared 的 Question 类型扩展（向后兼容…）」——**Question 实际在 apps/web/src/core**（plan-002 裁定，未进 shared）。shared 中只有占位类型。本 plan 应裁定：core 内扩展 union（推荐，与 plan-002 决策连续）；shared 占位类型是否收敛（建议：本 plan 不动 shared，收敛议题移交 plan-005 或专门小 plan）。

### 验收标准

- 「四模式完整游玩」可勾选；建议补「intro 模式回归：现有用例零改动通过 + 一局 intro 手测不回归」
- 「lrc 解析 10 首全成功」：需写明测试从 `music/` 读真实文件（只读不改动，符合硬性约束 1——plan-001 测试已有先例）
- 「localStorage 最佳成绩按 模式×难度 独立」可测（读 localStorage 断言键）
- 375px 项与 plan-002 遗留 ⚠️ 一并纳入本 plan 或 plan-004——需明示归属（建议归 plan-004 视觉走查，本 plan 不重复）

### 边界与风险

- 对 tools/prepare-audio 的修改授权：见意见 1，计划书必须显式列出（违反即 FIX）
- 对 `packages/shared/**`：零改动（歌词产物 schema 放 core 或工具侧 JSON，不动 shared 类型也行；若要在 shared 加 LyricsData 类型，按「新增导出允许」的先例写明）
- 风险节 lrc 质量参差已识别；补充：**空行占比高的歌**（如间奏长的再生讃美曲）有效行可能不足抽题阈值，解析器单测要覆盖
- 回滚单 commit 前提：本 plan 改动横跨 tools + web 两领地，回滚 revert 一个 commit 仍成立（同一 commit）

## 必改清单（FIX 时必填）

1. 歌词数据管道：选定路径 (a)，声明 tools/prepare-audio 修改授权 + 产物 schema（`assets/lyrics/{id}.json` 或并入 manifest）+ `--verify` 覆盖范围
2. lrc 解析器规格：时间戳格式、翻译剥离开关、空行/异常行处理、有效行阈值与报错；歌词题**抽行规则**（种子随机、最短字数过滤、去重）
3. Question 扩展：discriminated union 定义、mix 多集合答案与 judge 分派、现有用例迁移策略（intro 零改动）
4. 难度矩阵：完整 模式×难度 表（片段键/选项数/答案数/提示），落为 shared 占位或 core 常量并配测试
5. useAudioPlayer：playQueue 接口与单播统一方案、间距与失败跳过行为
6. 混合模式交互：toggle 选择、已选指示、确认按钮（选满才可确认）、单选模式保持即点即判
7. 更正类型落点：Question 在 core 扩展（非 shared）；本 plan 对 shared 零改动

## 结论

VERDICT: FIX

七条必改均为「草案 → 可实现计划书」的细化工作（草案自我声明待细化，评阅确认），不涉及方向性推翻：四模式矩阵、结算强化、localStorage 最佳成绩的骨架均成立。修订后按协议 RECHECK（可由 orchestrator 或恢复后的独立 agent 执行）。

## RECHECK（v2 复核）

- 复核人：orchestrator（v2 修订者与评阅者同为 orchestrator，独立性缺口同前声明；已另派独立 agent 事后复核，其结论可推翻本节）
- 日期：2026-10-26
- 逐条核对：
  1. 歌词管道 ✅ 选定 (a)：prepare-audio 产出 `assets/lyrics/{id}.json`（schema、阈值 8 行、幂等、--verify 覆盖均写入），涉及文件节显式授权且范围限定
  2. lrc 规格 ✅ 时间戳/翻译剥离/空行/异常行计数/阈值；抽行规则（种子随机、len<6 过滤、含歌名行排除）落进 buildQuiz 交付物
  3. Question union ✅ 四形态定义 + judge 分派（mix 集合相等）+ intro 用例零改动的回归验收
  4. 难度矩阵 ✅ 完整 模式×难度 表（片段/选项/答案/提示四列）进交付物 2
  5. useAudioPlayer ✅ playQueue(srcs, gapMs=500)、单播统一为长度 1 队列、失败跳过计数
  6. 混合交互 ✅ toggle 取消、已选 X/N、选满才可确认；单选保持即点即判
  7. 类型落点 ✅ 全部 core 内；shared 零改动（收敛议题移交 plan-005）；「不动」清单更正
  另：375px/游玩手测明确归 plan-004（不重复验收）；回滚前提（单 commit 跨 tools+web）写入风险节。
RECHECK: PASS

## 独立复核（2026-10-26）

- 复核人：独立 reviewer agent；只读检查代码，本次仅追加本评阅文件。
- 复核基线：`38b4bf1`；原有歌词解析器与 CLI 前置校验的未提交改动保留。已运行 `npm test`，当前 45 项通过（web 12、shared 8、tools 25），但这只证明已有测试，不代表四模式已经实现。
- v2 已把歌词生成、歌词抽取、四模式难度矩阵、多选判定、连播和成绩存储写成可验证交付物，前次七项必改均有对应规格。计划可以进入实现。
- 兼容实现要求：`apps/web/src/core/quiz.test.ts:73` 仍读取 `DIFFICULTY_MAP[d]`；保留该 intro 常量，并新增独立的模式矩阵常量即可同时满足 v2 的二维矩阵与旧测试零改动要求。`buildQuiz` 扩展联合类型时也应保留 intro 调用的类型推断。
- 已发现且必须在实现中修复的现有问题：`apps/web/src/pages/QuizPage.tsx:34` 与 `apps/web/src/pages/SummaryPage.tsx:44` 直接拼接 `BASE_URL` 和 manifest 相对路径，但 manifest 的 `audio/...`、`covers/...` 均相对 `assets/` 根，现有写法请求错误地址。修复在本计划已授权的页面范围内，浏览器验收需核查实际音频与封面成功加载。
- 建议把 `apps/web/src/data.ts` 补列到涉及文件（计划第 41 行歌词运行时获取自然涉及该模块）；统一尊重 `BASE_URL`，避免子路径运行时失败。加载失败应有返回/重试入口，localStorage 读写失败应不影响结算。
- 队列实现验收需同时覆盖自动播放被拦截、坏片段跳过、换题/退出时取消旧队列及重放从第 1 段开始，不能把媒体损坏统一当成需要手势。
- 本复核接受当前四模式范围；“对齐 MyGO”按玩法参考理解，不作为未经核实的完全复刻声明。游玩与移动端验收仍由 plan-004 完成并记录真实证据。

VERDICT: PASS
RECHECK: PASS

### v3 独立复核补充

已重新阅读 v3 全文：第 27 行明确兼容常量与二维矩阵并存；第 54 行补列 `data.ts`；第 56 行明确 `assets/` 路径、歌词去重/空候选恢复、fetch 与存储校验，以及顺序连播的范围。前述实施注意事项已有明确归属，无计划层阻塞。

RECHECK: PASS
