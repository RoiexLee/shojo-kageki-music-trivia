import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAudioQueue, type AudioState } from './audioQueue.ts';

function setup(initialState: AudioContextState = 'running') {
  const sources: Array<{ start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; onended: (() => void) | null }> = [];
  const gains: number[] = [];
  let currentTime = 10;
  let contextState = initialState;
  const context = {
    get state() { return contextState; },
    get currentTime() { return currentTime; },
    destination: {},
    createBufferSource: vi.fn(() => {
      const source = { buffer: null, onended: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn() } as any;
      sources.push(source);
      return source;
    }),
    createGain: vi.fn(() => ({ gain: { value: 0 }, connect: vi.fn() })),
    decodeAudioData: vi.fn(async () => ({ duration: 10 }) as AudioBuffer),
    resume: vi.fn(async () => { contextState = 'running'; }),
    suspend: vi.fn(async () => { contextState = 'suspended'; }),
    close: vi.fn(async () => { contextState = 'closed'; }),
  } as unknown as AudioContext;
  const fetchMock = vi.fn(async (url: string) => ({ ok: url !== 'bad.mp3', status: url === 'bad.mp3' ? 500 : 200, arrayBuffer: async () => new ArrayBuffer(4) }));
  vi.stubGlobal('fetch', fetchMock);
  const states: AudioState[] = [];
  const player = createAudioQueue(() => ({}) as HTMLAudioElement, (state) => states.push(state), () => context);
  return { player, context, sources, gains, states, fetchMock, setTime: (value: number) => { currentTime = value; } };
}

afterEach(() => vi.unstubAllGlobals());

describe('Web Audio 同步混音生命周期', () => {
  it('两轨都解码成功后同一时刻开始，增益按轨道数缩放', async () => {
    const { player, context, sources, states } = setup();
    (context.createGain as any).mockImplementation(() => ({ gain: { value: 0 }, connect: vi.fn() }));
    player.playQueue(['a.mp3', 'b.mp3']);
    await vi.waitFor(() => expect(sources).toHaveLength(2));
    expect(sources).toHaveLength(2);
    expect(sources[0].start).toHaveBeenCalledWith(10.03, 0);
    expect(sources[1].start).toHaveBeenCalledWith(10.03, 0);
    expect(states.at(-1)).toMatchObject({ isPlaying: true, failedCount: 0 });
    expect((context.createGain as any).mock.results[0].value.gain.value).toBe(.5);
    expect((context.createGain as any).mock.results[1].value.gain.value).toBe(.5);
  });

  it('任一轨失败则整组不创建 BufferSource，报告全部失败', async () => {
    const { player, sources, states } = setup();
    player.playQueue(['good.mp3', 'bad.mp3']);
    await vi.waitFor(() => expect(states.at(-1)?.failedCount).toBe(2));
    expect(sources).toHaveLength(0);
    expect(states.at(-1)).toMatchObject({ failedCount: 2, isPlaying: false });
  });

  it('suspended 立即显示手势需求，手势 resume 后统一开始', async () => {
    const { player, context, sources, states } = setup('suspended');
    player.playQueue(['a.mp3', 'b.mp3']);
    expect(states.at(-1)?.needsGesture).toBe(true);
    await vi.waitFor(() => expect(states.at(-1)?.needsGesture).toBe(true));
    expect(sources).toHaveLength(0);
    player.resumeFromGesture();
    await vi.waitFor(() => expect(sources).toHaveLength(2));
    expect(context.resume).toHaveBeenCalled();
    expect(sources).toHaveLength(2);
  });

  it('resume pending 时保留手势提示，停止后迟到 resolve 不得启动旧题', async () => {
    const { player, context, sources, states } = setup('suspended');
    let resolveResume!: () => void;
    context.resume = vi.fn(() => new Promise<void>((resolve) => { resolveResume = resolve; }));
    player.playQueue(['old.mp3']);
    await vi.waitFor(() => expect(states.at(-1)?.needsGesture).toBe(true));
    player.resumeFromGesture();
    expect(states.at(-1)?.needsGesture).toBe(true);
    player.stop();
    resolveResume();
    await Promise.resolve();
    expect(sources).toHaveLength(0);
    expect(states.at(-1)).toMatchObject({ isPlaying: false, needsGesture: false });
  });

  it('暂停记录共同偏移，恢复从同一偏移重建两轨，重放回到零', async () => {
    const { player, context, sources, setTime } = setup();
    player.playQueue(['a.mp3', 'b.mp3']);
    await vi.waitFor(() => expect(sources).toHaveLength(2));
    setTime(14);
    player.pause();
    expect(sources[0].stop).toHaveBeenCalled();
    await vi.waitFor(() => expect(context.state).toBe('suspended'));
    player.resume();
    await vi.waitFor(() => expect(sources).toHaveLength(4));
    expect(sources[2].start.mock.calls[0][0]).toBeCloseTo(14.03, 5);
    expect(sources[2].start.mock.calls[0][1]).toBeCloseTo(3.97, 5);
    player.replay();
    await vi.waitFor(() => expect(sources).toHaveLength(6));
    expect(sources[4].start).toHaveBeenCalledWith(14.03, 0);
  });

  it('支持进度读取与可选 AnalyserNode 频谱采样，无 createAnalyser 时安全降级', async () => {
    const { player, sources, setTime } = setup();
    const buf = new Uint8Array(16);
    expect(player.sampleFrequency(buf)).toBe(false);
    player.playQueue(['a.mp3']);
    await vi.waitFor(() => expect(sources).toHaveLength(1));
    setTime(13.53);
    const progress = player.getPlaybackProgress();
    expect(progress.durationSec).toBe(10);
    expect(progress.elapsedSec).toBeCloseTo(3.5, 2);
  });

  it('旧 fetch 解码完成不能越题启动，失败请求支持取消', async () => {
    let resolveFirst!: (value: Response) => void;
    const first = new Promise<Response>((resolve) => { resolveFirst = resolve; });
    const fetchMock = vi.fn((url: string) => url === 'old.mp3' ? first : Promise.resolve({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(2) } as Response));
    vi.stubGlobal('fetch', fetchMock);
    const { player, sources } = setup();
    vi.stubGlobal('fetch', fetchMock);
    player.playQueue(['old.mp3']);
    player.playQueue(['new.mp3']);
    await Promise.resolve(); await Promise.resolve();
    resolveFirst({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(2) } as Response);
    await Promise.resolve();
    expect(sources.every((source) => source.start.mock.calls.length === 0 || source.start.mock.calls[0][0] === 10.03)).toBe(true);
  });
});
