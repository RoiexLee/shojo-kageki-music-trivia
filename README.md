# 少女歌剧 Revue Starlight 猜歌 · Starlight Song Quiz

《少女☆歌劇 レヴュースタァライト》题材的本地网页猜歌游戏。听曲中片段、倒放或同步混合片段，或读取一句中文歌词，从选项中猜出歌曲。

这是非官方、非商业的本地粉丝项目。音乐、歌词、封面和官方视觉素材仍归原权利方所有，使用前请阅读 [NOTICE.md](NOTICE.md)。

参考资料：[MyGO!!!!! 猜歌挑战](https://www.bilibili.com/toy/MyGOSongQuiz/index.html)、[shinycolors-song-guess](https://github.com/Sallyn0225/shinycolors-song-guess)、[歌曲调研](docs/research/revue-starlight-songs.md)。

## 本地运行

要求：Node.js 20.19+（或 22.12+）、npm、系统 PATH 中可执行的 `ffmpeg` 和 `ffprobe`。首次安装：

```bash
npm install
npm run assets
npm test
npm run build
```

`npm run assets` 读取 `music/`，生成 gitignored 的 `apps/web/public/assets/`。若只想检查现有产物，可运行 `npm run assets -- --verify`；它会检查 10 首歌曲的八种片段、封面、歌词结构、源 LRC SHA-256 指纹和 ffprobe 时长。

开发服务器：

```bash
npm run dev
# 浏览器打开命令输出的 localhost 地址
```

生产本地预览（先完成 `npm run build`）：

```bash
npm run preview --workspace apps/web -- --host 127.0.0.1 --port 4173 --strictPort
```

如果页面提示资源缺失，先确认 `ffmpeg -version` 和 `ffprobe -version` 都可执行，再删除 `apps/web/public/assets/` 后重新运行 `npm run assets`。源音频、封面或歌词更新后，运行 `npm run assets -- --force`；LRC 内容变化会由指纹触发对应歌词产物重建。

## 当前玩法

每局默认 10 题，种子写在结算页，也可用 `?seed=42` 复现题卷。

- **片段猜歌**：简单/普通/困难分别播放曲中 15/10/5 秒片段，选项为 3/4/6 首。
- **歌词猜歌**：作答前显示过滤后的中文翻译；简单难度附作品出处，选项为 3/4/6 首。提交后播放正确歌曲的 10 秒片段并显示日文原文。
- **倒放猜歌**：播放 8 秒倒放片段；简单难度额外显示一句歌词提示，选项为 3/4/6 首。
- **混合猜歌**：两首 10 秒曲中片段同刻开始并同步混合，三档难度均为 2 首答案，选项为 4/6/8 首；选满后确认，答案集合完全相等才得分。

混合模式是对参考页面同时混音/倒放串烧玩法的简化实现；歌词模式是本项目新增玩法。副歌起点默认 72 秒，个别歌曲未人工试听校准，不能把切片称为每首的真实副歌。

## 曲库维护

每首歌曲必须保持一个独立文件夹，文件名与 `packages/shared/src/songs.json` 的 `folder` 字段逐字符一致：

```text
music/<folder>/<folder>.mp3
music/<folder>/<folder>.lrc
music/<folder>/<folder>.jpg
```

在 `songs.json` 增加与曲目对应的 `id`、标题、出处、演唱者和可选 `chorusStartSec`，然后执行 `npm run assets -- --only <id>` 调试单曲，最后用全量 `npm run assets -- --verify` 检查。LRC 至少需要 8 条有效时间戳歌词；空时间戳和无法解析行会被跳过，标题泄露和过短歌词不会进入题面。不要把生成的 mp3、封面或歌词 JSON 提交到 Git。

## 计划与协作

所有功能按 `plans/plan-NNN-<slug>/` 的 `plan.md → plan-review.md → implementation.md → implementation-review.md → commit` 流程推进，细则见 [AGENTS.md](AGENTS.md)。当前提交链：

- `plan-001` 脚手架与数据基座
- `plan-002` 游戏核心引擎
- `plan-003` 歌词、倒放、混合、难度与可靠音频队列
- `plan-004` 舞台视觉、官方素材与浏览器验收
- `plan-005` 本地交付文档与生产预览

## 版权与范围

素材只用于本地学习和测试，不公开分发、不部署含音乐素材的公开站点。扩充歌曲前先确认自有合法本地音源；本仓库不代为下载或提供受版权保护的歌曲。
