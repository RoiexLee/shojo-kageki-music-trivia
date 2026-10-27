# plan-010 实现纪要

## 实际改动

- 在 `packages/shared/src/songs.json` 的 `ジャンヌダルク` 条目增加 `chorusStartSec: 47`。该曲时长约 83.96 秒，47 秒起点对应歌词副歌段并满足最长 15 秒切片要求。
- 运行 `npm run assets` 全量补齐缺失资源；旧有 48 首按幂等规则跳过，新增 73 首生成音频、全曲、封面和歌词 JSON。
- 生成结果为 121 条 manifest、121 个 audio 目录、121 个 cover、121 个 lyrics 文件，前端依赖的资源集合已完整。
- 保留三条非阻断 LRC 警告：再生讃美曲、ジャンヌダルク、星々の絆(movie ver.) 各有 1 行无法解析，但有效歌词行数均达到最低阈值，未修改源歌词。

## 自测

- `npm run assets`：通过，输出“新建 803 个文件，跳过 528 个”。
- `npm run assets -- --verify`：通过，121 首 × 8 片段 + 封面 + 歌词，路径、时长、歌词内容与源文件指纹全部一致。
- `npm test`：通过，web 37、shared 8、prepare-audio 27 个测试全部通过。
- `npm run build`：通过，TypeScript 与 Vite production build 成功。
- `manifest.json`、audio、covers、lyrics 目录数量均为 121。

## 回滚与限制

本次只提交 `songs.json` 的副歌起点修正；`apps/web/public/assets/` 为 gitignored 生成目录，需要在部署或另一工作树中重新运行 `npm run assets`。47 秒是基于歌词时间点的可用起点，尚未进行人工听感校准。
