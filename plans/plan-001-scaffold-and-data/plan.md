# plan-001 — 工程脚手架与数据基座

- 状态：返修中（v2，已按 plan-review.md 必改清单修订）
- 作者：orchestrator
- 日期：2026-10-26
- 修订：v2 — 采纳评阅 4 条必改 + 建议项（.gitignore 整目录忽略、folder 对齐键、loudnorm、manifest schema、--if-present、--verify、chorus 越界防护、幂等参数比对、动态曲数断言、windowsHide、路径写全）

## 背景与目标

项目刚启动：`music/` 已按每歌一文件夹整理（10 首歌：mp3 + lrc + jpg，其中 2 首含 yrc），git 已初始化并完成首次提交（46af6fc）。本计划搭建**工程骨架**与**数据/音频基座**，使后续 plan-002（游戏核心）可以直接在其上开发。

参考架构：`Sallyn0225/shinycolors-song-guess`（npm/pnpm monorepo：apps/web + packages/shared + tools/prepare-audio）。

## 交付物清单

1. **根 `package.json`**：npm workspaces（`apps/*`、`packages/*`、`tools/*`），脚本：
   - `npm run assets` → 调用 prepare-audio 生成切片
   - `npm test` → `npm test --workspaces --if-present`（无 test 脚本的 workspace 不报错）
   - `npm run dev` / `npm run build` → 转发到 apps/web；app 不存在时**非零退出 + 可读错误信息**（如「apps/web 尚未创建，见 plan-002」）
2. **`.gitignore` 修订**（明确交付动作）：将现有两行子路径规则 `apps/web/public/assets/audio/`、`apps/web/public/assets/covers/` 替换为整目录 `apps/web/public/assets/`；顺手删除无效残留模式 `generated/`
3. **`packages/shared/`**：
   - `src/types.ts`：核心类型
     - `SongMeta`：`id`（罗马字 slug）/ `folder`（**对齐键**，值 = music/ 下文件夹名，逐字符精确匹配）/ `title`（官方标题，仅展示）/ `romaji` / `aliases` / `type` / `origin` / `singers` / `description` / `chorusStartSec?`（默认 72）/ 其他可选字段——调研报告已存在则填满，否则最小元数据 + `「待补」`标记并在 implementation.md 记录走了回退分支
     - `Manifest` / `ManifestEntry`：见交付物 4 的 schema
     - `QuizMode`、`Difficulty`、`Question`、`QuizConfig`（plan-002 消费的占位定义，仅类型）
   - `src/songs.json`：10 首歌元数据
   - `src/index.ts` 导出 + `src/songs.ts` 提供 `loadSongs()` 校验读取（手写校验，不引 zod）
   - Vitest 单测：songs.json 通过校验、id 唯一、folder 唯一且与 `music/` 实际文件夹**动态对账**（条目数 === music/ 文件夹数，断言不硬编码 10）
4. **`tools/prepare-audio/`**（Node.js ESM CLI，无运行时第三方依赖，调用系统 ffmpeg）：
   - 对齐：按 `SongMeta.folder` 与 `music/` 文件夹名**逐字符精确匹配**（不做 title 匹配；亦不做 Unicode 归一——folder 值就是文件系统真实名，从 songs.json 复制粘贴保证一致）；找不到映射时报错列出未对齐项
   - 为每首歌生成（到 `apps/web/public/assets/`，整目录已 gitignore）：
     - `audio/{id}/intro-5.mp3`、`intro-10.mp3`、`intro-15.mp3`（从头切片，128kbps CBR，`-af loudnorm` 响度归一）
     - `audio/{id}/chorus-10.mp3`（从 `chorusStartSec` 切片，同样 loudnorm）
     - `audio/{id}/reverse-8.mp3`（取 chorus 段倒放，`-af areverse`，loudnorm）
     - `covers/{id}.jpg`（封面压缩到 ≤512px、质量 80）
   - **切片前用 ffprobe 校验总时长**：不足 `chorusStartSec + 10` 秒时报错（歌级，列出问题歌与总时长），不静默切短片段
   - 产出 `apps/web/public/assets/manifest.json`，条目 schema（在 shared 定义 `ManifestEntry` 类型，工具与 plan-002 共用契约）：
     ```json
     {
       "id": "star-divine",
       "folder": "Star Divine",
       "title": "Star Divine",
       "segments": {
         "intro-5":  { "path": "audio/star-divine/intro-5.mp3",  "durationSec": 5.0 },
         "intro-10": { "path": "audio/star-divine/intro-10.mp3", "durationSec": 10.0 },
         "intro-15": { "path": "audio/star-divine/intro-15.mp3", "durationSec": 15.0 },
         "chorus-10":{ "path": "audio/star-divine/chorus-10.mp3","durationSec": 10.0 },
         "reverse-8":{ "path": "audio/star-divine/reverse-8.mp3","durationSec": 8.0 }
       },
       "coverPath": "covers/star-divine.jpg",
       "params": { "chorusStartSec": 72, "bitrate": "128k", "generatedAt": "<ISO>" }
     }
     ```
   - 支持参数：`--only <id>`（调试单曲）、`--force`（强制重建）、`--verify`（只读校验：manifest 每个片段路径与 coverPath 指向实际存在的文件、ffprobe 时长与标称一致 ±0.5s，全部通过退出码 0）
   - 幂等与参数比对：manifest 条目含 `params`；重跑时若目标文件已存在且 params 一致则跳过转码，不一致则提示并自动重建该条目（`--force` 全量重建）
   - spawn 一律数组传参 + `windowsHide: true`
   - README.md：用法说明
   - Vitest：纯函数（切片命令构造器、folder→id 映射、params 比对）单测；ffmpeg 真实转码不在测试范围，但 implementation.md 记录一次真实运行结果（10 首歌全部成功 + `--verify` 通过 + 总体积）
