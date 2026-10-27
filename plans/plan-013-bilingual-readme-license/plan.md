# plan-013：拆分双语 README、统一项目名并确定代码许可证

## 背景与目标

用户要求中文 README 与英文 README 分离，并删除上一版 README 中未经要求添加的项目结构、玩法、素材管道和部署章节。仓库根包仍使用旧的英文项目名，需要统一为 `shojo-kageki-music-trivia`；代码与文档许可证需要明确为适合本项目的 SPDX 许可证，许可证说明不展开第三方素材内容。

## 交付物清单

- [ ] `README.md` 仅保留 Standard Readme 所需的中文标题、描述、安装、使用、贡献和许可证章节。
- [ ] 新增独立的英文 `README_EN.md`，内容与中文 README 的最小范围一致。
- [ ] 根 `package.json`、`package-lock.json` 和网页标题统一使用 `shojo-kageki-music-trivia`。
- [ ] 新增根 `LICENSE`，代码与文档采用 MIT；README 的许可证章节只链接并说明 MIT。
- [ ] 不在 README 的许可证章节讨论 `music/` 或第三方素材版权；部署建议留在本次回复，不写回 README。

## 涉及文件

- `README.md`
- `README_EN.md`
- `LICENSE`
- `package.json`
- `package-lock.json`
- `apps/web/index.html`
- `plans/README.md`
- `plans/plan-012-readme-deployment/implementation.md`
- `plans/plan-012-readme-deployment/implementation-review.md`
- `plans/plan-013-bilingual-readme-license/`

## 实现步骤

1. 将根包名称和网页可见标题改为 `shojo-kageki-music-trivia`，保留 `@starlight/*` 作为 workspace 内部包名。
2. 按 Standard Readme 最小章节重写中文 README，并编写独立英文 README。
3. 新增 MIT LICENSE，更新根包许可证元数据。
4. 清理计划记录中不再准确的旧项目名与 README 章节描述。
5. 运行名称搜索、`npm test`、`npm run build` 和必要的文档检查。

## 验收标准

- [ ] 工作树文本不再出现旧的英文项目名。
- [ ] README 不包含“项目结构 / Project Structure”“玩法 / Gameplay”“素材与资源管道 / Asset Pipeline”“部署建议 / Deployment”二级章节。
- [ ] `README.md` 和 `README_EN.md` 均有安装、使用、贡献、许可证章节，且许可证只说明 MIT 代码/文档许可。
- [ ] `package.json`、`package-lock.json` 根元数据、`apps/web/index.html` 的项目名一致。
- [ ] `npm test` 与 `npm run build` 通过。

## 风险与回滚

- 修改根 npm 包名会改变 npm 输出中的项目标识，但不影响 `@starlight/*` workspace import；如外部脚本依赖旧包名，需要同步调整。
- MIT 允许较宽松的代码复用；若未来要求衍生作品必须继续开源，应另行评估 GPL-3.0-or-later。
- 回滚可恢复 README、LICENSE、包元数据、网页标题和本计划文件，不触碰游戏逻辑与音频产物。
