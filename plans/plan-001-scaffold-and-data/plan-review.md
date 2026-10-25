# plan-001 计划评阅

- 评阅人：reviewer-agent
- 日期：2026-10-26
- 评阅对象：plans/plan-001-scaffold-and-data/plan.md

**仓库事实核对**（评阅时实测）：
- `music/` 共 10 个文件夹，每夹 mp3 + lrc + jpg，恰 2 夹含 yrc（`恋は太陽 〜CIRCUS!〜`、`私たちはもう舞台の上`）——与计划描述一致，无出入。
- git 已初始化且有首次提交 `46af6fc`——与「背景」描述一致。
- `ffmpeg 9.0-full_build-www.gyan.dev`（含 libmp3lame）与 ffprobe 实测可用——与风险节描述一致。Node v24.13.0 / npm 11.6.2，满足 AGENTS.md「Node ≥ 20」。
- `docs/research/revue-starlight-songs.md` **尚不存在**（`docs/research/` 下仅有空目录 `_tmp`）。计划已预设回退分支（文件夹名作 title + 「待补」），本评阅按该分支评估；验收标准第 6 条（与调研报告一致）本轮为空转，可接受。

## 逐项意见

### 交付物

1. **（交付物 3 / 涉及文件）「该目录 gitignore」为不实陈述，与仓库现状矛盾**。计划称产物生成「到 `apps/web/public/assets/`，该目录 gitignore」，但现有 `.gitignore` 只忽略 `apps/web/public/assets/audio/` 与 `apps/web/public/assets/covers/` 两个子目录，**不含 `manifest.json`**。按计划实现后，`apps/web/public/assets/manifest.json` 将是未跟踪且未忽略的文件，验收标准「`git status` 干净」必然失败。「修改：`.gitignore`（如需微调）」的措辞不足以覆盖这个已确认的缺口。
2. **（交付物 3）manifest.json 结构欠规格**。计划只写「每首歌可用片段与相对路径、时长（ffprobe）」，未写明封面路径与字段构成。plan-002 草稿（其交付物 3）明确要「从 `assets/manifest.json` + shared 的 songs.json 加载曲库；封面用于结算页展示」——若 manifest 不含 coverPath，plan-002 只能靠 `covers/{id}.jpg` 约定拼路径，可行但契约未定。建议在计划中给出条目最小 schema：`id`、`intro-15 / intro-10 / intro-5 / chorus-10 / reverse-8` 的相对路径与各自实测时长、`coverPath`、实际使用的 `chorusStartSec`；并建议在 `packages/shared` 定义 `Manifest`/`ManifestEntry` 类型，工具产出与 plan-002 消费共用同一契约。
3. **（交付物 3）响度归一缺失，与 AGENTS.md 不一致**。AGENTS.md 目录结构一节将 tools/prepare-audio 职责写为「ffmpeg：切片/倒放/**响度归一**/封面压缩」，本计划覆盖了切片、倒放、封面，唯独没有响度归一，也未声明缓期。猜歌玩法中各曲响度不一致会直接影响听感公平，且切片时顺带加 loudnorm 成本极低；至少应在计划中显式二选一：纳入，或写明「缓期至 plan-00X」及理由。
4. **（交付物 2 / 3）「与 songs.json 按 title 对齐」脆弱**，详见技术方案意见 1。建议改用显式 `folder` 字段对齐。
5. （交付物 1）`npm test`「递归运行各 workspace 的 Vitest」建议写明命令形态 `npm test --workspaces --if-present`，避免未来某 workspace 无 test 脚本时根命令报错；「dev/build 转发容忍 app 不存在时清晰报错」在验收标准中无对应条目（见验收意见 3）。
6. （交付物 4）路径写作 `plans/plan-001/implementation.md`，实际目录是 `plans/plan-001-scaffold-and-data/`。AGENTS.md 要求引用文件一律相对仓库根路径，请写全，避免 implementer 误建目录。
7. 交付物整体覆盖「脚手架 + 数据基座」目标，粒度可验证；与 plan-002 草稿声明的改动范围（其禁止动根 package.json、tools/**、music/**）恰好形成互斥所有权，无越界冲突。

### 验收标准

1. 「`git status` 干净」按现状必然失败——原因见交付物意见 1，属计划与仓库实际状态的矛盾，必改。
2. 「`npm run assets` 一条命令……10 首歌无一失败」可勾选，但缺少对 manifest 内容本身的校验。建议补一条：「manifest.json 中每首歌的 5 个片段路径与 coverPath 均指向实际存在的文件，时长与文件名标称一致」（可做成工具 `--verify` 子命令或一条测试）。
3. 建议补：apps/web 不存在时运行 `npm run dev`，得到非零退出码与可读错误信息（对应交付物 1 中自己提出的要求）。
4. 「songs.json 字段与调研报告一致（如报告已存在）」——评阅时点报告不存在，该条本轮空转，可接受；建议在 implementation.md 明确记录走的是回退分支。
5. 「无第三方运行时依赖新增或仅有白名单 dev 依赖：typescript/vitest」清晰可查。提醒：vitest 需实际落进某处 package.json 的 devDependencies，别只装不记。

### 技术方案

1. **title 对齐的三重隐患**：实测文件夹名含 U+301C（WAVE DASH，非全角波浪 U+FF5E）、半角 `!`、空格、逗号。(a) 手写 songs.json 时 301C/FF5E 极易混淆；(b) 调研报告落地后，官方标题与文件夹名几乎必然有细微出入（空格、波浪号、标点全半角），届时按 title 精确匹配将**全量对齐失败**；(c) 计划未约定 Unicode 规范化。计划规定的「找不到映射时报错列出」保证了失败可见、不会静默错配，这点好，但对齐键本身应改设计：SongMeta 增加显式 `folder` 字段（值 = 文件夹名），工具按 folder 对齐、title 纯展示；或至少规定比较前做 NFC + U+301C/U+FF5E 归一。现在改是加一个可选字段，plan-002 之后再改就是对 shared 的破坏性变更（其计划已禁止），成本完全不同。
2. ffmpeg 方案可行：ffmpeg 9 full build 实测可用，128k CBR 重编码切片、`-af areverse` 倒放均无问题；areverse 异常时「先切片再二次倒放」的回退合理。
3. `chorusStartSec` 默认 72s 无越界防护：工具流程里已有 ffprobe，切片前应校验总时长，不足 82s 时明确报错（或 clamp 并警告），避免未来扩曲库时切出短/空片段。
4. 幂等只检查「文件已存在」：若 songs.json 的 chorusStartSec 或源文件变化，旧产物不会重建且无提示。建议 manifest 记录生成参数（chorusStartSec、码率），重跑发现不一致时提示需 `--force` 或直接重建。
5. 单测断言「10 首」硬编码：plan-005 扩曲库时该断言必碎。建议改为「songs.json 条目数 === `music/` 文件夹数」的动态对账，或 ≥ 10。
6. Windows 细节：spawn 数组传参方案正确且必要（实测歌名 `!` 为半角 ASCII，无展开风险，但数组形式仍是唯一正确做法）；建议加 `windowsHide: true` 避免每次转码弹控制台窗口，顺手项。

### 边界与风险

1. 边界清晰：「不动 music/、AGENTS.md、docs/research/**」明确，工具只读 music/，符合硬性约束 1；写入范围与 plan-002 草稿的所有权声明互斥无冲突。
2. 对 plan-002 的接口：类型（SongMeta/QuizMode/Difficulty/Question/QuizConfig）+ songs.json + manifest.json 组合基本够用（难度→intro-15/10/5 由片段命名天然承载），唯一缺口是 manifest 未写明 coverPath 与 schema（见交付物意见 2）。plan-002 风险节已自备「适配层」预案，但契约写清可免去那层适配。
3. 回滚「git revert 单次提交」可行，与 AGENTS.md「实现评阅 PASS 后由 orchestrator 单次 commit」一致；产物目录不受 revert 影响、可随时重建，无残留问题。
4. `.gitignore` 中 `generated/` 是无效残留模式（仓库无此目录），微调 .gitignore 时可顺手删除。

## 必改清单（FIX 时必填）

1. **.gitignore 必须覆盖 manifest.json**：计划声称 `apps/web/public/assets/` 整目录已 gitignore，仓库现状仅忽略其下 `audio/` 与 `covers/`。把 .gitignore 调整从「如需微调」升级为明确交付动作并写清目标规则（建议直接忽略 `apps/web/public/assets/` 整目录，替换现有两行子路径）。
2. **对齐键改造**：SongMeta 增加显式 `folder` 字段，prepare-audio 按 folder 对齐（title 仅展示）；或在计划中写死比较前的规范化规则（NFC + U+301C/U+FF5E 归一）。理由：调研报告落地后官方标题与文件夹名必然有细微出入，按 title 对齐将全量失败。
3. **响度归一去留必须显式化**：纳入（每片段加 loudnorm 滤镜）或写明「缓期至 plan-00X + 理由」，消除与 AGENTS.md 工具职责描述的不一致。
4. **manifest.json 最小 schema 写入计划**：至少含每首歌 id、intro-15/10/5、chorus-10、reverse-8 的相对路径与实测时长、coverPath；建议同步在 packages/shared 定义 Manifest 类型作为 plan-002 的消费契约。

## 结论

VERDICT: FIX

四条必改均为计划文本层面的小改动（约十行 + .gitignore 一行），不涉及方案重构；其中第 1 条是计划与仓库现状的实质矛盾，不修则验收必挂。建议性意见（`--if-present`、manifest 校验验收条目、chorus 越界防护、幂等参数比对、动态曲数断言、路径写全）可随返修一并采纳或逐条答复。修回后按协议由本 reviewer 复核（RECHECK）。

---

## 复核（v2，2026-10-26）

RECHECK: PASS

四条必改逐项核验通过：

1. **.gitignore**：交付物 2 升级为明确动作（整目录 `apps/web/public/assets/` 替换两行子路径 + 删 `generated/` 残留），涉及文件节与验收第 2 条同步收紧——原「计划声称已 gitignore 与仓库现状矛盾」的问题消除。
2. **对齐键**：SongMeta 增加显式 `folder` 字段作为对齐键（逐字符精确匹配文件系统真实名、不做 title 匹配），测试补 folder 唯一性断言——选择的是评阅给出的更稳方案（a），边界清晰。
3. **响度归一**：五个片段全部纳入 `-af loudnorm`，风险节显式声明「单 pass、不做双 pass」及理由——与 AGENTS.md 工具职责描述的不一致消除，缓期/纳入的二选一已明确。
4. **manifest schema**：完整 JSON 示例（segments 五片段 + durationSec、coverPath、params 含 chorusStartSec/bitrate/generatedAt）写入计划，`Manifest`/`ManifestEntry` 类型落在 packages/shared 作为 plan-002 消费契约——plan-002 所需的难度→intro-15/10/5、chorus、reverse、封面路径全部覆盖。

采纳的建议项均已落位且可验收：`--workspaces --if-present`、`--verify`（含 ±0.5s 时长校验）、dev 缺 app 时非零退出 + 可读错误、ffprobe 前置时长校验（不足 chorusStartSec+10 报错并列出问题歌）、params 幂等比对、动态曲数对账（不硬编码 10）、`windowsHide: true`、流程文档路径写全。

给 implementer 的三条非阻塞提醒（不构成返修，实现时注意即可）：

1. **幂等比对须排除 `params.generatedAt`**：该字段每次生成都会变，若对 params 整体深比较，则「params 一致则跳过」永不触发、每次全量重建，直接违反验收第 7 条的「幂等跳过」。比对集应为 `{ chorusStartSec, bitrate }`（及未来新增的确定性参数），generatedAt 仅作记录。
2. **loudnorm 会将音频重采样到 192kHz**，编码 mp3 时 ffmpeg 会自动再降到 libmp3lame 支持的采样率，形成双重重采样。建议滤镜链显式收尾（如 `-ar 44100`），减少无谓的质量损耗与体积波动；不影响验收，`--verify` 的时长校验可兜底。
3. 验收第 1 条白名单新增的「vite 相关脚手架」本 plan 用不到（apps/web 在 plan-002 才创建），实现时 devDependencies 实际应只出现 typescript/vitest；vite 类依赖由 plan-002 自行声明白名单，避免白名单名存实亡。

（另：交付物 4 中「从 songs.json 复制粘贴保证一致」与风险节「从文件系统复制值进 songs.json」方向表述相反，以风险节为准——纯文字问题，不要求修改。）
