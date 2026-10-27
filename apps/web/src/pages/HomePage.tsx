import { useEffect, useState, type PointerEvent } from 'react';
import {
  DIFFICULTY_LABEL,
  MODE_DIFFICULTY_MAP,
  MODE_LABEL,
  TROUPE_MEMBERS,
  formatTime,
  type Difficulty,
  type QuizMode,
  type Song,
} from '../core/quiz.ts';
import { loadBest } from '../core/best.ts';
import { CrownEmblem, ModeCrest, RapierArrow, StarEmblem } from '../components/TheaterIcons.tsx';
import { TheaterFooter, TheaterHeader, type LobbyView } from '../components/TheaterHeader.tsx';
import { JukeboxStudio } from '../components/JukeboxStudio.tsx';

interface Props {
  mode: QuizMode;
  onModeChange: (mode: QuizMode) => void;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onStart: () => void;
  songCount: number;
  loading: boolean;
  error: string | null;
  songs?: Song[];
  onPreviewSong?: (songId: string) => void;
  previewingSongId?: string | null;
  isPlaying?: boolean;
  onStopPreview?: () => void;
  onAccentChange?: (color: string) => void;
}

const base = import.meta.env.BASE_URL;
const AUTO_ROTATE_MS = 4600;

const COPY: Record<QuizMode, string> = {
  intro: '聆听曲中片段，猜出歌名',
  lyrics: '展示日文歌词与中文译文，认出歌曲',
  reverse: '从倒放的旋律中，认出歌曲',
  mix: '两首副歌同步混合，全部选出',
};

const REVUE_SUBTITLE: Record<QuizMode, string> = {
  intro: 'REVUE I · MELODY AUDITION',
  lyrics: 'REVUE II · LIBRETTO SCRIPT',
  reverse: 'REVUE III · CHRONO REVERSAL',
  mix: 'REVUE IV · DUAL SYMPHONY',
};

const DIFFICULTY_STARS: Record<Difficulty, string> = {
  easy: '★☆☆',
  normal: '★★☆',
  hard: '★★★',
};

