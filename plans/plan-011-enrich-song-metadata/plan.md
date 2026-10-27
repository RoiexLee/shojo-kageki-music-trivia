# plan-011：补齐新增曲库元数据

## 背景与目标

plan-009 为了先让 121 首素材进入资源管道，新增歌曲的 `romaji`、`type`、`origin`、`description` 暂使用占位值。当前试听曲库能播放，但曲目卡片显示“未分类／待补”，不符合既有歌曲元数据标准。本计划补齐所有占位字段，并为可确认的歌曲添加别名。

## 交付物清单

- [ ] `packages/shared/src/songs.json` 中不再出现新增条目的 `未分类`、`待补` 或以原日文标题充当罗马音的占位字段。
- [ ] 新增歌曲的类型、出处、罗马音、描述与演唱者保持与已有 48 首的字段风格一致；版本曲目明确标注 movie/ver. 或角色组合。
- [ ] 对能确认的常见中文/英文别名补入 `aliases`，无法确认时保留空数组，不编造非通行译名。
- [ ] `npm test`、`npm run build` 通过，资源 manifest 不受影响。
- [ ] 记录元数据来源范围、推断字段和未人工核验项。

## 涉及文件

- `packages/shared/src/songs.json`
- `plans/plan-011-enrich-song-metadata/implementation.md`
- `plans/plan-011-enrich-song-metadata/implementation-review.md`

## 实现步骤

1. 按歌曲线整理新增曲目：动画/剧场版、舞台、Best Album、角色歌与版本曲。
2. 参考现有调研报告、文件名演唱者与官方/发行信息，逐条填写 romaji、aliases、type、origin、description。
3. 保持 id、folder、音频资源路径和 chorusStartSec 不变，只更新展示元数据。
4. 运行 schema、测试和构建检查，确认没有占位字段残留。
5. 由 reviewer 复核字段完整性与明显分类错误后提交。

## 验收标准

- [ ] `songs.json` 121 条全部通过 `parseSongs`。
- [ ] 新增 73 条中 `type`、`origin`、`description` 非占位，`romaji` 不再等于日文标题占位（英文标题可保留正式英文罗马字）。
- [ ] 试听曲库可继续按歌曲名排序并显示分类、出处和描述。
- [ ] `npm test` 与 `npm run build` 通过。

## 风险与回滚

- 部分舞台/手游曲目的发行信息只能按本地文件与系列曲目推断；实现纪要会标明这类字段，后续可逐条替换，不影响音频资源。
- 回滚只需恢复 `songs.json`；不触碰 `music/` 与已生成 assets。
