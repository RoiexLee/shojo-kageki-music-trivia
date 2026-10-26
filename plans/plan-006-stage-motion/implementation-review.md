# Plan 006 实现评阅

- 评阅人：独立 reviewer agent
- 日期：2026-10-26
- 评阅对象：当前工作树中的 plan-006 实现及 plans/plan-006-stage-motion/implementation.md
- 基线：plan-005 提交 eb7f29d；未把已移除的 favicon/index.html 变更纳入评阅。

## 已核验项目

- apps/web/src/components/StageHero.tsx 已使用 Karen、Hikari、Maya 三张透明角色图，采用 import.meta.env.BASE_URL，角色失败时隐藏单图并保留 cast.png 降级层；首页接入，答题页和结算页接入 stage-enter。
- NOTICE.md:17-23 记录了三张 PNG 的完整官方 URL、核验日期和本地版权边界。实际文件均为 2400×3336 PNG，并含透明信息。
- apps/web/src/core/quiz.ts:220-225、apps/web/src/core/share.ts:3-6、apps/web/src/pages/SummaryPage.tsx:45,63-64,84 的时间格式调用链已统一；quiz.test.ts:132-138 覆盖 0、45、59、60、83 秒及超过一小时，share.test.ts:4-6 覆盖分享文案。
- styles.css:39-46、89-93、104-109、136、197-200 提供舞台背景、角色/聚光灯/星屑/入场/列表动效和 reduced-motion 关闭规则；375px 预览中首页角色、标题和模式按钮均可见，未观察到角色覆盖标题或按钮。
- 独立重跑结果：npm test 通过（web 29、shared 8、prepare-audio 26，共 63 项）；npm run build 通过；npm run assets -- --verify 通过；git diff --check 通过。工作树未发现 music/ 或 apps/web/public/assets/ 改动。

## 必改问题

1. **FIX — 当前 plan-006 缺少 375px 浏览器验收证据。** implementation.md:41-52 的 IAB 证据只记录桌面视口；第 52 行明确把移动布局交给旧 plan-004 的 375px 走查。本计划修改了 styles.css:157-161 的角色缩放/定位以及 168-195 的移动布局，因此旧证据不能证明当前实现满足 plan.md:52、54 的“375px 无裁切/横向滚动、按钮可点击”要求。请在当前 plan-006 生产预览上重新设置 375px 视口，实际走查首页、开始答题、答题选项和结算操作，并在 implementation.md 补充日期/URL、scrollWidth 与 viewport 对比、关键控件可点击和控制台结果；同时记录 reduced-motion 检查，避免仅以“沿用 plan-004”代替本次证据。

## 非阻塞观察

- styles.css:22 的舞台背景仍使用根路径 /theme/stage.png，而 StageHero.tsx:1、13、19 使用 BASE_URL。当前根路径生产预览可用；若部署到非根路径，应统一 BASE_URL 或在实现纪要记录根路径部署限制。
- StageHero.tsx:13 的 cast.png 始终以 0.12 透明度渲染，符合计划所述降级/辅助层，但后续浏览器证据应确认透明角色仍是主视觉。

## 结论

代码、素材来源、时间 formatter、自动化检查和 reduced-motion 实现均通过；在补齐当前实现的 375px 浏览器证据前，plan-006 的逐条验收尚未闭合。

VERDICT: FIX

## RECHECK（2026-10-26）

已复核 implementation.md:44-55：当前版本通过独立 Chromium/CDP 完成 375×812 首页、答题、结算流程；记录 innerWidth/innerHeight、scrollWidth/clientWidth、控件可点击、控制台空错误/警告数组及 reduced-motion 下 animation-name:none。apps/web/index.html:8 与 apps/web/public/favicon.svg 已补齐，当前生产预览 favicon.svg 返回 200 image/svg+xml；npm run build 通过。原 FIX 已整改，未发现新的阻塞问题。

RECHECK: PASS
