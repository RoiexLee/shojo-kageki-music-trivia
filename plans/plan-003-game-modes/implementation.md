# plan-003 实现纪要：歌词 / 倒放 / 混合 / 难度与结算

- 实现者：implementer
- 日期：2026-10-26
- 基线：`38b4bf1`（plan-002 已提交）；接续实现前已有未提交的 `lyrics.mjs`、歌词测试和 CLI 初步改动。

## 实际改动

- `tools/prepare-audio/src/lyrics.mjs` 增加 LRC 秒数校验；`cli.mjs` 为歌词产物写入 `lyrics/{id}.json`，在 manifest 参数记录 LRC SHA-256 指纹，`--verify` 同时校验源歌词、指纹、行数和结构。
- `apps/web/src/core/quiz.ts` 保留旧 `DIFFICULTY_MAP`，新增 `MODE_DIFFICULTY_MAP`、歌词抽行、四种 Question union、四模式抽题、多选判定和 toggle。
- `apps/web/src/core/best.ts` 实现按模式×难度隔离的 localStorage 最佳成绩，异常存储降级为本局结果。
- `apps/web/src/hooks/audioQueue.ts` 与 `useAudioPlayer.ts` 提供单片段兼容和顺序连播，处理间隔、坏片段跳过、自动播放手势、重放和换题取消；用纯 JS 队列测试覆盖竞态。
- `apps/web/src/data.ts` 增加 manifest/歌词结构校验、`assets/` URL 拼接和并行歌词加载。
- `App.tsx`、HomePage、QuizPage、SummaryPage 接入四种模式、歌词/倒放提示、混合多选确认、资源错误恢复、返回首页、seed 和最佳成绩。
- 生成了本地 gitignored 产物：10 个 `apps/web/public/assets/lyrics/*.json`。

## 与计划的偏差

- 混合模式按计划明确为顺序播放副歌片段，未实现同时叠音；避免引入复杂的 Web Audio 混音层。
- 视觉主题仍沿用 plan-002 的暗色骨架，封面墙、分享图和 375px / 1280px 视觉走查交给 plan-004。
- 资源结构未修改 `packages/shared`；歌词类型仅在 web core 侧消费，维持计划中 shared 零改动边界。

## 自测结果

- `npm test`：web 20 tests、shared 8 tests、prepare-audio 26 tests 全部通过。
- `npm run assets`：10 首歌曲的歌词产物生成；再运行 `npm run assets -- --verify`，10 首 × 5 片段 + 封面 + 歌词的路径、时长、内容指纹全部通过。
- `npm run build`：TypeScript 检查与 Vite 构建通过，dist 生成成功。
- dev 冒烟：Vite 在本机 5175 端口返回首页、`/assets/manifest.json`、`/assets/lyrics/star-divine.json` 均为 HTTP 200。5173/5174 已有进程占用，未覆盖它们。

## 待后续人工验收

- 需要在真实浏览器中分别启动四种模式并实际点击完一局，检查音频播放策略与移动端布局；plan-004 将完成该游玩级和视觉验收。

## 独立实现评阅返修（2026-10-26）

- 按 `implementation-review.md` 四项必改修正：QuizPage 反馈复用 `judge`，混合题选满但含干扰项时明确显示错误及完整答案；不再用选择数量代替正确性。
- 所有音频模式展示真实播放/等待手势/未播放状态；坏片段显示失败数、重试按钮与返回首页提示，继续保留坏片段跳过规则。
- SummaryPage 的持久化从 render/useMemo 移至 effect；始终显示本机最佳成绩，存储失败则说明仅显示本局结果。
- 核心测试真实覆盖 toggle 选中/取消/满额/无效选项，以及 mix 正逆序正确、同数量错选、重复、少选和多选。原有 12 项 intro 测试正文未改。
- 新增 `data.test.ts` 验证有效清单与歌词、错误/外部路径、缺片段、缺歌、重复歌曲、非法时长、歌词 id/行数/时间/翻译结构。新增 `QuizPage.test.tsx` 通过静态渲染验证混合错误反馈、正确反馈和加载失败可见入口。
- 修正音频取消测试：两首新队列的第一首 ended 后立即 stop，推进计时器后仍没有创建第二首音频。
- 返修验证：`npm test` **61 项全部通过**（web 27、shared 8、tools 26），`npm run build` 类型检查与生产构建通过。上述静态页面回归不代替 plan-004 的真实浏览器点击与音频播放验收。
