# plan-015 实现纪要

## 实际改动

- 使用原始完整工作区的 `music/` 生成并校验本地资源，未把源素材或生成目录加入 Git。
- `npm run assets -- --verify` 通过：121 首歌曲 × 8 片段、封面、歌词和源文件指纹一致。
- `npm run build` 通过；`apps/web/dist/` 共 1348 个文件、约 710 MB，包含 manifest、1089 个音频文件、121 个歌词文件和 121 个封面文件，不含 `music/` 源目录。
- 通过 Cloudflare API 创建 Pages 项目 `shojo-kageki-music-trivia`，使用 Wrangler Direct Upload 发布 `apps/web/dist/`。

## 部署结果

- 部署地址：<https://d53c80ac.shojo-kageki-music-trivia.pages.dev>
- 项目主地址：<https://shojo-kageki-music-trivia.pages.dev>
- 线上验证：主页面 200；manifest 读取到 121 条；首首歌曲的歌词 JSON、封面和 `clip-10` 音频均返回 200。
- GitHub 公开镜像未参与构建，`music/` 没有上传到 GitHub。

## 与计划的偏差

- Wrangler 首次通过本地代理上传时在第 22 个文件遇到 headers timeout；切换为不经过代理的网络路径后，1348 个文件在 61 秒内上传完成。
- 未配置自定义域名，使用 Cloudflare 默认 `pages.dev` 地址。

## 自测结果

- 原始完整工作区：`npm test`、`npm run build`、`npm run assets -- --verify` 均通过。
- 线上 smoke test：主页、manifest、歌词、封面、音频片段均通过 HTTP 200 检查。
