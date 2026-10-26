import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAudioQueue, type AudioState } from './audioQueue.ts';

function setup(errors: (Error | undefined)[] = []) {
  const elements: HTMLAudioElement[] = [];
  let state: AudioState;
  const player = createAudioQueue(() => {
    const failure = errors[elements.length];
    const audio = {
      src: '', onplay: null, onpause: null, onended: null, onerror: null,
      play: vi.fn(() => failure ? Promise.reject(failure) : Promise.resolve()),
      pause: vi.fn(), load: vi.fn(), removeAttribute: vi.fn(),
    } as unknown as HTMLAudioElement;
    elements.push(audio);
    return audio;
  }, (next) => { state = next; });
  return { player, elements, state: () => state };
}

afterEach(() => vi.useRealTimers());

describe('连播生命周期', () => {
  it('结束后间隔 500ms，重放从第一首开始', () => {
    vi.useFakeTimers();
    const { player, elements, state } = setup();
    player.playQueue(['a.mp3', 'b.mp3']);
    elements[0].onended?.(new Event('ended'));
    vi.advanceTimersByTime(499);
    expect(elements).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(elements[1].src).toBe('b.mp3');
    expect(state().queueIndex).toBe(1);
    player.replay();
    expect(elements[2].src).toBe('a.mp3');
    expect(state().queueIndex).toBe(0);
  });

  it('退出取消间隔定时器，旧事件和旧 play 拒绝不能推进新队列', async () => {
    vi.useFakeTimers();
    const { player, elements, state } = setup([new Error('bad source')]);
    player.playQueue(['a.mp3', 'b.mp3']);
    const oldEnded = elements[0].onended;
    player.playQueue(['new.mp3', 'never.mp3']);
    oldEnded?.call(elements[0], new Event('ended'));
    await Promise.resolve();
    vi.runAllTimers();
    expect(elements).toHaveLength(2);
    expect(state().failedCount).toBe(0);
    elements[1].onended?.(new Event('ended'));
    player.stop();
    vi.runAllTimers();
    expect(elements).toHaveLength(2);
    expect(state().isPlaying).toBe(false);
  });

  it('媒体失败只计一次并跳过，自动播放受阻保留当前片段等待手势', async () => {
    vi.useFakeTimers();
    const denied = new Error('gesture'); denied.name = 'NotAllowedError';
    const { player, elements, state } = setup([new Error('decode'), denied]);
    player.playQueue(['bad.mp3', 'good.mp3']);
    elements[0].onerror?.(new Event('error'));
    await Promise.resolve();
    vi.advanceTimersByTime(500);
    await Promise.resolve();
    expect(state()).toMatchObject({ failedCount: 1, queueIndex: 1, needsGesture: true });
    player.resumeFromGesture();
    expect(elements[2].src).toBe('good.mp3');
    elements[2].onplay?.(new Event('play'));
    expect(state()).toMatchObject({ isPlaying: true, needsGesture: false });
    player.dispose();
    expect(elements[2].pause).toHaveBeenCalled();
  });
});