5. **流程文档**：`plans/plan-001-scaffold-and-data/implementation.md`、`plans/plan-001-scaffold-and-data/implementation-review.md`（完整路径，目录已存在，勿新建 `plans/plan-001/`）

## 涉及文件

新增：根 `package.json`、`packages/shared/**`、`tools/prepare-audio/**`、`apps/web/public/assets/`（gitignored 产物）
修改：`.gitignore`（整目录忽略 assets + 删 `generated/` 残留）、`plans/README.md`（状态）
不动：`music/`、`AGENTS.md`、`docs/research/**`

## 实现步骤（建议）

1. 根 package.json + workspace 结构与空壳目录 + .gitignore 修订
2. shared 类型（含 Manifest 契约）与 songs.json（先读调研报告；无报告则最小元数据 + 「待补」）
3. prepare-audio：CLI 参数 → folder 对齐 → ffprobe 时长校验 → ffmpeg 切片/倒放/封面 → manifest（含 params 比对幂等）
4. 真实跑 `npm run assets` + `npm run assets -- --verify`，记录结果
5. 补测试与文档，自测全绿后写实现纪要

## 验收标准

- [ ] `npm install` 在根目录成功（无第三方运行时依赖；devDependencies 白名单：typescript/vitest/vite 相关脚手架，且实际落进各 workspace 的 package.json）
- [ ] `.gitignore` 含 `apps/web/public/assets/` 整目录且无 `generated/` 残留；`npm run assets` 后 `git status` 干净
- [ ] `npm run assets` 一条命令从 `music/` 生成全部切片 + manifest.json，10 首歌无一失败
- [ ] `npm run assets -- --verify` 退出码 0：manifest 所有片段路径与 coverPath 存在、时长与标称一致（±0.5s）
- [ ] apps/web 不存在时 `npm run dev` 非零退出且错误信息可读
- [ ] `npm test`（`--workspaces --if-present`）通过：shared 校验/id+folder 唯一/与 music/ 动态对账；tools 命令构造器与 params 比对单测通过
- [ ] `--only` 与 `--force` 行为符合描述（幂等跳过、params 不一致自动重建）
- [ ] songs.json 字段与 `docs/research/revue-starlight-songs.md` 一致；若报告当时不存在，implementation.md 明确记录回退分支
- [ ] implementation.md 含真实运行输出摘要与总体积数字

## 风险与回滚

- 歌名含特殊字符（〜 U+301C、半角 !、空格、逗号）：spawn 数组传参 + `windowsHide: true`；folder 对齐键逐字符精确匹配，从文件系统复制值进 songs.json，不做归一化
- ffmpeg 9（gyan.dev full build，含 libmp3lame）已实测可用；`areverse` 异常时回退为先切片再二次倒放；`loudnorm` 双 pass 过重，用单 pass 即可
- 整体回滚：`git revert` 单次提交即可（本 plan 一次 commit）
