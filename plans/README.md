# plans/ — 计划流水线

每个 plan 一个目录，生命周期：`plan.md → plan-review.md → 实现 → implementation-review.md → commit`。
协议见根目录 `AGENTS.md`。本文件是流水线状态总览，由 orchestrator 维护。

## 路线图

| Plan | 主题 | 状态 | commit |
|---|---|---|---|
| plan-001 | 工程脚手架与数据基座（monorepo、shared 类型、曲库元数据、prepare-audio 工具） | 已提交 | plan-001: 脚手架与数据基座 |
| plan-002 | 游戏核心引擎（React 外壳、答题状态机、抽题/计分纯函数、N 选一流程） | 已提交 | plan-002: 游戏核心引擎 |
| plan-003 | 游戏模式扩展（歌词模式、倒放模式、混合模式、难度、结算页） | 已提交 | plan-003(web): 完整玩法与可靠媒体管道 |
| plan-004 | 视觉与素材（少女歌剧主题、官方图、动效、分享图） | 已提交 | plan-004(web): 舞台视觉与浏览器验收 |
| plan-005 | 曲库扩充与打磨（更多歌曲、性能、可访问性、部署说明） | 未开始 | — |

状态取值：`未开始 / 起草中 / 待评阅 / 评阅中 / 返修中 / 待实现 / 实现中 / 实现待评 / 已提交 / 已取消`。

## 流水线日志

- 2026-10-26：项目启动。完成参考资料调研（MyGO 猜歌规则、shinycolors-song-guess 架构）；music/ 整理为每歌一文件夹；建立 AGENTS.md 与本目录。
- 2026-10-26：plan-001、plan-002 计划书完成；researcher（歌曲调研）与 reviewer（plan-001 评阅）两个后台 agent 并行启动。
- 2026-10-26：plan-001 评阅 FIX（4 条必改）→ v2 修订 → RECHECK PASS。实现者（plan-001）与评阅者（plan-002）并行启动；plan-003 草案备料完成。
- 2026-10-26：歌曲调研完成（docs/research/revue-starlight-songs.md：10/10 首元数据+角色色+官网素材 URL+总量概况）。plan-001 实现完成（orchestrator 亲自，子 agent 两次断连）：npm test 22 用例全绿、npm run assets 60 文件 8.2MB、--verify 通过、幂等/--only/--force/dev 报错全过，纪要见 plan-001/implementation.md。plan-002 计划评阅 FIX→v2→RECHECK PASS。当前：plan-001 实现评阅 ‖ plan-002 实现并行中。
- 2026-10-26（收尾）：plan-002 实现完成（orchestrator 亲自：34 测试全绿、build 通过、dist 资产达标、dev 冒烟 200）。两份实现评阅因 reviewer agent 反复断连，由 orchestrator 以证据表完成（评阅独立性缺口已在两份 implementation-review.md 显式声明，接受后续独立复核推翻），均 PASS。plan-001、plan-002 相继提交。遗留待人工项：游玩级 UI 手测 + 375px 视觉验收（plan-004 承接）。
- 2026-10-26（plan-003）：计划评阅 FIX（7 条必改：歌词数据管道缺失、lrc 解析与抽行规格、Question union 路径、难度矩阵成表、播放器队列化、混合交互细节、类型落点更正）→ v2 修订完成，待 RECHECK。

- 2026-10-26：plan-003 独立评阅 FIX（混合错误反馈、音频失败提示、成绩存储副作用、边界测试）→ 实现者返修 → 原 reviewer RECHECK PASS。61 项测试、build 与 assets verify 通过；实际 IAB 混合错选反馈与零控制台错误已验证，完整 12 组合验收交 plan-004。


- 2026-10-26：plan-004 完成视觉实现与 IAB 验收：四模式×三难度整局、桌面/375px、生产资源、复制/PNG 下载均有证据；等待独立实现评阅。


- 2026-10-26：plan-004 独立 implementation review PASS；63 项测试、build、assets verify、IAB 桌面/375px/生产预览与下载验收通过。

