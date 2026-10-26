import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuizPage, resolveAudioSources } from './QuizPage.tsx';
import type { MixQuestion } from '../core/quiz.ts';

const question: MixQuestion = {
  id: 'q1', mode: 'mix', answerSongIds: ['a', 'b'], optionSongIds: ['a', 'b', 'c', 'd'],
  clips: [{ songId: 'a', segmentKey: 'clip-10' }, { songId: 'b', segmentKey: 'clip-10' }],
};
const songById = new Map(['a', 'b', 'c', 'd'].map((id) => [id, { id, title: `歌曲${id}`, type: 'OP', origin: '动画' }]));
const entries = new Map(['a', 'b'].map((id) => [id, { segments: { 'clip-10': { path: `audio/${id}/clip-10.mp3` } } } as any]));

function render(selectedIds: string[], failedCount = 0, isPlaying = false, entryById = entries) {
  return renderToStaticMarkup(<QuizPage question={question} questions={[question]} index={0} answered selectedIds={selectedIds}
    score={0} difficulty="easy" songById={songById} entryById={entryById}
    onSelect={vi.fn()} onConfirm={vi.fn()} onNext={vi.fn()} onExit={vi.fn()}
    audio={{ isPlaying, isPaused: false, needsGesture: false, queueIndex: 0, failedCount, replay: vi.fn(), resumeFromGesture: vi.fn(), play: vi.fn(), playQueue: vi.fn(), stop: vi.fn(), pause: vi.fn(), resume: vi.fn() }} />);
}

describe('答题页判定与音频反馈', () => {
  it('选满但含干扰项时，显示错误与完整答案，不误报答对', () => {
    const html = render(['a', 'c']);
    expect(html).toContain('选错了。答案：歌曲a、歌曲b');
    expect(html).not.toContain('答对了！');
    expect(html).toContain('0 分');
  });

  it('答案集合正确才显示答对', () => {
    expect(render(['b', 'a'])).toContain('答对了！');
  });

  it('坏片段有失败提示和重试入口，不播放时不宣称正在播放', () => {
    const html = render(['a', 'c'], 1);
    expect(html).toContain('1 段音频加载失败');
    expect(html).toContain('重新加载并播放');
    expect(html).toContain('暂未播放，可重放');
    expect(html).not.toContain('正在播放');
    expect(render(['a', 'c'], 0, true)).toContain('两首歌曲正在同步混合');
  });

  it('混合题缺任一音源时返回空列表，不会静默只播放剩余轨道', () => {
    const resolved = resolveAudioSources(question, true, new Map([['a', { segments: { 'clip-10': { path: 'audio/a/clip-10.mp3' } } } as any]]));
    expect(resolved.missing).toBe(true);
    expect(resolved.paths).toEqual([]);
    const html = render(['a', 'c'], 0, false, new Map());
    expect(html).toContain('本题音频资源不完整');
    expect(html).toContain('返回首页重试');
  });
});
