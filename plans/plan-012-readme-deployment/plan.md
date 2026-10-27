# plan-012：按 Standard Readme 重写项目说明

## 背景与目标

当前根目录 README 只有本地运行与玩法摘要，缺少 Standard Readme 要求的目录、贡献说明和许可证章节，且曲库数量与选项数已落后于当前实现。项目名称统一为 `shojo-kageki-music-trivia`，产品中文名统一为“少女☆歌剧 Revue Starlight 猜歌”，并补充 GitHub Pages 与 Cloudflare Pages 的部署边界，明确含版权音乐素材的版本只能本地运行。

## 交付物清单

- [ ] 根目录 `README.md` 按 Standard Readme 顺序包含标题、短描述、目录、安装、使用、贡献和许可证等章节。
- [ ] README 统一使用 `shojo-kageki-music-trivia`、 “少女☆歌剧 Revue Starlight 猜歌”、 “Shojo Kageki Music Trivia” 与四种玩法术语。
- [ ] README 修正当前曲库数量、难度选项数和生成产物说明。
- [ ] README 给出当前本地运行建议，以及取得授权后 GitHub Pages、Cloudflare Pages、独立对象存储/CDN 的部署取舍。
- [ ] 不修改 `music/`、生成的音频产物或游戏逻辑；保留工作树中预先存在的 `package-lock.json` 修改。

## 涉及文件

- `README.md`
- `plans/README.md`
- `plans/plan-012-readme-deployment/plan.md`
- `plans/plan-012-readme-deployment/plan-review.md`
- `plans/plan-012-readme-deployment/implementation.md`
- `plans/plan-012-readme-deployment/implementation-review.md`

## 实现步骤

1. 对照 Standard Readme 规范整理 README 结构和双语摘要。
2. 以当前代码、`songs.json`、`NOTICE.md` 和音频预处理工具文档为准修正命令与玩法数据。
3. 加入版权、曲库维护、部署限制、贡献、致谢和 `UNLICENSED` 说明。
4. 检查 README 内部链接、外部文档链接和术语一致性。
5. 运行 `npm test`、`npm run build` 与 `npm run assets -- --verify`，在实现纪要记录结果。

## 验收标准

- [ ] README 标题含 `shojo-kageki-music-trivia`，短描述与根 `package.json` 的 `description` 完全一致。
- [ ] README 的目录覆盖全部二级标题，Install/Usage/Contributing/License 信息齐全。
- [ ] 玩法描述与 `apps/web/src/core/quiz.ts` 的四模式、4/6/8 选项和混合双答案规则一致。
- [ ] README 明确 `music/` 与 `apps/web/public/assets/` 的关系、版权限制和公开部署风险。
- [ ] 测试、构建和资源校验通过，且没有修改预先存在的 `package-lock.json` 改动。

## 风险与回滚

- 外部托管平台的额度和中国大陆网络可达性会变化；README 使用官方文档链接并注明需上线前复核。
- 本计划只改文档与计划记录；回滚时恢复 `README.md` 和本计划目录即可，不影响代码与素材。
