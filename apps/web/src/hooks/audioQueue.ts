export interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  needsGesture: boolean;
  queueIndex: number;
  failedCount: number;
}

export const initialAudioState: AudioState = { isPlaying: false, isPaused: false, needsGesture: false, queueIndex: 0, failedCount: 0 };

/** 独立于 React，以便验证播放 promise、媒体事件与换题取消的竞态。 */
export function createAudioQueue(createAudio: () => HTMLAudioElement, onChange: (state: AudioState) => void) {
  let state = { ...initialAudioState };
  let audio: HTMLAudioElement | null = null;
  let sources: string[] = [];
  let gap = 500;
  let revision = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function update(patch: Partial<AudioState>) {
    state = { ...state, ...patch };
    onChange(state);
  }

  function cancel() {
    revision++;
    clearTimeout(timer);
    if (audio) {
      audio.onended = audio.onerror = audio.onplay = audio.onpause = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio = null;
    }
  }

  function startClip(index: number) {
    cancel();
    const ticket = revision;
    update({ queueIndex: index, isPlaying: false, isPaused: false, needsGesture: false });
    if (!sources[index]) return;
    const current = createAudio();
    audio = current;
    current.preload = 'auto';
    current.src = sources[index];

    const advance = (failed: boolean) => {
      if (revision !== ticket) return;
      cancel();
      update({ isPlaying: false, needsGesture: false, failedCount: state.failedCount + Number(failed) });
      if (index + 1 < sources.length) timer = setTimeout(() => startClip(index + 1), gap);
    };
    current.onplay = () => { if (revision === ticket) update({ isPlaying: true, isPaused: false, needsGesture: false }); };
    current.onpause = () => { if (revision === ticket) update({ isPlaying: false }); };
    current.onended = () => advance(false);
    current.onerror = () => advance(true);
    const tryPlay = () => current.play().catch((error: unknown) => {
      if (revision !== ticket) return;
      if (error instanceof Error && error.name === 'NotAllowedError') update({ isPlaying: false, needsGesture: true });
      else if (!(error instanceof Error && error.name === 'AbortError')) advance(true);
    });
    resumeCurrent = tryPlay;
    void tryPlay();
  }

  let resumeCurrent: (() => Promise<void>) | undefined;

  function playQueue(srcs: string[], gapMs = 500) {
    cancel();
    sources = [...srcs];
    gap = Math.max(0, gapMs);
    update({ ...initialAudioState });
    if (sources.length) startClip(0);
  }

  return {
    playQueue,
    play: (src: string) => playQueue([src]),
    replay: () => playQueue(sources, gap),
    pause: () => { if (audio) { audio.pause(); update({ isPlaying: false, isPaused: true }); } },
    resume: () => { if (audio && state.isPaused) void resumeCurrent?.(); },
    resumeFromGesture: () => { if (sources.length) startClip(state.queueIndex); },
    stop: () => { cancel(); update({ isPlaying: false, isPaused: false, needsGesture: false }); },
    dispose: cancel,
  };
}
