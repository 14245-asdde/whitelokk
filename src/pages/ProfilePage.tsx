import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { SocialButton } from '../components/SocialIcons';
import MusicPlayer from '../components/MusicPlayer';

// Badge with tooltip — pure CSS, no state
function BadgeItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="badge">
      <span style={{ fontSize: 14, filter: 'grayscale(1) brightness(1.5)', lineHeight: 1, display: 'block' }}>
        {icon}
      </span>
      <span className="badge-tooltip">{label}</span>
    </div>
  );
}

// Optimized TiltCard — uses ref, no setState on mousemove
function TiltCard({ children, style, className }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rx = dy * -5;
      const ry = dx * 5;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.012)`;
      el.style.transition = 'transform 0.08s ease';
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    el.style.transition = 'transform 0.55s ease';
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}

// Shine effect on hover — GPU only
function ShineOverlay() {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.07) 0%, transparent 60%)`;
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.background = 'transparent';
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        position: 'absolute', inset: 0, zIndex: 10,
        borderRadius: 20, pointerEvents: 'auto',
        transition: 'background 0.15s ease',
      }}
    />
  );
}

function getAnimationStyle(anim?: string): React.CSSProperties {
  switch (anim) {
    case 'slide': return { animation: 'slideInLeft 0.55s cubic-bezier(0.22,1,0.36,1) forwards' };
    case 'scale': return { animation: 'scaleIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards' };
    case 'flip': return { animation: 'flipIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards' };
    case 'none': return {};
    default: return { animation: 'fadeInUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards' };
  }
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [musicRevealed, setMusicRevealed] = useState(false);

  // Blob — DOM ref only, no React state
  const blobRef = useRef<HTMLDivElement>(null);
  const blobRaf = useRef<number>(0);
  const blobTarget = useRef({ x: 50, y: 50 });
  const blobCurrent = useRef({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      blobTarget.current = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      };
    };
    window.addEventListener('mousemove', handleMouse, { passive: true });

    let running = true;
    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
    function animateBlob() {
      if (!running) return;
      blobCurrent.current.x = lerp(blobCurrent.current.x, blobTarget.current.x, 0.04);
      blobCurrent.current.y = lerp(blobCurrent.current.y, blobTarget.current.y, 0.04);
      if (blobRef.current) {
        blobRef.current.style.left = blobCurrent.current.x + '%';
        blobRef.current.style.top = blobCurrent.current.y + '%';
      }
      blobRaf.current = requestAnimationFrame(animateBlob);
    }
    animateBlob();

    return () => {
      running = false;
      cancelAnimationFrame(blobRaf.current);
      window.removeEventListener('mousemove', handleMouse);
    };
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
        <div className="profile-loader" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: 'rgba(255,255,255,0.06)', letterSpacing: -4 }}>404</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Профиль не найден</div>
        <a href="/" style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', padding: '8px 18px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, transition: 'all 0.2s' }}>← На главную</a>
      </div>
    );
  }

  const accent = profile.accentColor || '#ffffff';
  const socialColor = profile.socialIconColor || '#ffffff';

  const bg =
    profile.backgroundType === 'color'
      ? { background: profile.backgroundColor || '#080808' }
      : profile.backgroundType === 'gradient'
      ? { background: profile.backgroundGradient || 'linear-gradient(135deg,#080808 0%,#111 100%)' }
      : { background: '#080808' };

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

      {/* Ambient blob — GPU transform only */}
      <div
        ref={blobRef}
        style={{
          position: 'fixed',
          width: 600, height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}0d 0%, transparent 65%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
          transform: 'translate(-50%,-50%)',
          zIndex: 1,
          willChange: 'left, top',
        }}
      />

      {/* Grain overlay — lightweight SVG */}
      <div className="grain-overlay" />

      {/* Grid lines */}
      <div className="grid-overlay" />

      {/* Center layout */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', padding: '48px 16px 64px',
      }}>
        <div style={{ width: '100%', maxWidth: 430 }}>

          <TiltCard style={{ borderRadius: 22 }} className="profile-card">
            <div
              style={{
                ...getAnimationStyle(profile.cardAnimation),
                borderRadius: 22,
                overflow: 'hidden',
                background: profile.glassEffect
                  ? 'rgba(8,8,8,0.55)'
                  : 'rgba(10,10,10,0.97)',
                backdropFilter: profile.blurEffect ? 'blur(32px)' : 'none',
                WebkitBackdropFilter: profile.blurEffect ? 'blur(32px)' : 'none',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), 0 0 60px ${accent}0a`,
                position: 'relative',
              }}
            >
              {/* Shine hover effect */}
              <ShineOverlay />

              {/* Accent top glow */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 180,
                background: `linear-gradient(180deg, ${accent}10 0%, transparent 100%)`,
                pointerEvents: 'none', zIndex: 0,
              }} />

              {/* Banner */}
              <div style={{ position: 'relative', height: 115, overflow: 'hidden', zIndex: 1 }}>
                {profile.bannerBase64 ? (
                  <img
                    src={profile.bannerBase64}
                    alt="Banner"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="eager"
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: `linear-gradient(135deg, ${accent}1a 0%, ${accent}06 50%, transparent 100%)`,
                  }} />
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)',
                }} />
              </div>

              {/* Content */}
              <div style={{ padding: '0 22px 22px', position: 'relative', zIndex: 1 }}>

                {/* Avatar */}
                <div style={{ marginTop: -44, display: 'inline-block', position: 'relative' }}>
                  {/* Animated ring */}
                  <div style={{
                    width: 86, height: 86,
                    borderRadius: '50%',
                    background: `conic-gradient(${accent} 0%, ${accent}66 40%, transparent 60%, ${accent} 100%)`,
                    padding: 2.5,
                    boxShadow: `0 0 24px ${accent}40`,
                    animation: 'spin-slow 6s linear infinite',
                  }}>
                    <div style={{
                      width: '100%', height: '100%',
                      borderRadius: '50%', overflow: 'hidden',
                      background: '#0d0d0d',
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
                          fontSize: 32, fontWeight: 900, color: accent,
                          background: `${accent}10`,
                        }}>
                          {(profile.displayName || profile.username || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                {profile.badges?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                    {profile.badges.map((badge) => (
                      <BadgeItem key={badge.id} icon={badge.icon} label={badge.label} />
                    ))}
                  </div>
                )}

                {/* Name */}
                <div style={{ marginTop: profile.badges?.length ? 10 : 16 }}>
                  <div style={{
                    fontSize: 22, fontWeight: 900, color: '#fff',
                    letterSpacing: '-0.5px', lineHeight: 1.1,
                  }}>
                    {profile.displayName || profile.username}
                  </div>
                  <div style={{
                    fontSize: 12.5, color: 'rgba(255,255,255,0.3)',
                    marginTop: 3, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span>@{profile.username}</span>
                    {profile.showUid && profile.numericUid && (
                      <span style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 5, padding: '1px 6px',
                        fontSize: 10.5, fontFamily: 'monospace',
                      }}>#{profile.numericUid}</span>
                    )}
                  </div>
                </div>

                {/* Location */}
                {profile.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                      <path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" />
                    </svg>
                    {profile.location}
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />

                {/* Bio */}
                {profile.bio && (
                  <div
                    className="markdown-body bio-block"
                    style={{ fontSize: 13.5, lineHeight: 1.7 }}
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
                    borderRadius: 14, padding: '12px 14px',
                    marginTop: 14,
                    background: 'rgba(88,101,242,0.07)',
                    border: '1px solid rgba(88,101,242,0.18)',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(88,101,242,0.35)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(88,101,242,0.18)')}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={`https://cdn.discordapp.com/avatars/${profile.discordData.id}/${profile.discordData.avatar}.png?size=64`}
                        alt="Discord"
                        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Crect width='44' height='44' rx='22' fill='%235865F2'/%3E%3C/svg%3E`;
                        }}
                      />
                      <div style={{
                        position: 'absolute', bottom: 1, right: 1,
                        width: 11, height: 11,
                        background: '#57f287',
                        borderRadius: '50%',
                        border: '2px solid #0a0a0a',
                        boxShadow: '0 0 6px #57f28766',
                      }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>
                        {profile.discordData.username}
                        {profile.discordData.discriminator && profile.discordData.discriminator !== '0' && (
                          <span style={{ color: 'rgba(255,255,255,0.28)', fontWeight: 400 }}>
                            #{profile.discordData.discriminator}
                          </span>
                        )}
                      </div>
                      {profile.discordData.bio && (
                        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.38)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {profile.discordData.bio}
                        </div>
                      )}
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2" style={{ flexShrink: 0, opacity: 0.9 }}>
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                    </svg>
                  </div>
                )}

                {/* Music */}
                {profile.music && (
                  <div
                    style={{ marginTop: 14, position: 'relative', cursor: !musicRevealed ? 'pointer' : 'default', borderRadius: 14, overflow: 'hidden' }}
                    onClick={() => { if (!musicRevealed) setMusicRevealed(true); }}
                  >
                    {!musicRevealed && (
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 14,
                        backdropFilter: 'blur(2px)',
                      }}>
                        <div className="music-unlock-btn">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Нажми чтобы открыть
                        </div>
                      </div>
                    )}
                    <div style={{
                      filter: musicRevealed ? 'none' : 'blur(10px)',
                      transition: 'filter 0.5s ease',
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

          {/* Meta info */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 16, marginTop: 18, flexWrap: 'wrap',
          }}>
            {profile.showViews !== false && (
              <div className="meta-chip">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                  <path d="M12.015 7c4.751 0 8.063 3.012 9.504 4.636-1.401 1.837-4.713 5.364-9.504 5.364-4.42 0-7.93-3.536-9.478-5.407 1.493-1.647 4.817-4.593 9.478-4.593zm0-2c-7.569 0-12.015 6.551-12.015 6.551s4.835 7.449 12.015 7.449c7.733 0 11.985-7.449 11.985-7.449s-4.291-6.551-11.985-6.551zm-.015 3c-2.209 0-4 1.792-4 4 0 2.209 1.791 4 4 4s4-1.791 4-4c0-2.208-1.791-4-4-4z" />
                </svg>
                {profile.views || 0} просмотров
              </div>
            )}
            {profile.showUid && profile.numericUid && (
              <div className="meta-chip" style={{ fontFamily: 'monospace' }}>
                UID #{profile.numericUid}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
