import { useEffect, useMemo, useRef } from 'react';
import {
  DIFFICULTY_LABEL,
  MODE_LABEL,
  answerIds,
  computeStreaks,
  judge,
  type Difficulty,
  type Question,
  type QuestionResult,
  type Song,
} from '../core/quiz.ts';
import { assetUrl } from '../data.ts';
import { CrownEmblem, RapierArrow, StarEmblem } from '../components/TheaterIcons.tsx';
import { TheaterFooter, TheaterHeader } from '../components/TheaterHeader.tsx';
import { TurntableVisualizer } from '../components/TurntableVisualizer.tsx';
import type { useAudioPlayer } from '../hooks/useAudioPlayer.ts';
import type { ManifestEntry } from '@starlight/shared';

interface Props {
  question: Question;
  questions: Question[];
  index: number;
  answered: boolean;
  selectedIds: string[];
  score: number;
  difficulty: Difficulty;
  results?: QuestionResult[];
  songById: Map<string, Song>;
  entryById: Map<string, ManifestEntry>;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onNext: () => void;
  onExit: () => void;
  audio: ReturnType<typeof useAudioPlayer>;
  onOpenJukeboxModal?: () => void;
}

/** 解析本题全部音源：缺任一轨时返回空列表，避免混合题静默丢轨后只播放一首；歌词题优先截取对应歌词附近片段。 */
export function resolveAudioSources(question: Question, answered: boolean, entryById: Map<string, ManifestEntry>) {
  if (question.mode === 'lyrics' && !answered) return { paths: [] as string[], missing: false, window: undefined };
  if (question.mode === 'lyrics') {
    const entry = entryById.get(question.answerSongId);
    if (!entry) return { paths: [] as string[], missing: true, window: undefined };
    if (question.clipStartSec !== undefined) {
      return {
        paths: [assetUrl(`audio/${question.answerSongId}/full.mp3`)],
        missing: false,
        window: { startSec: question.clipStartSec, durationSec: question.clipDurationSec ?? 6 },
      };
    }
    const fallbackPath = entry.segments['clip-10']?.path;
    return {
      paths: fallbackPath ? [assetUrl(fallbackPath)] : [],
      missing: !fallbackPath,
      window: undefined,
    };
  }
  const clips =
    question.mode === 'mix'
      ? question.clips
      : [{ songId: question.answerSongId, segmentKey: question.segmentKey }];
  const paths = clips.map(({ songId, segmentKey }) => entryById.get(songId)?.segments[segmentKey]?.path);
  const missing = paths.some((path) => !path);
  return { paths: missing ? [] : paths.map((path) => assetUrl(path!)), missing, window: undefined };
}

