import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 片段播放器：单 <audio>，支持无限重放；播放状态供 UI 驱动波形动画。
 * 自动播放被浏览器拦截时置 needsGesture，由用户点击播放键触发。
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    const onEnd = () => setIsPlaying(false);
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    return () => {
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const play = useCallback((src: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = src;
    audio.currentTime = 0;
    audio.play().catch(() => setNeedsGesture(true));
  }, []);

  const replay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    audio.currentTime = 0;
    audio.play().catch(() => setNeedsGesture(true));
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resumeFromGesture = useCallback(() => {
    setNeedsGesture(false);
    const audio = audioRef.current;
    if (audio?.src) {
      audio.currentTime = 0;
      audio.play().catch(() => setNeedsGesture(true));
    }
  }, []);

  return { play, replay, stop, isPlaying, needsGesture, resumeFromGesture };
}
