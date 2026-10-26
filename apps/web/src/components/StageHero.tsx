const base = import.meta.env.BASE_URL;

const characters = [
  ['karen', '愛城華恋'],
  ['hikari', '神楽ひかり'],
  ['maya', '天堂真矢'],
] as const;

/** 舞台背景上的透明角色层；角色资源失败时保留已有 cast.png 作为降级。 */
export function StageHero() {
  return (
    <div className="stage-hero" aria-label="舞台少女主视觉">
      <img className="stage-hero-fallback" src={`${base}theme/cast.png`} alt="" width="1920" height="840" />
      <div className="stage-hero-lights" aria-hidden="true" />
      {characters.map(([id, name], index) => (
        <img
          key={id}
          className={`stage-character stage-character-${index}`}
          src={`${base}theme/characters/${id}.png`}
          alt=""
          width="1260"
          height="1740"
          loading={index === 0 ? 'eager' : 'lazy'}
          onError={(event) => { event.currentTarget.style.display = 'none'; }}
          data-character={name}
        />
      ))}
      <span className="stage-hero-star" aria-hidden="true">✦</span>
    </div>
  );
}
