import { DIFFICULTY_LABEL, type Difficulty } from '../core/quiz.ts';

interface Props {
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onStart: () => void;
  songCount: number;
}

const MODES = [
  { id: 'intro', title: '开头猜歌', copy: '听歌曲开头，选出它是哪一首。', enabled: true },
  { id: 'lyrics', title: '歌词猜歌', copy: '一句歌词，猜出它的出处。（即将登场）', enabled: false },
  { id: 'reverse', title: '倒放猜歌', copy: '倒放的旋律，还能认出来吗？（即将登场）', enabled: false },
  { id: 'mix', title: '混合连猜', copy: '多首连播，全部选出。（即将登场）', enabled: false },
] as const;

export function HomePage({ difficulty, onDifficultyChange, onStart, songCount }: Props) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-4 py-10">
      <header className="text-center">
        <p className="text-sm tracking-widest text-amber-200/80">少女☆歌劇 レヴュースタァライト</p>
        <h1 className="mt-2 text-3xl font-bold">舞台猜歌 ★ スタァライトクイズ</h1>
        <p className="mt-2 text-sm text-amber-100/70">曲库 {songCount} 首 · 每局 10 题 · 听片段猜歌名</p>
      </header>

      <section aria-label="玩法" className="grid grid-cols-2 gap-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={!m.enabled}
            className={[
              'rounded-xl border p-4 text-left transition',
              m.enabled
                ? 'border-amber-300/40 bg-purple-900/40 hover:border-amber-200/80 hover:bg-purple-800/50'
                : 'cursor-not-allowed border-white/10 bg-black/20 opacity-50',
            ].join(' ')}
          >
            <span className="block font-bold">{m.title}</span>
            <span className="mt-1 block text-xs text-amber-100/70">{m.copy}</span>
          </button>
        ))}
      </section>

      <section aria-label="难度" className="flex justify-center gap-2">
        {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDifficultyChange(d)}
            aria-pressed={difficulty === d}
            className={[
              'rounded-full px-5 py-2 text-sm font-semibold transition',
              difficulty === d
                ? 'bg-amber-300 text-purple-950'
                : 'border border-amber-200/40 text-amber-100/80 hover:bg-amber-200/10',
            ].join(' ')}
          >
            {DIFFICULTY_LABEL[d]}
            <span className="ml-1 text-xs opacity-70">
              {d === 'easy' ? '15秒·3选' : d === 'normal' ? '10秒·4选' : '5秒·6选'}
            </span>
          </button>
        ))}
      </section>

      <button
        type="button"
        onClick={onStart}
        className="mx-auto rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-amber-300 px-12 py-3 text-lg font-bold text-purple-950 shadow-lg shadow-rose-900/40 transition hover:brightness-110"
      >
        开始答题
      </button>

      <footer className="text-center text-xs text-amber-100/40">
        非官方粉丝作品 · 素材版权归 Bushiroad 等原权利方 · 仅本地游玩
      </footer>
    </main>
  );
}
