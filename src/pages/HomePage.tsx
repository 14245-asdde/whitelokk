import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { UserProfile } from '../types';

/* ─── Mock profile card for hero ─── */
function HeroProfileCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 30 });

  const handleMouse = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      style={{
        rotateX, rotateY,
        transformPerspective: 800,
        borderRadius: 22,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(24px)',
        overflow: 'hidden',
        width: 320,
        position: 'relative',
        boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {/* Banner */}
      <div style={{
        height: 90,
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #111 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.06) 0%, transparent 70%)',
        }} />
        {/* Decorative lines */}
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: `${i * 25}%`,
            width: 1,
            background: 'rgba(255,255,255,0.04)',
          }} />
        ))}
      </div>

      {/* Avatar */}
      <div style={{ position: 'relative', padding: '0 20px 20px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'linear-gradient(135deg, #333, #1a1a1a)',
          border: '3px solid rgba(10,10,10,1)',
          marginTop: -32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, fontWeight: 800, color: 'rgba(255,255,255,0.5)',
          position: 'relative',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          W
          {/* Online dot */}
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 12, height: 12, borderRadius: '50%',
            background: '#4ade80',
            border: '2px solid rgba(10,10,10,1)',
            boxShadow: '0 0 8px rgba(74,222,128,0.6)',
          }} />
        </div>

        {/* Name + badges */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.3px' }}>whitelokk</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 12 }}>@whitelokk · 1.2K просмотров</div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['👑','⭐','🎵','🔥','💎'].map((icon, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, filter: 'grayscale(1)',
              }}>{icon}</div>
            ))}
          </div>

          {/* Bio */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '12px 14px',
            fontSize: 12.5, color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6, marginBottom: 14,
          }}>
            <span style={{ color: '#fff', fontWeight: 600 }}>Разработчик</span> · строю вещи в интернете.<br />
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>music / code / design</span>
          </div>

          {/* Music player */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, filter: 'grayscale(1)', flexShrink: 0,
            }}>🎵</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Favourite Track
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)' }}>Artist Name</div>
              <div style={{ marginTop: 5, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: '40%', height: '100%', background: '#fff', borderRadius: 99 }} />
              </div>
            </div>
          </div>

          {/* Socials */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {[
              { icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:15,height:15}}><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg> },
              { icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:15,height:15}}><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg> },
              { icon: <svg viewBox="0 0 24 24" fill="currentColor" style={{width:15,height:15}}><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg> },
            ].map((s, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)',
              }}>{s.icon}</div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Animated counter ─── */
function Counter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / 40;
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return <>{val.toLocaleString('ru')}</>;
}

