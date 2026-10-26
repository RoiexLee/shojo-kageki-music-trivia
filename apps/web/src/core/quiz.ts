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
  easy: { optionCount: 3, segmentKey: 'intro-15' },
  normal: { optionCount: 4, segmentKey: 'intro-10' },
  hard: { optionCount: 6, segmentKey: 'intro-5' },
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
};

export const MODE_LABEL: Record<QuizMode, string> = {
  intro: '开头猜歌', lyrics: '歌词猜歌', reverse: '倒放猜歌', mix: '混合连猜',
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
    easy: { optionCount: 3, answerCount: 1, hint: 'origin' },
    normal: { optionCount: 4, answerCount: 1 },
    hard: { optionCount: 6, answerCount: 1 },
  },
  reverse: {
    easy: { optionCount: 3, answerCount: 1, segmentKey: 'reverse-8', hint: 'lyric' },
    normal: { optionCount: 4, answerCount: 1, segmentKey: 'reverse-8' },
    hard: { optionCount: 6, answerCount: 1, segmentKey: 'reverse-8' },
  },
  mix: {
    easy: { optionCount: 4, answerCount: 2, segmentKey: 'chorus-10' },
    normal: { optionCount: 6, answerCount: 2, segmentKey: 'chorus-10' },
    hard: { optionCount: 8, answerCount: 3, segmentKey: 'chorus-10' },
  },
};

export interface LyricLine { timeMs: number; text: string; translation?: string }
export interface LyricsData { id: string; lineCount: number; lines: LyricLine[] }
export type LyricsById = Record<string, LyricsData>;

/** 曲库条目（SongMeta 的最小消费面） */
export interface Song {
  id: string;
  title: string;
  type: string;
  origin: string;
  aliases?: string[];
}

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
        clips: shuffle([...answerSongIds], rng).map((songId) => ({ songId, segmentKey: 'chorus-10' })),
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
    let line: LyricLine | undefined;
    if (config.mode === 'lyrics' || spec.hint === 'lyric') {
      const candidates = lyricCandidates(answer, lyrics[answer.id]?.lines ?? []);
      if (!candidates.length) throw new Error(`《${answer.title}》没有可用的猜歌歌词，请返回选择其他模式或重新准备歌词资源。`);
      line = candidates[Math.floor(rng() * candidates.length)];
    }
    if (config.mode === 'reverse') return { ...common, mode: 'reverse', segmentKey: 'reverse-8', lyricHint: line?.text };
    return {
      ...common, mode: 'lyrics', lyricText: line!.text, translation: line!.translation,
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
