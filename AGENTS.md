# AGENTS.md — 少女☆歌剧 Revue Starlight 猜歌 · Agent 协作规范

本文件是本仓库所有 agent（与人类协作者）的**最高行为准则**。开始任何工作前必须先读完本文件。

## 项目使命

开发一款《少女☆歌剧 レヴュースタァライト》（Revue Starlight）题材的**网页猜歌游戏**：
播放歌曲片段（开头/副歌/倒放/混合）或展示歌词，玩家从选项中猜出是哪一首歌。

- 玩法参考：Bilibili《MyGO!!!!! 猜歌挑战》（bilibili.com/toy/MyGOSongQuiz）
- 工程参考：GitHub `Sallyn0225/shinycolors-song-guess`（pnpm monorepo / React / 音频切片工具）
- 调研报告：`docs/research/revue-starlight-songs.md`

## 目录结构

```
music/               源音频素材（每歌一文件夹：mp3 + lrc + jpg [+ yrc]）
apps/web/            游戏前端（Vite + React + TypeScript + Tailwind CSS）
packages/shared/     歌曲元数据 schema、TypeScript 类型、曲库索引
tools/prepare-audio/ 音频预处理工具（ffmpeg：切片/倒放/响度归一/封面压缩）
plans/               计划目录，见下方「Plan 流水线协议」
docs/research/       调研报告（歌曲资料、素材 URL）
```

## 技术栈约定

| 层 | 选型 |
|---|---|
| 包管理 | npm workspaces（Node ≥ 20） |
| 前端 | Vite + React 18+ + TypeScript + Tailwind CSS |
| 纯逻辑 | 游戏核心（抽题/计分/判定）必须是**可单测的纯函数**，放 `packages/shared` 或 `apps/web/src/core`，禁止与 React 组件耦合 |
| 音频处理 | Node.js CLI 调 ffmpeg，产物写入 `apps/web/public/assets/`（gitignore，可随时重建） |
| 测试 | Vitest（纯函数必须有测试） |

## Plan 流水线协议（核心流程）

每个功能以 **plan** 为单位推进，一个 plan 的完整生命周期：

```
plan.md → plan-review.md（评阅）→ 实现 → implementation-review.md（评阅）→ git commit
```

### 目录与文件

- `plans/plan-NNN-<slug>/`，NNN 三位递增编号（plan-001、plan-002…）
- `plan.md`：计划书。必须包含：背景与目标、交付物清单（可验证）、涉及文件、实现步骤、验收标准（逐条可勾选）、风险与回滚
- `plan-review.md`：计划评阅。结论必须是 `VERDICT: PASS` 或 `VERDICT: FIX`（附必改清单）
- `implementation.md`：实现纪要。实际改动、与计划的偏差及原因、如何自测
- `implementation-review.md`：实现评阅。结论同上；FIX 则必须整改后才可 commit

### 并行流水线（双 agent）

编排者（orchestrator）维持流水线：**读操作与写操作并行，写操作之间串行**。

```
t0  reviewer 评阅 plan A
t1  implementer 实现 A   ‖  reviewer 评阅 plan B     ← 写 A ‖ 读 B，无冲突
t2  A 实现完 → reviewer 评阅 A 实现  ‖  implementer 实现 B（基于 A 已提交的代码）
t3  A 评阅通过 → commit A；循环推进 C…
```

规则：
1. implementer 只在 orchestrator 明确下达「实现 plan X」后才动手；实现前先 `git log --oneline -5` 与 `git status` 确认基线
2. reviewer 是**只读**角色，绝不修改代码；只能写自己的 review 文件
3. 同一时刻最多一个 agent 拥有「写权限」（改代码）；研究/评阅可随时并行
4. 返修（FIX）：orchestrator 把必改清单发回 implementer，修完由原 reviewer 复核一次（追加 `RECHECK: PASS/FIX` 到 review 文件末尾）
5. 每个 plan 的 commit 由 orchestrator 在实现评阅 PASS 后执行，commit message 格式：`plan-NNN: <一句话摘要>`

### Git 规范

- 分支：全程在 `main` 上线性推进（单人 + agent 项目，不搞 PR）
- 提交信息：Conventional Commits 风格，`plan-NNN(scope): summary`，如 `plan-003(web): 歌词猜歌模式与混合模式`
- **禁止提交**：`node_modules/`、构建产物、生成的音频切片（可由工具重建）
- **允许提交**：`music/` 源素材（仅本地仓库使用，见 NOTICE.md，禁止推送到公开远端）

## 硬性约束

1. **不动 `music/`**：除非 plan 明确要求且 orchestrator 批准，任何 agent 不得增删改 `music/` 内容
2. **不覆盖他人文件**：写文件前先确认该文件不属于其他进行中的 plan 的交付物
3. **纯函数核心**：游戏规则逻辑（抽题、选项生成、计分、判定）不依赖 DOM/React，必须可被 Vitest 直接测试
4. **版权**：所有音乐/图像素材版权归 Bushiroad 等原权利方；仓库保持本地，NOTICE.md 必须随素材存在
5. **完成后自测**：implementer 交付前必须跑通 `npm test`（如存在）与构建/类型检查，并在 implementation.md 记录结果
6. **遇到阻塞**：写清阻塞原因到自己的纪要文件并回报，不要静默绕过或伪造完成

## 交流约定

- 所有 agent 的产出（plan/review/纪要）用**中文**
- 引用文件一律相对仓库根路径
- review 要具体：指出文件+行级问题，不给空泛评价
