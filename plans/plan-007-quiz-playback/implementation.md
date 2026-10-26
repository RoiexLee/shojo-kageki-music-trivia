# Plan 007 实现纪要：片段、中文歌词与同步混合猜歌

## 实际改动

- 将 DIFFICULTY_MAP 的片段改为曲中 clip-15/10/5，新增并保留 MODE_DIFFICULTY_MAP 的四模式三难度矩阵；混合模式三个难度均固定两首不同歌曲、每轨 clip-10，选项为 4/6/8。
- 在 tools/prepare-audio 增加 clip-5/10/15 规格，源时长前置校验覆盖 chorusStartSec + 15，验证器和测试改为八种片段；本地生成了 30 个新增切片（产物位于 gitignored 的 apps/web/public/assets/，未纳入提交）。
- 中文歌词候选只从译文字段抽取：去空、长度至少 6、必须含汉字且不含假名，归一化去重并排除歌名/别名泄漏；题目前只显示中文，答对或答错后显示日文原文并播放正确歌曲的 clip-10。
- 用 Web Audio 重写播放队列：所有轨道 fetch/decode 成功后，使用同一 AudioContext.currentTime 加未来偏移统一开始，增益按轨道数缩放；失败整组停止并报告失败数。实现了暂停、继续、重放、停止、手势恢复、AbortController/revision 取消和过期回调隔离。
- 页面效果按答题状态控制：片段/倒放/混合在作答前播放，普通题答题后停止；歌词题作答前不渲染播放器，提交后启动正确歌曲试听，避免旧停止 effect 中断。混合状态改为“同步混合/两轨同刻开始”，去除顺序播放文案。
- 混合题音源解析改为整组校验：任一轨路径缺失即返回空列表、停止排程并显示整体资源错误与“返回首页重试”入口，避免静默降级成单轨；新增页面/解析回归测试。
- 题目标题聚焦与音频生命周期 effect 分离，仅切换题目时聚焦，答题与揭晓过程中不再抢夺玩家焦点。
- 成绩键对规则改变的片段、歌词、混合模式使用 best:v2:<mode>:<difficulty>，倒放保留原键兼容旧成绩；同步分享文案、首页、README、工具说明、HTML 描述和计划总览。
- 同步 shared 类型、manifest fixture、页面/核心/队列测试；队列测试覆盖同刻开始与增益、整组失败、手势恢复、暂停偏移、重放归零、换题取消。

## 与计划的偏差

- 计划中的真实浏览器桌面/375px 交互和实际播放调度证据尚未在本 agent 阶段执行，由 orchestrator 在实现评阅前完成。
- 旧 intro-* 与 chorus-10 资源规格继续保留，便于回滚和兼容；新玩法只引用 clip-*。

## 自测记录

- npm test --workspaces --if-present：通过（总计 67 tests）。web 33 tests、shared 8 tests、prepare-audio 26 tests；另补充了 resume pending、停止后迟到 resolve 以及混合缺轨回归。
- npm run assets：通过，新增 30 个 clip 文件，其他产物幂等复用。
- npm run assets -- --verify：通过，10 首歌曲 × 8 片段，路径、时长、封面、歌词和源 LRC 指纹均一致。
- npm run build：通过，TypeScript 检查和 Vite production build 均成功。
- 未修改 music/，未新增依赖，未提交生成的 assets 或 dist。

## 浏览器验收证据

- 使用 `http://127.0.0.1:4173/`，Chrome 155 sandbox + Playwright；Browser 插件在本会话不可用，按 frontend-testing-debugging skill 使用了独立 Playwright fallback。
- 桌面 1440×1000：首页显示“片段猜歌 / 歌词猜歌 / 混合猜歌”；片段题请求 `audio/{id}/clip-10.mp3`。歌词题作答前只有中文译文且无播放器，答对和答错后均显示日文原文并显示“正在播放”。
- 混合普通题实际拦截到两个 `BufferSource.start` 参数均为 `[0.03, 0]`，两个 Gain 值均为 `0.5`，资源为两首不同歌曲的 `clip-10.mp3`；暂停/继续状态分别显示“已暂停”和“正在同步混合”。困难题页面显示“2 首 × 10 秒 · 8 选 2”。控制台无 error/warning。
- 375×812：首页 `scrollWidth === clientWidth === 375`，无横向溢出。截图保存在任务外部目录：`plan007-desktop-home.png`、`plan007-mobile-home.png`、`plan007-final-mix.png`。

剩余风险：未在多种真实移动浏览器上重复验证自动播放策略；缺失 manifest 片段属于静态资源错误，页面提供返回首页重试，不会降级成单轨。
