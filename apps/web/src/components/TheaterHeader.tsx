import { TROUPE_MEMBERS } from '../core/quiz.ts';
import { CrownEmblem, GramophoneIcon, StarEmblem } from './TheaterIcons.tsx';

export type LobbyView = 'stage' | 'jukebox' | 'troupe';

interface TheaterHeaderProps {
  onHome?: () => void;
  activeView?: LobbyView;
  onChangeView?: (view: LobbyView) => void;
  onOpenJukeboxModal?: () => void;
  songCount?: number;
  statusTag?: string;
}

export function TheaterHeader({
  onHome,
  activeView = 'stage',
  onChangeView,
  onOpenJukeboxModal,
  songCount = 10,
  statusTag,
}: TheaterHeaderProps) {
  const logoContent = (
    <span className="crest-logo-group">
      <img
        src={`${import.meta.env.BASE_URL}theme/logo.png`}
        width="168"
        height="38"
        alt="少女☆歌劇 レヴュースタァライト"
      />
      <span className="crest-sub-pill" aria-hidden="true">
        <StarEmblem size={11} /> 99TH STARLIGHT EDITION
      </span>
    </span>
  );

  return (
    <header className="theater-hud-bar">
      <div className="hud-wing-left">
        {onHome ? (
          <button type="button" className="crest-home-btn" onClick={onHome} aria-label="返回首页">
            {logoContent}
          </button>
        ) : (
          logoContent
        )}
      </div>

      {onChangeView ? (
        <nav className="hud-center-tabs" aria-label="剧场殿堂切换">
          <button
            type="button"
            className={`hud-nav-blade ${activeView === 'stage' ? 'is-active' : ''}`}
            onClick={() => onChangeView('stage')}
          >
            <StarEmblem size={14} />
            <span>选拔主舞台</span>
          </button>
          <button
            type="button"
            className={`hud-nav-blade ${activeView === 'jukebox' ? 'is-active' : ''}`}
            onClick={() => onChangeView('jukebox')}
          >
            <GramophoneIcon size={15} />
            <span>试听曲库</span>
          </button>
          <button
            type="button"
            className={`hud-nav-blade ${activeView === 'troupe' ? 'is-active' : ''}`}
            onClick={() => onChangeView('troupe')}
          >
            <CrownEmblem size={15} />
            <span>九九组名鉴</span>
          </button>
        </nav>
      ) : (
        onOpenJukeboxModal && (
          <div className="hud-center-tabs">
            <button type="button" className="hud-nav-blade" onClick={onOpenJukeboxModal}>
              <GramophoneIcon size={15} />
              <span>试听曲库 &amp; 九九组名鉴</span>
            </button>
          </div>
        )
      )}

      <div className="hud-wing-right">
        <span className="hud-status-plaque">
          <CrownEmblem size={14} />
          <span>{statusTag ?? '非官方猜歌游戏'}</span>
        </span>
      </div>
    </header>
  );
}

export function TheaterFooter() {
  return (
    <footer className="theater-footlight-bar">
      <div className="footlight-divider" aria-hidden="true">
        <span className="footlight-ray" />
        <span className="footlight-zero-plaque">⊕ POSITION ZERO · SEISHO MUSIC ACADEMY 99TH</span>
        <span className="footlight-ray" />
      </div>
      <div className="footlight-gems" aria-hidden="true">
        {TROUPE_MEMBERS.map((m) => (
          <span key={m.id} className="footlight-gem" style={{ '--gem': m.color } as React.CSSProperties} title={`${m.name} (${m.cv})`} />
        ))}
      </div>
    </footer>
  );
}
