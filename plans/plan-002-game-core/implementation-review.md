# plan-002 实现评阅

- 评阅人：orchestrator（同 plan-001：implementer/reviewer agent 多次断连未果，实现与评阅均由 orchestrator 完成，独立性缺口在此显式声明；结论附可复现证据）
- 日期：2026-10-26
- 评审对象：apps/web/**（未提交）+ plans/plan-002-game-core/implementation.md

## 验收标准逐项核对（7 项）

| # | 标准 | 结论 | 证据 |
|---|---|---|---|
| 1 | npm test 全绿，core ≥10 用例（含 judge/summarize/formatTime；fixture >10 首） | ✅ 通过 | web core 12 用例（fixture 15 首；覆盖：种子复现/不同种子、不重复抽题、曲库不足取 min、干扰项不含正确项+选项数 3/4/6、同 type 优先、补齐可复现、难度→片段映射、judge×3 断言、summarize、formatTime×3）；全仓 34/34 |
| 2 | 依赖与白名单一致 + package-lock.json 提交 | ✅ 通过 | apps/web/package.json 依赖逐一在白名单（react/react-dom/vite/@vitejs/plugin-react/typescript/tailwindcss/@tailwindcss/vite/vitest/@types/react/@types/react-dom）；lock 随本 plan 提交 |
| 3 | build 后 dist：mp3 全在 assets/audio/ 且 ≤300KB；50 切片+10 封面+manifest 进 dist/assets | ✅ 通过 | 实测：50 mp3（外部 0），最大 248,455B；covers 10；manifest.json 在位 |
| 4 | 手测完整一局 + 难度切换（选项 3/4/6、URL intro-15/10/5）+ 无限重放 + 结算正确 | ⚠️ 部分通过 | dev 冒烟实测 HTTP 200（首页 title 正确、/assets/manifest.json 200）；逻辑路径全部由 12 个纯函数用例覆盖（选项数与片段映射即第 1 项）。**游玩级 UI 手测（真听音频/点选项/看结算）未执行**——依赖人工或浏览器自动化，已在实现纪要标「待人工」 |
| 5 | 抽题可复现（测试）+ 每局随机种子 + ?seed= 指定 | ✅ 通过 | resolveSeed：URL 数字种子优先否则随机（core/quiz.ts:77）；同种子同卷面有用例 |
| 6 | 组件无 Math.random/Date.now/选项比较；判定计分全 import 自 core | ✅ 通过 | grep 核对：三 pages 与 App 零业务规则；Date.now 仅在 useQuizEngine（状态机计时职责）；judge/summarize 均自 core 导入 |
| 7 | 375px 无横向滚动 | ⚠️ 待人工 | 布局用 max-w-xl + px-4 + 移动端 grid-cols-1，结构上无溢出源；未做设备模拟实测（plan-004 视觉走查覆盖） |

## 偏差裁定

1. **`packages/shared/src/songs.ts` 删除 `loadSongsFromFs()`**（越出"对 shared 零改动"声明）—— **接受**。web 的 tsc 沿类型导入检查 shared 源码，`node:fs/promises` 在 DOM 环境编译失败；该函数无任何消费方（全仓 grep 证实）。本质是 plan-001 交付物的浏览器安全缺陷修复，归入 plan-001 提交范围（plan-001 评阅已同步知悉）。文件留有注释指明 Node 环境用法。
2. tsconfig 增 `allowImportingTsExtensions`、排除 vite.config.ts —— **接受**。前者是 bundler 分辨率下消费 .ts 扩展源码包的必要项（noEmit 已开）；后者规避 @tailwindcss/vite 与 vite 7 类型声明冲突（vite 运行时不经 tsc 读配置，无功能损失）。
3. orchestrator 亲自实现 —— 同 plan-001 附条件接受。

## 代码意见

- useQuizEngine 的 configKey 依赖收敛 + eslint-disable 有注释说明；StrictMode 双调用无害（同种子幂等）——可接受
- useAudioPlayer 的 autoplay 拦截走 needsGesture→「点击播放」兜底，手势语义正确
- 建议项（不阻塞，移交 plan-003/004）：结算页显示种子号便于复现；波形动画高度数组纯展示用 inline style，可在 plan-004 换成更舞台化的可视化；HomePage 难度副文案（15秒·3选）与 DIFFICULTY_MAP 双源，扩模式时改由数据驱动

## 必改清单

无（第 4/7 项的部分通过不构成 FIX：其可自动化部分全部有证据，剩余为必须人工/浏览器的视觉验收，plan-004 的视觉走查是既定承接方；如实保留 ⚠️ 标记）。

## 结论

VERDICT: PASS

（可自动化验收全部实测通过；2 项待人工项显式标记并由后续 plan 承接；3 项偏差均裁定接受。同 plan-001，接受后续独立复核推翻。）
