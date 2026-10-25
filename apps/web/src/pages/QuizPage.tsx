import { useEffect } from 'react';
import { DIFFICULTY_LABEL, type Difficulty, type Question, type Song } from '../core/quiz.ts';
import type { ManifestEntry } from '@starlight/shared';

interface Props {
  question: Question;
  questions: Question[];
  index: number;
  answered: boolean;
  selectedId: string | null;
  score: number;
  difficulty: Difficulty;
  songById: Map<string, Song>;
  entryById: Map<string, ManifestEntry>;
  onSelect: (songId: string) => void;
  onNext: () => void;
  audio: {
    isPlaying: boolean;
    needsGesture: boolean;
    replay: () => void;
    resumeFromGesture: () => void;
    play: (src: string) => void;
  };
}

const base = import.meta.env.BASE_URL;

export function QuizPage(props: Props) {
  const { question, index, answered, selectedId, songById, entryById, audio } = props;

  // 换题自动播放片段（此前「开始答题」已构成用户手势；被拦截则显示播放键）
  useEffect(() => {
    const seg = entryById.get(question.answerSongId)?.segments[question.segmentKey];
    if (seg) audio.play(`${base}${seg.path}`);
  }, [question.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest text-amber-200/70">开头猜歌 · {DIFFICULTY_LABEL[props.difficulty]}</p>
          <h1 className="text-lg font-bold">
            第 {index + 1} / {props.questions.length} 题
          </h1>
        </div>
        <span className="rounded-full bg-purple-900/60 px-3 py-1 text-sm font-semibold text-amber-200">
          {props.score} 分
        </span>
      </header>

      <div className="flex gap-1.5" aria-label="题目进度">
        {props.questions.map((q, i) => (
          <span key={q.id} className={`progress-dot ${i < index ? 'done' : i === index ? 'current' : ''}`} />
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-amber-200/20 bg-black/30 px-4 py-4">
        <div className={`wave flex-1 ${audio.isPlaying ? 'is-playing' : ''}`} aria-hidden="true">
          {Array.from({ length: 42 }, (_, i) => (
            <i key={i} style={{ height: `${22 + ((i * 19) % 58)}%` }} />
          ))}
        </div>
        {audio.needsGesture ? (
          <button
            type="button"
            onClick={audio.resumeFromGesture}
            className="rounded-full bg-amber-300 px-4 py-2 text-sm font-bold text-purple-950"
          >
            点击播放
          </button>
        ) : (
          <button
            type="button"
            onClick={audio.replay}
            aria-label="重放本题"
            title="重放本题（不限次数）"
            className="rounded-full border border-amber-200/40 px-4 py-2 text-sm text-amber-100 hover:bg-amber-200/10"
          >
            ↺ 重放
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="listbox" aria-label="歌曲选项">
        {question.optionSongIds.map((id, i) => {
          const song = songById.get(id);
          const isAnswer = id === question.answerSongId;
          const isPicked = id === selectedId;
          const cls = !answered
            ? 'border-amber-200/25 bg-purple-900/40 hover:border-amber-200/70 hover:bg-purple-800/50'
            : isAnswer
              ? 'border-emerald-400/80 bg-emerald-900/30'
              : isPicked
                ? 'border-rose-400/80 bg-rose-900/30'
                : 'border-white/10 bg-black/20 opacity-60';
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={isPicked}
              disabled={answered}
              onClick={() => props.onSelect(id)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${cls}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200/15 text-sm font-bold text-amber-200">
                {i + 1}
              </span>
              <span className="min-w-0">
                <b className="block truncate">{song?.title ?? id}</b>
                {song && <small className="block truncate text-xs text-amber-100/60">{song.origin}</small>}
              </span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="min-h-10 text-center text-sm">
        {!answered ? (
          <span className="text-amber-100/60">听完这段，选出对应的歌曲。可无限次重放。</span>
        ) : selectedId === question.answerSongId ? (
          <span className="font-bold text-emerald-300">答对了：{songById.get(question.answerSongId)?.title}</span>
        ) : (
          <span className="font-bold text-rose-300">
            选错了。答案是：{songById.get(question.answerSongId)?.title}
          </span>
        )}
      </div>

      {answered && (
        <button
          type="button"
          onClick={props.onNext}
          className="mx-auto rounded-full bg-amber-300 px-10 py-2.5 font-bold text-purple-950 hover:brightness-110"
        >
          {index + 1 >= props.questions.length ? '查看结果' : '下一题'}
        </button>
      )}
    </main>
  );
}
