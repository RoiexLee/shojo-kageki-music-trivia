# Plan 008 实现纪要：Starlight Grand Revue 华丽歌剧舞台前端完全重构

## 实际改动

1. **纯函数核心与音频钩子扩展（零外部依赖，单测全覆盖）**
   - `apps/web/src/core/best.ts` 与 `best.test.ts`：新增无副作用的 `loadBest(mode, difficulty)` 与 `bestStorageKey`，供首页模式卡片直接读取并展示历史最佳成绩；扩展 `saveBest` 返回 `isNewRecord: boolean`，驱动结算页 `✦ NEW RECORD` 金色皇冠标识。
   - `apps/web/src/core/quiz.ts` 与 `quiz.test.ts`：扩展 `Song` 接口（`romaji`、`singers`、`description`、`folder`）；新增圣翔音乐学园第 99 期生 `TROUPE_MEMBERS`（9 位舞台少女官方应援色、声优、出席番号与判词）；新增 `computeStreaks(results)`（当前连击、最高连击、最快单题耗时、平均耗时）与 `computeStageRank(summary)`（`S+` / `A` / `B` / `C` 四档歌剧舞台评级）。
   - `apps/web/src/hooks/audioQueue.ts`、`useAudioPlayer.ts` 与 `audioQueue.test.ts`：在保留双轨 `ctx.currentTime + 0.03` 同刻排程与手势恢复语义的前提下，增加特性检测的 `AnalyserNode` 实时频谱采样（`sampleFrequency`）与播放进度查询（`getPlaybackProgress`）。

2. **全曲试听资产生成与校验**
   - `tools/prepare-audio/src/cli.mjs`：在生成音频切片时同步将源全曲拷贝至 `apps/web/public/assets/audio/<id>/full.mp3`，并在 `--verify` 模式下校验全曲文件存在性。
   - `apps/web/src/App.tsx`、`JukeboxStudio.tsx`、`SummaryPage.tsx`：试听曲库与结算页回顾列表均直接播放全曲 `audio/<id>/full.mp3`。

3. **官网 9 位舞台少女透明立绘全量补齐**
   - 从少女☆歌剧官方网站获取并核验全部 9 位第 99 期生透明角色立绘 PNG（2400×3336，含 alpha 透明通道），保存于 `apps/web/public/theme/characters/{karen,hikari,maya,mahiru,junna,nana,claudine,futaba,kaoruko}.png`，并在 `NOTICE.md` 完整记录来源与版权说明。

4. **旧前端完全删除与全新歌剧舞台架构重写**
   - 删除旧版简单朴素的组件与样式，重写为完整的歌剧舞台视觉与交互体系：
     - `apps/web/src/components/TheaterIcons.tsx`：定制矢量圣翔校徽星芒、再生皇冠、西洋剑箭头、古典留声机、东京塔剪影与四模式专属纹章。
     - `apps/web/src/components/TheaterBackdrop.tsx`：全屏 60fps Canvas 星尘粒子与鼠标金粉拖尾引擎 + 三环逆向旋转 SVG 机械星盘（Clockwork Astrolabe）+ 3D 透视舞台地板网格 + 随角色代表色实时联动的体积聚光灯与天鹅绒侧幕。
     - `apps/web/src/components/TheaterHeader.tsx`：悬浮式 Art Deco 双翼一级导航栏（`选拔主舞台` / `试听曲库` / `九九组名鉴`）与底栏，去除二级重复导航栏。
     - `apps/web/src/components/TurntableVisualizer.tsx`：360° 环形 Canvas 音频频谱光环 + 3D 黄金黑胶唱盘（单曲顺/逆时针旋转与唱臂，混合猜歌模式双黑胶同台交锋）+ 42 根对称声波光柱。
     - `apps/web/src/components/JukeboxStudio.tsx`：
       - **试听曲库**：左侧 10 首名曲黑胶唱片架 + 右侧大型旋转黑胶唱盘、歌曲考据详情、全曲播放控制与完整中日双语歌词台本滚动预览。
       - **九九组名鉴**：9 位舞台少女的 3×3 宝石档案卡片阵，每张卡片右侧嵌入对应角色的高清透明立绘（调整合适高度完整呈现头顶皇冠与上半身礼服），点击切换全场聚光灯主题色。
     - `apps/web/src/pages/HomePage.tsx`：
       - 左翼 `POSITION ZERO · GRAND STAGE` 全景 3D 视差舞台：去除右上角冗余人物按钮、中部曲库入口按钮及左下角 `⊕ POSITION ZERO` 文字；统一由底部颜色条切换舞台立绘，颜色条最左侧新增全员高亮特殊皇冠标记（`全员同台`），点击任一角色颜色宝石即可在主舞台切换展示全部 9 位舞台少女的透明立绘与名言。
       - 右翼选拔控制台：45° 切角歌剧剧目刀锋卡（含历史最佳勋章）、星级难度选择器与流光开演按钮。
     - `apps/web/src/pages/QuizPage.tsx`：三栏拱顶 HUD、十幕星冕进度轨、巴洛克羊皮卷歌词台本卡（同时展示日文主歌词与中文辅助译文，并在作答揭晓后按 `line.timeMs` 精确截取播放该句歌词附近的 4.5～7.5 秒原曲片段）、并排实体播放/从头重放按钮（移除底部冗余文字状态）、包含封面+曲名+专辑出处的选项卡片阵列（移除 A/B 字母与数字角标）及作答揭晓后的黑胶典藏横幅。
     - `apps/web/src/pages/SummaryPage.tsx`：皇家授勋台 Stage Rank 评级勋章、4 维演出统计牌匾、1200×675 Canvas 剧场海报导出及支持直接全曲试听的百老汇节目单回顾列表。
     - `apps/web/src/components/TheaterHeader.tsx` 与 `HomePage.tsx`：移除导航栏数字徽章、首页冗余曲数描述及底栏/导出图中的非官方版权免责声明字样。

## 自测结果

- `npm test`：通过，共 70 项测试（`@starlight/web` 36 项、`@starlight/shared` 8 项、`@starlight/prepare-audio` 26 项）。
- `npm run build`：通过，`tsc -b && vite build` 零错误。
- `npm run assets -- --verify`：通过，10 首歌曲 × 8 片段 + 全曲 `full.mp3` + 封面 + 歌词全部校验一致。

## 计划偏差与风险

- 根据用户最新指令，视觉验收交由用户亲自执行，不再运行自动化截图比对。
- 未改动 `music/` 源素材目录；生成的 `apps/web/public/assets/` 保持在 `.gitignore` 中不入库。
