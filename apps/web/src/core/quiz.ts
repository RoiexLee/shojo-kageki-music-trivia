import { mulberry32, shuffle, type Rng } from './rng.ts';
import type { SegmentKey } from '@starlight/shared';

/** 核心本地类型（不消费 shared 占位类型；plan-003 视需要收敛回 shared） */
export type Difficulty = 'easy' | 'normal' | 'hard';
export type QuizMode = 'intro' | 'lyrics' | 'reverse' | 'mix';

export interface DifficultySpec {
  optionCount: number;
  segmentKey: SegmentKey;
}

export const DIFFICULTY_MAP: Record<Difficulty, DifficultySpec> = {
  easy: { optionCount: 4, segmentKey: 'clip-15' },
  normal: { optionCount: 6, segmentKey: 'clip-10' },
  hard: { optionCount: 8, segmentKey: 'clip-5' },
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
};

export const MODE_LABEL: Record<QuizMode, string> = {
  intro: '片段猜歌', lyrics: '歌词猜歌', reverse: '倒放猜歌', mix: '混合猜歌',
};

export interface ModeSpec {
  optionCount: number;
  answerCount: number;
  segmentKey?: SegmentKey;
  hint?: 'origin' | 'lyric';
}

export const MODE_DIFFICULTY_MAP: Record<QuizMode, Record<Difficulty, ModeSpec>> = {
  intro: {
    easy: { ...DIFFICULTY_MAP.easy, answerCount: 1 },
    normal: { ...DIFFICULTY_MAP.normal, answerCount: 1 },
    hard: { ...DIFFICULTY_MAP.hard, answerCount: 1 },
  },
  lyrics: {
    easy: { optionCount: 4, answerCount: 1, hint: 'origin' },
    normal: { optionCount: 6, answerCount: 1 },
    hard: { optionCount: 8, answerCount: 1 },
  },
  reverse: {
    easy: { optionCount: 4, answerCount: 1, segmentKey: 'reverse-8', hint: 'lyric' },
    normal: { optionCount: 6, answerCount: 1, segmentKey: 'reverse-8' },
    hard: { optionCount: 8, answerCount: 1, segmentKey: 'reverse-8' },
  },
  mix: {
    easy: { optionCount: 4, answerCount: 2, segmentKey: 'clip-10' },
    normal: { optionCount: 6, answerCount: 2, segmentKey: 'clip-10' },
    hard: { optionCount: 8, answerCount: 2, segmentKey: 'clip-10' },
  },
};

export interface LyricLine { timeMs: number; text: string; translation?: string }
export interface LyricsData { id: string; lineCount: number; lines: LyricLine[] }
export type LyricsById = Record<string, LyricsData>;

/** 曲库条目（SongMeta 的消费面，可选字段支持曲库图鉴与揭晓典藏卡展示） */
export interface Song {
  id: string;
  title: string;
  type: string;
  origin: string;
  aliases?: string[];
  romaji?: string;
  singers?: string[];
  description?: string;
  folder?: string;
}

/** 圣翔音乐学园第 99 期生（スタァライト九九組）舞台代表色与声优档案 */
export interface TroupeMember {
  id: string;
  number: number;
  name: string;
  romaji: string;
  cv: string;
  color: string;
  colorName: string;
  epithet: string;
}

