import { mulberry32, shuffle, type Rng } from './rng.ts';
import type { SegmentKey } from '@starlight/shared';

/** 核心本地类型（不消费 shared 占位类型；plan-003 视需要收敛回 shared） */
export type Difficulty = 'easy' | 'normal' | 'hard';

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

/** 曲库条目（SongMeta 的最小消费面） */
export interface Song {
  id: string;
  title: string;
  type: string;
  origin: string;
  aliases?: string[];
}

export interface QuizConfig {
  mode: 'intro';
  difficulty: Difficulty;
  questionCount: number;
  seed: number;
}

export interface Question {
  id: string;
  mode: 'intro';
  answerSongId: string;
  optionSongIds: string[];
  segmentKey: SegmentKey;
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  elapsedMs: number;
}

export const DEFAULT_QUESTION_COUNT = 10;

/**
 * 生成一局题目：按种子不重复抽 questionCount 首（曲库不足取 min）；
 * 干扰项优先同 type，不足时从剩余曲库以同一 rng 补齐；选项乱序。
 */
export function buildQuiz(songs: Song[], config: QuizConfig): Question[] {
  const rng = mulberry32(config.seed);
  const spec = DIFFICULTY_MAP[config.difficulty];
  const count = Math.min(config.questionCount, songs.length);
  // 曲库 < 题数：取 min 不报错（plan-002 契约）
  const needOptions = Math.min(spec.optionCount, songs.length);

  const picked = shuffle([...songs], rng).slice(0, count);
  return picked.map((answer, i) => {
    const others = songs.filter((s) => s.id !== answer.id);
    const sameType = shuffle(others.filter((s) => s.type === answer.type), rng);
    const rest = shuffle(others.filter((s) => s.type !== answer.type), rng);
    const options = [answer.id, ...[...sameType, ...rest].slice(0, needOptions - 1).map((s) => s.id)];
    return {
      id: `q${i + 1}`,
      mode: 'intro' as const,
      answerSongId: answer.id,
      optionSongIds: shuffle(options, rng),
      segmentKey: spec.segmentKey,
    };
  });
}

/** 判定：单选，选中即答案才正确 */
export function judge(question: Question, selectedId: string): boolean {
  return selectedId === question.answerSongId;
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

/** 用时格式化：X分SS秒 / SS秒 */
export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}分${sec.toString().padStart(2, '0')}秒` : `${sec}秒`;
}

/** 每局种子：URL ?seed= 优先（复现 bug 用），否则随机 */
export function resolveSeed(): number {
  const fromUrl = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('seed') : null;
  if (fromUrl !== null && /^[0-9]+$/.test(fromUrl)) return Number(fromUrl);
  return Math.floor(Math.random() * 2 ** 31);
}

export { mulberry32, shuffle, type Rng };
