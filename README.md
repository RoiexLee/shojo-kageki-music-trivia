# 少女歌剧 Revue Starlight 猜歌 · Starlight Song Quiz

《少女☆歌劇 レヴュースタァライト》题材的网页猜歌游戏。播放歌曲片段（开头 / 副歌 / 倒放 / 混音）或展示歌词，从选项中猜出是哪一首歌。

- 玩法参考：[MyGO!!!!! 猜歌挑战](https://www.bilibili.com/toy/MyGOSongQuiz/index.html)
- 工程参考：[shinycolors-song-guess](https://github.com/Sallyn0225/shinycolors-song-guess)
- 歌曲调研：[docs/research/revue-starlight-songs.md](docs/research/revue-starlight-songs.md)

## 快速开始

```bash
npm install            # 安装依赖（npm workspaces）
npm run assets         # 由 music/ 生成音频切片到 apps/web/public/assets/
npm run dev            # 启动开发服务器
npm test               # 运行测试
```

## 开发流程

本仓库由 agent 流水线推进，每个功能一个 plan，完整周期为
`plan → plan 评阅 → 实现 → 实现 评阅 → 提交`。详见 [AGENTS.md](AGENTS.md) 与 [plans/README.md](plans/README.md)。

## 版权声明

本项目为非官方、非商业粉丝作品。音乐、图像等素材版权归 Bushiroad / Nelke Planning 等原权利方所有，详见 [NOTICE.md](NOTICE.md)。**本仓库仅供本地学习使用，禁止公开分发素材。**
