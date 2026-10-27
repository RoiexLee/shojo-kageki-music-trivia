# plan-014：建立不含本地素材的 GitHub 代码镜像

## 背景与目标

当前 `main` 的工作树只有 `README.md` 和 `README_EN.md` 的未提交修改，但 `music/` 已有 472 个文件被 Git 跟踪，并且已经进入历史提交。仅新增 `.gitignore` 无法阻止这些文件在公开 GitHub 历史中出现。本计划建立一个不含 `music/` 当前文件和全部历史对象的公开代码镜像，同时保留现有完整工作区作为部署源。

## 交付物清单

- [ ] 先保留并提交当前 `README.md`、`README_EN.md` 的 MIT 署名修改，不覆盖用户改动。
- [ ] 在公开镜像工作树中将 `music/` 加入 `.gitignore`，不从私有部署工作区删除源文件。
- [ ] 使用隔离副本清理 `music/` 的全部 Git 历史；公开镜像的当前索引和全部历史对象均不包含 `music/`。
- [ ] 评估并记录 `apps/web/public/theme/` 官方视觉素材是否允许公开；未获确认前不擅自删除或新增。
- [ ] 处理代码脱离 `music/` 后的素材对账测试：代码镜像的 `npm test`、类型检查和构建应能完成，完整素材校验保留给本地部署工作区。
- [ ] 审阅 `NOTICE.md` 与公开代码镜像的表述，避免把公开代码镜像误写成包含本地素材的仓库。
- [ ] 在用户确认目标 GitHub 仓库地址后，才添加 remote 并 push；push 前完成索引、历史、路径和大文件审计。

## 涉及文件

- `README.md`
- `README_EN.md`
- `.gitignore`
- `NOTICE.md`
- `packages/shared/test/songs.test.ts`
- `tools/prepare-audio/test/lyrics.test.mjs`
- `plans/plan-014-github-code-mirror/`
- 隔离的公开镜像工作树（不覆盖当前完整部署工作区）

## 实现步骤

1. 记录当前基线：`git status`、`git log --oneline -5`、未提交 README 差异和本地 `music/`/assets/dist 统计；另检查 `.git/objects/` 中现有临时 garbage 对象，先完成备份再处理。
2. 在当前完整工作区先提交 README 署名修改，并确认测试、构建和资源校验基线。
3. 创建隔离公开镜像副本；检查 `git-filter-repo` 是否可用，必要时仅在该副本准备清理工具。
4. 从公开镜像历史和当前索引移除 `music/`，加入 `music/` 忽略规则；不修改原始部署工作区的 `music/`。
5. 让代码镜像在没有 `music/` 时仍能运行代码测试和构建：`packages/shared/test/songs.test.ts` 与 `tools/prepare-audio/test/lyrics.test.mjs` 的素材对账用例在素材缺失时明确跳过；素材存在时的完整对账测试必须在本地部署工作区保留可执行入口。
6. 审阅 `NOTICE.md`、主题素材和 README，扫描公开镜像中的 `music` 路径、音频文件、生成 assets、dist 与大文件。
7. 用户确认 GitHub 目标地址后，添加 remote、推送清理后的历史，并用全新 clone 验证仓库内容。

## 验收标准

- [ ] 当前完整工作区的 `music/` 文件数量和内容未被删除或改写。
- [ ] 公开镜像 `git ls-files music` 无输出，`git rev-list --objects --all -- music` 无输出。
- [ ] 公开镜像不包含 `apps/web/public/assets/`、`apps/web/dist/`、mp3、lrc 或 jpg 生成/源产物。
- [ ] 公开镜像的 `npm test`、`npm run build` 通过；本地完整工作区的素材校验仍能通过。
- [ ] push 前已得到用户对目标 GitHub 仓库地址和公开主题素材范围的确认。
- [ ] 从 GitHub 新 clone 的仓库检查不到 `music/` 当前文件或历史对象。

## 风险与回滚

- 历史重写会改变提交哈希；只在隔离副本执行，原 `main` 作为本地部署源保留，必要时删除公开镜像副本重新生成。
- `git-filter-repo` 当前未确认已安装；若工具不可用，先在隔离副本补齐工具，不直接使用可能误操作主工作区的替代命令。
- `NOTICE.md` 当前包含本地仓库限制，公开代码镜像表述需要单独审阅；未确认前不推送。
