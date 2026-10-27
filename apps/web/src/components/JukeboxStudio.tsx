import { useEffect, useMemo, useState } from 'react';
import { TROUPE_MEMBERS, type LyricsData, type Song } from '../core/quiz.ts';
import { assetUrl, parseLyrics } from '../data.ts';
import { GramophoneIcon, StarEmblem } from './TheaterIcons.tsx';

interface JukeboxStudioProps {
  mode: 'inline' | 'modal';
  initialTab?: 'songs' | 'troupe';
  onTabChange?: (tab: 'songs' | 'troupe') => void;
  onClose?: () => void;
  songs: Song[];
  onPreviewSong: (songId: string) => void;
  previewingSongId: string | null;
  isPlaying: boolean;
  onStopPreview: () => void;
  onAccentChange?: (color: string) => void;
}

const base = import.meta.env.BASE_URL;

/**
 * 试听曲库 & 九九组名鉴：
 * - 曲库殿堂：左侧按歌名排序的黑胶唱片架 + 右侧大师级黑胶唱机、全曲播放与中日双语完整台本鉴赏
 * - 九九组名鉴：按学号排序的 9 位 99 期舞台少女立绘档案卡片阵 + 专属应援色舞台追光联动
 */
export function JukeboxStudio({
  mode,
  initialTab = 'songs',
  onClose,
  songs,
  onPreviewSong,
  previewingSongId,
  isPlaying,
  onStopPreview,
  onAccentChange,
}: JukeboxStudioProps) {
  const sortedSongs = useMemo(
    () => [...songs].sort((a, b) => a.title.localeCompare(b.title, 'ja', { numeric: true, sensitivity: 'base' })),
    [songs],
  );
  const [tab, setTab] = useState<'songs' | 'troupe'>(initialTab);
  const [selectedSongId, setSelectedSongId] = useState<string>(sortedSongs[0]?.id ?? 'san-nana-go-ichi-zero');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(TROUPE_MEMBERS[0].id);
  const [lyricsPreview, setLyricsPreview] = useState<LyricsData | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (previewingSongId) {
      setSelectedSongId(previewingSongId);
    }
  }, [previewingSongId]);

  // 异步加载选中歌曲的中日双语完整歌词供鉴赏
  useEffect(() => {
    if (!selectedSongId || typeof fetch === 'undefined') return;
    let cancelled = false;
    fetch(assetUrl(`lyrics/${selectedSongId}.json`))
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return;
        try {
          setLyricsPreview(parseLyrics(json, selectedSongId));
        } catch {
          setLyricsPreview(null);
        }
      })
      .catch(() => {
        if (!cancelled) setLyricsPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSongId]);

  useEffect(() => {
    if (mode !== 'modal' || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, onClose]);

  const activeSong = sortedSongs.find((s) => s.id === selectedSongId) ?? sortedSongs[0];
  const isCurrentSongPlaying = previewingSongId === activeSong?.id && isPlaying;

  const content = (
    <section
      className={`jukebox-grand-hall ${mode === 'modal' ? 'is-modal-hall' : 'is-inline-hall'}`}
      aria-label={tab === 'troupe' ? '九九组名鉴' : '试听曲库'}
    >
      {mode === 'modal' && onClose && (
        <header className="hall-modal-bar">
          <button type="button" className="hall-close-btn" onClick={onClose} aria-label="返回舞台">
            ✕ 关闭窗口
          </button>
        </header>
      )}

      {tab === 'songs' && activeSong ? (
        <div className="jukebox-master-layout">
          {/* 左侧：按歌曲名称排序的黑胶唱片架 */}
          <div className="jukebox-rack-list" role="listbox" aria-label="收录歌曲列表">
            {sortedSongs.map((song, idx) => {
              const isSelected = song.id === activeSong.id;
              const isThisPlaying = previewingSongId === song.id && isPlaying;
              const cover = assetUrl(`covers/${song.id}.jpg`);
              return (
                <div
                  key={song.id}
                  className={`rack-vinyl-item ${isSelected ? 'is-selected' : ''} ${isThisPlaying ? 'is-playing' : ''}`}
                  onClick={() => setSelectedSongId(song.id)}
                >
                  <div className="rack-sleeve-thumb">
                    <img
                      src={cover}
                      alt=""
                      width="60"
                      height="60"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.opacity = '0.25';
                      }}
                    />
                    <span className={`rack-mini-disc ${isThisPlaying ? 'spinning' : ''}`} aria-hidden="true" />
                  </div>
                  <div className="rack-item-info">
                    <div className="rack-item-top">
                      <span className="rack-index">#{String(idx + 1).padStart(3, '0')}</span>
                      <span className="rack-type-tag">{song.type}</span>
                    </div>
                    <strong>{song.title}</strong>
                    <small>{song.origin}</small>
                  </div>
                  <button
                    type="button"
                    className={`rack-play-trigger ${isThisPlaying ? 'is-active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSongId(song.id);
                      if (isThisPlaying) onStopPreview();
                      else onPreviewSong(song.id);
                    }}
                  >
                    {isThisPlaying ? '■ 停止' : '▶ 全曲'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 右侧：大师级黑胶唱机与曲目考据台 */}
          <aside className="jukebox-deck-showcase" aria-label="当前选中曲目鉴赏台">
            <div className="deck-turntable-hero">
              <div className={`deck-giant-vinyl ${isCurrentSongPlaying ? 'is-spinning' : ''}`}>
                <div className="giant-vinyl-grooves" />
                <img
                  className="giant-vinyl-cover"
                  src={assetUrl(`covers/${activeSong.id}.jpg`)}
                  alt={activeSong.title}
                  width="180"
                  height="180"
                  onError={(e) => {
                    e.currentTarget.style.opacity = '0.3';
                  }}
                />
              </div>
              <div className="deck-song-header">
                <span className="deck-badge-pill">
                  <StarEmblem size={12} /> {activeSong.type} · {activeSong.origin}
                </span>
                <h3>{activeSong.title}</h3>
                {activeSong.romaji && <p className="deck-romaji">{activeSong.romaji}</p>}
                {activeSong.aliases && activeSong.aliases.length > 0 && (
                  <p className="deck-aliases">常用译名：{activeSong.aliases.join(' / ')}</p>
                )}
                <p className="deck-singers">
                  演唱阵容：{(activeSong.singers ?? ['スタァライト九九組']).join('・')}
                </p>
                {activeSong.description && <blockquote className="deck-critique">{activeSong.description}</blockquote>}
                <div className="deck-action-bar">
                  <button
                    type="button"
                    className="imperial-cta-btn deck-play-cta"
                    onClick={() => (isCurrentSongPlaying ? onStopPreview() : onPreviewSong(activeSong.id))}
                  >
                    <GramophoneIcon size={18} />
                    <span>{isCurrentSongPlaying ? '停止全曲播放' : '播放全曲'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 完整双语歌词台本预览 */}
            <div className="deck-libretto-preview">
              <div className="libretto-preview-title">
                <StarEmblem size={12} />
                <span>STAGE LIBRETTO · 歌剧台本歌词</span>
              </div>
              {lyricsPreview && lyricsPreview.lines.length > 0 ? (
                <div className="libretto-lines-scroll">
                  {lyricsPreview.lines
                    .filter((l) => l.text.trim().length > 0)
                    .map((line, i) => (
                      <div key={i} className="libretto-bilingual-row">
                        <p lang="ja" className="libretto-jp">
                          {line.text}
                        </p>
                        {line.translation && (
                          <p lang="zh" className="libretto-zh">
                            {line.translation}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="libretto-empty">台本装订中，点击上方按钮即可聆听全曲旋律。</p>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <div className="troupe-gallery-layout">
          {/* 九九组 9 人立绘宝石名片阵 */}
          <div className="troupe-cards-grid">
            {TROUPE_MEMBERS.map((m) => {
              const isSelected = m.id === selectedMemberId;
              const portraitSrc = `${base}theme/characters/${m.id}.png`;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`troupe-dossier-card ${isSelected ? 'is-selected' : ''}`}
                  style={{ '--member-color': m.color } as React.CSSProperties}
                  onClick={() => {
                    setSelectedMemberId(m.id);
                    onAccentChange?.(m.color);
                  }}
                >
                  <div className="dossier-info-col">
                    <div className="dossier-top">
                      <span className="dossier-no">No. {String(m.number).padStart(2, '0')}</span>
                      <span className="dossier-color-chip">
                        <i className="dossier-gem" style={{ backgroundColor: m.color }} />
                        {m.colorName}
                      </span>
                    </div>
                    <strong className="dossier-name">{m.name}</strong>
                    <small className="dossier-romaji">{m.romaji}</small>
                    <span className="dossier-cv">CV. {m.cv}</span>
                    <span className="dossier-epithet">「{m.epithet}」</span>
                  </div>
                  <div className="dossier-portrait-wrap" aria-hidden="true">
                    <img
                      className="dossier-portrait-img"
                      src={portraitSrc}
                      alt=""
                      width="240"
                      height="334"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );

  if (mode === 'modal') {
    return (
      <div
        className="jukebox-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="试听曲库与九九组名鉴"
        onClick={onClose}
      >
        <div className="jukebox-modal-shell" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
