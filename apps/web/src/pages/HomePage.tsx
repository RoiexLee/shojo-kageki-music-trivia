import { DIFFICULTY_LABEL, MODE_DIFFICULTY_MAP, MODE_LABEL, type Difficulty, type QuizMode } from '../core/quiz.ts';

interface Props {
  mode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onStart: () => void;
  songCount: number;
  loading: boolean;
  error: string | null;
}

const COPY: Record<QuizMode, string> = {
  intro: '听歌曲开头，选出它是哪一首。',
  lyrics: '一句日文歌词，认出熟悉的旋律。',
  reverse: '倒放八秒，挑战你的音乐记忆。',
  mix: '两至三首副歌顺序连播，选出全部歌曲。',
};

export function HomePage({ mode, onModeChange, difficulty, onDifficultyChange, onStart, songCount, loading, error }: Props) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-4 py-10">
      <header className="text-center">
        <p className="text-sm tracking-widest text-amber-200/80">少女☆歌劇 レヴュースタァライト</p>
        <h1 className="mt-2 text-3xl font-bold">舞台猜歌 ★ スタァライトクイズ</h1>
        <p className="mt-2 text-sm text-amber-100/70">曲库 {songCount} 首 · 每局 10 题 · 听片段猜歌名</p>
      </header>
      <section aria-label="玩法" className="grid grid-cols-2 gap-3">
        {(Object.keys(MODE_LABEL) as QuizMode[]).map((value) => (
          <button key={value} type="button" disabled={loading} onClick={() => onModeChange(value)} aria-pressed={mode === value}
            className={`rounded-xl border p-4 text-left transition ${mode === value ? 'border-amber-300 bg-purple-800/70' : 'border-amber-300/30 bg-purple-900/40 hover:border-amber-200/80'}`}>
            <span className="block font-bold">{MODE_LABEL[value]}</span>
            <span className="mt-1 block text-xs leading-relaxed text-amber-100/70">{COPY[value]}</span>
          </button>
        ))}
      </section>
      <section aria-label="难度" className="flex flex-wrap justify-center gap-2">
        {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((value) => {
          const spec = MODE_DIFFICULTY_MAP[mode][value];
          return (
            <button key={value} type="button" disabled={loading} onClick={() => onDifficultyChange(value)} aria-pressed={difficulty === value}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${difficulty === value ? 'bg-amber-300 text-purple-950' : 'border border-amber-200/40 text-amber-100/80 hover:bg-amber-200/10'}`}>
              {DIFFICULTY_LABEL[value]}<span className="ml-1 text-xs opacity-70">{spec.optionCount} 选 {spec.answerCount}</span>
            </button>
          );
        })}
      </section>
      <p className="text-center text-sm text-amber-100/70">
        {mode === 'intro' ? `播放 ${difficulty === 'easy' ? 15 : difficulty === 'normal' ? 10 : 5} 秒开头` : mode === 'lyrics' ? '无音频 · 简单难度提供作品出处' : mode === 'reverse' ? '播放 8 秒倒放 · 简单难度提供歌词提示' : `每段 10 秒 · 间隔半秒 · 全部选对才得分`}
      </p>
      {error && <p role="alert" className="text-center text-sm text-rose-300">{error} 可再次点击开始重试。</p>}
      <button type="button" onClick={onStart} disabled={loading}
        className="mx-auto rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-amber-300 px-12 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-rose-900/40 transition hover:brightness-110 disabled:opacity-60">
        {loading ? '准备中…' : '开始答题'}
      </button>
      <footer className="text-center text-xs text-amber-100/50">非官方粉丝作品 · 素材版权归 Bushiroad 等原权利方 · 仅本地游玩</footer>
    </main>
  );
}
