import type { Difficulty, QuizMode, QuizSummary } from './quiz.ts';

export function isBetterScore(candidate: QuizSummary, previous: QuizSummary | null): boolean {
  return previous === null || candidate.correct > previous.correct
    || (candidate.correct === previous.correct && candidate.elapsedMs < previous.elapsedMs);
}

export function saveBest(mode: QuizMode, difficulty: Difficulty, score: QuizSummary): { best: QuizSummary; saved: boolean } {
  try {
    // 片段、歌词和混合规则已变更，使用 v2；倒放规则保持兼容旧成绩。
    const key = mode === 'reverse' ? `best:${mode}:${difficulty}` : `best:v2:${mode}:${difficulty}`;
    const raw: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    let previous: QuizSummary | null = null;
    if (typeof raw === 'object' && raw !== null) {
      const candidate = raw as QuizSummary;
      if (Number.isInteger(candidate.correct) && Number.isInteger(candidate.total)
        && candidate.total === score.total && candidate.correct >= 0 && candidate.correct <= candidate.total
        && Number.isFinite(candidate.elapsedMs) && candidate.elapsedMs >= 0) previous = candidate;
    }
    const best = isBetterScore(score, previous) ? score : previous!;
    localStorage.setItem(key, JSON.stringify(best));
    return { best, saved: true };
  } catch {
    return { best: score, saved: false };
  }
}
