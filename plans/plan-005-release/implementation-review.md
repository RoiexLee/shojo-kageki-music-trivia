# plan-005 实现评阅

- 评阅人：独立 reviewer agent
- 日期：2026-10-26
- 基线：`fa791ca`（plan-004 已提交）之后的文档改动
- 评阅对象：README、prepare-audio README、plans 总览、实现纪要及生产预览证据

## 结论

VERDICT: PASS

本计划的文档交付与生产验证已完成，命令、版本要求、资源约束、四模式规则、曲库维护和版权边界均能从仓库现状复现。未发现需要返修的阻塞。

## 具体核对

1. `README.md:11-31` 给出真实安装、资源生成、测试、构建、开发服务器和 workspace 生产预览命令；生产命令 `npm run preview --workspace apps/web -- --host 127.0.0.1 --port 4173 --strictPort` 与 `apps/web/package.json` 的 Vite script 一致。Node 要求写为 20.19+ 或 22.12+，与当前嵌套 Vite 的 engine 一致，避免根 package 宽松声明造成误导。
2. `README.md:33-49` 准确记录 4 模式×3 难度、歌词无音频、混合顺序连播、选项/答案数量、`?seed` 复现及默认 72 秒副歌起点未人工听感校准；明确混合玩法与参考页面的差异，没有声称完全复刻。
3. `README.md:51-64` 与 `tools/prepare-audio/README.md:8-31` 覆盖每歌独立目录、folder 逐字符对齐、LRC 八行阈值、短行/标题过滤、指纹重建、`--only`/`--force`/`--verify`、五种片段、封面和歌词 JSON。README 明确说明生成的音频、封面、歌词不提交；源音频/封面更新时使用 `--force`，LRC 变化由指纹触发重建，和 CLI 行为一致。
4. `NOTICE.md`、README 与 plan-005 纪要持续声明官方音乐、歌词、封面和视觉素材仅限本地学习，未新增歌曲或公开部署范围；`git status` 未显示生成的 `assets`、`dist` 或 `node_modules`，music/ 未被修改。
5. 独立运行 `npm test`：63 项通过（web 29、shared 8、prepare-audio 26）；`npm run build` 通过；`npm run assets -- --verify` 通过 10 首 × 5 片段、封面、歌词结构、LRC 指纹与 ffprobe 时长校验。
6. implementation.md 记录了生产预览命令、首页/歌词简单/混合困难流程、真实主题图/manifest/MP3/封面/歌词 HTTP 200、复制成绩和 PNG 下载结果；plan-004 纪要补充了桌面、375px 和完整矩阵游玩证据，因此本计划没有重复声称未验证的听感或覆盖范围。

## 提交前的小项

- 当前 `plans/README.md` 将 plan-005 标记为“实现中”，这是评阅前状态；提交本计划后应把它更新为“已提交”并填入实际 commit 标题。
- 工具 README 的依赖段保留“Node ≥20”是针对独立 ffmpeg 工具的宽松要求，根 README 已给完整 web 工程实际下限；无需改动实现。

本轮未修改代码、文档或资源，未执行额外浏览器操作；评阅依据仓库文件、独立命令输出及实现纪要中的生产预览证据。
