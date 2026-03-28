import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  // Canvas частицы
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    const particles: {
      x: number; y: number; size: number;
      speedX: number; speedY: number; opacity: number; pulse: number;
    }[] = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.2 + 0.2,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: -Math.random() * 0.35 - 0.08,
        opacity: Math.random() * 0.35 + 0.04,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let animId: number;
    let frame = 0;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;
        const op = p.opacity * (0.8 + 0.2 * Math.sin(p.pulse));
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${op})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  // Blob за курсором
  useEffect(() => {
    const handleMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useEffect(() => {
    const blob = blobRef.current;
    if (!blob) return;
    blob.style.left = mousePos.x - 250 + 'px';
    blob.style.top = mousePos.y - 250 + 'px';
  }, [mousePos]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: '⬡', title: 'Персональный профиль', desc: 'Уникальный профиль с аватаром, баннером, биографией и значками' },
    { icon: '♪', title: 'Музыка', desc: 'Загрузи свой трек — он будет играть прямо на профиле' },
    { icon: '◈', title: 'Discord', desc: 'Привяжи Discord — аватар, ник, описание и тег' },
    { icon: '★', title: 'Значки', desc: 'Значки статуса только при наведении — без лишнего текста' },
    { icon: '◆', title: 'Соцсети', desc: 'Белые иконки с кастомным цветом — все твои платформы' },
    { icon: '◉', title: 'Аналитика', desc: 'Счётчик просмотров и числовой UID профиля' },
  ];

  const mockBadges = ['🔥', '⭐', '👑', '💎', '🛡️'];

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', position: 'relative', overflow: 'hidden', fontFamily: 'inherit' }}>
      {/* Canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Cursor blob */}
      <div ref={blobRef} style={{
        position: 'fixed', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(255,255,255,0.035) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(80px)',
        pointerEvents: 'none', zIndex: 1,
        transition: 'left 0.12s ease, top 0.12s ease',
      }} />

      {/* Grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
      }} />

      {/* Статичные блобы */}
      <div style={{
        position: 'fixed', top: '5%', left: '5%', width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(255,255,255,0.018) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '0%', right: '0%', width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(180,180,255,0.015) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 20 ? 'rgba(8,8,8,0.92)' : 'transparent',
        backdropFilter: scrollY > 20 ? 'blur(24px)' : 'none',
        borderBottom: scrollY > 20 ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        height: 60, display: 'flex', alignItems: 'center',
        padding: '0 40px', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 15, color: '#000', fontWeight: 900 }}>W</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.5px', color: '#fff' }}>WhiteLokk</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '8px 20px', borderRadius: 10,
                background: '#fff', border: 'none',
                color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'transform 0.15s, opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Дашборд →
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/auth')}
                style={{
                  padding: '8px 18px', borderRadius: 10,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.65)', fontSize: 13, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                Войти
              </button>
              <button
                onClick={() => navigate('/auth')}
                style={{
                  padding: '8px 20px', borderRadius: 10,
                  background: '#fff', border: 'none',
                  color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: '0 0 0 rgba(255,255,255,0)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 0 rgba(255,255,255,0)'; }}
              >
                Создать профиль
              </button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        textAlign: 'center', padding: '100px 24px 80px',
        gap: 0,
      }}>
        {/* Pill badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 6px 5px 14px', borderRadius: 999,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          marginBottom: 36, fontSize: 12, color: 'rgba(255,255,255,0.5)',
          animation: 'fadeIn 0.6s ease both',
        }}>
          Только по инвайт-коду
          <div style={{
            padding: '3px 10px', borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700,
          }}>
            BETA
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(52px, 9vw, 100px)',
          fontWeight: 900, letterSpacing: '-4px',
          lineHeight: 0.92, margin: '0 0 24px',
          animation: 'fadeInUp 0.7s ease both',
          animationDelay: '0.1s',
        }}>
          <span style={{
            background: 'linear-gradient(180deg, #ffffff 20%, rgba(255,255,255,0.4) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            White
          </span>
          <span style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Lokk
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'rgba(255,255,255,0.4)',
          maxWidth: 480, lineHeight: 1.65,
          margin: '0 0 44px',
          animation: 'fadeInUp 0.7s ease both',
          animationDelay: '0.18s',
          fontWeight: 400,
        }}>
          Твой персональный профиль с музыкой, Discord, значками и соцсетями. Полностью кастомизируемый.
        </p>

        {/* CTA */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeInUp 0.7s ease both',
          animationDelay: '0.26s',
        }}>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '13px 32px', borderRadius: 14,
              background: '#fff', border: 'none',
              color: '#000', fontSize: 14, fontWeight: 800,
              cursor: 'pointer', letterSpacing: '-0.3px',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 0 40px rgba(255,255,255,0.08)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(255,255,255,0.08)'; }}
          >
            Начать бесплатно →
          </button>
          <button
            onClick={() => { const el = document.getElementById('features'); el?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              padding: '13px 28px', borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)', fontSize: 14,
              cursor: 'pointer', letterSpacing: '-0.2px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            Узнать больше
          </button>
        </div>

        {/* Mock profile preview */}
        <div style={{
          marginTop: 72,
          animation: 'fadeInUp 0.8s ease both',
          animationDelay: '0.35s',
          position: 'relative',
        }}>
          {/* Glow under card */}
          <div style={{
            position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)',
            width: 300, height: 60,
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }} />

          {/* Mock card */}
          <div style={{
            width: 340, borderRadius: 20,
            background: 'rgba(10,10,10,0.85)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(30px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            overflow: 'hidden',
            animation: 'float 4s ease-in-out infinite',
          }}>
            {/* Banner */}
            <div style={{
              height: 90,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, transparent 40%, rgba(10,10,10,0.7) 100%)',
              }} />
              {/* Decorative lines */}
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: 15 + i * 20, left: 0, right: 0, height: 1,
                  background: `rgba(255,255,255,${0.04 - i * 0.008})`,
                }} />
              ))}
            </div>

            <div style={{ padding: '0 18px 18px' }}>
              {/* Avatar */}
              <div style={{ marginTop: -28, marginBottom: 10 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.3))',
                  padding: 2, boxShadow: '0 0 16px rgba(255,255,255,0.15)',
                }}>
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 900, color: 'rgba(255,255,255,0.8)',
                  }}>W</div>
                </div>
              </div>

              {/* Badges mock */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                {mockBadges.map((b, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, filter: 'grayscale(1) brightness(1.5)',
                  }}>{b}</div>
                ))}
              </div>

              {/* Name */}
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px' }}>WhiteLokk</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>@whitelokk <span style={{ opacity: 0.5 }}>#12345678</span></div>

              {/* Bio mock */}
              <div style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                marginBottom: 12,
              }}>
                {[70, 90, 55].map((w, i) => (
                  <div key={i} style={{
                    height: 8, borderRadius: 4,
                    background: 'rgba(255,255,255,0.12)',
                    width: `${w}%`, marginBottom: i < 2 ? 6 : 0,
                  }} />
                ))}
              </div>

              {/* Social icons mock */}
              <div style={{ display: 'flex', gap: 6 }}>
                {['T', 'D', 'G', 'Y'].map((s, i) => (
                  <div key={i} style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700,
                  }}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.2)', fontSize: 11,
          animation: 'pulse-soft 2s ease-in-out infinite',
        }}>
          <span>прокрути вниз</span>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)' }} />
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div id="features" style={{
        position: 'relative', zIndex: 10,
        padding: '80px 24px 120px',
        maxWidth: 1100, margin: '0 auto',
      }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 14px', borderRadius: 999,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 11, color: 'rgba(255,255,255,0.4)',
            letterSpacing: '1px', textTransform: 'uppercase',
            marginBottom: 20,
          }}>
            Возможности
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900,
            letterSpacing: '-2px', color: '#fff',
            background: 'linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Всё что нужно
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)', marginTop: 12 }}>
            Один профиль — всё о тебе
          </p>
        </div>

        {/* Features grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
        }}>
          {features.map((f, i) => (
            <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} delay={i * 0.06} />
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '60px 24px 120px',
        maxWidth: 800, margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 14px', borderRadius: 999,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11, color: 'rgba(255,255,255,0.4)',
          letterSpacing: '1px', textTransform: 'uppercase',
          marginBottom: 20,
        }}>
          Как это работает
        </div>
        <h2 style={{
          fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900,
          letterSpacing: '-2px', marginBottom: 52,
          background: 'linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          Три шага
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { num: '01', title: 'Получи инвайт', desc: 'Попроси инвайт-код у участника или дожись раздачи от админа' },
            { num: '02', title: 'Создай профиль', desc: 'Зарегистрируйся, загрузи аватар, баннер, добавь биографию и музыку' },
            { num: '03', title: 'Делись ссылкой', desc: 'Твой профиль доступен по ссылке domain/username — делись с миром' },
          ].map((step, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 24,
              padding: '32px 0',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              textAlign: 'left',
            }}>
              <div style={{
                minWidth: 48, height: 48,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.3)',
                letterSpacing: '-0.5px',
              }}>{step.num}</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-0.3px' }}>{step.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA BOTTOM */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '0 24px 120px',
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: 600, margin: '0 auto',
          padding: '60px 40px',
          borderRadius: 24,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
            width: 400, height: 200,
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900,
            letterSpacing: '-1.5px', marginBottom: 12,
            background: 'linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.5) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Готов создать профиль?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 32 }}>
            Нужен инвайт-код. Закрытая бета.
          </p>
          <button
            onClick={() => navigate('/auth')}
            style={{
              padding: '14px 40px', borderRadius: 14,
              background: '#fff', border: 'none',
              color: '#000', fontSize: 15, fontWeight: 800,
              cursor: 'pointer', letterSpacing: '-0.3px',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 0 40px rgba(255,255,255,0.1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(255,255,255,0.1)'; }}
          >
            Зарегистрироваться →
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{
        position: 'relative', zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#000', fontWeight: 900 }}>W</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>WhiteLokk</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          © 2025 WhiteLokk. Закрытая бета.
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '28px 24px',
        borderRadius: 16,
        background: hovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
        border: hovered ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(255,255,255,0.07)',
        transition: 'all 0.25s ease',
        cursor: 'default',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        animation: `fadeInUp 0.6s ease both`,
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, marginBottom: 16,
        filter: 'grayscale(1) brightness(2)',
        transition: 'transform 0.2s',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: 15, fontWeight: 800, color: '#fff',
        marginBottom: 8, letterSpacing: '-0.3px',
      }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
        {desc}
      </div>
    </div>
  );
}
