# 少女☆歌剧 Revue Starlight 猜歌 _(shojo-kageki-music-trivia)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

少女☆歌剧 Revue Starlight 网页猜歌游戏（非官方粉丝作品）

`shojo-kageki-music-trivia` 是一个本地优先的《少女☆歌剧 Revue Starlight》网页猜歌游戏：玩家通过聆听音频片段、倒放片段、同步混合片段，或阅读歌词来猜歌名。项目名称、仓库名称和面向用户的英文名称统一为 `shojo-kageki-music-trivia` / **Shojo Kageki Music Trivia**；根 npm workspace 中保留的 `starlight-song-quiz` 仅是历史内部包名。

This is an unofficial, non-commercial fan project. Audio, lyrics, cover art, and official visual assets remain the property of their respective rights holders. The repository is intended for local learning and testing; read [NOTICE.md](NOTICE.md) before preparing or sharing any build.

<a id="table-of-contents"></a>
## Table of Contents

- [背景 / Background](#background)
- [安装 / Install](#install)
- [使用 / Usage](#usage)
- [项目结构 / Project Structure](#project-structure)
- [玩法 / Gameplay](#gameplay)
- [素材与资源管道 / Asset Pipeline](#asset-pipeline)
- [部署建议 / Deployment](#deployment)
- [贡献 / Contributing](#contributing)
- [致谢 / Thanks](#thanks)
- [许可证 / License](#license)

<a id="background"></a>
## 背景 / Background

项目玩法参考了 [Bilibili《MyGO!!!!! 猜歌挑战》](https://www.bilibili.com/toy/MyGOSongQuiz/index.html)；工程组织参考 [shinycolors-song-guess](https://github.com/Sallyn0225/shinycolors-song-guess)，歌曲资料见[调研报告](docs/research/revue-starlight-songs.md)。游戏规则、抽题、选项生成、计分和判定位于可单测的纯函数中，前端使用 React、Vite、TypeScript 和 Tailwind CSS。

本仓库的公开名称是 `shojo-kageki-music-trivia`。目前 `music/` 中的源音频、歌词和封面仅供本地使用，生成的音频切片也不应发布到公开站点；因此当前交付形态是本地运行，而不是公开在线 Demo。

<a id="install"></a>
## 安装 / Install

### 依赖

- Node.js 20.19+（或 22.12+）
- npm
- PATH 中可执行的 [`ffmpeg`](https://ffmpeg.org/) 和 `ffprobe`

首次安装并准备本地资源：

```bash
npm install
npm run assets
npm test
npm run build
```

`npm run assets` 读取 `music/`，将音频片段、压缩封面、歌词 JSON 和 `manifest.json` 生成到被 Git 忽略的 `apps/web/public/assets/`。当前 `packages/shared/src/songs.json` 包含 121 首歌曲；资源校验会检查每首歌的八种片段、封面、歌词结构、源 LRC SHA-256 指纹和 ffprobe 时长。

<a id="usage"></a>
## 使用 / Usage

启动开发服务器：

```bash
npm run dev
```

生产构建与本地预览：

```bash
npm run build
npm run preview --workspace apps/web -- --host 127.0.0.1 --port 4173 --strictPort
```

每局默认 10 题。结算页会显示种子，也可以使用 `?seed=42` 复现同一份题卷。若页面提示资源缺失，请确认 `ffmpeg -version` 和 `ffprobe -version` 可执行，然后删除 `apps/web/public/assets/` 并重新运行 `npm run assets`。

<a id="project-structure"></a>
## 项目结构 / Project Structure

```text
music/               本地源音频、LRC 歌词与封面（受版权限制）
apps/web/            Vite + React + TypeScript + Tailwind 前端
packages/shared/     歌曲元数据 schema、类型与曲库索引
tools/prepare-audio/ ffmpeg 音频预处理与资源校验工具
docs/research/       歌曲资料与素材来源记录
plans/               按计划推进的实现与评阅记录
```

<a id="gameplay"></a>
## 玩法 / Gameplay

| 模式 | 规则 | 选项与难度 |
| --- | --- | --- |
| 片段猜歌 | 播放曲中片段 | 简单/普通/困难为 15/10/5 秒，选项为 4/6/8 首 |
| 歌词猜歌 | 题面显示过滤后的中文译文；简单难度附作品出处；提交后播放该句附近的原曲片段并显示日文原文 | 选项为 4/6/8 首 |
| 倒放猜歌 | 播放 8 秒倒放片段；简单难度附一句歌词提示 | 选项为 4/6/8 首 |
| 混合猜歌 | 两首 10 秒曲中片段同刻开始并同步混合；必须选出两首答案才得分 | 选项为 4/6/8 首 |

曲中片段的默认起点为 72 秒，单曲也可以在 `songs.json` 中设置 `chorusStartSec`；未逐首人工试听校准时，不应把它理解为每首歌的真实副歌位置。

<a id="asset-pipeline"></a>
## 素材与资源管道 / Asset Pipeline

每首歌曲保持一个独立文件夹，文件名必须与 `packages/shared/src/songs.json` 的 `folder` 字段逐字符一致：

```text
music/<folder>/<folder>.mp3
music/<folder>/<folder>.lrc
music/<folder>/<folder>.jpg
```

常用命令：

```bash
npm run assets -- --only <id>  # 只处理一首歌曲
npm run assets -- --force      # 忽略幂等检查并全量重建
npm run assets -- --verify     # 只读校验路径、时长、歌词和源文件指纹
```

新增曲目时填写 `id`、标题、出处、演唱者和可选 `chorusStartSec`。LRC 至少需要 8 条有效时间戳歌词；空时间戳、无法解析行、标题泄露和过短歌词不会进入题面。`apps/web/public/assets/` 中的生成文件可随时重建，不要提交生成的 mp3、封面或歌词 JSON；不要在未经计划批准的情况下修改 `music/`。

<a id="deployment"></a>
## 部署建议 / Deployment

### 当前版本

当前版本**不建议部署到 GitHub Pages、Cloudflare Pages 或其他公开站点**。`NOTICE.md` 明确要求本地使用，`music/` 和生成的音频切片含有第三方版权素材；公开部署前必须先取得相应授权，并移除不允许公开的源文件和产物。

### 取得授权后的取舍

| 场景 | 建议 |
| --- | --- |
| 只展示无音频的静态前端、主要面向海外开发者 | GitHub Pages 最省事；发布站点有 1 GB 大小和约 100 GB/月软带宽限制，适合作为代码或无音频演示镜像。 |
| 有授权的海外版本 | Cloudflare Pages 托管 `apps/web/dist`，音频放 R2 或其他独立对象存储/CDN；Cloudflare Pages 单文件上限为 25 MiB、单站最多 20,000 个文件。 |
| 有授权且主要面向中国大陆用户 | 音频优先放完成 ICP 与内容合规的中国大陆对象存储/CDN（例如 OSS/COS 及其 CDN）；GitHub Pages 和 Cloudflare Pages 默认都不保证大陆访问质量。 |

如果必须在两个静态托管平台中选一个，我推荐 **Cloudflare Pages 托管前端，音频独立分发**：构建和自定义域名更灵活，但它本身不能解决中国大陆访问，Cloudflare China Network 需要 Enterprise、额外订阅、ICP 和内容审核。GitHub Pages 更适合不含音频的海外代码展示。

部署前还要注意：Vite 当前未设置 `base`。使用 GitHub Pages 的项目子路径时，需要把 `base` 配成 `/shojo-kageki-music-trivia/`，或使用根路径自定义域名；无论使用哪种平台，先在 CI 或本地准备好 `apps/web/public/assets/`，不要把版权源音频直接推到公开构建环境。

平台限制与中国网络说明请以官方文档为准：[GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)、[GitHub Pages publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)、[Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)、[Cloudflare China Network](https://developers.cloudflare.com/china-network/)。

<a id="contributing"></a>
## 贡献 / Contributing

欢迎提交代码和文档方面的 issue 或 PR；请在公开仓库启用后使用 GitHub Issues/Discussions，当前本地协作可直接向维护者提出问题。贡献要求：

- 不提交音频、歌词、封面或官方视觉素材的新增副本，不修改 `music/`，除非计划明确要求并获得批准。
- 游戏规则继续保持与 React 解耦的纯函数，并为新增非平凡逻辑补充 Vitest 测试。
- 功能按 `plans/plan-NNN-<slug>/plan.md → plan-review.md → implementation.md → implementation-review.md → commit` 流程推进，细则见 [AGENTS.md](AGENTS.md)。
- 提交前运行 `npm test`、`npm run build` 和 `npm run assets -- --verify`，并在实现纪要记录结果。

<a id="thanks"></a>
## 致谢 / Thanks

- [Standard Readme](https://github.com/RichardLitt/standard-readme)：README 结构规范。
- [Bilibili《MyGO!!!!! 猜歌挑战》](https://www.bilibili.com/toy/MyGOSongQuiz/index.html)：玩法参考。
- [shinycolors-song-guess](https://github.com/Sallyn0225/shinycolors-song-guess)：工程组织参考。
- [少女☆歌剧 Revue Starlight 官方网站](https://revuestarlight.com/)：官方视觉素材来源记录见 [NOTICE.md](NOTICE.md)。

<a id="license"></a>
## 许可证 / License

**UNLICENSED**。本仓库当前未授予代码或文档的开源再分发许可，代码与文档归本项目维护者（仓库所有者）所有；音乐、歌词、封面和官方视觉素材的版权归原权利方所有，具体边界见 [NOTICE.md](NOTICE.md)。若未来改为公开开源项目，应先补充明确的 SPDX 许可证文件并重新审核全部素材。