export const TROUPE_MEMBERS: readonly TroupeMember[] = [
  { id: 'karen', number: 1, name: '愛城華恋', romaji: 'Aijō Karen', cv: '小山百代', color: '#FB5458', colorName: '华恋红', epithet: '约定之星的舞台少女' },
  { id: 'hikari', number: 29, name: '神楽ひかり', romaji: 'Kagura Hikari', cv: '三森すずこ', color: '#5A8DEE', colorName: '星光蓝', epithet: '远渡重洋的宿命星芒' },
  { id: 'maya', number: 18, name: '天堂真矢', romaji: 'Tendō Maya', cv: '富田麻帆', color: '#EAE6F2', colorName: '孤高白', epithet: '立于顶点的首席主役' },
  { id: 'junna', number: 25, name: '星見純那', romaji: 'Hoshimi Junna', cv: '佐藤日向', color: '#62C4E8', colorName: '苍穹水蓝', epithet: '紧握自己那颗星辰' },
  { id: 'mahiru', number: 17, name: '露崎まひる', romaji: 'Tsuyuzaki Mahiru', cv: '岩田陽葵', color: '#86D66B', colorName: '晨曦黄绿', epithet: '温柔守望的向阳花' },
  { id: 'nana', number: 15, name: '大場なな', romaji: 'Daiba Nana', cv: '小泉萌香', color: '#F4C84B', colorName: '轮回耀黄', epithet: '第 99 回圣翔祭的守护者' },
  { id: 'claudine', number: 11, name: '西條クロディーヌ', romaji: 'Saijō Claudine', cv: '相羽あいな', color: '#F58840', colorName: '炽烈亮橙', epithet: '永不言败的法兰西荣光' },
  { id: 'futaba', number: 2, name: '石動双葉', romaji: 'Isurugi Futaba', cv: '生田輝', color: '#9B6AD6', colorName: '疾风暗紫', epithet: '斩开迷雾的锐利锋芒' },
  { id: 'kaoruko', number: 22, name: '花柳香子', romaji: 'Hanayagi Kaoruko', cv: '伊藤彩沙', color: '#F07CA5', colorName: '京洛樱粉', epithet: '千锤百炼的优雅花朵' },
];

export interface QuizConfig {
  mode: QuizMode;
  difficulty: Difficulty;
  questionCount: number;
  seed: number;
}

interface QuestionBase {
  id: string;
  optionSongIds: string[];
}

export interface IntroQuestion extends QuestionBase {
  mode: 'intro';
  answerSongId: string;
  segmentKey: SegmentKey;
}

export interface LyricsQuestion extends QuestionBase {
  mode: 'lyrics';
  answerSongId: string;
  lyricText: string;
  originalLyricText?: string;
  lyricTimeMs?: number;
  clipStartSec?: number;
  clipDurationSec?: number;
  translation?: string;
  originHint?: string;
}

export interface ReverseQuestion extends QuestionBase {
  mode: 'reverse';
  answerSongId: string;
  segmentKey: 'reverse-8';
  lyricHint?: string;
}

export interface MixQuestion extends QuestionBase {
  mode: 'mix';
  answerSongIds: string[];
  clips: { songId: string; segmentKey: SegmentKey }[];
}

export type Question = IntroQuestion | LyricsQuestion | ReverseQuestion | MixQuestion;

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  elapsedMs: number;
  selectedSongIds?: string[];
}

export const DEFAULT_QUESTION_COUNT = 10;

/**
 * 生成一局题目：按种子不重复抽 questionCount 首（曲库不足取 min）；
 * 干扰项优先同 type，不足时从剩余曲库以同一 rng 补齐；选项乱序。
 */
export function lyricCandidates(song: Song, lines: LyricLine[]): LyricLine[] {
  const normalize = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
  const titles = [song.title, ...(song.aliases ?? [])].map(normalize).filter(Boolean);
  const seen = new Set<string>();
  return lines.filter((line) => {
    const text = normalize(line.text);
    if (line.text.trim().length < 6 || seen.has(text) || titles.some((title) => text.includes(title))) return false;
    seen.add(text);
    return true;
  });
}

/** 中文题面只允许包含汉字、没有日文假名的非空译文。 */
export function translationCandidates(song: Song, lines: LyricLine[]): LyricLine[] {
  const normalize = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
  const titles = [song.title, ...(song.aliases ?? [])].map(normalize).filter(Boolean);
  const seen = new Set<string>();
  return lines.filter((line) => {
    const translation = line.translation?.trim() ?? '';
    const text = normalize(translation);
    if (translation.length < 6 || !/[\u3400-\u9fff]/u.test(translation) || /[\u3040-\u30ff]/u.test(translation)
      || seen.has(text) || titles.some((title) => text.includes(title))) return false;
    seen.add(text);
    return true;
  });
}

