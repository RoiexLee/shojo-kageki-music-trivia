import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuizPage, resolveAudioSources } from './QuizPage.tsx';
import type { MixQuestion, QuestionResult } from '../core/quiz.ts';

const question: MixQuestion = {
  id: 'q1',
  mode: 'mix',
  answerSongIds: ['a', 'b'],
  optionSongIds: ['a', 'b', 'c', 'd'],
  clips: [
    { songId: 'a', segmentKey: 'clip-10' },
    { songId: 'b', segmentKey: 'clip-10' },
  ],
};
const songById = new Map(
  ['a', 'b', 'c', 'd'].map((id) => [
    id,
    { id, title: `歌曲${id}`, type: 'OP', origin: '动画', romaji: `Romaji ${id}`, description: `曲评${id}` },
  ]),
);
const entries = new Map(
  ['a', 'b'].map((id) => [id, { coverPath: `covers/${id}.jpg`, segments: { 'clip-10': { path: `audio/${id}/clip-10.mp3` } } } as any]),
);

function render(selectedIds: string[], failedCount = 0, isPlaying = false, entryById = entries, results: QuestionResult[] = []) {
  return renderToStaticMarkup(
    <QuizPage
      question={question}
      questions={[question]}
      index={0}
      answered
      selectedIds={selectedIds}
      score={0}
      difficulty="easy"
      results={results}
      songById={songById}
      entryById={entryById}
      onSelect={vi.fn()}
      onConfirm={vi.fn()}
      onNext={vi.fn()}
      onExit={vi.fn()}
      audio={{
        isPlaying,
        isPaused: false,
        needsGesture: false,
        queueIndex: 0,
        failedCount,
        replay: vi.fn(),
        resumeFromGesture: vi.fn(),
        play: vi.fn(),
        playQueue: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        sampleFrequency: vi.fn(() => false),
        getPlaybackProgress: vi.fn(() => ({ elapsedSec: 0, durationSec: 10 })),
      }}
    />,
  );
}

describe('答题页判定与音频反馈', () => {
  it('选满但含干扰项时，显示错误与完整答案，不误报答对', () => {
    const html = render(['a', 'c']);
    expect(html).toContain('选错了。答案：歌曲a、歌曲b');
    expect(html).not.toContain('答对了！');
    expect(html).toContain('0 分');
    expect(html).toContain('AUDITION RECORD · 正确曲目档案');
  });

  it('答案集合正确才显示答对，并展示 POSITION ZERO 揭晓卡与连击徽章', () => {
    const html = render(['b', 'a'], 0, false, entries, [
      { questionId: 'q0', correct: true, elapsedMs: 1200 },
      { questionId: 'q1', correct: true, elapsedMs: 1500 },
    ]);
    expect(html).toContain('答对了！');
    expect(html).toContain('POSITION ZERO · 完美命中');
    expect(html).toContain('2 连击');
  });

  it('坏片段有失败提示和重试入口，且选项卡片含封面、曲名与专辑出处，不含 A/B 字母角标', () => {
    const html = render(['a', 'c'], 1);
    expect(html).toContain('1 段音频加载失败');
    expect(html).toContain('重新加载并播放');
    expect(html).toContain('从头重放');
    expect(html).toContain('blade-option-cover');
    expect(html).not.toContain('blade-letter-crest');
    expect(html).not.toContain('已暂停，点击继续');
  });

  it('歌词题同时显示日文主歌词与中文辅助歌词，并在揭晓后定位该句歌词附近的原曲窗口', () => {
    const lyricsQuestion = {
      id: 'q2',
      mode: 'lyrics' as const,
      answerSongId: 'a',
      optionSongIds: ['a', 'b', 'c'],
      lyricText: '在塔顶上伸出手将那颗星抓住的人',
      originalLyricText: 'あの星を掴むのはだあれ?',
      lyricTimeMs: 13000,
      clipStartSec: 12.5,
      clipDurationSec: 6.5,
    };
    const resolvedBefore = resolveAudioSources(lyricsQuestion, false, entries);
    expect(resolvedBefore.paths).toEqual([]);
    const resolvedAfter = resolveAudioSources(lyricsQuestion, true, entries);
    expect(resolvedAfter.paths).toEqual(['/assets/audio/a/full.mp3']);
    expect(resolvedAfter.window).toEqual({ startSec: 12.5, durationSec: 6.5 });
  });

  it('混合题缺任一音源时返回空列表，不会静默只播放剩余轨道', () => {
    const resolved = resolveAudioSources(
      question,
      true,
      new Map([['a', { segments: { 'clip-10': { path: 'audio/a/clip-10.mp3' } } } as any]]),
    );
    expect(resolved.missing).toBe(true);
    expect(resolved.paths).toEqual([]);
    const html = render(['a', 'c'], 0, false, new Map());
    expect(html).toContain('本题音频资源不完整');
    expect(html).toContain('返回首页重试');
  });
});
