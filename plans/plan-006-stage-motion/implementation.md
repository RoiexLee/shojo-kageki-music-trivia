# Plan 006 实现纪要

## 实际改动

- `apps/web/src/core/quiz.ts` 的 `formatTime` 统一输出中文单位前空格：`45 秒`、`1 分 23 秒`，并保留分钟内秒数两位补零。
- `apps/web/src/core/quiz.test.ts` 增加 0、45、59、60、83 秒及超过一小时边界；`apps/web/src/core/share.test.ts` 同步验证复制文案。
- 新增 `apps/web/src/components/StageHero.tsx`，在舞台背景上叠加 Karen、Hikari、Maya 三张透明官方立绘；角色加载失败时保留低透明度 `cast.png` 降级层。
- `apps/web/src/pages/HomePage.tsx` 接入透明舞台主视觉；`QuizPage.tsx`、`SummaryPage.tsx` 增加页面入场类名。
- `apps/web/src/styles.css` 增加聚光灯、角色入场、星屑呼吸、答案列表和结算行的动效，并补充移动端角色缩放与 `prefers-reduced-motion` 关闭规则。
- `apps/web/index.html` 与 `apps/web/public/favicon.svg` 提供本地 favicon，避免浏览器默认 `/favicon.ico` 404 干扰控制台验收。
- `NOTICE.md` 记录三张立绘的官方完整 URL、核验日期、PNG 与透明通道信息；未修改 `music/` 和音频产物。

## 资源来源

三张图片均从少女☆歌剧官方站点获取并核验为 PNG、2400×3336，采样 alpha 通道包含透明像素：

- Karen：`https://revuestarlight.com/wordpress/wp-content/themes/revuestarlight_v1/assets/images/common/animation/character/main/revue/pc/char_karen_revue@2x.png`
- Hikari：`https://revuestarlight.com/wordpress/wp-content/themes/revuestarlight_v1/assets/images/common/animation/character/main/revue/pc/char_hikari_revue@2x.png`
- Maya：`https://revuestarlight.com/wordpress/wp-content/themes/revuestarlight_v1/assets/images/common/animation/character/main/revue/pc/char_maya_revue@2x.png`

文件保存为 `apps/web/public/theme/characters/{karen,hikari,maya}.png`，仅用于本地开发预览。

## 视觉对比记录

以旧版首页和官方舞台素材为基准，浏览器走查重点检查了以下差异：

1. **主视觉资产**：旧版是带白底横幅；新版能看到三张角色的透明边缘，舞台背景和深酒红底色直接透出。
2. **层次与光线**：新版增加金色聚光灯渐变、两侧深红帷幕边缘和星屑呼吸，角色处于背景前、文字区之外，没有覆盖主标题或开始按钮。
3. **首屏布局**：标题仍在左侧，透明舞台仍在右侧，模式区紧跟首屏，未增加无关卡片或营销文案。
4. **答题状态**：答题页保留波形、进度条和音频控制，选项改为逐项轻微上移动效；点击选项后正确/错误状态与焦点行为仍然可见。
5. **结算状态**：结算页保留成绩、复制、下载和再玩一次操作，成绩行逐条入场；时间显示已统一为带空格的中文单位。
6. **响应式**：`760px` 断点下角色层缩小并向两侧收拢，选项变为单列，开始与结算操作按钮保持可点击。
7. **无障碍动效**：`prefers-reduced-motion: reduce` 下全局动画和过渡关闭，内容不依赖动画完成才显示。

## 自测结果

- `npm test`：通过，web 29 项、shared 8 项、prepare-audio 26 项，共 63 项。
- `npm run build`：通过，Vite 生产构建成功。
- `npm run assets -- --verify`：通过，10 首歌曲 × 5 片段、封面和歌词指纹一致。
- `git diff --check`：通过。

## 浏览器验收证据

使用 IAB `http://127.0.0.1:4175/` 完成桌面真实流程，并用独立 Chromium/CDP 页面完成当前版本的 375×812 移动验收：

1. 首页首屏显示透明角色舞台构图、模式按钮和开始答题按钮。
2. 点击“开始答题”后进入第 1 题，标题焦点转移、音频控件、进度条和答案选项可见。
3. 点击一个答案后，选项禁用并显示“你的选择/正确答案”，再连续完成剩余题目。
4. 点击“查看结果”进入结算页，显示本场成绩、最佳成绩和逐题回顾。
5. 点击“复制成绩”显示“成绩文案已复制。”；结算页可见 `用时 1 分 28 秒` 形式的文案。
6. IAB 控制台无应用错误；补充本地 favicon 后，375px 页面控制台错误/警告数组为空。
7. 375px 首页、答题页和结算页的 `innerWidth=375`、`innerHeight=812`，`scrollWidth=360`、`clientWidth=360`，均无横向滚动；首页角色、标题和模式按钮可见，答题选项与“下一题”、结算“查看结果”可点击。
8. 在同一 375px 页面设置 `prefers-reduced-motion: reduce` 后，`matchMedia` 为真，舞台灯光和页面入场动画的计算样式均为 `animation-name: none`，仍无横向溢出。

移动验收截图保存于临时目录 `C:/Users/roiexlee/.codex/visualizations/2026/10/26/01a176b0-36eb-7890-93fa-2fd1572bf888/plan006-mobile-home.png` 和 `plan006-mobile-quiz.png`，未写入仓库。

## 计划偏差与风险

- 角色图片没有重新压缩或转 WebP，保留 PNG alpha 质量；首次加载体积较大，后续可按需压缩。
- 保留 `cast.png` 作为低透明度降级层，正常情况下主视觉由透明角色组成；若官方 URL 变化，角色 `onError` 会隐藏失败图但不会阻断游戏。
- 本计划没有改变抽题、计分、音频队列或 `music/` 内容。
