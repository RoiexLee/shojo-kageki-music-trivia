# prepare-audio — 音频预处理工具

由 `music/`（每歌一文件夹：mp3 + lrc + jpg [+ yrc]）生成猜歌游戏所需的音频切片、压缩封面与 `manifest.json`，全部产物写入 `apps/web/public/assets/`（gitignored，可随时重建）。

## 用法

```bash
npm run assets                    # 全量生成（幂等：params 一致且文件存在则跳过）
npm run assets -- --only <id>     # 只处理指定歌曲（id 见 packages/shared/src/songs.json）
npm run assets -- --force         # 忽略幂等，全量重建
npm run assets -- --verify        # 只读校验：路径存在 + ffprobe 时长与标称一致（±0.5s）
```

## 产物

- `audio/{id}/intro-5|10|15.mp3` — 开头切片（三档难度用）
- `audio/{id}/chorus-10.mp3` — 副歌切片（起点 = 该歌 `chorusStartSec`，默认 72s）
- `audio/{id}/reverse-8.mp3` — 副歌段倒放
- `covers/{id}.jpg` — 封面压缩（最长边 ≤512px，不放大小图）
- `manifest.json` — 条目含 `segments`（五片段 path + 实测时长）、`coverPath`、`params`（chorusStartSec/bitrate/generatedAt）

## 处理规则

- 对齐：songs.json 的 `folder` 字段与 `music/` 文件夹名**逐字符精确匹配**（歌名含 U+301C 波浪线/空格/半角 `!`，不做任何归一化）；不对齐即报错退出
- 时长前置校验：ffprobe 源曲总时长，不足 `chorusStartSec + 10` 秒报错（不静默切短）
- 转码：`loudnorm` 单 pass 响度归一 + `-ar 44100`（避免 loudnorm 内部 192kHz 重采样传导）+ libmp3lame 128k CBR；倒放片段 `areverse,loudnorm`
- 幂等：`params`（排除 `generatedAt`）一致且目标文件存在则跳过；params 变化自动重建对应条目
- spawn 一律数组传参 + `windowsHide: true`（特殊字符安全）

## 依赖

- Node ≥ 20，系统 `ffmpeg` / `ffprobe`（gyan.dev full build 验证通过）
- 无运行时第三方依赖；测试用 Vitest（根 devDependencies）
