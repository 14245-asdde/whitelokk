import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { SocialButton } from '../components/SocialIcons';
import MusicPlayer from '../components/MusicPlayer';

function BadgeItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="badge">
      <span style={{ fontSize: 14, filter: 'grayscale(1) brightness(1.5)', lineHeight: 1 }}>{icon}</span>
      <span className="badge-tooltip">{label}</span>
    </div>
  );
}

// Tilt card component
function TiltCard({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -6, y: dx * 6 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }

  function handleMouseEnter() {
    setIsHovered(true);
  }

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        ...style,
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.01 : 1})`,
        transition: isHovered
          ? 'transform 0.1s ease'
          : 'transform 0.5s ease',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}

function getAnimationStyle(anim?: string): React.CSSProperties {
  switch (anim) {
    case 'slide':
      return { animation: 'slideInLeft 0.6s ease forwards' };
    case 'scale':
      return { animation: 'scaleIn 0.5s ease forwards' };
    case 'none':
      return {};
    default:
      return { animation: 'fadeInUp 0.6s ease forwards' };
  }
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [musicRevealed, setMusicRevealed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  useEffect(() => {
    if (!username) { setNotFound(true); setLoading(false); return; }
    const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
    getDocs(q).then(snap => {
      if (snap.empty) { setNotFound(true); setLoading(false); return; }
      const data = snap.docs[0].data() as UserProfile;
      setProfile(data);
      setLoading(false);
      const ref = doc(db, 'users', snap.docs[0].id);
      updateDoc(ref, { views: increment(1) }).catch(() => {});
    }).catch(() => { setNotFound(true); setLoading(false); });
  }, [username]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#080808',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.08)',
          borderTop: '2px solid rgba(255,255,255,0.5)',
          animation: 'spin-slow 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#080808',
        flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 64, fontWeight: 900, color: 'rgba(255,255,255,0.07)' }}>404</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>Профиль не найден</div>
        <a href="/" style={{
          marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.4)',
          textDecoration: 'none', padding: '7px 16px',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, transition: 'all 0.2s',
        }}>← На главную</a>
      </div>
    );
  }

  const bg =
    profile.backgroundType === 'color'
      ? { background: profile.backgroundColor || '#080808' }
      : profile.backgroundType === 'gradient'
      ? { background: profile.backgroundGradient || 'linear-gradient(135deg, #080808 0%, #1a1a2e 100%)' }
      : { background: '#080808' };

  const accent = profile.accentColor || '#ffffff';
  const socialColor = profile.socialIconColor || '#ffffff';
  const blobX = 20 + mousePos.x * 60;
  const blobY = 10 + mousePos.y * 60;

  return (
    <div style={{ minHeight: '100vh', ...bg, position: 'relative', overflowX: 'hidden' }}>
      {/* Video BG */}
      {profile.backgroundType === 'video' && profile.backgroundVideoUrl && (
        <video
          src={profile.backgroundVideoUrl}
          autoPlay loop muted playsInline
          style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        />
      )}

      {/* Moving blob */}
      <div style={{
        position: 'fixed',
        top: `${blobY}%`,
        left: `${blobX}%`,
        width: 500, height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}08 0%, transparent 70%)`,
        filter: 'blur(80px)',
        pointerEvents: 'none',
        transform: 'translate(-50%,-50%)',
        transition: 'top 1s ease, left 1s ease',
        zIndex: 1,
      }} />

      {/* Noise */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.5,
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        minHeight: '100vh', padding: '48px 16px 64px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          <TiltCard
            style={{ borderRadius: 20, overflow: 'hidden' }}
            className={`profile-card ${profile.cardAnimation !== 'none' ? '' : ''}`}
          >
            {/* Main card */}
            <div
              style={{
                ...getAnimationStyle(profile.cardAnimation),
                borderRadius: 20,
                overflow: 'hidden',
                background: profile.glassEffect
                  ? 'rgba(0,0,0,0.5)'
                  : 'rgba(12,12,12,0.95)',
                backdropFilter: profile.blurEffect ? 'blur(28px)' : 'none',
                WebkitBackdropFilter: profile.blurEffect ? 'blur(28px)' : 'none',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: `0 8px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`,
                position: 'relative',
              }}
            >
              {/* Inner glow accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 200,
                background: `linear-gradient(180deg, ${accent}08 0%, transparent 100%)`,
                pointerEvents: 'none', zIndex: 0,
              }} />

              {/* Banner */}
              <div style={{ position: 'relative', height: 110, overflow: 'hidden', zIndex: 1 }}>
                {profile.bannerBase64 ? (
                  <img
                    src={profile.bannerBase64}
                    alt="Banner"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: `linear-gradient(135deg, ${accent}18 0%, ${accent}05 50%, transparent 100%)`,
                  }} />
                )}
                {/* Banner fade */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)',
                }} />
              </div>

              {/* Content */}
              <div style={{ padding: '0 20px 20px', position: 'relative', zIndex: 1 }}>
                {/* Avatar */}
                <div style={{ marginTop: -40, display: 'inline-block' }}>
                  <div style={{
                    width: 80, height: 80,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${accent} 0%, ${accent}44 100%)`,
                    padding: 2.5,
                    boxShadow: `0 0 20px ${accent}30`,
                  }}>
                    <div style={{
                      width: '100%', height: '100%',
                      borderRadius: '50%', overflow: 'hidden',
                      background: '#111',
                    }}>
                      {profile.discordData?.avatar ? (
                        <img
                          src={`https://cdn.discordapp.com/avatars/${profile.discordData.id}/${profile.discordData.avatar}.png?size=128`}
                          alt="Avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : profile.avatarBase64 ? (
                        <img
                          src={profile.avatarBase64}
                          alt="Avatar"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 30, fontWeight: 900, color: accent,
                        }}>
                          {(profile.displayName || profile.username || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                {profile.badges?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {profile.badges.map((badge) => (
                      <BadgeItem key={badge.id} icon={badge.icon} label={badge.label} />
                    ))}
                  </div>
                )}

                {/* Name */}
                <div style={{ marginTop: profile.badges?.length ? 8 : 14 }}>
                  <div style={{ fontSize: 21, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
                    {profile.displayName || profile.username}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    @{profile.username}
                    {profile.showUid && profile.numericUid && (
                      <span style={{ marginLeft: 8, opacity: 0.5 }}>#{profile.numericUid}</span>
                    )}
                  </div>
                </div>

                {/* Location */}
                {profile.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                      <path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" />
                    </svg>
                    {profile.location}
                  </div>
                )}

                {/* Bio */}
                {profile.bio && (
                  <div
                    className="markdown-body"
                    style={{
                      marginTop: 14,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      fontSize: 13.5,
                      lineHeight: 1.65,
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{profile.bio}</ReactMarkdown>
                  </div>
                )}

                {/* Social links */}
                {profile.socialLinks?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                    {profile.socialLinks.map((link, i) => (
                      <SocialButton
                        key={i}
                        platform={link.platform}
                        url={link.url}
                        color={link.color || socialColor}
                      />
                    ))}
                  </div>
                )}

                {/* Discord block */}
                {profile.discordData && (
                  <div style={{
                    borderRadius: 12, padding: '12px 14px',
                    marginTop: 14,
                    background: 'rgba(88,101,242,0.08)',
                    border: '1px solid rgba(88,101,242,0.2)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={`https://cdn.discordapp.com/avatars/${profile.discordData.id}/${profile.discordData.avatar}.png?size=64`}
                        alt="Discord"
                        style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='42' height='42' viewBox='0 0 42 42'%3E%3Crect width='42' height='42' rx='21' fill='%235865F2'/%3E%3C/svg%3E`;
                        }}
                      />
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 12, height: 12,
                        background: '#57f287',
                        borderRadius: '50%',
                        border: '2px solid #0a0a0a',
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        {profile.discordData.username}
                        {profile.discordData.discriminator && profile.discordData.discriminator !== '0' && (
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
                            #{profile.discordData.discriminator}
                          </span>
                        )}
                      </div>
                      {profile.discordData.bio && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {profile.discordData.bio}
                        </div>
                      )}
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" style={{ flexShrink: 0, opacity: 0.8 }}>
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                  </div>
                )}

                {/* Music */}
                {profile.music && (
                  <div
                    style={{ marginTop: 14, position: 'relative', cursor: !musicRevealed ? 'pointer' : 'default' }}
                    onClick={() => { if (!musicRevealed) setMusicRevealed(true); }}
                  >
                    {!musicRevealed && (
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 14,
                        background: 'rgba(0,0,0,0.15)',
                      }}>
                        <div style={{
                          fontSize: 12, color: 'rgba(255,255,255,0.8)',
                          background: 'rgba(0,0,0,0.7)',
                          padding: '6px 14px', borderRadius: 999,
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          pointerEvents: 'none',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Нажми чтобы открыть
                        </div>
                      </div>
                    )}
                    <div style={{
                      filter: musicRevealed ? 'none' : 'blur(8px)',
                      transition: 'filter 0.4s ease',
                      userSelect: musicRevealed ? 'auto' : 'none',
                      pointerEvents: musicRevealed ? 'auto' : 'none',
                    }}>
                      <MusicPlayer track={profile.music} accentColor={accent} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TiltCard>

          {/* Views + UID */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 14, marginTop: 16, flexWrap: 'wrap',
          }}>
            {profile.showViews !== false && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                  <path d="M12.015 7c4.751 0 8.063 3.012 9.504 4.636-1.401 1.837-4.713 5.364-9.504 5.364-4.42 0-7.93-3.536-9.478-5.407 1.493-1.647 4.817-4.593 9.478-4.593zm0-2c-7.569 0-12.015 6.551-12.015 6.551s4.835 7.449 12.015 7.449c7.733 0 11.985-7.449 11.985-7.449s-4.291-6.551-11.985-6.551zm-.015 3c-2.209 0-4 1.792-4 4 0 2.209 1.791 4 4 4s4-1.791 4-4c0-2.208-1.791-4-4-4z" />
                </svg>
                {(profile.views || 0)} просмотров
              </div>
            )}
            {profile.showUid && profile.numericUid && (
              <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: 'monospace' }}>
                UID #{profile.numericUid}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