export function buildQuiz(songs: Song[], config: QuizConfig & { mode: 'intro' }, lyrics?: LyricsById): IntroQuestion[];
export function buildQuiz(songs: Song[], config: QuizConfig, lyrics?: LyricsById): Question[];
export function buildQuiz(songs: Song[], config: QuizConfig, lyrics: LyricsById = {}): Question[] {
  if (!Number.isInteger(config.questionCount) || config.questionCount < 1) throw new Error('题数必须为正整数');
  if (new Set(songs.map((song) => song.id)).size !== songs.length) throw new Error('曲库包含重复歌曲');
  const rng = mulberry32(config.seed);
  const spec = MODE_DIFFICULTY_MAP[config.mode][config.difficulty];
  if (songs.length > 0 && songs.length < spec.answerCount) throw new Error('曲库数量不足以生成此模式');
  const count = Math.min(config.questionCount, songs.length);
  // 曲库 < 题数：取 min 不报错（plan-002 契约）
  const needOptions = Math.min(spec.optionCount, songs.length);

  const picked = shuffle([...songs], rng).slice(0, count);
  return picked.map((answer, i) => {
    const id = `q${i + 1}`;
    if (config.mode === 'mix') {
      const answerSongIds = [answer.id, ...shuffle(songs.filter((s) => s.id !== answer.id), rng)
        .slice(0, spec.answerCount - 1).map((s) => s.id)];
      const distractors = shuffle(songs.filter((s) => !answerSongIds.includes(s.id)), rng)
        .slice(0, needOptions - answerSongIds.length).map((s) => s.id);
      return {
        id, mode: 'mix', answerSongIds,
        clips: shuffle([...answerSongIds], rng).map((songId) => ({ songId, segmentKey: 'clip-10' })),
        optionSongIds: shuffle([...answerSongIds, ...distractors], rng),
      };
    }
    const others = songs.filter((s) => s.id !== answer.id);
    const sameType = shuffle(others.filter((s) => s.type === answer.type), rng);
    const rest = shuffle(others.filter((s) => s.type !== answer.type), rng);
    const options = [answer.id, ...[...sameType, ...rest].slice(0, needOptions - 1).map((s) => s.id)];
    const common = {
      id,
      answerSongId: answer.id,
      optionSongIds: shuffle(options, rng),
    };
    if (config.mode === 'intro') return { ...common, mode: 'intro', segmentKey: DIFFICULTY_MAP[config.difficulty].segmentKey };
    const allLines = lyrics[answer.id]?.lines ?? [];
    let line: LyricLine | undefined;
    if (config.mode === 'lyrics') {
      const candidates = translationCandidates(answer, allLines);
      if (!candidates.length) throw new Error(`《${answer.title}》没有可用的中文歌词译文，请返回选择其他模式或重新准备歌词资源。`);
      line = candidates[Math.floor(rng() * candidates.length)];
    } else if (spec.hint === 'lyric') {
      const candidates = lyricCandidates(answer, allLines);
      if (!candidates.length) throw new Error(`《${answer.title}》没有可用的猜歌歌词，请返回选择其他模式或重新准备歌词资源。`);
      line = candidates[Math.floor(rng() * candidates.length)];
    }
    if (config.mode === 'reverse') return { ...common, mode: 'reverse', segmentKey: 'reverse-8', lyricHint: line?.text };
    const lineIdx = line ? allLines.indexOf(line) : -1;
    const nextLine = lineIdx >= 0 ? allLines[lineIdx + 1] : undefined;
    const clipStartSec = Math.max(0, Number((line!.timeMs / 1000 - 0.5).toFixed(2)));
    const rawSpanSec =
      nextLine && nextLine.timeMs > line!.timeMs ? (nextLine.timeMs - line!.timeMs) / 1000 + 0.8 : 6;
    const clipDurationSec = Number(Math.min(7.5, Math.max(4.5, rawSpanSec)).toFixed(2));
    return {
      ...common,
      mode: 'lyrics',
      lyricText: line!.translation!,
      originalLyricText: line!.text,
      lyricTimeMs: line!.timeMs,
      clipStartSec,
      clipDurationSec,
      originHint: spec.hint === 'origin' ? answer.origin : undefined,
    };
  });
}

export function answerIds(question: Question): string[] {
  return question.mode === 'mix' ? question.answerSongIds : [question.answerSongId];
}

/** 混合必须不多不少选中全部答案；单选仍支持原来的字符串参数。 */
export function judge(question: Question, selected: string | string[]): boolean {
  const ids = typeof selected === 'string' ? [selected] : selected;
  const expected = answerIds(question);
  return ids.length === expected.length && new Set(ids).size === ids.length && expected.every((id) => ids.includes(id));
}

