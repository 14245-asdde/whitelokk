import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Canvas particles — optimized
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };

    // Меньше частиц, но красивее
    const COUNT = 50;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -Math.random() * 0.28 - 0.05,
      op: Math.random() * 0.3 + 0.04,
      phase: Math.random() * Math.PI * 2,
    }));

    let raf: number;
    let t = 0;

    function draw() {
      ctx!.clearRect(0, 0, W, H);
      t += 0.012;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
        if (p.x < -4) p.x = W + 4;
        if (p.x > W + 4) p.x = -4;

        const alpha = p.op * (0.75 + 0.25 * Math.sin(t + p.phase));
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx!.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    draw();
    window.addEventListener('resize', resize, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Blob — direct DOM, lerp, no setState
  useEffect(() => {
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const cur = { x: target.x, y: target.y };

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    let raf: number;
    let running = true;
    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
    function tick() {
      if (!running) return;
      cur.x = lerp(cur.x, target.x, 0.05);
      cur.y = lerp(cur.y, target.y, 0.05);
      if (blobRef.current) {
        blobRef.current.style.transform = `translate(${cur.x - 300}px, ${cur.y - 300}px)`;
      }
      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  // Scroll nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goAuth = useCallback(() => navigate(user ? '/dashboard' : '/auth'), [user, navigate]);

  const features = [
    { icon: '✦', title: 'Личный профиль', desc: 'Красивая страница с аватаром, баннером, биографией и значками' },
    { icon: '◈', title: 'Кастомизация', desc: 'Меняй цвета, анимации, фон, эффекты стекла под себя' },
    { icon: '◎', title: 'Музыка', desc: 'Загрузи трек прямо в профиль — с обложкой и плеером' },
    { icon: '⬡', title: 'Соцсети', desc: 'Все ссылки в одном месте — с цветными значками' },
    { icon: '◐', title: 'Discord', desc: 'Привяжи Discord аккаунт и показывай свой профиль' },
    { icon: '◆', title: 'Инвайт-система', desc: 'Закрытое сообщество — только по приглашению' },
  ];

  const steps = [
    { n: '01', title: 'Получи инвайт', desc: 'Попроси код у участника сообщества' },
    { n: '02', title: 'Создай аккаунт', desc: 'Email + никнейм + инвайт-код — и ты внутри' },
    { n: '03', title: 'Настрой профиль', desc: 'Открой дашборд и сделай страницу своей' },
  ];

  return (
    <div style={{ background: '#080808', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>

      {/* Particles canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Blob — GPU transform */}
      <div
        ref={blobRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.045) 0%, transparent 65%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0,
          willChange: 'transform',
        }}
      />

      {/* Grid */}
      <div className="grid-overlay" />
      <div className="grain-overlay" />

      {/* ── NAV ── */}
      <nav
        ref={navRef}
        className={`home-nav ${scrolled ? 'scrolled' : ''}`}
      >
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 24px',
          height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#000' }}>W</span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
              WhiteLokk
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user && (
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)',
                  padding: '8px 16px',
                  borderRadius: 9,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }}
              >
                Дашборд
              </button>
            )}
            <button onClick={goAuth} className="hero-btn-primary" style={{ padding: '9px 20px', fontSize: 13 }}>
              {user ? 'Мой профиль →' : 'Войти'}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', zIndex: 2,
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px',
      }}>
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'center',
          }}
            className="hero-grid"
          >
            {/* Left — text */}
            <div style={{ animation: 'fadeInUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards' }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 999, padding: '6px 14px', marginBottom: 28,
                fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#4ade80',
                  boxShadow: '0 0 6px #4ade80',
                  display: 'inline-block',
                  animation: 'pulse-soft 2s ease-in-out infinite',
                }} />
                Только по инвайту
              </div>

              <h1 style={{
                fontSize: 'clamp(40px, 6vw, 68px)',
                fontWeight: 900,
                lineHeight: 1.04,
                letterSpacing: '-2px',
                color: '#fff',
                marginBottom: 22,
              }}>
                Твой профиль.
                <br />
                <span style={{
                  background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.45) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Твои правила.
                </span>
              </h1>

              <p style={{
                fontSize: 16, lineHeight: 1.65,
                color: 'rgba(255,255,255,0.45)',
                maxWidth: 440, marginBottom: 36,
              }}>
                Создай уникальную биостраницу с музыкой, значками, Discord-профилем
                и полной кастомизацией. Только для приглашённых.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={goAuth} className="hero-btn-primary">
                  {user ? 'Открыть дашборд' : 'Создать профиль'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
                  </svg>
                </button>
                {!user && (
                  <button onClick={goAuth} className="hero-btn-secondary">
                    Войти
                  </button>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
                {[['∞', 'кастомизация'], ['🔒', 'закрытый клуб'], ['◎', 'ваш стиль']].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{v}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — mock profile card */}
            <div style={{
              display: 'flex', justifyContent: 'center',
              animation: 'fadeInUp 0.7s 0.15s cubic-bezier(0.22,1,0.36,1) both',
            }}>
              <MockProfile />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              fontSize: 11.5, fontWeight: 700, letterSpacing: '2px',
              color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 14,
            }}>
              ВОЗМОЖНОСТИ
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
              Всё что тебе нужно
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>
              Мощный набор инструментов для создания уникальной биостраницы
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 0.06} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            fontSize: 11.5, fontWeight: 700, letterSpacing: '2px',
            color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 14,
          }}>
            КАК ЭТО РАБОТАЕТ
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 48 }}>
            Три шага
          </h2>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            {steps.map((s, i) => (
              <div
                key={i}
                style={{
                  flex: '1 1 200px', maxWidth: 240,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 18, padding: '28px 22px',
                  textAlign: 'left',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{
                  fontSize: 42, fontWeight: 900,
                  color: 'rgba(255,255,255,0.04)',
                  position: 'absolute', top: 12, right: 16,
                  lineHeight: 1, letterSpacing: -2,
                }}>{s.n}</div>
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, width: 36, height: 36,
                  lineHeight: '36px', textAlign: 'center',
                  fontSize: 15, fontWeight: 900, color: '#fff',
                  marginBottom: 14,
                }}>{s.n}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '80px 24px 120px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24, padding: '56px 40px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Glow */}
            <div style={{
              position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
              width: 300, height: 200,
              background: 'radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 14 }}>
              Готов начать?
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 32 }}>
              Получи инвайт-код и создай свой уникальный профиль прямо сейчас
            </p>
            <button onClick={goAuth} className="hero-btn-primary" style={{ fontSize: 15, padding: '14px 36px' }}>
              {user ? 'Открыть дашборд' : 'Начать — это бесплатно'}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'relative', zIndex: 2,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          © 2025 WhiteLokk · Только по инвайту
        </div>
      </footer>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

// ── Mock Profile Card ──
function MockProfile() {
  return (
    <div style={{
      width: 300,
      animation: 'float 5s ease-in-out infinite',
      filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.7))',
    }}>
      <div style={{
        borderRadius: 22,
        overflow: 'hidden',
        background: 'rgba(10,10,10,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 0 60px rgba(255,255,255,0.05)',
      }}>
        {/* Banner */}
        <div style={{
          height: 90,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)',
          }} />
        </div>

        <div style={{ padding: '0 18px 18px' }}>
          {/* Avatar */}
          <div style={{ marginTop: -32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'conic-gradient(#fff 0%, rgba(255,255,255,0.3) 50%, #fff 100%)',
              padding: 2, animation: 'spin-slow 6s linear infinite',
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: '#111',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 900, color: '#fff',
              }}>E</div>
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
            {['★', '♦', '◎', '⬡'].map((b, i) => (
              <div key={i} style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: 'rgba(255,255,255,0.7)',
              }}>{b}</div>
            ))}
          </div>

          {/* Name */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>ebatelmamok100_7</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>@ebatelmamok100_7</div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

          {/* Bio */}
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            Добро пожаловать в мой профиль 👋<br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>Разработчик · Дизайнер</span>
          </div>

          {/* Social */}
          <div style={{ display: 'flex', gap: 7, marginTop: 13 }}>
            {['T', 'D', 'G'].map((s, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.09)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
              }}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feature Card ──
function FeatureCard({ icon, title, desc, delay }: {
  icon: string; title: string; desc: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onEnter = useCallback(() => {
    if (ref.current) {
      ref.current.style.background = 'rgba(255,255,255,0.06)';
      ref.current.style.borderColor = 'rgba(255,255,255,0.14)';
      ref.current.style.transform = 'translateY(-4px)';
    }
  }, []);

  const onLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.background = 'rgba(255,255,255,0.03)';
      ref.current.style.borderColor = 'rgba(255,255,255,0.07)';
      ref.current.style.transform = 'translateY(0)';
    }
  }, []);

  return (
    <div
      ref={ref}
      className="feature-card"
      style={{ animationDelay: `${delay}s` }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, marginBottom: 16,
        color: '#fff',
      }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}
