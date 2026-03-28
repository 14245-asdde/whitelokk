import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import BadgeItem from '../components/BadgeItem';
import SocialIcon from '../components/SocialIcon';
import MusicPlayer from '../components/MusicPlayer';
import { useViewTracker } from '../hooks/useViewTracker';
import { useAuth } from '../hooks/useAuth';

const ANIMATIONS: Record<string, any> = {
  fadeUp: { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 } },
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  slideLeft: { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 } },
  slideRight: { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 } },
  scale: { initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 } },
  bounce: { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0, transition: { type: 'spring', bounce: 0.5 } } },
};

const VIEW_BADGES = [
  { id: 'views_100', views: 100 },
  { id: 'views_500', views: 500 },
  { id: 'views_1000', views: 1000 },
  { id: 'views_5000', views: 5000 },
  { id: 'views_10000', views: 10000 },
];

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [customBadges, setCustomBadges] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useViewTracker(username || '', user?.uid, profile?.uid);

  // 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [6, -6]), { stiffness: 120, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-6, 6]), { stiffness: 120, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - (rect.left + rect.width / 2));
    mouseY.set(e.clientY - (rect.top + rect.height / 2));
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  useEffect(() => {
    const load = async () => {
      if (!username) return;
      try {
        const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
        const snap = await getDocs(q);
        if (snap.empty) { setNotFound(true); setLoading(false); return; }
        setProfile(snap.docs[0].data() as UserProfile);
        const cbSnap = await getDocs(collection(db, 'customBadges'));
        const cb: Record<string, any> = {};
        cbSnap.forEach(d => { cb[d.id] = d.data(); });
        setCustomBadges(cb);
      } catch { setNotFound(true); }
      setLoading(false);
    };
    load();
  }, [username]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
          <span style={{ fontSize: 28, filter: 'grayscale(1)' }}>⚡</span>
        </motion.div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
        <span style={{ fontSize: 48, filter: 'grayscale(1)' }}>👤</span>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Профиль не найден</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>@{username} не существует</p>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 8, textDecoration: 'none' }}>← На главную</Link>
      </div>
    );
  }

  const animConfig = ANIMATIONS[profile.animation] || ANIMATIONS.fadeUp;
  const accent = profile.accentColor || '#ffffff';
  const earnedViewBadges = VIEW_BADGES.filter(vb => (profile.views || 0) >= vb.views).map(vb => vb.id);
  const allBadges = [...new Set([...(profile.badges || []), ...earnedViewBadges])];
  const fontFamily = profile.font || 'Inter';

  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at center, #0d0d0d 0%, #000 100%)',
        fontFamily,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background effects */}
      {profile.bannerUrl && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${profile.bannerUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(50px)', opacity: 0.12, transform: 'scale(1.1)',
          pointerEvents: 'none',
        }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
      <div className="absolute inset-0 bg-grid" style={{ opacity: 0.4, pointerEvents: 'none' }} />

      {/* Accent glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}12, transparent 70%)`,
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      {/* Dashboard link (own profile) */}
      {user && user.uid === profile.uid && (
        <Link to="/dashboard" style={{
          position: 'fixed', top: 16, right: 16,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', fontSize: 12, fontWeight: 500,
          padding: '7px 14px', borderRadius: 8, textDecoration: 'none',
          backdropFilter: 'blur(10px)', zIndex: 50,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ⚡ Дашборд
        </Link>
      )}

      {/* Card */}
      <motion.div
        ref={cardRef}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1200, position: 'relative', zIndex: 10, width: '100%', maxWidth: 380 }}
        {...animConfig}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Glow border */}
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 24,
          background: `linear-gradient(135deg, ${accent}30, transparent, ${accent}10)`,
          filter: 'blur(1px)',
        }} />

        {/* Main card */}
        <div style={{
          position: 'relative',
          background: 'rgba(12,12,12,0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          overflow: 'visible',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset`,
        }}>
          {/* Banner */}
          <div style={{ height: 110, position: 'relative', overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
            {profile.bannerUrl ? (
              <img src={profile.bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: `linear-gradient(135deg, ${accent}25 0%, ${accent}08 50%, rgba(0,0,0,0.5) 100%)`,
              }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(12,12,12,0.9) 100%)' }} />
          </div>

          {/* Content */}
          <div style={{ padding: '0 20px 20px', position: 'relative', zIndex: 2 }}>
            {/* Avatar + stats row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36, marginBottom: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 76, height: 76, borderRadius: 18,
                  overflow: 'hidden', border: '3px solid rgba(12,12,12,1)',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                }}>
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (profile.displayName?.[0] || '?').toUpperCase()
                  }
                </div>
                <div style={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#4ade80', border: '2px solid rgba(12,12,12,1)',
                }} />
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 8, paddingBottom: 4, alignItems: 'center' }}>
                {profile.showViews !== false && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '4px 9px',
                  }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.4)' }}>
                      <path d="M12.015 7c4.751 0 8.063 3.012 9.504 4.636-1.401 1.837-4.713 5.364-9.504 5.364-4.42 0-7.93-3.536-9.478-5.407 1.493-1.647 4.817-4.593 9.478-4.593zm0-2c-7.569 0-12.015 6.551-12.015 6.551s4.835 7.449 12.015 7.449c7.733 0 11.985-7.449 11.985-7.449s-4.291-6.551-11.985-6.551zm-.015 3c-2.209 0-4 1.792-4 4 0 2.209 1.791 4 4 4s4-1.791 4-4c0-2.208-1.791-4-4-4z"/>
                    </svg>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{(profile.views || 0).toLocaleString()}</span>
                  </div>
                )}
                {allBadges.length > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: '4px 9px',
                  }}>
                    <span style={{ fontSize: 11, filter: 'grayscale(1)' }}>🏅</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{allBadges.length}</span>
                  </div>
                )}
                {profile.showUid && (
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8, padding: '4px 9px',
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}>#{profile.numericUid}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Name + badges */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: '-0.3px' }}>
                  {profile.displayName || profile.username}
                </h1>
                {allBadges.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    {allBadges.map(bid => (
                      <BadgeItem key={bid} badgeId={bid} customBadge={customBadges[bid]} />
                    ))}
                  </div>
                )}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>@{profile.username}</p>
            </div>

            {/* Location */}
            {profile.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 10 }}>
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 11, height: 11, flexShrink: 0 }}>
                  <path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/>
                </svg>
                {profile.location}
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div className="prose-bio" style={{ marginBottom: 14 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{profile.bio}</ReactMarkdown>
              </div>
            )}

            {/* Discord */}
            {profile.discordUsername && (
              <div style={{
                marginBottom: 12, padding: '10px 12px',
                background: 'rgba(88,101,242,0.08)', border: '1px solid rgba(88,101,242,0.15)',
                borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {profile.discordAvatar ? (
                  <img src={profile.discordAvatar} alt="Discord" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(88,101,242,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="#5865F2" style={{ width: 18, height: 18 }}>
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{profile.discordUsername}</p>
                  {profile.discordTag && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{profile.discordTag}</p>}
                  {profile.discordBio && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{profile.discordBio}</p>}
                </div>
              </div>
            )}

            {/* Music */}
            {profile.music?.url && (
              <div style={{ marginBottom: 12 }}>
                <MusicPlayer track={profile.music} accentColor={accent} />
              </div>
            )}

            {/* Social links */}
            {profile.socialLinks && profile.socialLinks.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {profile.socialLinks.map((link, i) => (
                  <SocialIcon key={i} platform={link.platform} url={link.url} color={link.color || accent} />
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, filter: 'grayscale(1)' }}>⚡</span>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, fontFamily: 'monospace' }}>whitelok.vercel.app</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
