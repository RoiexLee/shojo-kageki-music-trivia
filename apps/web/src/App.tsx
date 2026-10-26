import { useMemo, useRef, useState } from 'react';
import { fetchLyrics, fetchManifest, songs } from './data.ts';
import { resolveSeed, type Difficulty, type LyricsById, type QuizConfig, type QuizMode } from './core/quiz.ts';
import type { Manifest, ManifestEntry } from '@starlight/shared';
import { useQuizEngine } from './hooks/useQuizEngine.ts';
import { useAudioPlayer } from './hooks/useAudioPlayer.ts';
import { HomePage } from './pages/HomePage.tsx';
import { QuizPage } from './pages/QuizPage.tsx';
import { SummaryPage } from './pages/SummaryPage.tsx';

const emptyLyrics: LyricsById = {};

export default function App() {
  const [mode, setMode] = useState<QuizMode>('intro');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [lyrics, setLyrics] = useState<LyricsById | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const starting = useRef(false);
  const audio = useAudioPlayer();
  const engine = useQuizEngine(songs, config, lyrics ?? emptyLyrics);
  const songById = useMemo(() => new Map(songs.map((s) => [s.id, s])), []);
  const entryById = useMemo(
    () => new Map<string, ManifestEntry>((manifest?.entries ?? []).map((e) => [e.id, e])), [manifest],
  );

  async function start() {
    if (starting.current) return;
    starting.current = true;
    setLoading(true);
    setLoadError(null);
    try {
      const needsLyrics = mode === 'lyrics' || (mode === 'reverse' && difficulty === 'easy');
      const [m, l] = await Promise.all([
        manifest ?? fetchManifest(),
        needsLyrics ? lyrics ?? fetchLyrics() : lyrics,
      ]);
      setManifest(m);
      setLyrics(l);
      setConfig({ mode, difficulty, questionCount: 10, seed: resolveSeed() });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : '资源加载失败，请重试。');
    } finally {
      starting.current = false;
      setLoading(false);
    }
  }

  function home() { audio.stop(); setConfig(null); setLoadError(null); }

  if (!config) return (
    <HomePage mode={mode} onModeChange={setMode} difficulty={difficulty} onDifficultyChange={setDifficulty}
      onStart={start} songCount={songs.length} loading={loading} error={loadError} />
  );

  if (engine.state.error) return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-bold">暂时无法开演</h1>
      <p role="alert">{engine.state.error}</p>
      <button type="button" onClick={home} className="rounded-full bg-amber-300 px-6 py-3 font-bold text-purple-950">返回首页</button>
    </main>
  );

  if (engine.state.phase === 'summary') return (
    <SummaryPage config={config} results={engine.state.results} questions={engine.state.questions}
      songById={songById} entryById={entryById} onRestart={home} />
  );

  if (!engine.state.current) return <p role="status" className="p-10 text-center">正在准备舞台…</p>;
  return (
    <QuizPage question={engine.state.current} questions={engine.state.questions} index={engine.state.index}
      answered={engine.state.answered} selectedIds={engine.state.selectedIds} score={engine.summary.correct}
      difficulty={config.difficulty} songById={songById} entryById={entryById}
      onSelect={engine.select} onConfirm={engine.confirm} onNext={engine.next} onExit={home} audio={audio} />
  );
}
