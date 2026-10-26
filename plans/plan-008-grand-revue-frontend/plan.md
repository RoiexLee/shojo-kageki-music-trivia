# Plan 008：Starlight Grand Revue 华丽歌剧舞台前端完全重构

## 背景与目标

当前前端（`apps/web`）虽然已跑通片段、中文歌词、倒放、双曲混合四大玩法的逻辑与基础测试，但视觉呈现与交互体验过于简单、朴素：
- 样式文件仅有约 200 行基础规则，卡片为简单单色方框与 1px 细线，缺乏《少女☆歌剧 レヴュースタァライト》（Revue Starlight）标志性的 **Theatrical Art Deco（歌剧装饰艺术）**、天鹅绒帷幕、星象时钟齿轮、东京塔星芒与 `POSITION ZERO` 舞台美学。
- 动效仅限于简单的静态伪随机高度波浪条与基础淡入，缺乏真实 Web Audio 实时频谱律动、3D 视差舞台、光泽扫掠（Shimmer Sweep）、开幕/切幕仪式感与微交互物理反馈。
- 页面信息层次单薄：首页看不到各模式历史最佳纪录，缺少曲库与九九组角色鉴赏室；答题页在揭晓答案后缺少歌曲封面、罗马音、演唱者与曲评的戏剧化展示；结算页缺少舞台少女星级评定（Stage Rank）、连击/最快耗时统计与黑胶票根级高清分享海报。

本计划在不修改 `music/` 源素材、不新增第三方运行时依赖、不破坏既有纯函数契约与 67 项自动化测试的前提下，将前端完全重构为**高级动效、华丽歌剧舞台风格**的完整交互体验。

## 交付物清单（可验证）

- [ ] **全局歌剧舞台视觉与动效底座（`apps/web/src/components/StageBackdrop.tsx` + `apps/web/src/styles.css`）**：
  - 猩红天鹅绒双侧垂幕与鎏金顶幔、慢速旋转的精密星象时钟法阵（SVG Astrolabe & Clockwork）、交错摇曳的体积光追光灯束、升腾的舞台黄金星尘粒子层。
  - 遵循 Emil Design Engineering 动效规范：自定义强 `cubic-bezier(0.23, 1, 0.32, 1)` 缓动曲线、按钮 `:active` 按压反馈（`scale(0.97)`）、`@media (hover: hover) and (pointer: fine)` 悬停光泽扫掠、`@media (prefers-reduced-motion: reduce)` 完整降级。
- [ ] **纯函数扩展与单测（`apps/web/src/core/`）**：
  - `best.ts` 新增只读查询纯函数 `loadBest(mode, difficulty)`，用于在首页零副作用读取各模式×难度的本机最佳成绩；
  - `quiz.ts` 新增结算评级与连击统计纯函数 `computeStageRank(summary)` 与 `computeStreaks(results)`，以及九九组 9 位舞台少女代表色与声优元数据常量 `TROUPE_MEMBERS`；
  - 补充对应单元测试（`best.test.ts`、`quiz.test.ts`）。
- [ ] **Web Audio 实时频谱分析与进度增强（`apps/web/src/hooks/audioQueue.ts` + `apps/web/src/components/AudioVisualizer.tsx`）**：
  - `audioQueue.ts` 在兼容现有测试 mock（当 `ctx.createAnalyser` 存在时接入 `AnalyserNode`，不存在时安全降级）的前提下，新增 `sampleFrequency(target: Uint8Array): boolean` 与 `getPlaybackProgress(): { elapsedSec: number; durationSec: number }` 接口。
  - 新增 `AudioVisualizer.tsx`：打造「Starlight 黄金留声星盘 & 实时对称光谱仪」——内嵌旋转黑胶星盘（正放顺时针、倒放逆时针紫金时光纹、双曲混合为双星交叠双黑胶共鸣，揭晓后浮现正确歌曲专辑封面），配合实时频谱/呼吸声波柱与精确秒数进度条（保留 `.wave` 与 `.is-playing` 选择器兼容既有断言）。
