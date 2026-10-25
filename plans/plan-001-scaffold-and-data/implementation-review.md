# plan-001 实现评阅

- 评阅人：orchestrator（说明：独立 reviewer agent 四次派发均因平台连接中断未完成——本文件曾由其落盘为骨架后中断；按用户指示由 orchestrator 完成评阅。实现者亦为 orchestrator，独立性打折已在此显式声明，全部结论附可复现证据，供后续独立复核）
- 日期：2026-10-26
- 评审对象：工作树未提交改动（根 package.json、scripts/、packages/shared/**、tools/prepare-audio/**、.gitignore）+ plans/plan-001-scaffold-and-data/implementation.md

## 验收标准逐项核对（9 项）

| # | 标准 | 结论 | 证据 |
|---|---|---|---|
| 1 | npm install 成功、devDeps 白名单 | ✅ 通过 | 根 package.json devDependencies 仅 typescript+vitest；apps/web 依赖属 plan-002 范围（其白名单另见 plan-002 评阅） |
| 2 | .gitignore 整目录 + 无 generated/ 残留；assets 后 git status 无产物 | ✅ 通过 | `.gitignore:6` 为 `apps/web/public/assets/`；grep 确认无 generated/；git status 中无任何 assets 产物（实测） |
| 3 | npm run assets 10 首无一失败 | ✅ 通过 | 实现纪要记录：60 文件 24s；本次复核 --verify 通过 |
| 4 | --verify 退出码 0（路径存在 + 时长 ±0.5s） | ✅ 通过 | 本次实测输出「校验通过：10 首歌 × 5 片段 + 封面」 |
| 5 | apps/web 缺失时 npm run dev 非零退出 + 可读错误 | ✅ 通过 | 实现纪要记录 exit=1 + 错误文案；现 apps/web 已存在，历史证据成立（scripts/run-web.mjs 逻辑可直接复核） |
| 6 | npm test 通过（shared 校验/唯一性/动态对账；tools 单测） | ✅ 通过 | 本次实测 34/34（shared 8 + tools 14 + web 12[后者属 plan-002]） |
| 7 | --only / --force 行为正确 | ✅ 通过 | 实现纪要：修复处理循环未按 targets 过滤的 bug 后，--only 跳过 6、--force 重建 6（实测输出在纪要） |
| 8 | songs.json 与调研报告一致 | ✅ 通过 | docs/research/revue-starlight-songs.md 10/10 完成；songs.json 逐首与报告一致（id/folder/title/type/origin/singers/aliases 取自报告核实处） |
| 9 | implementation.md 含真实运行输出与总体积 | ✅ 通过 | 纪要含自测表与 8.2MB 体积数字 |

## 偏差裁定（2 项）

1. **工具不 import @starlight/shared，直读 songs.json + 3 行最小校验** —— **接受**。理由成立：Node 运行时对 node_modules 内 .ts 不做类型剥离，workspace 链接包 exports 指向 TS 源导致裸 node 不可执行。完整校验未丢失（shared 的 parseSongs + 8 用例承担），工具侧仅做对齐必需的重复检查。契约未被削弱：songs.json 单一数据源、类型以 shared 为准。
2. **orchestrator 亲自实现**（implementer agent 两次断连未落盘）—— **接受，附条件**。流程上实现/评阅本应分离；本次实现与评阅同为 orchestrator，独立性受损。缓解：全部验收项均有可复现命令证据（上表）；后续任何独立会话可按表复核。

## 代码意见

- （评阅中发现并已处理）`packages/shared/test/songs.test.ts` 首用例硬编码 `toHaveLength(10)`，plan-005 扩曲库时必然误报——与本 plan「断言不硬编码 10」的评审要求相悖（动态对账用例是达标的，但首用例漏网）。已改为非计数断言，shared 8/8 复跑通过。此修改属 plan-001 范围，随 plan-001 提交。
- `cli.mjs` manifest 半生成/损坏场景：JSON.parse 失败会走 main 的 catch 非零退出（可接受）；条目级缺失文件由幂等重建覆盖。
- spawn 数组传参 + windowsHide 全程执行；`-ss` 前置 + loudnorm 单 pass + `-ar 44100` 落实（有专测）。
- 建议项（不阻塞）：`--verify` 对 manifest 与 songs.json 的条目集合差异未显式对比（现两侧各查各的）；plan-005 扩库时可加对账。

## 必改清单

无。

## 结论

VERDICT: PASS

（9/9 验收项有实测证据；2 项偏差均裁定接受；1 项评阅中发现的问题已当场修复并复测。评阅独立性的缺口已显式声明，接受后续独立复核的推翻。）
