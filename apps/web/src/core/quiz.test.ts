import { describe, it, expect } from 'vitest';
import {
  buildQuiz,
  judge,
  summarize,
  formatTime,
  DIFFICULTY_MAP,
  mulberry32,
  shuffle,
  type Song,
} from './quiz.ts';

/** fixture：>10 首（真实曲库恰 10 首会退化为全量洗牌，测不出抽样/去重） */
function makeSongs(n: number): Song[] {
  const types = ['OP', '主題歌', 'シングル表題曲', 'キャラソン'];
  return Array.from({ length: n }, (_, i) => ({
    id: `song-${i + 1}`,
    title: `Song ${i + 1}`,
    type: types[i % types.length],
    origin: `origin-${i % 5}`,
  }));
}

describe('mulberry32 / shuffle', () => {
  it('同种子同序列，不同种子不同序列', () => {
    const a = Array.from({ length: 5 }, mulberry32(42));
    const b = Array.from({ length: 5 }, mulberry32(42));
    const c = Array.from({ length: 5 }, mulberry32(43));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
  it('shuffle 是排列（元素不增不减）且同种子可复现', () => {
    const src = makeSongs(15);
    const s1 = shuffle([...src], mulberry32(7));
    const s2 = shuffle([...src], mulberry32(7));
    expect(s1).toEqual(s2);
    expect([...s1].sort((x, y) => x.id.localeCompare(y.id))).toEqual([...src].sort((x, y) => x.id.localeCompare(y.id)));
  });
});

describe('buildQuiz', () => {
  it('同种子同卷面；不同种子不同卷面（15 首 fixture）', () => {
    const songs = makeSongs(15);
    const cfg = { mode: 'intro' as const, difficulty: 'normal' as const, questionCount: 10, seed: 123 };
    const q1 = buildQuiz(songs, cfg);
    const q2 = buildQuiz(songs, cfg);
    const q3 = buildQuiz(songs, { ...cfg, seed: 124 });
    expect(q1).toEqual(q2);
    expect(q1).not.toEqual(q3);
  });

  it('题目不重复（answer 唯一）、数量正确', () => {
    const songs = makeSongs(15);
    const qs = buildQuiz(songs, { mode: 'intro', difficulty: 'normal', questionCount: 10, seed: 1 });
    expect(qs).toHaveLength(10);
    const ids = qs.map((q) => q.answerSongId);
    expect(new Set(ids).size).toBe(10);
  });

  it('曲库 < 题数时取 min 不报错', () => {
    const songs = makeSongs(6);
    const qs = buildQuiz(songs, { mode: 'intro', difficulty: 'easy', questionCount: 10, seed: 1 });
    expect(qs).toHaveLength(6);
  });

  it('干扰项不含正确项；选项数符合难度（3/4/6）', () => {
    const songs = makeSongs(15);
    for (const d of ['easy', 'normal', 'hard'] as const) {
      const qs = buildQuiz(songs, { mode: 'intro', difficulty: d, questionCount: 10, seed: 99 });
      for (const q of qs) {
        expect(new Set(q.optionSongIds).size).toBe(q.optionSongIds.length);
        expect(q.optionSongIds).toContain(q.answerSongId);
        expect(q.optionSongIds).toHaveLength(Math.min(DIFFICULTY_MAP[d].optionCount, songs.length));
      }
    }
  });

  it('干扰项优先同 type：构造 5+ 同 type 时干扰项全为同 type', () => {
    const sameType: Song[] = Array.from({ length: 8 }, (_, i) => ({
      id: `op-${i}`, title: `OP ${i}`, type: 'OP', origin: 'x',
    }));
    const others: Song[] = Array.from({ length: 8 }, (_, i) => ({
      id: `other-${i}`, title: `Other ${i}`, type: 'キャラソン', origin: 'y',
    }));
    const songs = [...sameType, ...others];
    const qs = buildQuiz(songs, { mode: 'intro', difficulty: 'normal', questionCount: 8, seed: 5 });
    for (const q of qs) {
      const answer = songs.find((s) => s.id === q.answerSongId)!;
      if (answer.type === 'OP') {
        const distractors = q.optionSongIds.filter((id) => id !== q.answerSongId);
        for (const id of distractors) {
          expect(songs.find((s) => s.id === id)!.type).toBe('OP');
        }
      }
    }
  });

  it('随机补齐可复现：同种子下不足同 type 的题目补齐结果一致', () => {
    const songs = makeSongs(12);
    const cfg = { mode: 'intro' as const, difficulty: 'hard' as const, questionCount: 10, seed: 777 };
    expect(buildQuiz(songs, cfg)).toEqual(buildQuiz(songs, cfg));
  });

  it('难度 → 片段映射（intro-15/10/5）', () => {
    const songs = makeSongs(12);
    const pick = (d: 'easy' | 'normal' | 'hard') =>
      buildQuiz(songs, { mode: 'intro', difficulty: d, questionCount: 5, seed: 3 })[0].segmentKey;
    expect(pick('easy')).toBe('intro-15');
    expect(pick('normal')).toBe('intro-10');
    expect(pick('hard')).toBe('intro-5');
  });
});

describe('judge / summarize / formatTime', () => {
  const q = { id: 'q1', mode: 'intro' as const, answerSongId: 'a', optionSongIds: ['a', 'b'], segmentKey: 'intro-10' as const };
  it('judge：单选，仅正确 id 判对', () => {
    expect(judge(q, 'a')).toBe(true);
    expect(judge(q, 'b')).toBe(false);
    expect(judge(q, '')).toBe(false);
  });
  it('summarize：计数与用时聚合', () => {
    const s = summarize([
      { questionId: 'q1', correct: true, elapsedMs: 1500 },
      { questionId: 'q2', correct: false, elapsedMs: 2500 },
    ]);
    expect(s).toEqual({ correct: 1, total: 2, elapsedMs: 4000 });
    expect(summarize([])).toEqual({ correct: 0, total: 0, elapsedMs: 0 });
  });
  it('formatTime：秒 / 分秒补零', () => {
    expect(formatTime(45_000)).toBe('45秒');
    expect(formatTime(83_000)).toBe('1分23秒');
    expect(formatTime(0)).toBe('0秒');
  });
});
