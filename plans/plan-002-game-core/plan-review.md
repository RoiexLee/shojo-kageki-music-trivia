# plan-002 计划评阅

- 评阅人：reviewer-agent
- 日期：2026-10-26
- 评阅对象：plans/plan-002-game-core/plan.md
- 契约基线：plans/plan-001-scaffold-and-data/plan.md（v2，RECHECK PASS）。按协议，本评阅以 plan-001 v2 计划书声明的契约为准，不考察 plan-001 工作树实现现状。

**契约对齐总检**（逐项核对 plan-001 v2 承诺）：

- 片段命名：plan-002「音频路径按难度选择 intro-15/10/5」与 plan-001 manifest schema 的 `segments` 键（`intro-5`/`intro-10`/`intro-15`/`chorus-10`/`reverse-8`，各含 `path` + `durationSec`）逐字对齐，无出入。`chorus-10`/`reverse-8` 本 plan 不消费、留给 plan-003，合理。
- 封面：`coverPath` 由 plan-001 承诺，plan-002 结算页消费，对齐。
- 类型：`Manifest`/`ManifestEntry` 落在 shared 由 plan-001 承诺；`QuizMode/Difficulty/Question/QuizConfig` 为「plan-002 消费的占位定义，仅类型」。plan-002 未声明是否消费这四个占位类型、也未声明演化许可——见必改 2。
- 根脚本：plan-001 已配 `npm test --workspaces --if-present`、dev/build 转发（app 缺失时报错）、workspaces 含 `apps/*`，故 plan-002 无需动根 package.json，其边界声明与此一致。
- 引用核查：plan-002 未引用任何 plan-001 没承诺的东西。反向（该消费未消费的占位类型）见必改 2。

## 逐项意见

### 交付物

