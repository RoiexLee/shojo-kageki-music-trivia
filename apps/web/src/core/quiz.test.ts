import { describe, it, expect } from 'vitest';
import {
  buildQuiz,
  judge,
  summarize,
  formatTime,
  DIFFICULTY_MAP,
  MODE_DIFFICULTY_MAP,
  lyricCandidates,
  toggleSelection,
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

describe('plan-003 模式矩阵与判定', () => {
  const songs = makeSongs(12);
  const lyrics = Object.fromEntries(songs.map((song) => [song.id, {
    id: song.id,
    lineCount: 2,
    lines: [{ timeMs: 0, text: `${song.title} 的长歌词片段` }, { timeMs: 1000, text: '星光照亮舞台上的歌声' }],
  }]));

  it('四模式三难度都有完整规格', () => {
    for (const mode of ['intro', 'lyrics', 'reverse', 'mix'] as const) {
      for (const difficulty of ['easy', 'normal', 'hard'] as const) {
        const spec = MODE_DIFFICULTY_MAP[mode][difficulty];
        expect(spec.optionCount).toBeGreaterThanOrEqual(spec.answerCount);
        const questions = buildQuiz(songs, { mode, difficulty, questionCount: 2, seed: 8 }, lyrics);
        expect(questions).toHaveLength(2);
        expect(questions[0].optionSongIds).toHaveLength(spec.optionCount);
      }
    }
  });

  it('歌词抽行去除短行、标题泄露与重复文本', () => {
    const song = { id: 'x', title: 'Star Divine', type: 'OP', origin: 'x' };
    expect(lyricCandidates(song, [
      { timeMs: 0, text: '哈' },
      { timeMs: 1, text: 'Star Divine 这是标题' },
      { timeMs: 2, text: '可以留下的完整歌词' },
      { timeMs: 3, text: '可以留下的完整歌词' },
    ])).toEqual([{ timeMs: 2, text: '可以留下的完整歌词' }]);
  });

  it('mix 只有答案集合完全相等才判对，toggle 可取消且不超选', () => {
    const question = buildQuiz(songs, { mode: 'mix', difficulty: 'easy', questionCount: 1, seed: 5 }, lyrics)[0];
    expect(question.mode).toBe('mix');
    if (question.mode !== 'mix') return;
    const [first, second] = question.answerSongIds;
    const distractor = question.optionSongIds.find((id) => !question.answerSongIds.includes(id))!;
    expect(judge(question, question.answerSongIds)).toBe(true);
    expect(judge(question, [...question.answerSongIds].reverse())).toBe(true);
    expect(judge(question, [first, distractor])).toBe(false);
    expect(judge(question, [first, first])).toBe(false);
    expect(judge(question, question.answerSongIds.slice(0, 1))).toBe(false);
    expect(judge(question, [...question.answerSongIds, distractor])).toBe(false);
    expect(toggleSelection(question, [], first)).toEqual([first]);
    expect(toggleSelection(question, [first], first)).toEqual([]);
    expect(toggleSelection(question, [first], second)).toEqual([first, second]);
    expect(toggleSelection(question, [first, second], distractor)).toEqual([first, second]);
    expect(toggleSelection(question, [first], 'not-an-option')).toEqual([first]);
  });
});
