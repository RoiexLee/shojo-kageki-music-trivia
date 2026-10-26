/**
 * 前后端共用的核心类型契约。
 * SongMeta/Manifest 由 tools/prepare-audio 生产、apps/web 消费；
 * Quiz 相关类型为 plan-002 起的游戏核心占位定义（仅类型，可向后兼容地新增字段）。
 */

/** 歌曲元数据（packages/shared/src/songs.json 的一条记录） */
export interface SongMeta {
  /** 罗马字 slug，如 star-divine；作为 manifest 键与音频目录名 */
  id: string;
  /** music/ 下的文件夹名 —— 与文件系统逐字符精确匹配的对齐键 */
  folder: string;
  /** 官方标题（仅展示，不参与对齐） */
  title: string;
  /** 罗马字读音 */
  romaji: string;
  /** 常见中文译名/别名（答案判定与展示用） */
  aliases: string[];
  /** 歌曲类型：OP / ED / 挿入歌 / 劇場主題歌 / キャラソン 等 */
  type: string;
  /** 出处作品（2018 TV / 剧场版 / 舞台 等） */
  origin: string;
  /** 演唱者（角色/组合名） */
  singers: string[];
  /** 一句话描述（≤40 字，游戏提示文案；未查实可为「待补」） */
  description: string;
  /** 副歌切片起点（秒）；缺省由工具按默认值 72 处理 */
  chorusStartSec?: number;
}

/** 可用片段键：曲中切片、兼容旧开头/副歌切片及倒放切片 */
export type SegmentKey = 'intro-5' | 'intro-10' | 'intro-15' | 'clip-5' | 'clip-10' | 'clip-15' | 'chorus-10' | 'reverse-8';

/** manifest 中单个片段的描述 */
export interface SegmentInfo {
  /** 相对 assets 根的路径，如 audio/star-divine/intro-10.mp3 */
  path: string;
  /** ffprobe 实测时长（秒） */
  durationSec: number;
}

/** manifest 条目的生成参数（幂等比对用；generatedAt 不参与一致性比对） */
export interface ManifestParams {
  chorusStartSec: number;
  bitrate: string;
  generatedAt: string;
}

/** manifest.json 中每首歌的条目 */
export interface ManifestEntry {
  id: string;
  folder: string;
  title: string;
  segments: Record<SegmentKey, SegmentInfo>;
  coverPath: string;
  params: ManifestParams;
}

/** tools/prepare-audio 产出的 manifest.json 根结构 */
export interface Manifest {
  version: 1;
  generatedAt: string;
  entries: ManifestEntry[];
}

// ---------------------------------------------------------------------------
// 游戏核心占位类型（plan-002 实装纯函数，plan-003 扩展模式）
// ---------------------------------------------------------------------------

/** 玩法模式；plan-002 只实装 intro，其余为 plan-003 预留 */
export type QuizMode = 'intro' | 'lyrics' | 'reverse' | 'mix';

/** 难度：影响片段时长与选项数 */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** 一局游戏的配置 */
export interface QuizConfig {
  mode: QuizMode;
  difficulty: Difficulty;
  questionCount: number;
  /** 种子随机（mulberry32），同种子同卷面 */
  seed: number;
}

/** 题面（intro 模式形态；plan-003 扩展时以 discriminated union 增补） */
export interface Question {
  id: string;
  mode: QuizMode;
  /** 正确答案的歌 id */
  answerSongId: string;
  /** 选项歌 id（含正确项，已乱序） */
  optionSongIds: string[];
  /** 本题使用的片段键 */
  segmentKey: SegmentKey;
}

/** 单题作答结果 */
export interface QuestionResult {
  questionId: string;
  correct: boolean;
  elapsedMs: number;
}
