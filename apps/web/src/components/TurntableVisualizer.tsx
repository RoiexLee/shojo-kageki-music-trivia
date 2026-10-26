import { useEffect, useRef, useState } from 'react';
import type { QuizMode } from '../core/quiz.ts';
import type { PlaybackProgress } from '../hooks/audioQueue.ts';
import { StarEmblem } from './TheaterIcons.tsx';

interface TurntableVisualizerProps {
  mode: QuizMode;
  isPlaying: boolean;
  isPaused: boolean;
  answered: boolean;
  coverUrls: string[];
  sampleFrequency?: (target: Uint8Array<ArrayBuffer>) => boolean;
  getPlaybackProgress?: () => PlaybackProgress;
  onTogglePlay: () => void;
  onReplay: () => void;
}

const BAR_COUNT = 42;
const INITIAL_BARS = Array.from({ length: BAR_COUNT }, (_, i) => 24 + ((i * 19) % 56));

/**
 * 3D 黄金星象留声机 & 360° 环形光冕 + 对称声波阵列：
 * 1. Canvas 360° 环形音频频谱光环围绕黑胶唱片脉动
 * 2. 单曲顺转、倒放逆转紫金电弧、双曲混合双黑胶同台交锋
 * 3. 保留 .wave 与 .is-playing 选择器以兼容测试断言
 */
