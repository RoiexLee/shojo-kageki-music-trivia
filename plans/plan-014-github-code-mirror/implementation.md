# plan-014 实现纪要

## 实际改动

- 保留用户对 `README.md`、`README_EN.md` 的 MIT 署名修改。
- 在 `.gitignore` 增加 `music/`，保护后续公开代码镜像；未删除或改写当前工作区的 `music/`。
- `packages/shared/test/songs.test.ts` 与 `tools/prepare-audio/test/lyrics.test.mjs` 在没有本地 `music/` 时跳过素材对账用例，素材存在时继续完整校验。
- 更新 `NOTICE.md`，区分公开代码镜像与保留本地素材的部署工作区。
- 准备隔离历史清理工具 `git-filter-repo`；工具安装在用户 Python 环境，不进入仓库。

## 与计划的偏差

- 当前提交只包含公开镜像所需的代码边界和测试适配；隔离副本的历史清理、GitHub 仓库创建和 push 将在该提交完成后执行，以避免污染完整部署工作区。
- `apps/web/public/theme/` 未擅自删除，后续公开前需要根据用户确认决定是否保留。

## 自测结果

- `npm test`：通过，72 个测试全部通过；本地 `music/` 存在时素材对账用例实际执行。
- `npm run build`：通过。
- `npm run assets -- --verify`：通过，121 首歌曲 × 8 片段、封面、歌词和源文件指纹一致。
- `git status` 确认没有修改 `music/` 内容。
