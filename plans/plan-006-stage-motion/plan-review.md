# Plan 006 计划评阅

- 评阅人：独立 reviewer agent
- 日期：2026-10-26
- 评阅对象：plans/plan-006-stage-motion/plan.md
- 评阅范围：计划书本身；当前工作树中的 plan-006 实现改动只作为背景，不据此提前判定实现质量。

## 结构与范围核对

1. 计划包含背景目标（第 3–12 行）、可验证交付物（第 14–22 行）、涉及文件及明确的禁止修改范围（第 24–32 行）、实现步骤（第 34–44 行）、逐条验收标准（第 46–54 行）和风险回滚（第 56–61 行），满足 AGENTS.md 的流水线要求。
2. 计划把范围限制在时间格式、舞台视觉和动效；明确不改 music/、生成音频资产和猜歌规则，符合纯函数核心、版权和写权限约束。
3. 计划将实现、全量测试、资源校验、IAB 桌面/375px 走查和 implementation review 纳入交付，完成后具备可复核证据链。

## 实施时必须核对的具体风险

- **时间格式影响面。** apps/web/src/core/quiz.ts:220-225 的 formatTime 被 apps/web/src/core/share.ts:5、apps/web/src/pages/SummaryPage.tsx:45,63,64,84 及测试复用。实现应保持纯函数，并在 0、45、59、60、83 秒及超过一小时边界验证；复制文本、结算 JSX 和 Canvas 下载文案必须都出现中文空格，不能只更新其中一处。
- **透明素材可追溯性。** 计划第 37 行要求官方 URL 和版权边界，但落盘位置未限定；实现应在 NOTICE.md 或 docs/research/ 为每个 apps/web/public/theme/characters/*.png 记录完整 URL、查证日期、本地学习用途，并验证 PNG 具有真实 alpha 通道。角色加载失败时应保留 apps/web/public/theme/cast.png 降级层，同时不让降级横幅重新成为首页主视觉。
- **资源路径。** 现有 apps/web/src/styles.css:22 使用根路径 /theme/stage.png，而 vite.config.ts 未配置 base。实现和生产预览需确认根路径部署假设；若需支持子路径，应统一使用 import.meta.env.BASE_URL，否则在 implementation.md 记录这是已知部署限制并验证背景与角色均返回 200。
- **动效与无障碍。** 当前 apps/web/src/styles.css:87-92,136,197-200 已有波形、入场和 reduced-motion 规则。新增聚光灯、星屑、帷幕及状态动画必须一并被 prefers-reduced-motion: reduce 关闭，不能依赖动画完成来显示内容；还要保持 QuizPage.tsx 的焦点转移、暂停/停止生命周期和现有按钮可访问名称。
- **响应式遮挡。** styles.css:148-195 的 375px 断点应实际检查角色层是否覆盖标题、模式按钮、难度控件和开始按钮，document.documentElement.scrollWidth 不得超过视口宽度；桌面检查至少覆盖 1280px。长歌名、歌词长行、错误提示和下载/复制按钮也要保持可操作。
- **提交边界。** 验收后用 git diff --stat/git status 确认没有修改 music/、apps/web/public/assets/、构建产物或无关 package-lock.json；仅提交计划声明的源文件和文档，官方素材继续遵守仓库本地版权限制。

## 结论

计划内容完整、范围可控，风险均有对应的实现步骤或验收证据要求，可以进入实现阶段。

VERDICT: PASS