/* ─── Main ─── */
export default function HomePage() {
  const [topProfiles, setTopProfiles] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({ users: 0, views: 0 });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('views', 'desc'), limit(6));
        const snap = await getDocs(q);
        const profiles = snap.docs.map(d => d.data() as UserProfile);
        setTopProfiles(profiles);
        const allSnap = await getDocs(collection(db, 'users'));
        const totalViews = allSnap.docs.reduce((a, d) => a + (d.data().views || 0), 0);
        setStats({ users: allSnap.size, views: totalViews });
      } catch { }
    };
    load();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: '✍', title: 'Markdown Bio', desc: 'Оформляй описание с markdown — жирный, курсив, заголовки, цитаты' },
    { icon: '🎨', title: 'Кастомизация', desc: 'Цвета соцсетей, баннеры, аватар — всё под твой стиль' },
    { icon: '🎵', title: 'Музыка', desc: 'Добавь трек прямо в профиль. Пусть тебя слышат' },
    { icon: '🏆', title: 'Бейджики', desc: 'Собирай медали за просмотры, активность и достижения' },
    { icon: '🎮', title: 'Discord', desc: 'Привяжи аккаунт — покажи аватар, тег и описание' },
    { icon: '🔗', title: 'Соцсети', desc: 'Все ссылки в одном месте с кастомными цветами' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', overflowX: 'hidden' }}>

      {/* ─── Nav ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        background: scrolled ? 'rgba(8,8,8,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#000', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>W</span>
            </div>
            <span style={{ fontWeight: 800, color: '#fff', fontSize: 16, letterSpacing: '-0.5px' }}>WhiteLok</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link to="/auth" style={{
              color: 'rgba(255,255,255,0.45)', fontSize: 13.5, textDecoration: 'none',
              padding: '7px 14px', borderRadius: 9, transition: 'color 0.2s',
              fontWeight: 500,
            }}>Войти</Link>
            <Link to="/auth" style={{
              background: '#fff', color: '#000', fontSize: 13.5, fontWeight: 700,
              padding: '7px 16px', borderRadius: 9, textDecoration: 'none',
              boxShadow: '0 0 20px rgba(255,255,255,0.1)',
            }}>Начать →</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background effects */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,255,255,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '52px 52px' }} />
        {/* Orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.025), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '0%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.02), transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '80px 32px 60px', width: '100%', display: 'flex', alignItems: 'center', gap: 60, justifyContent: 'space-between' }}>

          {/* Left: Text */}
          <div style={{ flex: 1, minWidth: 0, maxWidth: 560 }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: 28 }}
            >
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 99, padding: '6px 14px',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5, fontWeight: 500 }}>Только по инвайту · Открытая бета</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontSize: 'clamp(42px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.03, letterSpacing: '-2.5px', marginBottom: 22 }}
            >
              Твоя страница.<br />
              <span style={{ color: 'rgba(255,255,255,0.22)' }}>Твой стиль.</span>
            </motion.h1>

            {/* Subline */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16.5, lineHeight: 1.65, marginBottom: 36, maxWidth: 440 }}
            >
              Создай уникальную страницу-визитку с музыкой, бейджиками, Discord профилем и markdown описанием. Только эксклюзив.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 48 }}
            >
              <Link to="/auth" style={{
                background: '#fff', color: '#000', fontWeight: 700, fontSize: 14.5,
                padding: '12px 26px', borderRadius: 11, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: '0 0 50px rgba(255,255,255,0.12)',
                transition: 'all 0.2s',
              }}>
                Создать страницу →
              </Link>
              <Link to="/auth" style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 500, fontSize: 14.5,
                padding: '12px 26px', borderRadius: 11, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s',
              }}>
                Войти
              </Link>
            </motion.div>

            {/* Mini stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{ display: 'flex', gap: 28, alignItems: 'center' }}
            >
              {[
                { label: 'Пользователей', value: stats.users },
                { label: 'Просмотров', value: stats.views },
                { label: 'Статус', value: null, text: 'Активен' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
                    {s.text ? s.text : (s.value ? <Counter target={s.value} /> : '—')}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11.5, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Profile card preview */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ flexShrink: 0, position: 'relative' }}
          >
            {/* Glow behind card */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400, height: 400, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }} />
            <HeroProfileCard />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{
            position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,0.2)', fontSize: 11,
          }}
        >
          <span>Прокрути вниз</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ width: 16, height: 16 }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3v10M4 9l4 4 4-4" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Features ─── */}
      <section style={{ padding: '80px 32px', maxWidth: 1140, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 99, padding: '5px 14px', marginBottom: 20,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>✦</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Возможности</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 12 }}>
            Всё что нужно
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15.5, maxWidth: 400, margin: '0 auto' }}>
            Богатый функционал для твоей страницы-визитки
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '22px 24px',
                cursor: 'default',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginBottom: 14, filter: 'grayscale(1)',
              }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 6 }}>{f.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13.5, lineHeight: 1.6 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Top profiles ─── */}
      {topProfiles.length > 0 && (
        <section style={{ padding: '0 32px 80px', maxWidth: 1140, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 40 }}
          >
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 8 }}>
              Топ профили
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14.5 }}>Самые популярные страницы</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {topProfiles.map((p, i) => (
              <Link key={p.uid} to={`/${p.username}`} style={{ textDecoration: 'none' }}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 14, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.08)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                  }}>
                    {p.avatarUrl
                      ? <img src={p.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (p.displayName?.[0] || '?').toUpperCase()
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.displayName || p.username}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>@{p.username}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.25)', fontSize: 12, flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 12, height: 12 }}>
                      <path d="M12.015 7c4.751 0 8.063 3.012 9.504 4.636-1.401 1.837-4.713 5.364-9.504 5.364-4.42 0-7.93-3.536-9.478-5.407 1.493-1.647 4.817-4.593 9.478-4.593zm0-2c-7.569 0-12.015 6.551-12.015 6.551s4.835 7.449 12.015 7.449c7.733 0 11.985-7.449 11.985-7.449s-4.291-6.551-11.985-6.551zm-.015 3c-2.209 0-4 1.792-4 4 0 2.209 1.791 4 4 4s4-1.791 4-4c0-2.208-1.791-4-4-4z" />
                    </svg>
                    {p.views || 0}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── CTA ─── */}
      <section style={{ padding: '0 32px 100px', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            maxWidth: 580, margin: '0 auto',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 22, padding: '52px 36px',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 200, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          }} />
          <div style={{ fontSize: 38, marginBottom: 18, filter: 'grayscale(1)' }}>⚡</div>
          <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1.2px', marginBottom: 14 }}>
            Готов начать?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15, marginBottom: 30, lineHeight: 1.65 }}>
            Нужен инвайт-код. Попроси у пользователей<br />или жди волны раздачи.
          </p>
          <Link to="/auth" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#fff', color: '#000', fontWeight: 700, fontSize: 15,
            padding: '13px 32px', borderRadius: 12, textDecoration: 'none',
            boxShadow: '0 0 50px rgba(255,255,255,0.12)',
          }}>
            Создать страницу →
          </Link>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 32px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#000', fontSize: 10, fontWeight: 900 }}>W</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
            © 2025 WhiteLok · Только по инвайту
          </p>
        </div>
      </footer>
    </div>
  );
}
