import { DIFFICULTY_LABEL, MODE_LABEL, formatTime, type QuizConfig, type QuizSummary } from './quiz.ts';

export function shareText(config: QuizConfig, score: QuizSummary): string {
  return ['少女☆歌剧 · 舞台猜歌', `${MODE_LABEL[config.mode]} · ${DIFFICULTY_LABEL[config.difficulty]}`,
    `答对 ${score.correct} / ${score.total} 题 · 用时 ${formatTime(score.elapsedMs)}`,
    `种子 ${config.seed}`, '非官方粉丝作品 · 仅限本地学习'].join('\n');
}
