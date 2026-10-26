import { useEffect, useMemo, useRef } from 'react';
import { DIFFICULTY_LABEL, MODE_LABEL, answerIds, judge, type Difficulty, type Question, type Song } from '../core/quiz.ts';
import { assetUrl } from '../data.ts';
import { Arrow, Brand, Footer } from '../components/Brand.tsx';
import type { useAudioPlayer } from '../hooks/useAudioPlayer.ts';
import type { ManifestEntry } from '@starlight/shared';

interface Props {
  question: Question; questions: Question[]; index: number; answered: boolean; selectedIds: string[]; score: number; difficulty: Difficulty;
  songById: Map<string, Song>; entryById: Map<string, ManifestEntry>;
  onSelect: (id: string) => void; onConfirm: () => void; onNext: () => void; onExit: () => void;
  audio: ReturnType<typeof useAudioPlayer>;
}

export function QuizPage(props: Props) {
  const { question, index, answered, selectedIds, songById, entryById, audio } = props;
  const heading = useRef<HTMLHeadingElement>(null);
  const audioSources = useMemo(() => {
    const clips = question.mode === 'mix' ? question.clips : question.mode === 'lyrics' ? [] : [{ songId: question.answerSongId, segmentKey: question.segmentKey }];
    return clips.map(({ songId, segmentKey }) => entryById.get(songId)?.segments[segmentKey]?.path).filter((path): path is string => Boolean(path)).map(assetUrl);
  }, [question, entryById]);
  const { playQueue, stop } = audio;
  useEffect(() => {
    heading.current?.focus();
    if (audioSources.length) playQueue(audioSources, 500);
    return stop;
  }, [question, audioSources, playQueue, stop]);
  useEffect(() => { if (answered) stop(); }, [answered, stop]);

  const answers = answerIds(question);
  const correct = judge(question, selectedIds);
  const expected = answers.length;
  const status = audio.needsGesture ? '点击播放，聆听本题' : audio.isPaused ? '已暂停，点击继续' : audio.isPlaying ? '正在播放' : '暂未播放，可重放';
  const playAction = audio.needsGesture ? audio.resumeFromGesture : audio.isPaused ? audio.resume : audio.replay;

  return (
    <main className="app-shell play-shell stage-enter">
      <Brand onHome={props.onExit} />
      <section className="quiz-body">
        <header className="quiz-heading">
          <div><button type="button" className="text-button back-button" onClick={props.onExit}>返回首页</button>
            <p className="muted">{MODE_LABEL[question.mode]} · {DIFFICULTY_LABEL[props.difficulty]}</p>
            <h1 ref={heading} tabIndex={-1}>第 {index + 1} <span>/ {props.questions.length} 题</span></h1>
          </div>
          <div className="score-number">{props.score} 分</div>
        </header>
        <div className="question-progress" role="progressbar" aria-label="题目进度" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={props.questions.length}>
          {props.questions.map((q, i) => <span key={q.id} className={i < index ? 'done' : i === index ? 'current' : ''} />)}
        </div>
        {question.mode === 'lyrics' ? (
          <section className="lyric-stage" aria-label="歌词题面">
            <p lang="ja">「{question.lyricText}」</p>
            {question.originHint && <small>出处提示：{question.originHint}</small>}
            {answered && question.translation && <p className="translation">{question.translation}</p>}
          </section>
        ) : (
          <section className="audio-stage" aria-label="片段播放器">
            <div className={`wave ${audio.isPlaying ? 'is-playing' : ''}`} aria-hidden="true">{Array.from({ length: 42 }, (_, i) => <i key={i} style={{ height: `${22 + ((i * 19) % 58)}%`, animationDelay: `${-(i % 7) * .13}s` }} />)}</div>
            <div className="audio-controls">
              <button type="button" className="secondary-button" onClick={audio.isPlaying ? audio.pause : playAction}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">{audio.isPlaying ? <path d="M6 4h4v16H6zm8 0h4v16h-4z" /> : <path d="m7 4 13 8-13 8z" />}</svg>
                {audio.isPlaying ? '暂停' : audio.isPaused ? '继续播放' : '点击播放'}
              </button>
              <button type="button" className="text-button" onClick={audio.replay}>从头重放</button>
            </div>
            <p role="status" className="media-status">{status}{question.mode === 'mix' && ` · 第 ${Math.min(audio.queueIndex + 1, expected)} / ${expected} 段`}</p>
          </section>
        )}
        {audio.failedCount > 0 && question.mode !== 'lyrics' && <div role="alert" className="error-notice">{audio.failedCount} 段音频加载失败，已跳过。<button type="button" className="text-button" onClick={audio.replay}>重新加载并播放</button></div>}
        {question.mode === 'reverse' && question.lyricHint && <p className="hint-line">提示歌词：{question.lyricHint}</p>}
        <div className="options-heading"><h2>{question.mode === 'mix' ? '选出听到的所有歌曲' : question.mode === 'lyrics' ? '这句歌词来自哪首歌？' : '这段旋律来自哪首歌？'}</h2>{question.mode === 'mix' && <span aria-live="polite">已选 {selectedIds.length} / {expected}</span>}</div>
        <div className="answer-grid" role="group" aria-label="歌曲选项">
          {question.optionSongIds.map((id, i) => {
            const picked = selectedIds.includes(id);
            const isAnswer = answers.includes(id);
            return <button key={id} type="button" className={`answer-option ${answered ? isAnswer ? 'correct' : picked ? 'incorrect' : 'unpicked' : picked ? 'selected' : ''}`} aria-pressed={picked} disabled={answered} onClick={() => props.onSelect(id)}>
              <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
              <span className="answer-text"><strong>{songById.get(id)?.title ?? id}</strong><small>{songById.get(id)?.origin}</small>{answered && (isAnswer || picked) && <small className="answer-verdict">{isAnswer ? '正确答案' : '你的选择'}</small>}</span>
            </button>;
          })}
        </div>
        <div className={`answer-feedback ${answered ? correct ? 'success-text' : 'error-text' : ''}`} aria-live="polite">
          {answered ? correct ? '答对了！' : `选错了。答案：${answers.map((id) => songById.get(id)?.title ?? id).join('、')}` : question.mode === 'mix' ? '选满后确认；可以再次点击取消选择。' : '点击一首歌曲，揭晓答案。'}
        </div>
        <div className="quiz-actions">
          {question.mode === 'mix' && !answered && <button type="button" className="primary-button" disabled={selectedIds.length !== expected} onClick={props.onConfirm}>确认判定<Arrow /></button>}
          {answered && <button type="button" className="primary-button" onClick={props.onNext}>{index + 1 >= props.questions.length ? '查看结果' : '下一题'}<Arrow /></button>}
        </div>
      </section>
      <Footer />
    </main>
  );
}
