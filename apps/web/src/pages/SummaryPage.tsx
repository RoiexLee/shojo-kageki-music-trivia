import { useEffect, useMemo, useState } from 'react';
import { formatTime, MODE_LABEL, DIFFICULTY_LABEL, type QuizConfig, type Question, type QuestionResult, type Song } from '../core/quiz.ts';
import { assetUrl } from '../data.ts';
import { saveBest } from '../core/best.ts';
import type { ManifestEntry } from '@starlight/shared';

interface Props {
  config: QuizConfig;
  results: QuestionResult[];
  questions: Question[];
  songById: Map<string, Song>;
  entryById: Map<string, ManifestEntry>;
  onRestart: () => void;
}

export function SummaryPage({ config, results, questions, songById, entryById, onRestart }: Props) {
  const score = useMemo(() => ({
    correct: results.filter((result) => result.correct).length,
    total: results.length,
    elapsedMs: results.reduce((sum, result) => sum + result.elapsedMs, 0),
  }), [results]);
  const [record, setRecord] = useState<ReturnType<typeof saveBest> | null>(null);
  useEffect(() => {
    setRecord(saveBest(config.mode, config.difficulty, score));
  }, [config.mode, config.difficulty, score]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-5 px-4 py-10">
      <header className="text-center">
        <p className="text-xs tracking-widest text-amber-200/70">RESULT · {MODE_LABEL[config.mode]} · {DIFFICULTY_LABEL[config.difficulty]}</p>
        <h1 className="mt-2 text-5xl font-black">{score.correct}<span className="text-2xl text-amber-100/60"> / {score.total}</span></h1>
        <p className="mt-2 text-sm text-amber-100/70">用时 {formatTime(score.elapsedMs)} · 种子 {config.seed}</p>
        <p role="status" className="mt-1 text-xs text-amber-200/70">{record === null ? '正在保存成绩…' : record.saved ? `本机最佳：${record.best.correct}/${record.best.total} · ${formatTime(record.best.elapsedMs)}` : '无法保存本机最佳成绩，仅显示本局结果。'}</p>
      </header>
      <ol className="flex flex-col gap-2.5">
        {results.map((result, i) => {
          const question = questions[i];
          const selected = result.selectedSongIds ?? [];
          const answerIds = question.mode === 'mix' ? question.answerSongIds : [question.answerSongId];
          const cover = entryById.get(answerIds[0])?.coverPath;
          return (
            <li key={result.questionId} className={`flex items-center gap-3 rounded-xl border p-2.5 ${result.correct ? 'border-emerald-400/50 bg-emerald-900/20' : 'border-rose-400/50 bg-rose-900/20'}`}>
              <span className="w-6 text-center text-sm text-amber-100/60">{i + 1}</span>
              {cover && <img src={assetUrl(cover)} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />}
              <span className="min-w-0 flex-1">
                <b className="block break-words">{answerIds.map((id) => songById.get(id)?.title ?? id).join(' · ')}</b>
                <small className="block text-xs text-amber-100/50">{MODE_LABEL[question.mode]} · {result.correct ? '答对' : `选中：${selected.map((id) => songById.get(id)?.title ?? id).join('、') || '无'}`} · {formatTime(result.elapsedMs)}</small>
              </span>
            </li>
          );
        })}
      </ol>
      <button type="button" onClick={onRestart} className="mx-auto rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-amber-300 px-12 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-rose-900/40 hover:brightness-110">再玩一次</button>
    </main>
  );
}