export function TurntableVisualizer({
  mode,
  isPlaying,
  isPaused,
  answered,
  coverUrls,
  sampleFrequency,
  getPlaybackProgress,
  onTogglePlay,
  onReplay,
}: TurntableVisualizerProps) {
  const [bars, setBars] = useState<number[]>(INITIAL_BARS);
  const [progress, setProgress] = useState<PlaybackProgress>({ elapsedSec: 0, durationSec: 0 });
  const haloCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isPlaying && !isPaused) {
      setBars(INITIAL_BARS);
      if (getPlaybackProgress) setProgress(getPlaybackProgress());
      return;
    }
    if (!isPlaying) {
      if (getPlaybackProgress) setProgress(getPlaybackProgress());
      return;
    }

    let rafId = 0;
    const freq = new Uint8Array(64);

    const renderFrame = (now: number) => {
      if (getPlaybackProgress) {
        setProgress(getPlaybackProgress());
      }
      const hasRealFreq = Boolean(sampleFrequency && sampleFrequency(freq) && freq.some((v) => v > 0));

      const nextBars = Array.from({ length: BAR_COUNT }, (_, i) => {
        if (hasRealFreq) {
          const dist = Math.abs(i - (BAR_COUNT - 1) / 2);
          const idx = Math.min(freq.length - 1, Math.floor(dist * 1.35));
          return Math.max(16, Math.min(100, Math.round((freq[idx] / 255) * 86 + 14)));
        }
        const w1 = Math.sin(now * 0.0085 + i * 0.38) * 30;
        const w2 = Math.cos(now * 0.0052 - i * 0.24) * 18;
        return Math.max(18, Math.min(98, Math.round(52 + w1 + w2)));
      });
      setBars(nextBars);

      // 绘制 360° 环形频谱光冕 Canvas
      const canvas = haloCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const size = canvas.width;
          const cx = size / 2;
          const cy = size / 2;
          const baseR = size * 0.34;
          ctx.clearRect(0, 0, size, size);

          const spikes = 48;
          for (let s = 0; s < spikes; s++) {
            const angle = (s / spikes) * Math.PI * 2 - Math.PI / 2;
            const amp = nextBars[s % BAR_COUNT] / 100;
            const innerR = baseR;
            const outerR = baseR + amp * (size * 0.13);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
            ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
            ctx.strokeStyle =
              mode === 'reverse'
                ? `rgba(196, 155, 255, ${0.35 + amp * 0.6})`
                : s % 2 === 0
                  ? `rgba(248, 223, 165, ${0.4 + amp * 0.58})`
                  : `rgba(251, 84, 88, ${0.35 + amp * 0.55})`;
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPlaying, isPaused, mode, sampleFrequency, getPlaybackProgress]);

  const progressPct =
    progress.durationSec > 0 ? Math.min(100, Math.max(0, (progress.elapsedSec / progress.durationSec) * 100)) : 0;

  return (
    <div className={`symphony-turntable-unit mode-${mode} ${isPlaying ? 'unit-playing' : ''}`}>
      {/* 左侧 / 中央：3D 留声星盘与 360° 光谱环 */}
      <div className="turntable-platter-zone" aria-hidden="true">
        <canvas ref={haloCanvasRef} width={220} height={220} className="turntable-halo-canvas" />

        {mode === 'mix' ? (
          <div className="twin-platters">
            {[0, 1].map((idx) => {
              const cover = answered ? coverUrls[idx] : undefined;
              return (
                <div key={idx} className={`platter-disc twin-disc-${idx} ${isPlaying ? 'spin-forward' : ''}`}>
                  <div className="disc-grooves" />
                  <div className="disc-gold-ring" />
                  <div className="disc-core">
                    {cover ? <img src={cover} alt="" width="54" height="54" /> : <span>{idx === 0 ? 'Ⅰ' : 'Ⅱ'}</span>}
                  </div>
                </div>
              );
            })}
            <span className="twin-clash-star">
              <StarEmblem size={22} />
            </span>
          </div>
        ) : (
          <div className="solo-platter">
            <div
              className={`platter-disc ${
                isPlaying ? (mode === 'reverse' ? 'spin-reverse' : 'spin-forward') : ''
              }`}
            >
              <div className="disc-grooves" />
              <div className="disc-gold-ring" />
              <div className="disc-core">
                {answered && coverUrls[0] ? (
                  <img src={coverUrls[0]} alt="" width="64" height="64" />
                ) : (
                  <span>{mode === 'reverse' ? '↺' : '✦'}</span>
                )}
              </div>
            </div>
            <div className={`gramophone-arm ${isPlaying ? 'arm-active' : ''}`}>
              <span className="arm-pivot" />
              <span className="arm-rod" />
              <span className="arm-head" />
            </div>
          </div>
        )}
      </div>

      {/* 右侧：声波光柱矩阵与时间刻尺 */}
      <div className="symphony-spectrum-panel">
        <div className="spectrum-top-meta" aria-hidden="true">
          <span className="spectrum-mode-tag">
            <StarEmblem size={12} />
            {mode === 'mix'
              ? 'DUAL HARMONY · 双星交响同刻混音'
              : mode === 'reverse'
                ? 'CHRONO REVERSAL · 逆转星轨旋律'
                : 'SEISHO ACOUSTICS · 圣翔黄金留声舱'}
          </span>
          {progress.durationSec > 0 && (
            <span className="spectrum-clock">
              {progress.elapsedSec.toFixed(1)}s <em>/ {progress.durationSec.toFixed(1)}s</em>
            </span>
          )}
        </div>

        <div className={`wave ${isPlaying ? 'is-playing' : ''}`} aria-hidden="true">
          {bars.map((h, i) => (
            <i
              key={i}
              style={{
                height: `${h}%`,
                animationDelay: `${-(i % 7) * 0.12}s`,
              }}
            />
          ))}
        </div>

        <div className="symphony-timeline" aria-hidden="true">
          <div className="timeline-progress-bar" style={{ width: `${progressPct}%` }}>
            <span className="timeline-spark" />
          </div>
        </div>
      </div>

      {/* 播放与重放控制栏：桌面端位于右下角且高度与左侧转盘齐平，移动端位于转盘右侧且高度对齐 */}
      <div className="audio-controls gramophone-controls-bar">
        <button
          type="button"
          className={`secondary-button gramophone-play-btn ${isPlaying ? 'is-playing' : ''}`}
          onClick={onTogglePlay}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            {isPlaying ? <path d="M6 4h4v16H6zm8 0h4v16h-4z" /> : <path d="m7 4 13 8-13 8z" />}
          </svg>
          <span>{isPlaying ? '暂停' : isPaused ? '继续播放' : '点击播放'}</span>
        </button>
        <button type="button" className="secondary-button gramophone-replay-btn" onClick={onReplay}>
          <svg
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span>从头重放</span>
        </button>
      </div>
    </div>
  );
}
