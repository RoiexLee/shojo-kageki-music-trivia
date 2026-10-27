# plan-011 实现纪要

## 实际改动

- 补齐 `packages/shared/src/songs.json` 中 73 首新增歌曲的 `romaji`、`aliases`、`type`、`origin` 和 `description`。
- 删除新增条目中的全部 `未分类`、`待补` 占位；日文标题改用拉丁字母罗马音，正式英文标题保留原英文写法。
- 为 `Fly Me to the Star` 角色版本、剧场版版本曲、LIFE IS LIKE A VOYAGE／復讐の剣组合版本分别标注版本和演唱组合；不改动 id、folder、chorusStartSec 或资源路径。
- 可确认的常见译名写入 aliases；公开资料不足的少数曲目使用明确的“舞台／企画曲”或“剧场版相关曲”分类，并在描述中采用本地音源与曲名可支持的保守文案。

## 资料与推断边界

- 主要依据仓库调研报告、官方音乐/发行线索、音频文件中的演唱者和曲名版本。
- `ラ・レヴュー・エターナル`、`アルカナ・アルカディア`、`Acte Zero`、`遙かなるエルドラド`、剧场版剧中歌等专辑归属按官方曲目线整理。
- `ポジションゼロへ！`、`十五時ミステリ`、`宵・花咲か唄`、`白鳥のセレナーデ`、`美しき人 或いは其れは`、`別れの戦記` 等公开发行信息较少的条目，分类和出处采用保守的系列归类，后续可替换为更精确的发行资料。

## 自测

- 新增条目占位统计：`type/origin/description` 均为 0；日文标题罗马音占位统计为 0。
- `npm test`：通过，web 37、shared 8、prepare-audio 27 个测试全部通过。
- `npm run build`：通过，TypeScript 与 Vite production build 成功。
- `music/`、`apps/web/public/assets/`、manifest 和音频路径未修改。
