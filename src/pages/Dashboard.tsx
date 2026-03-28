import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { UserProfile, Badge, SocialLink } from '../types';
import MarkdownEditor from '../components/MarkdownEditor';
import { SOCIAL_PLATFORMS } from '../components/SocialIcons';
import toast from 'react-hot-toast';

const ADMIN_USERNAME = 'ebatelmamok100_7';

const BADGE_OPTIONS: Badge[] = [
  { id: 'verified', icon: '✓', label: 'Verified' },
  { id: 'developer', icon: '⌨', label: 'Developer' },
  { id: 'moderator', icon: '◈', label: 'Moderator' },
  { id: 'admin', icon: '◆', label: 'Admin' },
  { id: 'booster', icon: '◉', label: 'Booster' },
  { id: 'og', icon: '★', label: 'OG' },
  { id: 'artist', icon: '◐', label: 'Artist' },
  { id: 'streamer', icon: '▶', label: 'Streamer' },
  { id: 'music', icon: '♫', label: 'Music' },
  { id: 'gamer', icon: '◎', label: 'Gamer' },
  { id: 'bug_hunter', icon: '◑', label: 'Bug Hunter' },
  { id: 'partner', icon: '⬡', label: 'Partner' },
];

const BG_GRADIENTS = [
  { label: 'Тёмный', value: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)' },
  { label: 'Ночь', value: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)' },
  { label: 'Глубина', value: 'linear-gradient(135deg, #0a0a1a 0%, #0f1923 50%, #0a0a0a 100%)' },
  { label: 'Пурпур', value: 'linear-gradient(135deg, #0d0015 0%, #1a0030 100%)' },
  { label: 'Изумруд', value: 'linear-gradient(135deg, #001a0f 0%, #0a1f15 100%)' },
  { label: 'Закат', value: 'linear-gradient(135deg, #1a0a00 0%, #200a00 100%)' },
  { label: 'Океан', value: 'linear-gradient(135deg, #000d1a 0%, #001833 100%)' },
  { label: 'Туман', value: 'linear-gradient(135deg, #111 0%, #1a1a2a 50%, #111 100%)' },
];

const ANIMATIONS = [
  { id: 'fade', label: 'Затухание' },
  { id: 'slide', label: 'Слайд' },
  { id: 'scale', label: 'Масштаб' },
  { id: 'none', label: 'Без анимации' },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateInviteCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 20; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

type TabId = 'profile' | 'appearance' | 'badges' | 'social' | 'music' | 'discord' | 'admin';

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.3px' }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 7, fontWeight: 500 }}>
      {children}
    </div>
  );
}

