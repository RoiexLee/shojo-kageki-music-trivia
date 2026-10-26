import { DIFFICULTY_LABEL, MODE_DIFFICULTY_MAP, MODE_LABEL, type Difficulty, type QuizMode } from '../core/quiz.ts';
import { Arrow, Brand, Footer } from '../components/Brand.tsx';

interface Props {
  mode: QuizMode; onModeChange: (mode: QuizMode) => void;
  difficulty: Difficulty; onDifficultyChange: (difficulty: Difficulty) => void;
  onStart: () => void; songCount: number; loading: boolean; error: string | null;
}

const COPY: Record<QuizMode, string> = {
  intro: '聆听歌曲开头，猜出歌名', lyrics: '根据一句歌词，认出旋律',
  reverse: '从倒放的旋律中，认出歌曲', mix: '多首副歌依次连播，全部选出',
};

export function HomePage({ mode, onModeChange, difficulty, onDifficultyChange, onStart, songCount, loading, error }: Props) {
  const spec = MODE_DIFFICULTY_MAP[mode][difficulty];
  const rule = mode === 'intro' ? `${difficulty === 'easy' ? 15 : difficulty === 'normal' ? 10 : 5} 秒片段`
    : mode === 'lyrics' ? '一句歌词' : mode === 'reverse' ? '8 秒倒放' : `${spec.answerCount} 首 × 10 秒`;
  return (
    <main className="app-shell home-page">
      <Brand />
      <section className="hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <h1 id="home-title">听见旋律，<br />再赴舞台。</h1>
          <p className="hero-subtitle">少女☆歌剧 Revue Starlight 猜歌挑战</p>
          <p className="hero-meta">{songCount} 首歌曲 · 每局 10 题 · 三档难度</p>
        </div>
        <img className="hero-art" src={`${import.meta.env.BASE_URL}theme/cast.png`} alt="身着舞台服的圣翔音乐学园九位舞台少女" width="1920" height="840" fetchPriority="high" />
      </section>
      <section className="mode-section" aria-labelledby="mode-title">
        <h2 className="section-heading" id="mode-title">选择你的舞台</h2>
        <div className="mode-grid">
          {(Object.keys(MODE_LABEL) as QuizMode[]).map((value) => (
            <button key={value} type="button" className="mode-choice" disabled={loading} onClick={() => onModeChange(value)} aria-pressed={mode === value}>
              <span>{MODE_LABEL[value]}</span><small>{COPY[value]}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="setup-bar" aria-label="难度与开始">
        <div className="difficulty-control" aria-label="难度">
          {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((value) => (
            <button key={value} type="button" disabled={loading} onClick={() => onDifficultyChange(value)} aria-pressed={difficulty === value}>{DIFFICULTY_LABEL[value]}</button>
          ))}
        </div>
        <p className="setup-rule" aria-live="polite">{rule} · {spec.optionCount} 选 {spec.answerCount}</p>
        <button type="button" className="primary-button start-button" onClick={onStart} disabled={loading}>{loading ? '准备中…' : '开始答题'}<Arrow /></button>
      </section>
      <p className="mode-hint">{mode === 'lyrics' ? '无需播放音频。简单难度附作品出处，作答后揭晓中文歌词。' : mode === 'mix' ? '片段间隔半秒，可反复重听；选满后确认，全部选对才得分。' : mode === 'reverse' ? '简单难度附一句歌词提示。片段可以无限次重听。' : '听不清也没关系，片段可以无限次重听。点击选项即提交答案。'}</p>
      {error && <p role="alert" className="error-notice">{error} 可再次点击开始重试。</p>}
      <Footer />
    </main>
  );
}
