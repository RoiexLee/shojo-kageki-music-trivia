# 少女☆歌剧 Revue Starlight 猜歌 _(shojo-kageki-music-trivia)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

少女☆歌剧 Revue Starlight 网页猜歌游戏（非官方粉丝作品）

English: [README_EN.md](README_EN.md)

项目名为 `shojo-kageki-music-trivia`。这是一个本地网页猜歌游戏。玩家可以从片段、歌词、倒放和同步混合四种模式中选择玩法，再从选项中猜出歌曲。游戏规则、抽题、选项生成、计分和判定均位于可单测的纯函数中。

## 安装

要求 Node.js 20.19+（或 22.12+）、npm，以及 PATH 中可执行的 `ffmpeg` 和 `ffprobe`。

```bash
npm install
npm run assets
npm test
npm run build
```

`npm run assets` 会生成本地开发所需的音频切片、封面、歌词 JSON 和 `manifest.json` 到 `apps/web/public/assets/`。资源目录是可重建产物，不需要提交到 Git。

## 使用

启动开发服务器：

```bash
npm run dev
```

生产构建与本地预览：

```bash
npm run build
npm run preview --workspace apps/web -- --host 127.0.0.1 --port 4173 --strictPort
```

每局默认 10 题；结算页会显示种子，也可以使用 `?seed=42` 复现题卷。准备单曲或检查资源时：

```bash
npm run assets -- --only <id>
npm run assets -- --verify
```

## 贡献

欢迎通过 issue 提问或提交代码、测试和文档 PR。提交前请：

- 遵循 [AGENTS.md](AGENTS.md) 中的计划、评阅和提交流程。
- 保持游戏规则逻辑与 React 组件解耦，并为新增非平凡逻辑补充 Vitest 测试。
- 运行 `npm test`、`npm run build` 和 `npm run assets -- --verify`。

## 许可证

[MIT](LICENSE) © RoiexLee
