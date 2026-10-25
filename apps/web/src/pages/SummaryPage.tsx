import { formatTime, DIFFICULTY_LABEL, type Difficulty, type Question, type QuestionResult, type Song } from '../core/quiz.ts';
import type { ManifestEntry } from '@starlight/shared';

interface Props {
  difficulty: Difficulty;
  results: QuestionResult[];
  questions: Question[];
  songById: Map<string, Song>;
  entryById: Map<string, ManifestEntry>;
  onRestart: () => void;
}

const base = import.meta.env.BASE_URL;

export function SummaryPage({ difficulty, results, questions, songById, entryById, onRestart }: Props) {
  const correct = results.filter((r) => r.correct).length;
  const elapsed = results.reduce((acc, r) => acc + r.elapsedMs, 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-5 px-4 py-10">
      <header className="text-center">
        <p className="text-xs tracking-widest text-amber-200/70">RESULT · {DIFFICULTY_LABEL[difficulty]}</p>
        <h1 className="mt-2 text-5xl font-black">
          {correct}
          <span className="text-2xl text-amber-100/60"> / {results.length}</span>
        </h1>
        <p className="mt-2 text-sm text-amber-100/70">用时 {formatTime(elapsed)}</p>
      </header>

      <ol className="flex flex-col gap-2.5">
        {results.map((r, i) => {
          const q = questions[i];
          const song = songById.get(q.answerSongId);
          const cover = entryById.get(q.answerSongId)?.coverPath;
          return (
            <li
              key={r.questionId}
              className={`flex items-center gap-3 rounded-xl border p-2.5 ${
                r.correct ? 'border-emerald-400/50 bg-emerald-900/20' : 'border-rose-400/50 bg-rose-900/20'
              }`}
            >
              <span className="w-6 text-center text-sm text-amber-100/60">{i + 1}</span>
              {cover && (
                <img src={`${base}${cover}`} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
              )}
              <span className="min-w-0 flex-1">
                <b className="block truncate">{song?.title}</b>
                <small className="block truncate text-xs text-amber-100/50">
                  {song?.origin} · {r.correct ? '答对' : '选错'} · {formatTime(r.elapsedMs)}
                </small>
              </span>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={onRestart}
        className="mx-auto rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-amber-300 px-12 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-rose-900/40 hover:brightness-110"
      >
        再玩一次
      </button>
    </main>
  );
}
