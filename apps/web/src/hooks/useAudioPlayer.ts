import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioQueue, initialAudioState, type PlaybackProgress } from './audioQueue.ts';

export function useAudioPlayer() {
  const [state, setState] = useState(initialAudioState);
  const queue = useRef<ReturnType<typeof createAudioQueue> | null>(null);

  useEffect(() => {
    const player = createAudioQueue(() => new Audio(), setState);
    queue.current = player;
    return () => { player.dispose(); queue.current = null; };
  }, []);

  const playQueue = useCallback((srcs: string[], gapMs = 500) => queue.current?.playQueue(srcs, gapMs), []);
  const play = useCallback((src: string) => queue.current?.play(src), []);
  const replay = useCallback(() => queue.current?.replay(), []);
  const stop = useCallback(() => queue.current?.stop(), []);
  const pause = useCallback(() => queue.current?.pause(), []);
  const resume = useCallback(() => queue.current?.resume(), []);
  const resumeFromGesture = useCallback(() => queue.current?.resumeFromGesture(), []);
  const sampleFrequency = useCallback((target: Uint8Array<ArrayBuffer>) => queue.current?.sampleFrequency(target) ?? false, []);
  const getPlaybackProgress = useCallback((): PlaybackProgress => queue.current?.getPlaybackProgress() ?? { elapsedSec: 0, durationSec: 0 }, []);

  return {
    ...state,
    playQueue,
    play,
    replay,
    stop,
    pause,
    resume,
    resumeFromGesture,
    sampleFrequency,
    getPlaybackProgress,
  };
}