export function toggleSelection(question: Question, selected: string[], id: string): string[] {
  if (!question.optionSongIds.includes(id)) return selected;
  if (selected.includes(id)) return selected.filter((value) => value !== id);
  return selected.length < answerIds(question).length ? [...selected, id] : selected;
}

/** 计分聚合 */
export interface QuizSummary {
  correct: number;
  total: number;
  elapsedMs: number;
}

export function summarize(results: QuestionResult[]): QuizSummary {
  return {
    correct: results.filter((r) => r.correct).length,
    total: results.length,
    elapsedMs: results.reduce((acc, r) => acc + r.elapsedMs, 0),
  };
}

export interface StreakStats {
  currentStreak: number;
  maxStreak: number;
  fastestMs: number | null;
  avgMs: number;
}

/** 计算作答序列的当前连击、最高连击、最快正确单题用时与平均用时。 */
export function computeStreaks(results: QuestionResult[]): StreakStats {
  let currentStreak = 0;
  let maxStreak = 0;
  let fastestMs: number | null = null;
  let totalMs = 0;
  for (const r of results) {
    totalMs += r.elapsedMs;
    if (r.correct) {
      currentStreak += 1;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
      if (fastestMs === null || r.elapsedMs < fastestMs) fastestMs = r.elapsedMs;
    } else {
      currentStreak = 0;
    }
  }
  return {
    currentStreak,
    maxStreak,
    fastestMs,
    avgMs: results.length > 0 ? Math.round(totalMs / results.length) : 0,
  };
}

export interface StageRank {
  tier: 'S+' | 'A' | 'B' | 'C';
  code: string;
  title: string;
  subtitle: string;
  quote: string;
  accuracyPct: number;
}

/** 根据本局汇总成绩评定舞台少女星级（Stage Rank）。 */
export function computeStageRank(summary: QuizSummary): StageRank {
  const ratio = summary.total > 0 ? summary.correct / summary.total : 0;
  const accuracyPct = Math.round(ratio * 100);
  if (summary.total > 0 && summary.correct === summary.total) {
    return {
      tier: 'S+',
      code: 'POSITION ZERO',
      title: 'TOP STAR · 命运之主役',
      subtitle: '凌驾于星光之巅，全曲目完美制霸！',
      quote: '「わかります——你已摘下那颗无人能及的命运之星。」',
      accuracyPct,
    };
  }
  if (ratio >= 0.8) {
    return {
      tier: 'A',
      code: 'BRILLIANT REVUE',
      title: 'BRILLIANT · 耀眼舞台少女',
      subtitle: '歌声与剑戟交织，聚光灯为你而倾泻！',
      quote: '「舞台少女每时每刻都在歌唱中重生。」',
      accuracyPct,
    };
  }
  if (ratio >= 0.6) {
    return {
      tier: 'B',
      code: 'RISING ACTRESS',
      title: 'RISING · 新星初绽',
      subtitle: '旋律已在心中回响，向着零点位置再度进发！',
      quote: '「听见星辰的对白，再次迈向舞台中央。」',
      accuracyPct,
    };
  }
  return {
    tier: 'C',
    code: 'ENCORE CALL',
    title: 'ENCORE · 再演序曲',
    subtitle: '帷幕尚未真正落下，只要还在歌唱，选拔便永不终结。',
    quote: '「我们早已立于舞台之上。」',
    accuracyPct,
  };
}

/** 用时格式化：中文单位前留空格，秒数始终两位（分享与成绩图共用）。 */
export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min} 分 ${sec.toString().padStart(2, '0')} 秒` : `${sec} 秒`;
}

/** 每局种子：URL ?seed= 优先（复现 bug 用），否则随机 */
export function resolveSeed(): number {
  const fromUrl = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('seed') : null;
  if (fromUrl !== null && /^[0-9]+$/.test(fromUrl) && Number.isSafeInteger(Number(fromUrl))) return Number(fromUrl) >>> 0;
  return Math.floor(Math.random() * 2 ** 31);
}

export { mulberry32, shuffle, type Rng };