export function HomePage({
  mode,
  onModeChange,
  difficulty,
  onDifficultyChange,
  onStart,
  songCount,
  loading,
  error,
  songs = [],
  onPreviewSong = () => undefined,
  previewingSongId = null,
  isPlaying = false,
  onStopPreview = () => undefined,
  onAccentChange,
}: Props) {
  const [view, setView] = useState<LobbyView>('stage');
  const [selectedCastIndex, setSelectedCastIndex] = useState<number>(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const spec = MODE_DIFFICULTY_MAP[mode][difficulty];
  const rule =
    mode === 'intro'
      ? `${difficulty === 'easy' ? 15 : difficulty === 'normal' ? 10 : 5} 秒曲中片段`
      : mode === 'lyrics'
        ? '一句歌词'
        : mode === 'reverse'
          ? '8 秒倒放'
          : `${spec.answerCount} 首 × 10 秒`;

  const focusedMember = TROUPE_MEMBERS[selectedCastIndex] ?? TROUPE_MEMBERS[0];

  // 默认自动轮播切换舞台少女立绘与舞台主题聚光色
  useEffect(() => {
    if (view !== 'stage') return;
    const timer = window.setInterval(() => {
      setSelectedCastIndex((prev) => (prev + 1) % TROUPE_MEMBERS.length);
    }, AUTO_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [view, selectedCastIndex]);

  useEffect(() => {
    onAccentChange?.(focusedMember.color);
  }, [focusedMember.color, onAccentChange]);

  function handleStagePointer(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setTilt({ x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) });
  }

  function handleViewChange(nextView: LobbyView) {
    setView(nextView);
    if (nextView === 'stage') {
      onStopPreview();
    }
  }

  return (
    <main className="opera-viewport lobby-viewport">
      <TheaterHeader
        activeView={view}
        onChangeView={handleViewChange}
        songCount={songCount}
        statusTag="REVUE AUDITION · 地下剧场选拔"
      />

      {view !== 'stage' ? (
        <div className="lobby-hall-container">
          <JukeboxStudio
            mode="inline"
            initialTab={view === 'troupe' ? 'troupe' : 'songs'}
            onTabChange={(t) => setView(t === 'troupe' ? 'troupe' : 'jukebox')}
            onClose={() => handleViewChange('stage')}
            songs={songs}
            onPreviewSong={onPreviewSong}
            previewingSongId={previewingSongId}
            isPlaying={isPlaying}
            onStopPreview={onStopPreview}
            onAccentChange={onAccentChange}
          />
        </div>
      ) : (
        <div className="grand-audition-deck">
          {/* 左翼：全景 3D 舞台少女剧场展示舱 */}
          <section className="grand-stage-wing" aria-label="舞台少女主视觉">
            <div
              className="panoramic-stage-box is-single-focus"
              onPointerMove={handleStagePointer}
              onPointerLeave={() => setTilt({ x: 0, y: 0 })}
              style={
                {
                  '--stage-focus-color': focusedMember.color,
                  transform: `perspective(1200px) rotateY(${tilt.x * 2.4}deg) rotateX(${-tilt.y * 1.8}deg)`,
                } as React.CSSProperties
              }
            >
              {/* 舞台天顶横梁 */}
              <div className="stage-canopy-bar">
                <span className="canopy-crest">
                  <StarEmblem size={12} /> POSITION ZERO · GRAND STAGE
                </span>
              </div>

              {/* 舞台远景横幅降级层与神圣星环 */}
              <img className="stage-hero-fallback" src={`${base}theme/cast.png`} alt="" width="1920" height="840" />
              <div
                className="stage-sacred-halo"
                aria-hidden="true"
                style={{ transform: `translate3d(${tilt.x * -16}px, ${tilt.y * -12}px, 0)` }}
              />
              <div
                className="stage-hero-lights"
                aria-hidden="true"
                style={{ transform: `translate3d(${tilt.x * -10}px, ${tilt.y * -6}px, 0)` }}
              />

              {/* 9 位角色官方透明立绘层：预挂载实现零闪烁丝滑聚光切换动画 */}
              <div className="stage-characters-viewport" aria-hidden="true">
                {TROUPE_MEMBERS.map((actor, idx) => {
                  const isActive = idx === selectedCastIndex;
                  return (
                    <img
                      key={actor.id}
                      className={`stage-character stage-character-solo ${isActive ? 'is-active' : 'is-inactive'}`}
                      src={`${base}theme/characters/${actor.id}.png`}
                      alt=""
                      width="1260"
                      height="1740"
                      loading={idx < 2 ? 'eager' : 'lazy'}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                      data-character={actor.name}
                      style={
                        {
                          '--char-glow': `${actor.color}99`,
                          '--char-tx': `${tilt.x * 12}px`,
                          '--char-ty': `${tilt.y * 6}px`,
                        } as React.CSSProperties
                      }
                    />
                  );
                })}
              </div>

              <span className="stage-hero-star" aria-hidden="true">
                ✦
              </span>

              {/* 舞台前沿九九组颜色条（9 位角色代表色切换） */}
              <div className="stage-apron-console">
                <div className="apron-troupe-matrix">
                  <div className="apron-gems-bar" role="group" aria-label="舞台少女立绘与代表色切换">
                    {TROUPE_MEMBERS.map((m, idx) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`apron-gem-trigger ${selectedCastIndex === idx ? 'is-active' : ''}`}
                        style={{ '--gem-color': m.color } as React.CSSProperties}
                        onClick={() => setSelectedCastIndex(idx)}
                        aria-label={`${m.name}（${m.colorName}）`}
                        title={`${m.name} · CV. ${m.cv}`}
                      >
                        <span className="gem-rhombus" style={{ backgroundColor: m.color }} />
                      </button>
                    ))}
                  </div>

                  <div className="apron-member-ticker">
                    <span key={focusedMember.id} className="ticker-member-line">
                      <i style={{ backgroundColor: focusedMember.color }} />
                      <strong>{focusedMember.name}</strong>
                      <small>
                        CV. {focusedMember.cv} · 「{focusedMember.epithet}」
                      </small>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 右翼：歌剧选拔剧目刀锋卡与开演扳机舱 */}
          <section className="audition-command-wing" aria-labelledby="mode-title">
            <div className="command-wing-header">
              <span className="wing-kicker">
                <StarEmblem size={12} /> SELECT YOUR REVUE REPERTOIRE
              </span>
              <h2 id="mode-title">选择你的舞台</h2>
            </div>

            <div className="repertoire-blades-grid">
              {(Object.keys(MODE_LABEL) as QuizMode[]).map((value) => {
                const best = loadBest(value, difficulty);
                const selected = mode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`mode-choice repertoire-blade mode-card-${value} ${selected ? 'is-selected' : ''}`}
                    disabled={loading}
                    onClick={() => onModeChange(value)}
                    aria-pressed={selected}
                  >
                    <div className="blade-header-row" aria-hidden="true">
                      <span className="blade-revue-code">{REVUE_SUBTITLE[value]}</span>
                      <span className="blade-crest-box">
                        <ModeCrest mode={value} />
                      </span>
                    </div>
                    <span className="blade-title-text">{MODE_LABEL[value]}</span>
                    <small className="blade-desc-text">{COPY[value]}</small>
                    <div className="blade-record-ribbon" aria-hidden="true">
                      {best ? (
                        <em className="ribbon-has-best">
                          <CrownEmblem size={13} /> 最佳 {best.correct} / {best.total} · {formatTime(best.elapsedMs)}
                        </em>
                      ) : (
                        <em>✦ {DIFFICULTY_LABEL[difficulty]}难度 · 尚未登台</em>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 难度星盘与开演点火控制台 */}
            <div className="ignition-console-box" aria-label="难度与开始">
              <div className="ignition-top-row">
                <div className="difficulty-selector-block">
                  <span className="ignition-sub-label">AUDITION TIER · 选拔星级</span>
                  <div className="difficulty-control" aria-label="难度">
                    {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        disabled={loading}
                        onClick={() => onDifficultyChange(value)}
                        aria-pressed={difficulty === value}
                      >
                        <i className="tier-stars" aria-hidden="true">
                          {DIFFICULTY_STARS[value]}
                        </i>
                        <span>{DIFFICULTY_LABEL[value]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rule-readout-box">
                  <span className="ignition-sub-label">STAGE SPEC · 本场规格</span>
                  <p className="setup-rule" aria-live="polite">
                    {rule} · {spec.optionCount} 选 {spec.answerCount}
                  </p>
                </div>
              </div>

              <p className="mode-hint">
                {mode === 'lyrics'
                  ? '同时展示日文主词与中文辅助译文，提交后播放该句歌词附近的原曲片段。'
                  : mode === 'mix'
                    ? '两首片段同刻开始，可反复重听；选满后确认，全部选对才得分。'
                    : mode === 'reverse'
                      ? '简单难度附一句歌词提示。片段可以无限次重听。'
                      : '听不清也没关系，片段可以无限次重听。点击选项即提交答案。'}
              </p>

              <button
                type="button"
                className="primary-button start-button imperial-cta-btn"
                onClick={onStart}
                disabled={loading}
              >
                <span className="cta-glint-sweep" aria-hidden="true" />
                <CrownEmblem size={20} />
                <span>{loading ? '准备中…' : '开始答题'}</span>
                <RapierArrow size={22} />
              </button>

              {error && (
                <p role="alert" className="error-notice">
                  {error} 可再次点击开始重试。
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      <TheaterFooter />
    </main>
  );
}
