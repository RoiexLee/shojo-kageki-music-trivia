# plan-010：修复短曲副歌起点并重建完整资源

## 背景与目标

曲库索引已扩充到 121 首，但 `apps/web/public/assets/manifest.json` 仍只有旧的 48 首。全量资源准备在 `ジャンヌダルク` 处因默认副歌起点 72 秒、音频时长约 84 秒而中止，导致前端将整个曲库判定为不完整，封面和播放均不可用。本计划为该曲设置实际可切片的副歌起点，并重新生成全量资源。

## 交付物清单

- [ ] 在 `packages/shared/src/songs.json` 的 `ジャンヌダルク` 条目增加 `chorusStartSec: 47`。
- [ ] 成功运行 `npm run assets`，生成 121 条完整 manifest、音频片段、歌词 JSON 与封面。
- [ ] `npm run assets -- --verify` 通过，确认路径、时长、封面和歌词结构完整。
- [ ] 更新实现纪要和实现评阅，记录三条可忽略的 LRC 警告及验证结果。

## 涉及文件

- `packages/shared/src/songs.json`
- `apps/web/public/assets/`（gitignored 生成产物）
- `plans/plan-010-rebuild-assets/implementation.md`
- `plans/plan-010-rebuild-assets/implementation-review.md`

## 实现步骤

1. 检查 `ジャンヌダルク` 时长与歌词时间点，确定 47 秒副歌起点满足最长 15 秒切片要求。
2. 更新歌曲元数据并运行全量 `npm run assets`，保留已有资源的幂等跳过行为。
3. 运行 `npm run assets -- --verify`，确认 manifest 条目数等于 songs.json 条目数，并抽查相关歌曲资源。
4. 记录实现纪要，由 reviewer 只读复核后提交。

## 验收标准

- [ ] `ジャンヌダルク` 预处理不再触发总时长错误。
- [ ] manifest、audio、covers、lyrics 均覆盖 121 首歌曲。
- [ ] `parseManifest` 可接受生成结果，前端可加载封面与全曲/片段播放资源。
- [ ] 三条 LRC skipped 警告不导致任务失败，所有歌曲有效歌词行数仍至少为 8。
- [ ] `npm test` 与 `npm run build` 通过。

## 风险与回滚

- 47 秒为依据歌词段落的可用副歌起点，若后续人工试听认为不准确，只需调整该字段并重跑对应资源。
- 生成资源位于 gitignored 目录，不进入提交；回滚时恢复 songs.json 并删除或重建 assets 即可。
