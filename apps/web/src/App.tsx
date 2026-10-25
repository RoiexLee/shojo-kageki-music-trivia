import { useMemo, useState } from 'react';
import { fetchManifest, songs } from './data.ts';
import { resolveSeed, type Difficulty, type QuizConfig } from './core/quiz.ts';
import type { Manifest, ManifestEntry } from '@starlight/shared';
import { useQuizEngine } from './hooks/useQuizEngine.ts';
import { useAudioPlayer } from './hooks/useAudioPlayer.ts';
import { HomePage } from './pages/HomePage.tsx';
import { QuizPage } from './pages/QuizPage.tsx';
import { SummaryPage } from './pages/SummaryPage.tsx';

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const audio = useAudioPlayer();

  const engine = useQuizEngine(songs, config);
  const songById = useMemo(() => new Map(songs.map((s) => [s.id, s])), []);
  const entryById = useMemo(
    () => new Map<string, ManifestEntry>((manifest?.entries ?? []).map((e) => [e.id, e])),
    [manifest],
  );

  async function start() {
    try {
      const m = manifest ?? (await fetchManifest());
      if (!manifest) setManifest(m);
      setConfig({ mode: 'intro', difficulty, questionCount: 10, seed: resolveSeed() });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  }

  if (loadError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-bold text-rose-300">音频资源未就绪</h1>
        <p className="text-sm text-amber-100/70">{loadError}</p>
      </main>
    );
  }

  if (!config) {
    return <HomePage difficulty={difficulty} onDifficultyChange={setDifficulty} onStart={start} songCount={songs.length} />;
  }

  if (engine.state.phase === 'summary') {
    return (
      <SummaryPage
        difficulty={difficulty}
        results={engine.state.results}
        questions={engine.state.questions}
        songById={songById}
        entryById={entryById}
        onRestart={() => {
          audio.stop();
          setConfig(null);
        }}
      />
    );
  }

  if (!engine.state.current) return null;
  return (
    <QuizPage
      question={engine.state.current}
      questions={engine.state.questions}
      index={engine.state.index}
      answered={engine.state.answered}
      selectedId={engine.state.selectedId}
      score={engine.summary.correct}
      difficulty={difficulty}
      songById={songById}
      entryById={entryById}
      onSelect={engine.select}
      onNext={engine.next}
      audio={audio}
    />
  );
}