- [ ] **首页华丽重构与「圣翔剧场 · 曲库与九九组图鉴」（`HomePage.tsx`、`StageHero.tsx`、`JukeboxModal.tsx`、`Brand.tsx`）**：
  - `StageHero.tsx` 升级为 3D 鼠标微视差多层舞台（背景星象仪、聚光灯束、华恋/光/真矢透明立绘、角色聚焦切换器、底部 `POSITION ZERO` 十字准星铭牌、九九组 9 人代表色宝石灯阵）。
  - 四大模式选择卡升级为 Art Deco 鎏金歌剧票根卡（专属定制 SVG 艺术徽标、英文副题、实时显示当前难度下的「本机最佳成绩徽章」）。
  - 新增 `JukeboxModal.tsx`（剧场曲库与九九组名鉴抽屉/模态框）：支持浏览全部 10 首歌曲的专辑封面、罗马音、别名、出处、演唱者与曲评，以及九九组 9 位舞台少女的代表色与声优档案。
- [ ] **答题页「Revue Audition 舞台对决舱」重构（`QuizPage.tsx`）**：
  - 顶部十幕星轨进度盘（Act I–X 星芒节点，区分已答对/已答错/当前幕脉冲）与实时连击星火（Combo Streak）徽章。
  - 歌词模式升级为「圣翔歌剧台本（Libretto Scroll）」巴洛克金边羊皮卷卡片；揭晓后展开日文原句并联动留声机试听。
  - 选项区升级为斜切角金属包边歌剧选拔卡（展示编号星章、歌名、出处、歌曲类型标签，揭晓后浮现封面缩略图与金/红圣光印记，支持数字键 `1-8` 与 `Enter` 快捷键且键盘操作无延迟）。
  - 作答揭晓后展示「Revue 曲目典藏揭晓卡」（含封面、罗马音、歌手、曲评），同时完整保留既有测试断言所需的状态与反馈文案。
- [ ] **结算页「Grand Finale 终幕谢幕礼赞」重构（`SummaryPage.tsx`）**：
  - 舞台少女评级授勋台（`TOP STAR` / `BRILLIANT REVUE` / `RISING ACTRESS` / `ENCORE CALL` 星冠徽章、正确率星环、总耗时、最快单题、最高连击、破纪录 `NEW RECORD` 提示）。
  - 升级版 Canvas 典藏纪念票根海报导出（深酒红星夜渐变、双层鎏金斜角外框、星芒纹章、评级称号与比分）。
  - 「回望这场演出」歌剧节目单（Playbill Review），展示每幕详情与封面。

## 涉及文件

- 修改：`apps/web/src/core/best.ts`、`apps/web/src/core/best.test.ts`
- 修改：`apps/web/src/core/quiz.ts`、`apps/web/src/core/quiz.test.ts`
- 修改：`apps/web/src/hooks/audioQueue.ts`、`apps/web/src/hooks/useAudioPlayer.ts`、`apps/web/src/hooks/audioQueue.test.ts`
- 新增：`apps/web/src/components/StageBackdrop.tsx`
- 新增：`apps/web/src/components/AudioVisualizer.tsx`
- 新增：`apps/web/src/components/JukeboxModal.tsx`
- 修改：`apps/web/src/components/Brand.tsx`
- 修改：`apps/web/src/components/StageHero.tsx`
- 修改：`apps/web/src/pages/HomePage.tsx`
- 修改：`apps/web/src/pages/QuizPage.tsx`、`apps/web/src/pages/QuizPage.test.tsx`
- 修改：`apps/web/src/pages/SummaryPage.tsx`
- 修改：`apps/web/src/App.tsx`
- 修改：`apps/web/src/styles.css`
- 修改：`plans/README.md`
- 新增：`plans/plan-008-grand-revue-frontend/*`
- 不修改：`music/`、`packages/shared/`、`tools/prepare-audio/`

## 实现步骤

