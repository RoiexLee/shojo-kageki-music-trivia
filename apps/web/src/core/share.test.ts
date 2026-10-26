import { expect, it } from 'vitest';
import { shareText } from './share.ts';

it('分享成绩包含可复现模式、难度、成绩、用时与种子', () => {
  expect(shareText({ mode: 'mix', difficulty: 'hard', seed: 42, questionCount: 10 }, { correct: 7, total: 10, elapsedMs: 83000 }))
    .toBe('少女☆歌剧 · 舞台猜歌\n混合连猜 · 困难\n答对 7 / 10 题 · 用时 1 分 23 秒\n种子 42\n非官方粉丝作品 · 仅限本地学习');
});