export function QuizPage(props: Props) {
  const { question, index, answered, selectedIds, songById, entryById, audio, results = [] } = props;
  const heading = useRef<HTMLHeadingElement>(null);
  const { paths: audioSources, missing: audioMissing, window: audioWindow } = useMemo(
    () => resolveAudioSources(question, answered, entryById),
    [question, answered, entryById],
  );
  const { playQueue, stop } = audio;
  const shouldPlay = (question.mode === 'lyrics' ? answered : !answered) && !audioMissing;

  useEffect(() => {
    heading.current?.focus();
  }, [question.id]);

  useEffect(() => {
    if (!shouldPlay) {
      stop();
      return;
    }
    playQueue(audioSources, 0, audioWindow);
    return stop;
  }, [question.id, shouldPlay, audioSources, audioWindow, playQueue, stop]);

  const answers = answerIds(question);
  const correct = judge(question, selectedIds);
  const expected = answers.length;
  const streaks = useMemo(() => computeStreaks(results), [results]);

  // 键盘数字键 1-8 快捷作答，Enter 确认/下一题（零延迟直接响应）
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!answered) {
        const num = Number(e.key);
        if (Number.isInteger(num) && num >= 1 && num <= question.optionSongIds.length) {
          e.preventDefault();
          props.onSelect(question.optionSongIds[num - 1]);
          return;
        }
        if (e.key === 'Enter' && question.mode === 'mix' && selectedIds.length === expected) {
          e.preventDefault();
          props.onConfirm();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        props.onNext();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answered, question, selectedIds.length, expected, props.onSelect, props.onConfirm, props.onNext]);

  const playAction = audio.needsGesture ? audio.resumeFromGesture : audio.isPaused ? audio.resume : audio.replay;
  const showAudio = question.mode !== 'lyrics' || answered;

  const answerCoverUrls = useMemo(
    () =>
      answers.map((id) => {
        const p = entryById.get(id)?.coverPath ?? `covers/${id}.jpg`;
        return assetUrl(p);
      }),
    [answers, entryById],
  );

  return (
    <main className="opera-viewport duel-viewport">
      <TheaterHeader
        onHome={props.onExit}
        onOpenJukeboxModal={props.onOpenJukeboxModal}
        songCount={songById.size || 10}
        statusTag="REVUE DUEL · 舞台选拔进行中"
      />

      <section className="duel-arena-stage">
        {/* 顶部歌剧双翼仪表盘 HUD */}
        <header className="duel-hud-arch">
          <div className="duel-hud-left">
            <div className="duel-mode-crest">
              <StarEmblem size={12} />
              <p className="muted">
                {MODE_LABEL[question.mode]} · {DIFFICULTY_LABEL[props.difficulty]}
              </p>
            </div>
            <h1 ref={heading} tabIndex={-1}>
              第 {index + 1} <span>/ {props.questions.length} 题</span>
            </h1>
          </div>

          {/* 十幕星冕宝石轨 */}
          <div
            className="question-progress starlight-arc-track"
            role="progressbar"
            aria-label="题目进度"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={props.questions.length}
          >
            {props.questions.map((q, i) => {
              const past = results[i];
              const stateCls = i < index ? 'done' : i === index ? 'current' : '';
              const resCls = past ? (past.correct ? 'arc-pass' : 'arc-miss') : '';
              return (
                <span key={q.id} className={`${stateCls} ${resCls}`.trim()}>
                  <i aria-hidden="true">{i + 1}</i>
                </span>
              );
            })}
          </div>

          <div className="duel-hud-right">
            {streaks.currentStreak >= 2 && (
              <div className="combo-flame-pill" aria-label={`当前连击 ${streaks.currentStreak}`}>
                <StarEmblem size={13} />
                <span>{streaks.currentStreak} 连击</span>
              </div>
            )}
            <div className="royal-score-plaque">
              <span className="plaque-caption" aria-hidden="true">
                AUDITION SCORE
              </span>
              <div className="score-number">{props.score} 分</div>
            </div>
          </div>
        </header>

        {/* 中央核心演剧台：歌剧台本卷轴 / 3D 黄金留声星盘 */}
        <div className="duel-centerpiece-deck">
          {question.mode === 'lyrics' && (
            <section className="lyric-stage libretto-scroll-card" aria-label="歌词题面">
              <div className="libretto-crest-line" aria-hidden="true">
                <span className="crest-ornament-wing" />
                <span>✦ SEISHO OPERA LIBRETTO · 圣翔歌剧台本 ✦</span>
                <span className="crest-ornament-wing" />
              </div>
              <p lang="ja" className="libretto-verse-main">
                「{question.originalLyricText ?? question.lyricText}」
              </p>
              {question.originalLyricText && (
                <p lang="zh" className="libretto-verse-sub">
                  {question.lyricText}
                </p>
              )}
              {question.originHint && <small className="libretto-origin-hint">出处提示：{question.originHint}</small>}
            </section>
          )}

          {showAudio && (
            <section className="audio-stage gramophone-stage-pod" aria-label="片段播放器">
              <TurntableVisualizer
                mode={question.mode}
                isPlaying={audio.isPlaying}
                isPaused={audio.isPaused}
                answered={answered}
                coverUrls={answerCoverUrls}
                sampleFrequency={audio.sampleFrequency}
                getPlaybackProgress={audio.getPlaybackProgress}
                onTogglePlay={audio.isPlaying ? audio.pause : playAction}
                onReplay={audio.replay}
              />
            </section>
          )}

          {(audio.failedCount > 0 || audioMissing) && showAudio && (
            <div role="alert" className="error-notice">
              {audioMissing
                ? `本题音频资源不完整，${question.mode === 'mix' ? '混合题已整体停止' : '播放已停止'}`
                : `${audio.failedCount} 段音频加载失败，${question.mode === 'mix' ? '混合题已整体停止' : '播放已停止'}`}
              。
              <button type="button" className="text-button" onClick={audioMissing ? props.onExit : audio.replay}>
                {audioMissing ? '返回首页重试' : '重新加载并播放'}
              </button>
            </div>
          )}

          {question.mode === 'reverse' && question.lyricHint && (
            <p className="hint-line">
              <StarEmblem size={14} /> 提示歌词：{question.lyricHint}
            </p>
          )}
        </div>

        {/* 歌剧选拔剑锋选项阵 */}
        <div className="duel-options-zone">
          <div className="options-heading">
            <h2>
              {question.mode === 'mix'
                ? '选出听到的所有歌曲'
                : question.mode === 'lyrics'
                  ? '这句歌词来自哪首歌？'
                  : '这段旋律来自哪首歌？'}
            </h2>
            {question.mode === 'mix' && (
              <span aria-live="polite" className="mix-selection-pill">
                已选 {selectedIds.length} / {expected}
              </span>
            )}
          </div>

          <div className="answer-grid blade-options-grid" role="group" aria-label="歌曲选项">
            {question.optionSongIds.map((id) => {
              const picked = selectedIds.includes(id);
              const isAnswer = answers.includes(id);
              const song = songById.get(id);
              const coverSrc = assetUrl(entryById.get(id)?.coverPath ?? `covers/${id}.jpg`);
              return (
                <button
                  key={id}
                  type="button"
                  className={`answer-option blade-option-card ${
                    answered ? (isAnswer ? 'correct' : picked ? 'incorrect' : 'unpicked') : picked ? 'selected' : ''
                  }`}
                  aria-pressed={picked}
                  disabled={answered}
                  onClick={() => props.onSelect(id)}
                >
                  <img
                    className="blade-option-cover"
                    src={coverSrc}
                    alt=""
                    width="56"
                    height="56"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.opacity = '0.25';
                    }}
                  />
                  <span className="answer-text blade-option-copy">
                    <strong>{song?.title ?? id}</strong>
                    <small>
                      {song?.origin}
                      {song?.type ? ` · ${song.type}` : ''}
                    </small>
                    {answered && (isAnswer || picked) && (
                      <small className="answer-verdict">{isAnswer ? '正确答案' : '你的选择'}</small>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 底部高潮判定与黑胶典藏揭晓区 */}
        <footer className="duel-climax-footer">
          <div className={`answer-feedback ${answered ? (correct ? 'success-text' : 'error-text') : ''}`} aria-live="polite">
            {answered
              ? correct
                ? '答对了！'
                : `选错了。答案：${answers.map((id) => songById.get(id)?.title ?? id).join('、')}`
              : question.mode === 'mix'
                ? '选满后确认；可以再次点击取消选择。'
                : '点击一首歌曲，揭晓答案。'}
          </div>

          {answered && (
            <aside className={`reveal-showcase vinyl-reveal-banner ${correct ? 'is-pass' : 'is-miss'}`} aria-label="本题曲目揭晓档案">
              <div className="reveal-banner-ribbon">
                <CrownEmblem size={15} />
                <span>{correct ? 'POSITION ZERO · 完美命中' : 'AUDITION RECORD · 正确曲目档案'}</span>
              </div>
              <div className="reveal-vinyl-cards">
                {answers.map((id) => {
                  const song = songById.get(id);
                  const coverSrc = assetUrl(entryById.get(id)?.coverPath ?? `covers/${id}.jpg`);
                  return (
                    <div key={id} className="reveal-vinyl-item">
                      <div className="reveal-sleeve-wrap">
                        <img
                          src={coverSrc}
                          alt=""
                          width="72"
                          height="72"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="reveal-spinning-disc" aria-hidden="true" />
                      </div>
                      <div className="reveal-meta-copy">
                        <span className="reveal-type-pill">{song?.type ?? 'Revue Song'}</span>
                        <strong>{song?.title ?? id}</strong>
                        {song?.romaji && <small className="reveal-romaji-line">{song.romaji}</small>}
                        <small>{song?.origin}</small>
                        {song?.description && <p className="reveal-critique-line">{song.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          )}

          <div className="quiz-actions">
            {question.mode === 'mix' && !answered && (
              <button
                type="button"
                className="primary-button imperial-cta-btn"
                disabled={selectedIds.length !== expected}
                onClick={props.onConfirm}
              >
                <span className="cta-glint-sweep" aria-hidden="true" />
                <span>确认判定</span>
                <RapierArrow size={20} />
              </button>
            )}
            {answered && (
              <button type="button" className="primary-button imperial-cta-btn" onClick={props.onNext}>
                <span className="cta-glint-sweep" aria-hidden="true" />
                <span>{index + 1 >= props.questions.length ? '查看结果' : '下一题'}</span>
                <RapierArrow size={20} />
              </button>
            )}
          </div>
        </footer>
      </section>

      <TheaterFooter />
    </main>
  );
}
