import { useEffect, useMemo } from 'react';
import { DIFFICULTY_LABEL, MODE_LABEL, answerIds, judge, type Difficulty, type Question, type Song } from '../core/quiz.ts';
import { assetUrl } from '../data.ts';
import type { ManifestEntry } from '@starlight/shared';

interface Props {
  question: Question; questions: Question[]; index: number; answered: boolean; selectedIds: string[]; score: number; difficulty: Difficulty;
  songById: Map<string, Song>; entryById: Map<string, ManifestEntry>;
  onSelect: (id: string) => void; onConfirm: () => void; onNext: () => void; onExit: () => void;
  audio: { isPlaying: boolean; needsGesture: boolean; queueIndex: number; failedCount: number; replay: () => void; resumeFromGesture: () => void; play: (src: string) => void; playQueue: (srcs: string[], gapMs?: number) => void };
}

export function QuizPage(props: Props) {
  const { question, index, answered, selectedIds, songById, entryById, audio } = props;
  const audioSources = useMemo(() => question.mode === 'mix'
    ? question.clips.map(({ songId, segmentKey }) => { const path = entryById.get(songId)?.segments[segmentKey]?.path; return path ? assetUrl(path) : ''; }).filter(Boolean)
    : question.mode !== 'lyrics' ? (() => { const segment = entryById.get(question.answerSongId)?.segments[question.segmentKey]; return segment ? [assetUrl(segment.path)] : []; })() : [], [question, entryById]);

  useEffect(() => {
    if (question.mode === 'lyrics') return;
    if (!audioSources.length) return;
    audio.playQueue(audioSources, 500);
    return () => audio.playQueue([], 0);
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const expected = question.mode === 'mix' ? answerIds(question).length : 1;
  const selectedAnswer = judge(question, selectedIds);
  const resultText = !answered ? null : selectedAnswer ? '答对了！' : `选错了。答案：${answerIds(question).map((id) => songById.get(id)?.title ?? id).join('、')}`;
  const title = question.mode === 'mix' ? '混合连猜' : MODE_LABEL[question.mode];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between">
        <div><button type="button" onClick={props.onExit} className="text-xs text-amber-200/70 hover:text-amber-100">← 返回首页</button><p className="mt-1 text-xs tracking-widest text-amber-200/70">{title} · {DIFFICULTY_LABEL[props.difficulty]}</p><h1 className="text-lg font-bold">第 {index + 1} / {props.questions.length} 题</h1></div>
        <span className="rounded-full bg-purple-900/60 px-3 py-1 text-sm font-semibold text-amber-200">{props.score} 分</span>
      </header>
      <div className="flex gap-1.5" aria-label="题目进度">{props.questions.map((q, i) => <span key={q.id} className={`progress-dot ${i < index ? 'done' : i === index ? 'current' : ''}`} />)}</div>
      {question.mode === 'lyrics' ? <section className="rounded-2xl border border-amber-200/25 bg-black/30 px-5 py-10 text-center"><p className="text-2xl font-bold leading-relaxed">「{question.lyricText}」</p>{question.translation && <p className="mt-3 text-sm text-amber-100/60">{question.translation}</p>}{question.originHint && <p className="mt-4 text-xs text-amber-200/70">出处提示：{question.originHint}</p>}</section>
        : <div className="flex items-center gap-3 rounded-2xl border border-amber-200/20 bg-black/30 px-4 py-4"><div className={`wave flex-1 ${audio.isPlaying ? 'is-playing' : ''}`} aria-label={`第 ${audio.queueIndex + 1} / ${audioSources.length || 1} 段`} aria-hidden="true">{Array.from({ length: 42 }, (_, i) => <i key={i} style={{ height: `${22 + ((i * 19) % 58)}%` }} />)}</div>{audio.needsGesture ? <button type="button" onClick={audio.resumeFromGesture} className="rounded-full bg-amber-300 px-4 py-2 text-sm font-bold text-purple-950">点击播放</button> : <button type="button" onClick={audio.replay} className="rounded-full border border-amber-200/40 px-4 py-2 text-sm text-amber-100 hover:bg-amber-200/10">↺ 重放</button>}</div>}
      {question.mode === 'reverse' && question.lyricHint && <p className="rounded-xl bg-purple-900/50 px-4 py-3 text-center text-sm text-amber-100/80">提示歌词：{question.lyricHint}</p>}
      {question.mode !== 'lyrics' && <p role="status" className="text-center text-sm text-amber-100/70">{audio.isPlaying ? '正在播放' : audio.needsGesture ? '等待点击播放' : '暂未播放，可重放'} · 第 {Math.min(audio.queueIndex + 1, audioSources.length || expected)} / {audioSources.length || expected} 段{question.mode === 'mix' && ` · 已选 ${selectedIds.length} / ${expected}`}</p>}
      {question.mode !== 'lyrics' && audio.failedCount > 0 && <div role="alert" className="text-center text-sm text-rose-300"><p>{audio.failedCount} 段音频加载失败，已跳过。可重试播放，或返回首页选择其他模式。</p><button type="button" onClick={audio.replay} className="mt-2 rounded-full border border-rose-300/60 px-4 py-2">重新加载并播放</button></div>}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="listbox" aria-label="歌曲选项">{question.optionSongIds.map((id, i) => { const song = songById.get(id); const picked = selectedIds.includes(id); const answer = answerIds(question).includes(id); const cls = !answered ? picked ? 'border-amber-200 bg-purple-700/60' : 'border-amber-200/25 bg-purple-900/40 hover:border-amber-200/70' : answer ? 'border-emerald-400/80 bg-emerald-900/30' : picked ? 'border-rose-400/80 bg-rose-900/30' : 'border-white/10 bg-black/20 opacity-60'; return <button key={id} type="button" role="option" aria-selected={picked} disabled={answered} onClick={() => props.onSelect(id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${cls}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200/15 text-sm font-bold text-amber-200">{i + 1}</span><span className="min-w-0"><b className="block break-words">{song?.title ?? id}</b><small className="block truncate text-xs text-amber-100/60">{song?.origin}</small></span></button>; })}</div>
      <div aria-live="polite" className="min-h-10 text-center text-sm">{resultText ? <span className={selectedAnswer ? 'font-bold text-emerald-300' : 'font-bold text-rose-300'}>{resultText}</span> : <span className="text-amber-100/60">{question.mode === 'mix' ? '选满后确认；可以取消选择。' : '听完这段，选出对应的歌曲。可以重放。'}</span>}</div>
      {question.mode === 'mix' && !answered && <button type="button" disabled={selectedIds.length !== expected} onClick={props.onConfirm} className="mx-auto rounded-full bg-amber-300 px-10 py-2.5 font-bold text-purple-950 disabled:cursor-not-allowed disabled:opacity-40">确认判定</button>}
      {answered && <button type="button" onClick={props.onNext} className="mx-auto rounded-full bg-amber-300 px-10 py-2.5 font-bold text-purple-950 hover:brightness-110">{index + 1 >= props.questions.length ? '查看结果' : '下一题'}</button>}
    </main>
  );
}
