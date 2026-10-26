import type { Difficulty, QuizMode, QuizSummary } from './quiz.ts';

export function bestStorageKey(mode: QuizMode, difficulty: Difficulty): string {
  // 片段、歌词和混合规则已变更，使用 v2；倒放规则保持兼容旧成绩。
  return mode === 'reverse' ? `best:${mode}:${difficulty}` : `best:v2:${mode}:${difficulty}`;
}

function parseStoredSummary(raw: unknown, expectedTotal?: number): QuizSummary | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as QuizSummary;
  if (
    !Number.isInteger(candidate.correct) ||
    !Number.isInteger(candidate.total) ||
    candidate.total < 1 ||
    (expectedTotal !== undefined && candidate.total !== expectedTotal) ||
    candidate.correct < 0 ||
    candidate.correct > candidate.total ||
    !Number.isFinite(candidate.elapsedMs) ||
    candidate.elapsedMs < 0
  ) {
    return null;
  }
  return { correct: candidate.correct, total: candidate.total, elapsedMs: candidate.elapsedMs };
}

export function isBetterScore(candidate: QuizSummary, previous: QuizSummary | null): boolean {
  return previous === null || candidate.correct > previous.correct
    || (candidate.correct === previous.correct && candidate.elapsedMs < previous.elapsedMs);
}

/** 零副作用读取本机最佳成绩（首页徽章展示用）。 */
export function loadBest(mode: QuizMode, difficulty: Difficulty, expectedTotal = 10): QuizSummary | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const item = localStorage.getItem(bestStorageKey(mode, difficulty));
    if (!item) return null;
    return parseStoredSummary(JSON.parse(item), expectedTotal);
  } catch {
    return null;
  }
}

export function saveBest(
  mode: QuizMode,
  difficulty: Difficulty,
  score: QuizSummary,
): { best: QuizSummary; saved: boolean; isNewRecord: boolean } {
  try {
    const key = bestStorageKey(mode, difficulty);
    const raw: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    const previous = parseStoredSummary(raw, score.total);
    const isNewRecord = isBetterScore(score, previous);
    const best = isNewRecord ? score : previous!;
    localStorage.setItem(key, JSON.stringify(best));
    return { best, saved: true, isNewRecord };
  } catch {
    return { best: score, saved: false, isNewRecord: false };
  }
}