function ToggleRow({
  label, desc, value, onChange,
}: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{desc}</div>}
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 40, height: 22, borderRadius: 999, cursor: 'pointer',
          background: value ? '#fff' : 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 2,
          left: value ? 'calc(100% - 20px)' : 2,
          width: 16, height: 16, borderRadius: '50%',
          background: value ? '#000' : 'rgba(255,255,255,0.4)',
          transition: 'left 0.2s, background 0.2s',
        }} />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarBase64, setAvatarBase64] = useState('');
  const [bannerBase64, setBannerBase64] = useState('');
  const [badges, setBadges] = useState<Badge[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [bgType, setBgType] = useState<'color' | 'gradient' | 'video'>('gradient');
  const [bgColor, setBgColor] = useState('#0a0a0a');
  const [bgGradient, setBgGradient] = useState(BG_GRADIENTS[0].value);
  const [bgVideoUrl, setBgVideoUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#ffffff');
  const [socialIconColor, setSocialIconColor] = useState('#ffffff');
  const [blurEffect, setBlurEffect] = useState(true);
  const [glassEffect, setGlassEffect] = useState(true);
  const [cardAnimation, setCardAnimation] = useState<'fade' | 'slide' | 'scale' | 'none'>('fade');
  const [showViews, setShowViews] = useState(true);
  const [showUid, setShowUid] = useState(false);
  // Music
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [musicCoverUrl, setMusicCoverUrl] = useState('');
  const [musicAudioBase64, setMusicAudioBase64] = useState('');
  const [musicAudioName, setMusicAudioName] = useState('');
  // Discord
  const [discordToken, setDiscordToken] = useState('');
  const [discordLoading, setDiscordLoading] = useState(false);
  // Social
  const [newSocialPlatform, setNewSocialPlatform] = useState('discord');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  // Admin
  const [inviteCodes, setInviteCodes] = useState<{
    id: string; code: string; isUsed: boolean; createdAt: number; usedBy?: string;
  }[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [adminStats, setAdminStats] = useState({ total: 0, used: 0, available: 0 });

  const audioInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = profile?.username === ADMIN_USERNAME;

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    getDoc(ref).then(snap => {
      if (snap.exists()) {
        const p = snap.data() as UserProfile;
        setProfile(p);
        setDisplayName(p.displayName || '');
        setBio(p.bio || '');
        setLocation(p.location || '');
        setAvatarBase64(p.avatarBase64 || '');
        setBannerBase64(p.bannerBase64 || '');
        setBadges(p.badges || []);
        setSocialLinks(p.socialLinks || []);
        setBgType(p.backgroundType || 'gradient');
        setBgColor(p.backgroundColor || '#0a0a0a');
        setBgGradient(p.backgroundGradient || BG_GRADIENTS[0].value);
        setBgVideoUrl(p.backgroundVideoUrl || '');
        setAccentColor(p.accentColor || '#ffffff');
        setSocialIconColor(p.socialIconColor || '#ffffff');
        setBlurEffect(p.blurEffect !== false);
        setGlassEffect(p.glassEffect !== false);
        setCardAnimation(p.cardAnimation || 'fade');
        setShowViews(p.showViews !== false);
        setShowUid(p.showUid === true);
        if (p.music) {
          setMusicTitle(p.music.title || '');
          setMusicArtist(p.music.artist || '');
          setMusicCoverUrl(p.music.coverUrl || '');
          setMusicAudioBase64(p.music.audioBase64 || '');
          setMusicAudioName('');
        }
      }
      setLoading(false);
    }).catch(e => {
      console.error('Load profile error:', e);
      toast.error('Ошибка загрузки профиля');
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (isAdmin && activeTab === 'admin') {
      loadInviteCodes();
    }
  }, [isAdmin, activeTab]);

  async function loadInviteCodes() {
    setInviteLoading(true);
    try {
      const q = query(collection(db, 'inviteCodes'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const codes = snap.docs.map(d => ({
        id: d.id,
        code: d.data().code as string,
        isUsed: d.data().isUsed as boolean,
        createdAt: d.data().createdAt as number,
        usedBy: d.data().usedBy as string | undefined,
      }));
      setInviteCodes(codes);
      const used = codes.filter(c => c.isUsed).length;
      setAdminStats({ total: codes.length, used, available: codes.length - used });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      console.error('Load invites error:', err);
      toast.error('Ошибка загрузки инвайтов: ' + (err.code || err.message || 'неизвестная'));
    }
    setInviteLoading(false);
  }

  async function generateWave(count: number) {
    if (!user) return;
    setInviteLoading(true);
    const errors: string[] = [];
    const created: string[] = [];

    for (let i = 0; i < count; i++) {
      const code = generateInviteCode();
      try {
        await addDoc(collection(db, 'inviteCodes'), {
          code,
          isUsed: false,
          createdBy: user.uid,
          createdAt: Date.now() + i,
        });
        created.push(code);
      } catch (e: unknown) {
        const err = e as { message?: string };
        errors.push(err.message || 'неизвестная ошибка');
        console.error('Create invite error:', e);
      }
    }

    if (created.length > 0) {
      toast.success(`Создано ${created.length} из ${count} инвайт-кодов`);
    }
    if (errors.length > 0) {
      toast.error(`Ошибка при создании ${errors.length} кодов. Проверь правила Firestore.`);
    }

    await loadInviteCodes();
    setInviteLoading(false);
  }

  async function generateSingle() {
    if (!user) return;
    const code = generateInviteCode();
    try {
      await addDoc(collection(db, 'inviteCodes'), {
        code,
        isUsed: false,
        createdBy: user.uid,
        createdAt: Date.now(),
      });
      toast.success(`Инвайт создан: ${code}`);
      await loadInviteCodes();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      console.error('Single invite error:', err);
      toast.error('Ошибка создания инвайта: ' + (err.code || err.message || ''));
    }
  }

  function markChanged() { setHasChanges(true); }

  async function handleSave() {
    if (!user || !profile) return;
    setSaving(true);
    try {
      // Собираем данные БЕЗ undefined полей (Firestore не принимает undefined)
      const updateData: Record<string, unknown> = {
        displayName: displayName || '',
        bio: bio || '',
        location: location || '',
        avatarBase64: avatarBase64 || '',
        bannerBase64: bannerBase64 || '',
        badges: badges || [],
        socialLinks: socialLinks || [],
        backgroundType: bgType,
        backgroundColor: bgColor || '#0a0a0a',
        backgroundGradient: bgGradient || BG_GRADIENTS[0].value,
        backgroundVideoUrl: bgVideoUrl || '',
        accentColor: accentColor || '#ffffff',
        socialIconColor: socialIconColor || '#ffffff',
        blurEffect: blurEffect,
        glassEffect: glassEffect,
        cardAnimation: cardAnimation || 'fade',
        showViews: showViews,
        showUid: showUid,
        // Сохраняем оригинальные поля
        uid: profile.uid,
        username: profile.username,
        views: profile.views || 0,
        createdAt: profile.createdAt,
        numericUid: profile.numericUid || '',
      };

      // Музыка — только если есть название
      if (musicTitle && musicTitle.trim()) {
        updateData.music = {
          title: musicTitle.trim(),
          artist: musicArtist || '',
          coverUrl: musicCoverUrl || '',
          audioBase64: musicAudioBase64 || '',
        };
      } else {
        updateData.music = null;
      }

      // Discord — сохраняем если есть
      if (profile.discordData) {
        updateData.discordData = profile.discordData;
      }

      // Используем setDoc с merge: true — это надёжнее updateDoc
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, updateData, { merge: true });

      setProfile(prev => prev ? { ...prev, ...updateData } as UserProfile : prev);
      setHasChanges(false);
      toast.success('✓ Сохранено!');
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      console.error('Save error:', err);
      if (err.code === 'permission-denied') {
        toast.error('Нет прав на сохранение. Проверь правила Firestore!');
      } else {
        toast.error('Ошибка сохранения: ' + (err.message || err.code || 'неизвестная'));
      }
    }
    setSaving(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Файл больше 2MB'); return; }
    try {
      const b64 = await fileToBase64(file);
      setAvatarBase64(b64);
      markChanged();
    } catch {
      toast.error('Ошибка загрузки файла');
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Файл больше 3MB'); return; }
    try {
      const b64 = await fileToBase64(file);
      setBannerBase64(b64);
      markChanged();
    } catch {
      toast.error('Ошибка загрузки файла');
    }
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Аудио больше 5MB'); return; }
    try {
      setMusicAudioName(file.name);
      const b64 = await fileToBase64(file);
      setMusicAudioBase64(b64);
      markChanged();
    } catch {
      toast.error('Ошибка загрузки аудио');
    }
  }

  function toggleBadge(badge: Badge) {
    const exists = badges.find(b => b.id === badge.id);
    if (exists) setBadges(badges.filter(b => b.id !== badge.id));
    else setBadges([...badges, badge]);
    markChanged();
  }

  function addSocialLink() {
    if (!newSocialUrl.trim()) { toast.error('Введи ссылку'); return; }
    const exists = socialLinks.find(l => l.platform === newSocialPlatform);
    if (exists) {
      setSocialLinks(socialLinks.map(l =>
        l.platform === newSocialPlatform ? { ...l, url: newSocialUrl } : l
      ));
    } else {
      setSocialLinks([...socialLinks, { platform: newSocialPlatform, url: newSocialUrl, color: socialIconColor }]);
    }
    setNewSocialUrl('');
    markChanged();
  }

  function removeSocialLink(platform: string) {
    setSocialLinks(socialLinks.filter(l => l.platform !== platform));
    markChanged();
  }

  async function fetchDiscord() {
    if (!discordToken.trim()) { toast.error('Введи токен Discord'); return; }
    if (!user) return;
    setDiscordLoading(true);
    try {
      const res = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: discordToken }
      });
      if (!res.ok) throw new Error('Неверный токен Discord');
      const data = await res.json();
      const discordData = {
        id: data.id,
        username: data.username,
        discriminator: data.discriminator || '0',
        avatar: data.avatar || '',
        bio: data.bio || '',
      };
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, { discordData }, { merge: true });
      setProfile(prev => prev ? { ...prev, discordData } : prev);
      toast.success('Discord привязан!');
      setDiscordToken('');
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message || 'Ошибка привязки Discord');
    }
    setDiscordLoading(false);
  }

  async function unlinkDiscord() {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { discordData: null }, { merge: true });
      setProfile(prev => prev ? { ...prev, discordData: undefined } : prev);
      toast.success('Discord отвязан');
    } catch {
      toast.error('Ошибка отвязки Discord');
    }
  }

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.08)',
          borderTop: '2px solid rgba(255,255,255,0.5)',
          animation: 'spin-slow 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (!profile) return null;

  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'profile', label: 'Профиль', icon: '◈' },
    { id: 'appearance', label: 'Внешний вид', icon: '◐' },
    { id: 'badges', label: 'Значки', icon: '★' },
    { id: 'social', label: 'Соцсети', icon: '◉' },
    { id: 'music', label: 'Музыка', icon: '♫' },
    { id: 'discord', label: 'Discord', icon: '◆' },
    ...(isAdmin ? [{ id: 'admin' as TabId, label: 'Админ', icon: '⬡' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff' }}>
      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(8,8,8,0.97)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 20px',
        height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#fff' }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 12, filter: 'invert(1)', fontWeight: 900 }}>W</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.3px' }}>WhiteLokk</span>
          </a>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.05)',
            padding: '2px 7px', borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            Дашборд
          </div>
          {isAdmin && (
            <div style={{
              fontSize: 10, color: 'rgba(255,200,100,0.8)',
              background: 'rgba(255,200,100,0.08)',
              padding: '2px 7px', borderRadius: 999,
              border: '1px solid rgba(255,200,100,0.15)',
            }}>
              ADMIN
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            href={`/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12, color: 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.07)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
            </svg>
            /{profile.username}
          </a>
          <button
            onClick={() => { signOut(auth); navigate('/'); }}
            style={{
              fontSize: 12, color: 'rgba(255,255,255,0.35)',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '5px 10px', borderRadius: 7,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            Выйти
          </button>
        </div>
      </div>

      <div style={{ paddingTop: 72, paddingBottom: 120, maxWidth: 800, margin: '0 auto', padding: '72px 16px 120px' }}>
        {/* Stats bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 10, marginBottom: 20,
        }}>
          {[
            { label: 'Просмотры', value: profile.views || 0, icon: '◎' },
            { label: 'Значки', value: (profile.badges || []).length, icon: '★' },
            { label: 'Соцсети', value: (profile.socialLinks || []).length, icon: '◉' },
            ...(isAdmin ? [{ label: 'Доступно', value: adminStats.available, icon: '⬡' }] : []),
          ].map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, padding: '12px 16px',
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Profile info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '14px 18px',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: avatarBase64 ? `url(${avatarBase64}) center/cover` : 'rgba(255,255,255,0.08)',
            border: `2px solid ${accentColor}`,
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{profile.displayName || profile.username}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>@{profile.username}</div>
          </div>
          {profile.numericUid && (
            <div style={{
              marginLeft: 'auto', fontSize: 11,
              color: 'rgba(255,255,255,0.25)',
              fontFamily: 'monospace',
            }}>
              #{profile.numericUid}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: 6,
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 0 auto',
                padding: '8px 14px',
                borderRadius: 8, border: 'none',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <>
              <SectionCard title="Основная информация">
                <div>
                  <Label>Отображаемое имя</Label>
                  <input
                    style={inputStyle}
                    placeholder="Твоё имя"
                    value={displayName}
                    onChange={e => { setDisplayName(e.target.value); markChanged(); }}
                  />
                </div>
                <div>
                  <Label>Город / Локация</Label>
                  <input
                    style={inputStyle}
                    placeholder="Москва, Россия"
                    value={location}
                    onChange={e => { setLocation(e.target.value); markChanged(); }}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Биография">
                <MarkdownEditor
                  value={bio}
                  onChange={v => { setBio(v); markChanged(); }}
                />
              </SectionCard>

              <SectionCard title="Аватар">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: avatarBase64 ? `url(${avatarBase64}) center/cover` : 'rgba(255,255,255,0.06)',
                    border: `2px solid ${accentColor}`,
                    flexShrink: 0, cursor: 'pointer',
                  }} onClick={() => avatarInputRef.current?.click()} />
                  <div>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      style={{
                        padding: '8px 16px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      Загрузить аватар
                    </button>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>
                      PNG, JPG до 2MB
                    </div>
                    {avatarBase64 && (
                      <button
                        onClick={() => { setAvatarBase64(''); markChanged(); }}
                        style={{
                          marginTop: 6, padding: '4px 10px', borderRadius: 6,
                          background: 'rgba(255,80,80,0.1)',
                          border: '1px solid rgba(255,80,80,0.2)',
                          color: 'rgba(255,100,100,0.8)', fontSize: 11, cursor: 'pointer',
                        }}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                </div>
              </SectionCard>

              <SectionCard title="Баннер">
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  style={{
                    width: '100%', height: 120, borderRadius: 10, cursor: 'pointer',
                    background: bannerBase64 ? `url(${bannerBase64}) center/cover` : 'rgba(255,255,255,0.04)',
                    border: '2px dashed rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, color: 'rgba(255,255,255,0.3)',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {!bannerBase64 && '+ Загрузить баннер (до 3MB)'}
                </div>
                <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerUpload} />
                {bannerBase64 && (
                  <button
                    onClick={() => { setBannerBase64(''); markChanged(); }}
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      background: 'rgba(255,80,80,0.1)',
                      border: '1px solid rgba(255,80,80,0.2)',
                      color: 'rgba(255,100,100,0.8)', fontSize: 11, cursor: 'pointer', alignSelf: 'flex-start',
                    }}
                  >
                    Удалить баннер
                  </button>
                )}
              </SectionCard>

              <SectionCard title="Видимость">
                <ToggleRow
                  label="Показывать просмотры"
                  desc="Счётчик просмотров профиля"
                  value={showViews}
                  onChange={v => { setShowViews(v); markChanged(); }}
                />
                <ToggleRow
                  label="Показывать UID"
                  desc={`Числовой ID: #${profile.numericUid || '?'}`}
                  value={showUid}
                  onChange={v => { setShowUid(v); markChanged(); }}
                />
              </SectionCard>
            </>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <>
              <SectionCard title="Фон страницы">
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['gradient', 'color', 'video'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => { setBgType(t); markChanged(); }}
                       style={{
                         flex: 1, padding: '8px 0', borderRadius: 8,
                         fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                         background: bgType === t ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                         color: bgType === t ? '#fff' : 'rgba(255,255,255,0.4)',
                         border: bgType === t ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
                       }}
                    >
                      {t === 'gradient' ? 'Градиент' : t === 'color' ? 'Цвет' : 'Видео'}
                    </button>
                  ))}
                </div>

                {bgType === 'gradient' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {BG_GRADIENTS.map(g => (
                      <div
                        key={g.value}
                        onClick={() => { setBgGradient(g.value); markChanged(); }}
                        style={{
                          height: 56, borderRadius: 8, cursor: 'pointer',
                          background: g.value,
                          border: bgGradient === g.value
                            ? '2px solid rgba(255,255,255,0.7)'
                            : '2px solid rgba(255,255,255,0.08)',
                          transition: 'border 0.15s',
                        }}
                        title={g.label}
                      />
                    ))}
                  </div>
                )}

                {bgType === 'color' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Label>Цвет фона</Label>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={e => { setBgColor(e.target.value); markChanged(); }}
                      style={{ width: 40, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'none' }}
                    />
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>{bgColor}</span>
                  </div>
                )}

                {bgType === 'video' && (
                  <div>
                    <Label>URL видео (mp4)</Label>
                    <input
                      style={inputStyle}
                      placeholder="https://..."
                      value={bgVideoUrl}
                      onChange={e => { setBgVideoUrl(e.target.value); markChanged(); }}
                    />
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Цвета">
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <Label>Акцентный цвет</Label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="color"
                        value={accentColor}
                        onChange={e => { setAccentColor(e.target.value); markChanged(); }}
                        style={{ width: 40, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>{accentColor}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Цвет иконок соцсетей</Label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="color"
                        value={socialIconColor}
                        onChange={e => { setSocialIconColor(e.target.value); markChanged(); }}
                        style={{ width: 40, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>{socialIconColor}</span>
                    </div>
                  </div>
                </div>

                {/* Presets */}
                <div>
                  <Label>Пресеты акцента</Label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['#ffffff', '#a78bfa', '#34d399', '#f87171', '#60a5fa', '#fbbf24', '#e879f9', '#fb7185'].map(c => (
                      <div
                        key={c}
                        onClick={() => { setAccentColor(c); markChanged(); }}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                          background: c,
                          border: accentColor === c ? '3px solid rgba(255,255,255,0.8)' : '3px solid transparent',
                          boxSizing: 'border-box', transition: 'border 0.15s',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Эффекты">
                <ToggleRow
                  label="Блюр-эффект"
                  desc="Размытие фона карточки"
                  value={blurEffect}
                  onChange={v => { setBlurEffect(v); markChanged(); }}
                />
                <ToggleRow
                  label="Стекло"
                  desc="Стеклянный эффект карточки"
                  value={glassEffect}
                  onChange={v => { setGlassEffect(v); markChanged(); }}
                />
              </SectionCard>

              <SectionCard title="Анимация появления">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {ANIMATIONS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => { setCardAnimation(a.id as typeof cardAnimation); markChanged(); }}
                       style={{
                         padding: '10px 0', borderRadius: 8,
                         fontSize: 12, fontWeight: 600, cursor: 'pointer',
                         background: cardAnimation === a.id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                         color: cardAnimation === a.id ? '#fff' : 'rgba(255,255,255,0.4)',
                         border: cardAnimation === a.id ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.06)',
                         transition: 'all 0.15s',
                       }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {/* BADGES TAB */}
          {activeTab === 'badges' && (
            <SectionCard title="Значки профиля">
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                Нажми на значок чтобы добавить или убрать
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                {BADGE_OPTIONS.map(badge => {
                  const active = badges.some(b => b.id === badge.id);
                  return (
                    <button
                      key={badge.id}
                      onClick={() => toggleBadge(badge)}
                       style={{
                         padding: '10px 14px',
                         borderRadius: 10,
                         fontSize: 13, fontWeight: 600,
                         cursor: 'pointer', transition: 'all 0.15s',
                         background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                         color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                         border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.07)',
                         display: 'flex', alignItems: 'center', gap: 8,
                         textAlign: 'left',
                       }}
                    >
                      <span style={{ fontSize: 16 }}>{badge.icon}</span>
                      <span style={{ fontSize: 12 }}>{badge.label}</span>
                    </button>
                  );
                })}
              </div>
              {badges.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Label>Активные значки ({badges.length})</Label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {badges.map(b => (
                      <span key={b.id} style={{
                        padding: '4px 10px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.08)',
                        fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        {b.icon} {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* SOCIAL TAB */}
          {activeTab === 'social' && (
            <>
              <SectionCard title="Добавить соцсеть">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select
                    value={newSocialPlatform}
                    onChange={e => setNewSocialPlatform(e.target.value)}
                    style={{ ...inputStyle, width: 'auto', flex: '0 0 auto' }}
                  >
                    {SOCIAL_PLATFORMS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Ссылка или юзернейм"
                    value={newSocialUrl}
                    onChange={e => setNewSocialUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSocialLink()}
                  />
                  <button
                    onClick={addSocialLink}
                    style={{
                      padding: '10px 18px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    + Добавить
                  </button>
                </div>
              </SectionCard>

              {socialLinks.length > 0 && (
                <SectionCard title={`Соцсети (${socialLinks.length})`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {socialLinks.map(link => {
                      const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
                      return (
                        <div key={link.platform} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 10, padding: '10px 14px',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <div style={{ fontSize: 16, width: 24, textAlign: 'center', color: socialIconColor }}>
                            {platform?.icon || '◉'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{platform?.label || link.platform}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{link.url}</div>
                          </div>
                          <button
                            onClick={() => removeSocialLink(link.platform)}
                            style={{
                              padding: '4px 10px', borderRadius: 6,
                              background: 'rgba(255,80,80,0.08)',
                              border: '1px solid rgba(255,80,80,0.15)',
                              color: 'rgba(255,100,100,0.7)', fontSize: 11, cursor: 'pointer',
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              )}
            </>
          )}

          {/* MUSIC TAB */}
          {activeTab === 'music' && (
            <SectionCard title="Музыка профиля">
              <div>
                <Label>Название трека</Label>
                <input
                  style={inputStyle}
                  placeholder="Название"
                  value={musicTitle}
                  onChange={e => { setMusicTitle(e.target.value); markChanged(); }}
                />
              </div>
              <div>
                <Label>Исполнитель</Label>
                <input
                  style={inputStyle}
                  placeholder="Исполнитель"
                  value={musicArtist}
                  onChange={e => { setMusicArtist(e.target.value); markChanged(); }}
                />
              </div>
              <div>
                <Label>URL обложки</Label>
                <input
                  style={inputStyle}
                  placeholder="https://... (ссылка на картинку)"
                  value={musicCoverUrl}
                  onChange={e => { setMusicCoverUrl(e.target.value); markChanged(); }}
                />
              </div>
              <div>
                <Label>Аудио файл</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    style={{
                      padding: '8px 16px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    {musicAudioBase64 ? '↺ Заменить файл' : '+ Загрузить mp3'}
                  </button>
                  {(musicAudioName || musicAudioBase64) && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      {musicAudioName || 'Файл загружен ✓'}
                    </span>
                  )}
                </div>
                <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleAudioUpload} />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>
                  MP3, OGG, WAV до 5MB. Хранится в Firestore.
                </div>
              </div>
              {musicAudioBase64 && (
                <button
                  onClick={() => { setMusicAudioBase64(''); setMusicAudioName(''); markChanged(); }}
                  style={{
                    padding: '6px 12px', borderRadius: 7,
                    background: 'rgba(255,80,80,0.08)',
                    border: '1px solid rgba(255,80,80,0.15)',
                    color: 'rgba(255,100,100,0.7)', fontSize: 12, cursor: 'pointer', alignSelf: 'flex-start',
                  }}
                >
                  Удалить аудио
                </button>
              )}
            </SectionCard>
          )}

          {/* DISCORD TAB */}
          {activeTab === 'discord' && (
            <SectionCard title="Привязка Discord">
              {profile.discordData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: profile.discordData.avatar
                        ? `url(https://cdn.discordapp.com/avatars/${profile.discordData.id}/${profile.discordData.avatar}.png) center/cover`
                        : 'rgba(88,101,242,0.3)',
                      border: '2px solid rgba(88,101,242,0.4)',
                    }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{profile.discordData.username}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        {profile.discordData.discriminator !== '0'
                          ? `#${profile.discordData.discriminator}`
                          : `@${profile.discordData.username}`}
                      </div>
                      {profile.discordData.bio && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                          {profile.discordData.bio}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={unlinkDiscord}
                    style={{
                      padding: '8px 16px', borderRadius: 8, alignSelf: 'flex-start',
                      background: 'rgba(255,80,80,0.1)',
                      border: '1px solid rgba(255,80,80,0.2)',
                      color: 'rgba(255,100,100,0.8)', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Отвязать Discord
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(255,165,0,0.07)',
                    border: '1px solid rgba(255,165,0,0.15)',
                    fontSize: 12, color: 'rgba(255,200,100,0.8)', lineHeight: 1.6,
                  }}>
                    ⚠️ Используй токен аккаунта Discord. Не делись токеном с другими!
                  </div>
                  <div>
                    <Label>Токен Discord</Label>
                    <input
                      style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 11 }}
                      placeholder="Введи токен..."
                      type="password"
                      value={discordToken}
                      onChange={e => setDiscordToken(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={fetchDiscord}
                    disabled={discordLoading}
                    style={{
                      padding: '10px 20px', borderRadius: 10,
                      background: discordLoading ? 'rgba(88,101,242,0.3)' : 'rgba(88,101,242,0.8)',
                      border: '1px solid rgba(88,101,242,0.5)',
                      color: '#fff', fontSize: 13, cursor: discordLoading ? 'not-allowed' : 'pointer',
                      fontWeight: 600, alignSelf: 'flex-start',
                    }}
                  >
                    {discordLoading ? 'Загружаю...' : 'Привязать Discord'}
                  </button>
                </div>
              )}
            </SectionCard>
          )}

          {/* ADMIN TAB */}
          {activeTab === 'admin' && isAdmin && (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Всего ключей', value: adminStats.total, color: 'rgba(255,255,255,0.6)' },
                  { label: 'Использовано', value: adminStats.used, color: 'rgba(255,100,100,0.7)' },
                  { label: 'Доступно', value: adminStats.available, color: 'rgba(100,255,150,0.7)' },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: '14px 16px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <SectionCard title="Генерация инвайтов">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={generateSingle}
                    disabled={inviteLoading}
                    style={{
                      padding: '10px 18px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    + 1 инвайт
                  </button>
                  {[5, 10, 25, 50].map(n => (
                    <button
                      key={n}
                      onClick={() => generateWave(n)}
                      disabled={inviteLoading}
                      style={{
                        padding: '10px 18px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.7)', fontSize: 13,
                        cursor: inviteLoading ? 'not-allowed' : 'pointer', fontWeight: 600,
                      }}
                    >
                      {inviteLoading ? '...' : `Волна +${n}`}
                    </button>
                  ))}
                  <button
                    onClick={loadInviteCodes}
                    disabled={inviteLoading}
                    style={{
                      padding: '10px 18px', borderRadius: 10,
                      background: 'rgba(100,200,255,0.06)',
                      border: '1px solid rgba(100,200,255,0.1)',
                      color: 'rgba(150,220,255,0.8)', fontSize: 13,
                      cursor: inviteLoading ? 'not-allowed' : 'pointer', fontWeight: 600,
                      marginLeft: 'auto',
                    }}
                  >
                    ↻ Обновить
                  </button>
                </div>
              </SectionCard>

              <SectionCard title={`Инвайт-коды (${inviteCodes.length})`}>
                {inviteLoading ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                    Загрузка...
                  </div>
                ) : inviteCodes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                    Кодов пока нет. Создай первый!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
                    {inviteCodes.map(c => (
                      <div key={c.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 9,
                        background: c.isUsed ? 'rgba(255,80,80,0.04)' : 'rgba(100,255,150,0.04)',
                        border: c.isUsed ? '1px solid rgba(255,80,80,0.1)' : '1px solid rgba(100,255,150,0.1)',
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: c.isUsed ? 'rgba(255,80,80,0.6)' : 'rgba(100,255,150,0.7)',
                        }} />
                        <code style={{
                          flex: 1, fontSize: 12, fontFamily: 'monospace',
                          color: c.isUsed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.85)',
                          letterSpacing: '1px',
                        }}>
                          {c.code}
                        </code>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                          {c.isUsed ? '● Использован' : '○ Свободен'}
                        </div>
                        {!c.isUsed && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(c.code);
                              toast.success('Скопировано!');
                            }}
                            style={{
                              padding: '3px 8px', borderRadius: 6,
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer',
                            }}
                          >
                            Копировать
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </div>

      {/* Save banner */}
      {hasChanges && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(15,15,15,0.97)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14, padding: '12px 20px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.3s ease',
        }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
            Есть несохранённые изменения
          </div>
          <button
            onClick={() => setHasChanges(false)}
            style={{
              padding: '7px 14px', borderRadius: 8,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer',
            }}
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '7px 20px', borderRadius: 8,
              background: saving ? 'rgba(255,255,255,0.3)' : '#fff',
              border: 'none',
              color: '#000', fontSize: 13, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Сохраняю...' : 'Сохранить'}
          </button>
        </div>
      )}
    </div>
  );
}