1. 编写纯函数扩展（`loadBest`、`computeStageRank`、`computeStreaks`、`TROUPE_MEMBERS`）及单元测试，确保纯逻辑 100% 可单测。
2. 扩展 `audioQueue.ts` 与 `useAudioPlayer.ts`，可选挂载 `AnalyserNode` 与播放进度计算，补充单元测试并确保既有 6 项音频队列测试全部通过。
3. 构建舞台视觉组件层：`StageBackdrop.tsx`（天鹅绒帷幕、旋转星象仪 SVG、追光灯与星尘）、`Brand.tsx`（顶栏铭牌与图鉴入口）、`StageHero.tsx`（3D 视差透明角色舞台、Position Zero 铭牌与九九组 9 色光石）、`JukeboxModal.tsx`（10 首曲库黑胶图鉴 + 九九组名鉴）、`AudioVisualizer.tsx`（留声星盘与实时对称频谱）。
4. 重构三大核心页面：`HomePage.tsx`、`QuizPage.tsx`、`SummaryPage.tsx` 及 `App.tsx`，严格保持所有无障碍属性（`aria-pressed`、`role="progressbar"`、`role="alert"`、`role="status"`、切题标题焦点）与测试文案契约。
5. 全面重写 `apps/web/src/styles.css`，建立三层设计 Token（色彩、排版、动效曲线、阴影与鎏金边框），实现高级歌剧舞台样式、响应式断点（桌面 1440px 与移动 375px 零横向溢出）与 `prefers-reduced-motion` 降级。
6. 运行 `npm test`、`npm run build`、`npm run assets -- --verify`，并启动本地服务器完成浏览器实测走查。
7. 撰写 `implementation.md`，交由只读 reviewer 评阅产出 `implementation-review.md`，通过后提交 `plan-008(web): 歌剧舞台全量重构与高级动效升级`。

## 验收标准

- [ ] 首页、答题页、结算页与曲库图鉴呈现完整的《少女☆歌剧》Art Deco 鎏金天鹅绒舞台视觉与高级动效（星象仪旋转、追光灯、3D 视差立绘、留声星盘、实时频谱、光泽扫掠、揭晓典藏卡、终幕授勋台）。
- [ ] 首页模式卡片可展示当前难度下的本机最佳成绩；点击「曲库图鉴」可查看 10 首歌曲封面/详情及九九组 9 位角色档案。
- [ ] 答题页在片段、歌词、倒放、双曲混合四种模式下动效与交互正常，揭晓答案后展示正确歌曲封面与详情卡片，同时保留全部既有测试断言文案。
- [ ] 结算页显示舞台评级（Stage Rank）、连击统计、高清重绘版 Canvas 成绩图导出与节目单回顾。
- [ ] 桌面端与 375px 移动端均无横向滚动条（`scrollWidth <= clientWidth`），`prefers-reduced-motion: reduce` 下动画安全降级。
- [ ] `npm test`、`npm run build`、`npm run assets -- --verify` 全部通过，浏览器控制台零错误。

## 风险与回滚

- **测试文案回归风险**：`QuizPage.test.tsx` 对特定文案（如 `答对了！`、`选错了。答案：...`、`两首歌曲正在同步混合`、`暂未播放，可重放` 等）有精确匹配。重构时必须保留这些核心文本节点，新增的装饰徽章与典藏卡作为增强层共存。
- **Web Audio Mock 兼容风险**：`audioQueue.test.ts` 中的自定义 `AudioContext` mock 未实现 `createAnalyser`。因此 `audioQueue.ts` 必须使用可选链/特性检测（`typeof ctx.createAnalyser === 'function'`），在测试环境无缝跳过频谱节点连接。
- **性能与动效负担**：所有持续动画仅使用 GPU 友好的 `transform` 与 `opacity`（以及单一轻量 Canvas 频谱绘制），并在页面不可见或停止播放时取消 `requestAnimationFrame`，在 `prefers-reduced-motion: reduce` 下彻底静态化。
