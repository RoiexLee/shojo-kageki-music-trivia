import { useEffect, useRef } from 'react';

interface TheaterBackdropProps {
  accentColor?: string;
  curtainKey?: string;
}

interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
  isGold: boolean;
}

/**
 * 全屏歌剧舞台三维空间与 Canvas 动态星尘粒子引擎：
 * 1. 60fps Canvas 黄金星尘与鼠标星芒涟漪（支持 reduced-motion 自动静默）
 * 2. 巨型三层正逆旋转星象时钟大法阵（SVG Grand Clockwork Astrolabe）
 * 3. 3D 透视舞台地板与 [POSITION ZERO] 零点十字灯阵
 * 4. 立体天鹅绒歌剧红幕与动态染色体积光追光灯
 */
export function TheaterBackdrop({ accentColor = '#FB5458', curtainKey = 'lobby' }: TheaterBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const count = Math.min(52, Math.max(24, Math.floor(width / 32)));
    const particles: StarParticle[] = Array.from({ length: count }, (_, i) => ({
      x: ((i * 97) % 100) * (width / 100),
      y: ((i * 53) % 100) * (height / 100),
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.22 - Math.random() * 0.45,
      size: 1.2 + Math.random() * 2.4,
      alpha: 0.2 + Math.random() * 0.65,
      phase: Math.random() * Math.PI * 2,
      isGold: i % 3 !== 0,
    }));

    const trail: Array<{ x: number; y: number; r: number; alpha: number }> = [];
    const handlePointerMove = (e: PointerEvent) => {
      if (trail.length < 18) {
        trail.push({ x: e.clientX, y: e.clientY, r: 2.2, alpha: 0.75 });
      }
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    let rafId = 0;
    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx + Math.sin(now * 0.001 + p.phase) * 0.12;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const twinkle = 0.55 + 0.45 * Math.sin(now * 0.003 + p.phase);
        const a = p.alpha * twinkle;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.isGold ? `rgba(248, 223, 165, ${a})` : `rgba(251, 110, 130, ${a * 0.85})`;
        ctx.beginPath();
        // 绘制十字星芒微粒
        const s = p.size;
        ctx.moveTo(0, -s * 1.8);
        ctx.lineTo(s * 0.45, -s * 0.45);
        ctx.lineTo(s * 1.8, 0);
        ctx.lineTo(s * 0.45, s * 0.45);
        ctx.lineTo(0, s * 1.8);
        ctx.lineTo(-s * 0.45, s * 0.45);
        ctx.lineTo(-s * 1.8, 0);
        ctx.lineTo(-s * 0.45, -s * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      for (let i = trail.length - 1; i >= 0; i--) {
        const t = trail[i];
        t.alpha -= 0.032;
        t.r += 0.25;
        if (t.alpha <= 0) {
          trail.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(248, 223, 165, ${t.alpha * 0.45})`;
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return (
    <div
      className="theater-cosmos"
      aria-hidden="true"
      style={{ '--stage-accent': accentColor } as React.CSSProperties}
    >
      {/* 远景歌剧穹顶与机械星象仪 */}
      <div className="cosmos-clockwork">
        <svg viewBox="0 0 1000 1000" fill="none" className="clockwork-svg">
          <defs>
            <radialGradient id="stage-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.22" />
              <stop offset="48%" stopColor="#e5c384" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0d0610" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="500" cy="500" r="480" fill="url(#stage-core-glow)" />

          {/* 外环：99期星宫刻度 */}
          <g className="cw-ring-1">
            <circle cx="500" cy="500" r="446" stroke="#e5c384" strokeOpacity="0.24" strokeWidth="1.2" />
            <circle cx="500" cy="500" r="430" stroke="#e5c384" strokeOpacity="0.32" strokeWidth="1" strokeDasharray="4 12" />
            {Array.from({ length: 36 }, (_, i) => {
              const rad = (i * 10 * Math.PI) / 180;
              const r1 = i % 3 === 0 ? 404 : 416;
              return (
                <line
                  key={i}
                  x1={500 + Math.cos(rad) * r1}
                  y1={500 + Math.sin(rad) * r1}
                  x2={500 + Math.cos(rad) * 444}
                  y2={500 + Math.sin(rad) * 444}
                  stroke="#f8dfa5"
                  strokeOpacity={i % 3 === 0 ? 0.55 : 0.22}
                  strokeWidth={i % 3 === 0 ? 2 : 1}
                />
              );
            })}
          </g>

          {/* 中环：逆向八芒命运罗盘 */}
          <g className="cw-ring-2">
            <circle cx="500" cy="500" r="342" stroke="#e5c384" strokeOpacity="0.28" strokeWidth="1.4" />
            <polygon
              points="500,158 585,415 842,500 585,585 500,842 415,585 158,500 415,415"
              stroke="#f8dfa5"
              strokeOpacity="0.28"
              strokeWidth="1.2"
            />
            <rect x="258" y="258" width="484" height="484" stroke="#e5c384" strokeOpacity="0.16" transform="rotate(45 500 500)" />
            <rect x="258" y="258" width="484" height="484" stroke="#e5c384" strokeOpacity="0.16" />
          </g>

          {/* 内环：圣翔零点准星 */}
          <g className="cw-ring-3">
            <circle cx="500" cy="500" r="196" stroke="#f8dfa5" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="8 6" />
            <circle cx="500" cy="500" r="120" stroke="#e5c384" strokeOpacity="0.25" strokeWidth="1" />
            <line x1="500" y1="40" x2="500" y2="960" stroke="#e5c384" strokeOpacity="0.14" />
            <line x1="40" y1="500" x2="960" y2="500" stroke="#e5c384" strokeOpacity="0.14" />
          </g>
        </svg>
      </div>

      {/* 3D 透视舞台地板网格（Stage Floor Perspective Grid） */}
      <div className="theater-floor-grid">
        <div className="floor-zero-line">
          <span>⊕ POSITION ZERO · STARLIGHT STAGE</span>
        </div>
      </div>

      {/* 动态体积追光灯束 */}
      <div className="theater-beam beam-left" />
      <div className="theater-beam beam-center" />
      <div className="theater-beam beam-right" />

      {/* 60fps 星尘粒子画布 */}
      <canvas ref={canvasRef} className="theater-particle-canvas" />

      {/* 歌剧院天鹅绒大幕画框 */}
      <div className="velvet-arch-top" />
      <div className="velvet-curtain curtain-left" />
      <div className="velvet-curtain curtain-right" />

      {/* 场景切换刀锋星芒扫掠层 */}
      <div key={curtainKey} className="act-transition-slash" />
    </div>
  );
}
