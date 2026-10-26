import { describe, expect, it, vi } from 'vitest';
import { saveBest } from './best.ts';

describe('最佳成绩', () => {
  it('按模式与难度隔离，只接受更高分或同分更快', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    expect(saveBest('intro', 'easy', { correct: 5, total: 10, elapsedMs: 100 })).toMatchObject({ saved: true });
    expect(saveBest('intro', 'easy', { correct: 4, total: 10, elapsedMs: 1 }).best.correct).toBe(5);
    expect(saveBest('intro', 'easy', { correct: 5, total: 10, elapsedMs: 90 }).best.elapsedMs).toBe(90);
    expect(saveBest('lyrics', 'easy', { correct: 1, total: 10, elapsedMs: 1 }).best.correct).toBe(1);
    storage.set('best:intro:easy', JSON.stringify({ correct: 10, total: 10, elapsedMs: 1 }));
    expect(saveBest('intro', 'easy', { correct: 0, total: 10, elapsedMs: 999 }).best.correct).toBe(5);
    expect(storage.has('best:v2:intro:easy')).toBe(true);
    storage.set('best:reverse:easy', JSON.stringify({ correct: 8, total: 10, elapsedMs: 1 }));
    expect(saveBest('reverse', 'easy', { correct: 2, total: 10, elapsedMs: 999 }).best.correct).toBe(8);
    vi.unstubAllGlobals();
  });

  it('localStorage 损坏时返回本局成绩而不中断', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{bad', setItem: () => { throw new Error('denied'); } });
    expect(saveBest('mix', 'hard', { correct: 2, total: 10, elapsedMs: 30 })).toEqual({
      best: { correct: 2, total: 10, elapsedMs: 30 }, saved: false,
    });
    vi.unstubAllGlobals();
  });
});
