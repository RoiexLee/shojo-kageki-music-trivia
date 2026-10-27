import { useEffect, useMemo, useRef, useState } from 'react';
import {
  formatTime,
  MODE_LABEL,
  DIFFICULTY_LABEL,
  answerIds,
  summarize,
  computeStageRank,
  computeStreaks,
  type QuizConfig,
  type Question,
  type QuestionResult,
  type Song,
} from '../core/quiz.ts';
import { assetUrl } from '../data.ts';
import { saveBest } from '../core/best.ts';
import { shareText } from '../core/share.ts';
import { CrownEmblem, GramophoneIcon, RapierArrow, StarEmblem } from '../components/TheaterIcons.tsx';
import { TheaterFooter, TheaterHeader } from '../components/TheaterHeader.tsx';
import type { ManifestEntry } from '@starlight/shared';

interface Props {
  config: QuizConfig;
  results: QuestionResult[];
  questions: Question[];
  songById: Map<string, Song>;
  entryById: Map<string, ManifestEntry>;
  onRestart: () => void;
  onPreviewSong?: (songId: string) => void;
  previewingSongId?: string | null;
  isPlaying?: boolean;
  onStopPreview?: () => void;
  onOpenJukeboxModal?: () => void;
}

export function SummaryPage({
  config,
  results,
  questions,
  songById,
  entryById,
  onRestart,
  onPreviewSong,
  previewingSongId,
  isPlaying,
  onStopPreview,
  onOpenJukeboxModal,
}: Props) {
  const score = useMemo(() => summarize(results), [results]);
  const rank = useMemo(() => computeStageRank(score), [score]);
  const streaks = useMemo(() => computeStreaks(results), [results]);
  const [record, setRecord] = useState<ReturnType<typeof saveBest> | null>(null);
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setRecord(saveBest(config.mode, config.difficulty, score));
    heading.current?.focus();
  }, [config.mode, config.difficulty, score]);

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(shareText(config, score));
      setNotice('成绩文案已复制。');
    } catch {
      setNotice('无法访问剪贴板，你可以直接选中页面上的成绩复制。');
    }
  }

  async function downloadResult() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 675;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 不可用');

      const grad = ctx.createRadialGradient(600, 200, 50, 600, 340, 720);
      grad.addColorStop(0, '#4a1531');
      grad.addColorStop(0.55, '#1d0d1d');
      grad.addColorStop(1, '#0d060f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 675);

      ctx.strokeStyle = '#e5c384';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(28, 28, 1144, 619);
      ctx.strokeStyle = 'rgba(229, 195, 132, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(42, 42, 1116, 591);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#e5c384';
      ctx.font = '600 18px sans-serif';
      ctx.fillText('✦ STARLIGHT AUDITION · GRAND FINALE PLAYBILL ✦', 600, 88);

      ctx.fillStyle = '#f9f1e4';
      ctx.font = 'bold 36px serif';
      ctx.fillText('少女☆歌剧 · 舞台猜歌', 600, 140);

      ctx.fillStyle = '#f8dfa5';
      ctx.font = '600 24px sans-serif';
      ctx.fillText(`${MODE_LABEL[config.mode]} · ${DIFFICULTY_LABEL[config.difficulty]}  |  [${rank.tier}] ${rank.code}`, 600, 188);

      ctx.fillStyle = '#fae3aa';
      ctx.font = 'bold 136px Georgia, serif';
      ctx.fillText(`${score.correct} / ${score.total}`, 600, 342);

      ctx.fillStyle = '#f9f1e4';
      ctx.font = 'bold 28px serif';
      ctx.fillText(rank.title, 600, 406);

      ctx.fillStyle = '#d0c2b8';
      ctx.font = '24px sans-serif';
      ctx.fillText(`用时 ${formatTime(score.elapsedMs)} · 最高 ${streaks.maxStreak} 连击 · 种子 ${config.seed}`, 600, 462);

      ctx.fillStyle = 'rgba(248, 223, 165, 0.8)';
      ctx.font = 'italic 20px serif';
      ctx.fillText(rank.quote, 600, 522);

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('导出失败'))), 'image/png'),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shojo-kageki-music-trivia-${config.mode}-${config.seed}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('成绩图片已生成，下载已开始。');
    } catch {
      setNotice('无法导出图片，请尝试复制成绩文案。');
    }
  }

  return (
    <main className="opera-viewport finale-viewport">
      <TheaterHeader
        onHome={onRestart}
        onOpenJukeboxModal={onOpenJukeboxModal}
        songCount={songById.size || 10}
        statusTag="CURTAIN CALL · 终幕谢幕礼堂"
      />

      <div className="finale-coronation-layout">
        {/* 顶部双翼皇家授勋台 */}
        <header className="result-heading coronation-hero-card">
          <div className="coronation-left-column">
            <div className="finale-rank-medal" data-tier={rank.tier}>
              <span className="rank-emblem-disc">{rank.tier}</span>
              <span className="rank-emblem-code">
                <CrownEmblem size={15} /> {rank.code}
              </span>
            </div>

            <p className="muted">
              {MODE_LABEL[config.mode]} · {DIFFICULTY_LABEL[config.difficulty]}
            </p>
            <h1 ref={heading} tabIndex={-1}>
              本场谢幕
            </h1>
            <p className="finale-rank-title">{rank.title}</p>
            <p className="result-score">
              {score.correct}
              <span> / {score.total}</span>
            </p>
            <p className="finale-quote">{rank.quote}</p>
          </div>

          <div className="coronation-right-column">
            <div className="finale-stats-grid" aria-label="本场演出统计">
              <div className="finale-stat-card">
                <span>命中率</span>
                <strong>{rank.accuracyPct}%</strong>
              </div>
              <div className="finale-stat-card">
                <span>最高连击</span>
                <strong>{streaks.maxStreak} 连击</strong>
              </div>
              <div className="finale-stat-card">
                <span>最快单题</span>
                <strong>{streaks.fastestMs !== null ? formatTime(streaks.fastestMs) : '—'}</strong>
              </div>
              <div className="finale-stat-card">
                <span>平均耗时</span>
                <strong>{formatTime(streaks.avgMs)}</strong>
              </div>
            </div>

            <p className="finale-meta-line">
              用时 {formatTime(score.elapsedMs)} · 种子 <span className="seed">{config.seed}</span>
            </p>

            <p role="status" className="best-score">
              {record === null ? (
                '正在保存成绩…'
              ) : record.saved ? (
                <>
                  {record.isNewRecord && <span className="new-record-crown">✦ NEW RECORD</span>}
                  本机最佳：{record.best.correct} / {record.best.total} · {formatTime(record.best.elapsedMs)}
                </>
              ) : (
                '无法保存本机最佳成绩，仅显示本局结果。'
              )}
            </p>

            <div className="result-actions">
              <button type="button" className="secondary-button" onClick={copyResult}>
                复制成绩
              </button>
              <button type="button" className="secondary-button" onClick={downloadResult}>
                下载成绩图
              </button>
              <button type="button" className="primary-button imperial-cta-btn" onClick={onRestart}>
                <span className="cta-glint-sweep" aria-hidden="true" />
                <StarEmblem size={15} />
                <span>再玩一次</span>
                <RapierArrow size={20} />
              </button>
            </div>

            <p className="share-notice" aria-live="polite">
              {notice}
            </p>
          </div>
        </header>

        {/* 百老汇歌剧节目单回顾（支持直接点击试听） */}
        <section className="result-review playbill-chronicle" aria-labelledby="review-title">
          <div className="playbill-header">
            <h2 className="section-heading" id="review-title">
              <span>回望这场演出 · OFFICIAL PLAYBILL</span>
            </h2>
          </div>

          <ol className="result-list playbill-grid">
            {results.map((result, i) => {
              const answers = answerIds(questions[i]);
              return (
                <li key={result.questionId} className={`result-row playbill-card ${result.correct ? 'is-correct' : 'is-wrong'}`}>
                  <span className={`result-mark ${result.correct ? 'success-text' : 'error-text'}`}>
                    {String(i + 1).padStart(2, '0')}
                    <small>{result.correct ? '答对' : '选错'}</small>
                  </span>

                  <div className="result-songs">
                    {answers.map((id) => {
                      const song = songById.get(id);
                      const coverPath = entryById.get(id)?.coverPath ?? `covers/${id}.jpg`;
                      const isThisPlaying = previewingSongId === id && isPlaying;
                      return (
                        <div className="result-song" key={id}>
                          <img
                            src={assetUrl(coverPath)}
                            alt=""
                            width="56"
                            height="56"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="result-song-copy">
                            <strong>
                              {song?.title ?? id}
                              {song?.type && <em className="playbill-type-chip">{song.type}</em>}
                            </strong>
                            <small>
                              {song?.origin}
                              {song?.romaji ? ` · ${song.romaji}` : ''}
                            </small>
                          </div>
                          {onPreviewSong && (
                            <button
                              type="button"
                              className={`playbill-listen-btn ${isThisPlaying ? 'is-active' : ''}`}
                              onClick={() => (isThisPlaying ? onStopPreview?.() : onPreviewSong(id))}
                            >
                              <GramophoneIcon size={13} />
                              <span>{isThisPlaying ? '停止' : '全曲试听'}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {!result.correct && (
                      <p className="your-answer">
                        你的选择：{(result.selectedSongIds ?? []).map((id) => songById.get(id)?.title ?? id).join('、') || '无'}
                      </p>
                    )}
                  </div>

                  <span className="result-time">{formatTime(result.elapsedMs)}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <TheaterFooter />
    </main>
  );
}