1. **（交付物 1）依赖白名单缺失，直接丢掉了 plan-001 RECHECK 的显式交接**。plan-001 评阅复核节非阻塞提醒第 3 条写明「vite 类依赖由 plan-002 自行声明白名单，避免白名单名存实亡」。plan-002 只写「Vite + React + TypeScript + Tailwind CSS（版本取当前稳定）」，未列出允许新增的依赖清单（react/react-dom/vite/@vitejs/plugin-react/typescript/tailwindcss 及 v3 的 postcss/autoprefixer 或 v4 的 @tailwindcss/vite、vitest、@types/*），也未说明版本锁定策略（提交 package-lock.json）。项目此前刻意保持「无第三方运行时依赖 + devDependencies 白名单」的可审计性，此处必须补齐。
2. **（交付物 2 vs 涉及文件）「`packages/shared/src/quiz/` 或 `apps/web/src/core` 二选一」是本计划最大的埋雷点，且与涉及文件节自相矛盾**。涉及文件节写「修改：仅限 `apps/web/**` 与 plans/README.md、plans/plan-002 文档」，但交付物 2 允许把纯函数放进 `packages/shared/src/quiz/`——后者必然要改 `packages/shared/src/index.ts`（新增导出），落在 apps/web/** 之外。两处文本只能对一处。更深一层：plan-001 把 `Question/QuizConfig` 等定义为占位类型，而 buildQuiz 实际产出的 Question 大概率需要携带选项列表、片段 key/音频路径、正确项 id 等字段，占位形状很可能不够用；若在 shared 上改这些类型，就构成 plan-002 自己禁止的「既有导出的破坏性修改」。当前曲库下这些占位类型尚无其他消费方（tools 只用 Manifest 系列），演化零风险，但计划必须把许可写明。建议：本 plan 裁定落 `apps/web/src/core`（理由：plan-001 正在并行写 shared，避免碰其交付物 index.ts；quiz 逻辑目前没有 web 以外的消费方；类型随函数同处演化最顺），shared 四个占位类型要么明确「本 plan 不消费、由 core 自定义类型，plan-003 视需要收敛回 shared」，要么明确「允许演化（无其他消费方）」。二选一必须在计划阶段裁定，不能留给实现纪要——它决定涉及文件清单和 shared 是否被动。
3. **（交付物 2）「优先同 type 出处歌曲」有歧义，撞在 plan-001 的双字段契约上**。SongMeta 同时定义了 `type` 和 `origin` 两个独立字段。「同 type 出处」无法判定指哪个：同 `type`（如同为插入歌）？同 `origin`（同专辑/同企划）？还是两者都同？这直接影响 buildQuiz 的实现和对应单测，且测试清单里只有「干扰项不含正确项」，没有优先级规则与「随机补齐也走种子随机流」的用例。需改写为明确字段（建议：优先同 `type`；不足时从剩余曲库以同一 seeded rng 补齐）并补测试。
4. **（交付物 2）测试清单与「纯函数必须有测试」不完全对账**。清单列了 4 类（种子可复现、不重复抽题、干扰项不含正确项、难度→片段/选项数映射），但交付的纯函数还有 `judge`、`summarize`、`formatTime`，均无对应用例。AGENTS.md 技术栈表与硬性约束 3 要求纯函数必须有测试，清单应补齐。另有一个 fixture 陷阱：当前曲库恰好 10 首，「随机不重复抽 10 题」在真实数据下退化为「全量洗牌」，抽样与去重逻辑测不出来——单测必须用 >10 首的 mock 数组，并顺带定义「曲库 < 题数」时的行为（取 min 或报错），为 plan-005 扩库留好语义。
5. **（交付物 2）`judge(question, selectedIds): boolean` 参数名与单选玩法不符**。本 plan 是 N 选一，参数应为 `selectedId`（单数）；复数签名暗示多选残留，实现时容易照抄出多余数组逻辑。一词之改，顺手修。
6. **（交付物 3）数据接线机制未写明，存在一个真实集成缝**。`manifest.json` 在 `apps/web/public/assets/`（整目录 gitignore），只能运行时 fetch，且**要求先跑过 `npm run assets`**——「npm run build 成功」在产物缺失时照样通过，验收若不写明前置顺序会漏掉「dist 里根本没有资产」的空构建。`songs.json` 建议走 Vite 静态 JSON import；plan-001 承诺的 `loadSongs()` 是「校验读取」，若实现为 Node/fs 风格则浏览器不可用，计划应写一句「不依赖 loadSongs 的运行时形态，直接 import songs.json」来钉死这条缝。
7. **（交付物 1/3）播放结束后的行为未定义**。规则写了「播放片段 → 选出 → 反馈 → 下一题」，但片段自然播完后 UI 处于什么状态、是否存在回合时限、重放是否无限制，均未说。建议本 plan 显式声明「无回合时限、可无限重放」（与 MyGO 基础玩法一致，限时留给后续 plan），一句决策省掉实现者的自由发挥空间。

### 验收标准

1. 「npm test 全绿，含 quiz 纯函数 ≥ 6 个用例」可勾选，但与交付物测试清单一样漏了 judge/summarize/formatTime（见交付物意见 4）。
2. 「npm run build 成功且产物不含源 mp3（只用切片）」方向正确（源 mp3 从不进 public，按构造即真），但判据不可操作。建议改为可执行检查：构建前先 `npm run assets`；dist 内所有 mp3 均位于 `assets/audio/` 下、单文件 ≤ 300KB（15s@128kbps ≈ 240KB，源曲整首远大于此）；manifest.json 与 50 个切片、10 张封面均在 dist/assets 中。
3. 「手测：可完整玩一局……」可执行；「难度切换生效」建议写明核对点（简单局选项恰 3 个、困难局恰 6 个；DOM/控制台核对片段 URL 为 intro-15/intro-5）。
4. 「抽题可复现（同一种子同卷面）且有对应测试」清晰可测。补充一句运行时种子来源更完整（每局随机生成种子；Debug/URL 参数可指定以便复现 bug）。
5. 「组件无内联业务规则」作为 implementation-review 的检视条目可行；建议给出机械判据（组件内不出现 Math.random/Date.now/选项比较逻辑，计分判定全部 import 自 core 模块）。
6. 「移动端 375px 宽度可正常游玩（无横向滚动）」可执行（DevTools 设备模拟 iPhone SE 档即可），无问题。

### 技术方案

1. 纯函数先行、UI 后置的步骤顺序正确；mulberry32 + 种子随机选型合适，可复现性可测。
2. 难度映射（简单 15s/3 项 → 困难 5s/6 项）方向与 MyGO 对齐，无歧义；「四选一」出现在背景与目标（plan.md:10）而规则节是 3/4/6，措辞应统一为「N 选一」，避免实现者按字面把选项写死为 4。
3. useQuizEngine/useAudioPlayer 职责切分合理，播放状态驱动 CSS class 的做法把音频 UI 耦合降到最低。
4. 风险清单缺两项常见坑：(a) workspace 链接包在 Vite 中的解析——shared 无构建产物时需确认其 package.json `main/exports` 指向 TS 源并能被 Vite 依赖预构建接受，必要时配 alias；(b) 浏览器自动播放策略——首次播放须在用户手势之后，本流程「点难度 → 进答题」天然有手势，但值得写一句以免实现成「进页面自动播」被 autoplay 拦截。

### 边界与风险

1. 与 plan-001 的所有权互斥总体成立：plan-001 拥有根 package.json、packages/shared、tools/**、.gitignore；plan-002 拥有 apps/web/**。唯一交叠是 plan-001 的生成产物写入 `apps/web/public/assets/`（gitignored、可重建），不构成源文件冲突。
2. **涉及文件节的边界句本身语病并夹带矛盾**：「禁止改动：根 package.json、packages/shared 既有导出的破坏性修改（新增导出允许）、tools/**、music/**（如需 shared 微调，在实现纪要中说明并保持向后兼容）」——「如需 shared 微调」的括注错挂在 music/** 之后，且「packages/shared 既有导出的破坏性修改」作为「禁止改动」的宾语读不通。结合交付物 2 的二选一（见交付物意见 2），这一节必须重写：要么裁定 apps/web/src/core 并维持「仅限 apps/web/**」，要么改列 `packages/shared/src/quiz/**` 与 index.ts 的新增导出，并把占位类型演化许可写清。
3. 「manifest/songs 结构与 plan-001 实际产出有出入：以其实现纪要为准 + 必要时适配层」的预案方向正确；但 plan-001 v2 已把 schema 写死为共享契约，正常路径不应需要适配层，建议措辞改为「契约不一致即为 plan-001 的实现缺陷，回报 orchestrator 裁决而非静默适配」，避免把上游偏差吞进本 plan。
4. Tailwind v3/v4 风险识别到位；「回滚：单次 commit revert」与 AGENTS.md 提交协议一致，可行。

## 必改清单（FIX 时必填）

1. **补 apps/web 依赖白名单与锁定策略**（承接 plan-001 RECHECK 提醒 3）：列出允许新增的 runtime/devDependencies（react、react-dom、vite、@vitejs/plugin-react、typescript、tailwindcss 及其配套、vitest、@types/*），写明版本锁定方式（提交 package-lock.json），保持「依赖可审计」的项目惯例。
2. **裁定纯函数落点并消除涉及文件矛盾**：在 `apps/web/src/core`（建议，理由见交付物意见 2）与 `packages/shared/src/quiz/` 之间由计划直接选定，同步修订涉及文件节使其自洽；并显式声明 shared 四个占位类型（QuizMode/Difficulty/Question/QuizConfig）的处置——本 plan 允许演化（尚无其他消费方）或明确不消费、由 core 自行定义。重写语病边界句。
3. **消解「优先同 type 出处」歧义**：明确干扰项优先级依据的字段（`type` 或 `origin` 或组合），规定不足时随机补齐也使用同一种子随机流，并补「干扰项优先级」与「随机补齐可复现」两个用例。
4. **补齐纯函数测试清单**：`judge`、`summarize`、`formatTime` 纳入测试列举（AGENTS.md：纯函数必须有测试）；写明单测 fixture 需 >10 首 mock 歌以真正覆盖抽样/去重，并定义曲库数 < 题数时的行为。

## 结论

VERDICT: FIX

四条必改均为计划文本层面修订（约二十行），不触及方案骨架：第 1 条是 plan-001 复核显式移交的义务，第 2 条是计划内部自相矛盾 + 占位类型演化授权缺失，第 3、4 条是规则歧义与测试完备性。玩法闭环覆盖完整（主页→模式→难度→答题→结算→再玩一次），契约消费（intro-15/10/5、coverPath、manifest、workspaces）与 plan-001 v2 逐项对齐，无越界引用。建议性意见（数据接线机制与 assets 前置、「N 选一」措辞、播放结束后行为、autoplay/workspace 解析风险、种子来源、「产物不含源 mp3」判据）可随返修一并采纳或逐条答复。修回后按协议由本 reviewer 复核（RECHECK）。

---

## 复核（v2，2026-10-26）

RECHECK: PASS

四条必改逐项核验通过：

1. **依赖白名单**：交付物 1 列全 runtime（react/react-dom）与 dev（vite/@vitejs/plugin-react/typescript/tailwindcss 含 v3/v4 配套分支/vitest/@types/react/@types/react-dom），要求提交 package-lock.json，白名单外须说明理由回报；验收第 2 条给出可勾选的对应条目。plan-001 RECHECK 移交的义务已闭环。
2. **落点裁定与边界**：纯函数裁定落 `apps/web/src/core`（理由三点齐备）；core 自定义类型、显式声明不消费 shared 占位类型且原样保留、plan-003 视需要收敛；涉及文件节重写后自洽（对 shared 零改动、不动根 package.json/.gitignore，语病消除），与交付物 2 不再矛盾。
3. **干扰项规则**：明确为「优先同 `type` 字段，不足时从剩余曲库以同一 seeded rng 补齐」，歧义消除；测试清单补「干扰项优先同 type（分组 fixture）」与「随机补齐可复现」。
4. **测试完备性**：`judge(question, selectedId)` 改单数；judge/summarize/formatTime 全部入列，用例门槛升为 ≥10；fixture 明确 >10 首 mock 并写明原因（真实曲库恰 10 首退化为全量洗牌）；「曲库 < 题数取 min 不报错」在规则节（plan.md:14）与 buildQuiz（plan.md:30）双重落位。

建议项落位确认：数据接线写死（songs.json 静态 import、manifest 运行时 fetch、手测/构建前先 `npm run assets`）、「N 选一」措辞统一、无回合时限+无限重放显式声明（plan.md:16）、autoplay 手势说明、workspace 解析风险与 alias 预案（步骤 1 + 风险节）、种子来源（每局随机 + `?seed=`）、构建判据量化（mp3 ≤300KB、50 切片+10 封面+manifest 进 dist/assets，与 plan-001 契约的 10×5 数量吻合）、组件无内联规则的机械判据、契约偏差上报不静默适配——全部落位且可验收。

给 implementer 的两条非阻塞提醒（不构成返修，实现时注意即可）：

1. **根 package-lock.json 会随安装被更新**：npm workspaces 是单一根锁文件，安装 apps/web 依赖必然修改根 package-lock.json（plan-001 的 `npm install` 已生成它）。这是 workspace 机制的机械结果，不违反「不动根 package.json」；实现纪要注明该文件随本 plan 一并提交即可（验收第 2 条已隐含此要求）。
2. **`@starlight/shared` 包名与 `./songs.json` 子路径是 plan-001 未声明的细节**：交付物 3 的 `import ... from '@starlight/shared/songs.json'` 假设了 shared 的包名与 exports 暴露 songs.json 子路径，plan-001 v2 两者均未承诺。以 plan-001 实际产出为准——包名不同就用实际包名，exports 未暴露子路径则经 index 重导出或 Vite alias（步骤 1 预案已覆盖）；这属未约定细节的现场适配，不触发「契约偏差上报」规则（该规则只管 schema/结构不一致）。
