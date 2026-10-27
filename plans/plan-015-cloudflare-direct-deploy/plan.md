# plan-015：从本地完整工作区直接部署 Cloudflare Pages

## 背景与目标

公开 GitHub 代码镜像不含 `music/`，无法通过 Git 集成构建完整游戏；本地完整工作区可以生成 `apps/web/public/assets/` 和 `apps/web/dist/`。本计划使用本地完整工作区生成部署产物，再通过 Cloudflare Pages Direct Upload/Wrangler 上传 `dist`，使部署包含生成内容但不把 `music/` 推送到 GitHub。

## 交付物清单

- [ ] 在包含 `music/` 的本地部署工作区运行资源生成、资源校验和生产构建。
- [ ] 记录 `apps/web/dist/` 的文件数、总大小和最大单文件大小，确认只包含构建产物、`assets/manifest.json`、音频、歌词和封面，不含 `music/` 源目录。
- [ ] 配置 Cloudflare Pages Direct Upload 项目，不使用公开 GitHub 镜像的 Git 自动构建。
- [ ] 使用默认 `pages.dev` 地址完成部署；没有自定义域名时不配置域名绑定。
- [ ] 部署后检查首页、manifest、封面、歌词、片段音频和四种玩法的资源加载。
- [ ] 记录项目名、部署 ID、访问地址、上传命令和回滚方式；不提交 `assets/` 或 `dist/`。

## 涉及文件

- `apps/web/public/assets/`（本地生成、Git 忽略）
- `apps/web/dist/`（本地构建、Git 忽略）
- `plans/plan-015-cloudflare-direct-deploy/`
- Cloudflare Pages 项目配置（线上资源，不写入公开 GitHub）

## 实现步骤

1. 确认使用当前完整工作区作为部署源，不从清理后的 GitHub 代码镜像生成资源。
2. 运行 `npm run assets -- --verify`；若资源缺失，先运行 `npm run assets`，再重新校验。
3. 运行 `npm run build`，检查 `dist/assets/manifest.json`、`audio/`、`lyrics/`、`covers/` 和前端入口。
4. 用户确认 Cloudflare 账号和 Pages 项目名后，使用 Wrangler Direct Upload 部署 `apps/web/dist`。
5. 在默认 `pages.dev` 地址验证资源和四种玩法，记录失败的资源请求与回滚版本。

## 验收标准

- [ ] `npm run assets -- --verify` 通过，当前 121 首歌曲资源完整。
- [ ] `npm run build` 通过，dist 中存在 manifest、音频、歌词和封面，且不存在 `music/` 目录。
- [ ] dist 文件数量、大小和单文件大小符合 Cloudflare Pages 当前限制。
- [ ] 部署使用 Direct Upload，不依赖公开 GitHub 镜像中的 `music/`。
- [ ] `pages.dev` 地址首页可访问，manifest、封面、歌词、片段音频和四种模式均通过冒烟检查。
- [ ] 部署 ID、URL 和回滚步骤已记录；Git 工作树没有新增待提交的生成产物。

## 风险与回滚

- Direct Upload 需要用户的 Cloudflare 登录状态或 API 授权；未获得确认前不执行上传。
- 无自定义域名时使用 `pages.dev`，中国大陆访问质量不作生产保证。
- 部署回滚使用 Cloudflare Pages 的上一版部署；本地回滚只需重新构建并上传指定版本的 dist。
