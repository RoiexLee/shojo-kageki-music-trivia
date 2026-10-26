export function Brand({ onHome }: { onHome?: () => void }) {
  const logo = <img src={`${import.meta.env.BASE_URL}theme/logo.png`} width="174" height="40" alt="少女☆歌劇 レヴュースタァライト" />;
  return <header className="brand-header">
    {onHome ? <button type="button" className="brand-home" onClick={onHome} aria-label="返回首页">{logo}</button> : logo}
    <span>非官方猜歌游戏</span>
  </header>;
}

export function Footer() {
  return <footer className="site-footer">非官方粉丝作品 · 素材版权归原权利方 · 仅限本地学习</footer>;
}

export function Arrow() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}
