# plan-001 实现纪要

- 实现者：orchestrator（原派出的 implementer agent 两次因网络中断丢失，按 AGENTS.md 阻塞回报规则改为 orchestrator 亲自实现，评阅仍由独立 reviewer 承担）
- 日期：2026-10-26
- 基线：git 46af6fc + 计划书 v2（RECHECK PASS，含复核节 3 条提醒）

## 实际改动清单

新增：
- 根 `package.json`：npm workspaces（apps/*、packages/*、tools/*）；scripts：assets / test（`--workspaces --if-present`）/ dev / build 转发
- `scripts/run-web.mjs`：dev/build 转发器，apps/web 缺失时非零退出 + 可读错误
- `packages/shared/`：`package.json`（exports 指向 TS 源，供 Vite 直接消费）、`tsconfig.json`、`src/types.ts`（SongMeta/Manifest/ManifestEntry/SegmentKey + quiz 占位类型）、`src/songs.json`（10 首，元数据来自调研报告）、`src/songs.ts`（手写 parseSongs 校验 + loadSongsFromFs）、`src/index.ts`、`test/songs.test.ts`（8 用例）
- `tools/prepare-audio/`：`src/util.mjs`（段落规格/默认值/deriveStartSec）、`src/ffmpeg.mjs`（参数构造纯函数 + paramsEqual 幂等比对 + alignSongs）、`src/proc.mjs`（spawn 数组传参 + windowsHide、ffprobe 时长）、`src/cli.mjs`（主流程：folder 对齐 → 时长前置校验 → 切片/倒放/封面 → manifest）、`test/builders.test.mjs`（14 用例）、`README.md`

修改：
- `.gitignore`：`apps/web/public/assets/audio/`、`covers/` 两行 → 整目录 `apps/web/public/assets/`；删除 `generated/` 残留
- `plans/README.md`：状态推进

## 与计划的偏差（及原因）

1. **工具不 import `@starlight/shared`，改为直接读 `packages/shared/src/songs.json` 并做最小校验（重复 id/folder、slug 格式）**。原因：Node 运行时对 node_modules 内的 `.ts` 不做类型剥离（workspace 链接包 exports 指向 TS 源），`import '@starlight/shared'` 在裸 node 下不可执行。完整 schema 校验仍在 shared 的 parseSongs + 测试中承担（Web/Vitest 侧），工具侧只保留对齐所需的 3 行最小校验。契约（SongMeta 字段、manifest 形状）与计划一致。
2. **实现者身份**：见上，orchestrator 亲自实现（子 agent 两次 ECONNRESET 中断且未落盘）。流程上实现与评阅仍分离。
3. songs.json 元数据：调研报告（docs/research/revue-starlight-songs.md）10/10 首完成，未走回退分支；个别字段（Star Diamond 的作词/发售日细目）报告中标注待查，songs.json 相应字段取已核实部分。

## 复核节 3 条提醒的落实

1. 幂等比对排除 `generatedAt`：`paramsEqual` 仅比较 `chorusStartSec`/`bitrate`（有专测：不同 generatedAt 判相等）
2. loudnorm 后显式 `-ar 44100`：`buildSliceArgs`/`buildReverseArgs` 均含（有专测断言）
3. devDependencies 仅 typescript/vitest（根 package.json），无 vite 类依赖；工具/共享包零运行时第三方依赖

## 自测记录（2026-10-26，真实执行）

| 项目 | 结果 |
|---|---|
| `npm install` | ✅ added 47 packages（typescript+vitest 及其依赖） |
| `npm test` | ✅ shared 8/8 + tools 14/14（期间修 1 处测试断言笔误：尾随空格 folder 应同时产生 missing+extra，代码行为本就正确） |
| `npm run assets`（首次） | ✅ 60 文件（10 首 × [5 片段 + 封面]），耗时 24s |
| 幂等重跑 | ✅ 新建 0 / 跳过 60 |
| `--only star-divine` | ✅ 跳过 6（修复一处 bug：处理循环原先未按 targets 过滤） |
| `--only star-divine --force` | ✅ 强制重建该歌 6 文件 |
| `npm run assets -- --verify` | ✅ 退出码 0：10 首 × 5 片段 + 封面路径与时长（±0.5s）全部一致 |
| `npm run dev`（apps/web 缺失） | ✅ 退出码 1 + 可读错误 |
| `git status`（assets 后） | ✅ 无产物泄漏（`apps/web/public/assets/` 整目录被忽略，仅源文件未跟踪） |

## 产物体积

- 总计 8.2 MB：audio 7.8 MB（50 个 mp3，单文件约 100-240KB）+ covers 476 KB（10 张 ≤512px JPEG）
- manifest.json 条目数 10，字段与计划 schema 一致（segments 五片段 + durationSec、coverPath、params）

## 已知限制 / 移交 plan-002

- `loadSongs()` 的运行时形态：Web 侧建议直接 `import songs from '@starlight/shared/songs.json'`（Vite 静态 import），parseSongs 可用于测试环境；`@starlight/shared` 的 exports 已含 `./songs.json` 子路径
- chorusStartSec 全部使用默认 72s（songs.json 未覆写）；plan-003+ 若需精确副歌定位，可在 songs.json 加字段后 `npm run assets` 增量重建（幂等会自动重建 params 变化的条目）
- manifest 的 durationSec 为切片实测值；Web 计时如需精确到片段实际时长，以 manifest 为准而非文件名标称
