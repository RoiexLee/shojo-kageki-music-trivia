export interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  needsGesture: boolean;
  queueIndex: number;
  failedCount: number;
}

export interface PlaybackProgress {
  elapsedSec: number;
  durationSec: number;
}

export const initialAudioState: AudioState = {
  isPlaying: false, isPaused: false, needsGesture: false, queueIndex: 0, failedCount: 0,
};

type ContextLike = AudioContext;

/** Web Audio 播放器：所有轨道先 fetch/decode，成功后用同一个 currentTime 排程，可选挂载 AnalyserNode。 */
export function createAudioQueue(
  _legacyCreateAudio: () => HTMLAudioElement,
  onChange: (state: AudioState) => void,
  createContext: () => ContextLike = () => new AudioContext(),
) {
  let state = { ...initialAudioState };
  let context: ContextLike | null = null;
  let analyser: AnalyserNode | null = null;
  let sources: string[] = [];
  let buffers: AudioBuffer[] | null = null;
  let active: AudioBufferSourceNode[] = [];
  let controller: AbortController | null = null;
  let revision = 0;
  let ended = 0;
  let startedAt = 0;
  let offset = 0;
  let duration = 0;

  function update(patch: Partial<AudioState>) {
    state = { ...state, ...patch };
    onChange(state);
  }

  function ensureContext() {
    if (!context) {
      context = createContext();
      if (typeof (context as Partial<AudioContext>).createAnalyser === 'function') {
        try {
          analyser = context.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.78;
        } catch {
          analyser = null;
        }
      }
    }
    return context;
  }

  function stopActive() {
    for (const source of active) {
      source.onended = null;
      try { source.stop(); } catch { /* 已结束的 BufferSource 不能再次 stop。 */ }
    }
    active = [];
  }

  function cancel() {
    revision++;
    controller?.abort();
    controller = null;
    stopActive();
    buffers = null;
    ended = 0;
    offset = 0;
    duration = 0;
  }

  function startBuffers(decoded: AudioBuffer[], ticket: number, fromOffset = 0) {
    const ctx = ensureContext();
    if (ticket !== revision || ctx.state !== 'running') return;
    stopActive();
    const when = ctx.currentTime + 0.03;
    const gain = 1 / Math.max(1, decoded.length);
    ended = 0;
    duration = Math.max(...decoded.map((buffer) => buffer.duration));
    offset = Math.max(0, Math.min(fromOffset, duration));
    startedAt = when - offset;
    active = decoded.map((buffer) => {
      const source = ctx.createBufferSource();
      const nodeGain = ctx.createGain();
      source.buffer = buffer;
      nodeGain.gain.value = gain;
      source.connect(nodeGain);
      nodeGain.connect(ctx.destination);
      if (analyser) {
        try { nodeGain.connect(analyser); } catch { /* 忽略非标准上下文 */ }
      }
      source.onended = () => {
        if (ticket !== revision) return;
        ended++;
        if (ended >= decoded.length) {
          active = [];
          offset = 0;
          update({ isPlaying: false, isPaused: false, needsGesture: false });
        }
      };
      source.start(when, offset);
      return source;
    });
    update({ isPlaying: true, isPaused: false, needsGesture: false });
  }

  async function loadAndPrepare(ticket: number) {
    const ctx = ensureContext();
    try {
      const decoded = await Promise.all(sources.map(async (src) => {
        const response = await fetch(src, { signal: controller?.signal });
        if (!response.ok) throw new Error(`音频加载失败（${response.status}）`);
        return ctx.decodeAudioData(await response.arrayBuffer());
      }));
      if (ticket !== revision) return;
      buffers = decoded;
      duration = Math.max(...decoded.map((buffer) => buffer.duration));
      if (ctx.state === 'running') startBuffers(decoded, ticket);
      else update({ needsGesture: true });
    } catch (error) {
      if (ticket !== revision || (error instanceof DOMException && error.name === 'AbortError')) return;
      buffers = null;
      update({ isPlaying: false, isPaused: false, needsGesture: false, failedCount: sources.length });
    }
  }

  function playQueue(srcs: string[], _gapMs = 500) {
    cancel();
    sources = [...srcs];
    update({ ...initialAudioState });
    if (!sources.length) return;
    const ctx = ensureContext();
    controller = new AbortController();
    const ticket = revision;
    if (ctx.state === 'suspended') update({ needsGesture: true });
    void loadAndPrepare(ticket);
  }

  function resumeFromGesture() {
    const ctx = ensureContext();
    const ticket = revision;
    // 必须在点击事件调用链内直接发起 resume；不等待 fetch/decode 完成。
    void ctx.resume().then(() => {
      if (ticket !== revision) return;
      if (buffers && sources.length) startBuffers(buffers, ticket, state.isPaused ? offset : 0);
    }).catch(() => { if (ticket === revision) update({ needsGesture: true }); });
  }

  function pause() {
    const ctx = context;
    if (!ctx || !state.isPlaying) return;
    offset = Math.max(0, Math.min(duration, ctx.currentTime - startedAt));
    stopActive();
    update({ isPlaying: false, isPaused: true });
    void ctx.suspend().catch(() => undefined);
  }

  function resume() {
    const ctx = context;
    if (!ctx || !state.isPaused || !buffers) return;
    const ticket = revision;
    if (ctx.state === 'suspended') {
      // 继续按钮本身属于用户手势，直接在调用链里恢复上下文。
      void ctx.resume().then(() => {
        if (ticket !== revision || !buffers) return;
        startBuffers(buffers, ticket, offset);
      }).catch(() => { if (ticket === revision) update({ needsGesture: true }); });
      return;
    }
    startBuffers(buffers, ticket, offset);
  }

  function sampleFrequency(target: Uint8Array<ArrayBuffer>): boolean {
    if (!state.isPlaying || !analyser) return false;
    try {
      analyser.getByteFrequencyData(target);
      return true;
    } catch {
      return false;
    }
  }

  function getPlaybackProgress(): PlaybackProgress {
    if (state.isPlaying && context && duration > 0) {
      const elapsedSec = Math.max(0, Math.min(duration, context.currentTime - startedAt));
      return { elapsedSec, durationSec: duration };
    }
    if (state.isPaused && duration > 0) {
      return { elapsedSec: offset, durationSec: duration };
    }
    return { elapsedSec: 0, durationSec: duration };
  }

  return {
    playQueue,
    play: (src: string) => playQueue([src]),
    replay: () => playQueue(sources),
    pause,
    resume,
    resumeFromGesture,
    sampleFrequency,
    getPlaybackProgress,
    stop: () => { cancel(); update({ isPlaying: false, isPaused: false, needsGesture: false }); },
    dispose: () => { cancel(); analyser = null; void context?.close().catch(() => undefined); context = null; },
  };
}
