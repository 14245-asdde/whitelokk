import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc, collection, addDoc, getDocs, query, where, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { UserProfile, InviteCode } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SOCIAL_ICONS } from '../components/SocialIcon';
import { SYSTEM_BADGES } from '../components/BadgeItem';

const ANIMATIONS = ['fadeUp', 'fadeIn', 'slideLeft', 'slideRight', 'scale', 'bounce'];
const FONTS = ['Inter', 'Space Grotesk', 'serif', 'monospace'];
const VIEW_BADGE_THRESHOLDS = [
  { id: 'views_100', label: '100 просмотров', views: 100, emoji: '👁' },
  { id: 'views_500', label: '500 просмотров', views: 500, emoji: '🌟' },
  { id: 'views_1000', label: '1К просмотров', views: 1000, emoji: '💎' },
  { id: 'views_5000', label: '5К просмотров', views: 5000, emoji: '🏆' },
  { id: 'views_10000', label: '10К просмотров', views: 10000, emoji: '👑' },
];

function generateInvite(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let r = '';
  for (let i = 0; i < 20; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

type Tab = 'stats' | 'profile' | 'badges' | 'social' | 'music' | 'discord' | 'settings' | 'invites' | 'admin';

const S = {
  topbar: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, zIndex: 100,
    height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px',
    background: 'rgba(0,0,0,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(20px)',
  },
  sidebar: {
    position: 'fixed' as const, top: 56, left: 0, bottom: 0,
    width: 220, background: 'rgba(6,6,6,1)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    padding: '16px 10px', display: 'flex', flexDirection: 'column' as const,
    overflowY: 'auto' as const, zIndex: 50,
  },
  main: {
    marginLeft: 220, marginTop: 56, minHeight: 'calc(100vh - 56px)',
    padding: '32px', background: '#000',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, padding: '24px',
    marginBottom: 16,
  },
  label: { display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6, fontWeight: 500 },
  input: {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const,
  },
  btnPrimary: {
    background: '#fff', color: '#000', border: 'none', borderRadius: 10,
    padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'opacity 0.2s', whiteSpace: 'nowrap' as const,
  },
  btnGhost: {
    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  btnDanger: {
    background: 'rgba(239,68,68,0.1)', color: 'rgba(239,68,68,0.8)',
    border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
    padding: '6px 12px', fontSize: 12, cursor: 'pointer',
  },
  sectionTitle: { color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 16, display: 'block' },
  row: { display: 'flex', gap: 10, alignItems: 'flex-start' },
};

export default function DashboardPage() {
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('stats');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [myInvites, setMyInvites] = useState<InviteCode[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<InviteCode[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [customBadges, setCustomBadges] = useState<any[]>([]);
  const [newBadge, setNewBadge] = useState({ name: '', emoji: '', description: '', imageUrl: '' });
  const [newSocial, setNewSocial] = useState({ platform: 'discord', url: '', color: '#ffffff' });
  const [musicForm, setMusicForm] = useState({ title: '', artist: '', url: '', coverUrl: '' });
  const [discordForm, setDiscordForm] = useState({ discordUsername: '', discordAvatar: '', discordTag: '', discordBio: '' });
  const [showSaveBar, setShowSaveBar] = useState(false);
  const [badgeKeyInput, setBadgeKeyInput] = useState('');
  const [userBadgeKeys, setUserBadgeKeys] = useState<any[]>([]);
  const [waveLoading, setWaveLoading] = useState(false);
  const [adminBadgeTarget, setAdminBadgeTarget] = useState('');
  const [adminBadgeId, setAdminBadgeId] = useState('');
  const [adminKeyBadgeId, setAdminKeyBadgeId] = useState('');
  const [previewBio, setPreviewBio] = useState(false);
  const [waveTarget, setWaveTarget] = useState<'all' | 'user'>('all');
  const [waveTargetUser, setWaveTargetUser] = useState('');
  const [waveCount, setWaveCount] = useState(10);
  const [statsHistory] = useState(() => {
    // Имитация истории просмотров за 7 дней (из localStorage или просто текущее значение)
    const base = 0;
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i],
      views: base,
    }));
  });

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    if (profile) {
      setForm({ ...profile });
      setMusicForm({ title: profile.music?.title || '', artist: profile.music?.artist || '', url: profile.music?.url || '', coverUrl: profile.music?.coverUrl || '' });
      setDiscordForm({ discordUsername: profile.discordUsername || '', discordAvatar: profile.discordAvatar || '', discordTag: profile.discordTag || '', discordBio: profile.discordBio || '' });
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (tab === 'invites' && user) loadInvites();
    if (tab === 'admin' && profile?.isAdmin) loadAdminData();
    if (tab === 'badges') loadCustomBadges();
  }, [tab]);

  const loadInvites = async () => {
    if (!user) return;
    try {
      // Мои созданные инвайты
      const q1 = query(collection(db, 'invites'), where('createdBy', '==', user.uid));
      const snap1 = await getDocs(q1);
      setMyInvites(snap1.docs.map(d => ({ code: d.id, ...d.data() } as InviteCode)));

      // Входящие инвайты (от волны раздачи)
      const q2 = query(collection(db, 'invites'), where('receivedBy', '==', user.uid));
      const snap2 = await getDocs(q2);
      setReceivedInvites(snap2.docs.map(d => ({ code: d.id, ...d.data() } as InviteCode)));
    } catch (e: any) { toast.error('Ошибка загрузки инвайтов: ' + e.message); }
  };

  const loadAdminData = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      setAllUsers(snap.docs.map(d => d.data() as UserProfile));
      const keysSnap = await getDocs(collection(db, 'badgeKeys'));
      setUserBadgeKeys(keysSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e: any) { toast.error('Ошибка загрузки: ' + e.message); }
  };

  const loadCustomBadges = async () => {
    try {
      const snap = await getDocs(collection(db, 'customBadges'));
      setCustomBadges(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {}
  };

  const mark = () => setShowSaveBar(true);

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    mark();
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const data: any = {
        displayName: form.displayName || '',
        bio: form.bio || '',
        avatarUrl: form.avatarUrl || '',
        bannerUrl: form.bannerUrl || '',
        accentColor: form.accentColor || '#ffffff',
        location: form.location || '',
        showUid: form.showUid ?? false,
        showViews: form.showViews ?? true,
        animation: form.animation || 'fadeUp',
        font: form.font || 'Inter',
        socialLinks: (form.socialLinks || []).map(l => ({
          platform: l.platform || '',
          url: l.url || '',
          icon: l.icon || '',
          color: l.color || '#ffffff',
        })),
        music: (musicForm.url && musicForm.title) ? {
          title: musicForm.title,
          artist: musicForm.artist,
          url: musicForm.url,
          coverUrl: musicForm.coverUrl,
        } : null,
        discordUsername: discordForm.discordUsername || '',
        discordAvatar: discordForm.discordAvatar || '',
        discordTag: discordForm.discordTag || '',
        discordBio: discordForm.discordBio || '',
      };
      await updateDoc(doc(db, 'users', user.uid), data);
      setProfile({ ...profile!, ...data });
      setShowSaveBar(false);
      toast.success('✅ Сохранено!');
    } catch (e: any) {
      console.error('handleSave error:', e);
      toast.error('Ошибка сохранения: ' + (e.message || e.code || 'Неизвестная ошибка'));
    }
    setSaving(false);
  };

  const createInvite = async () => {
    if (!user) return;
    const code = generateInvite();
    try {
      await setDoc(doc(db, 'invites', code), {
        code,
        used: false,
        createdBy: user.uid,
        createdAt: Date.now(),
        isWave: false,
      });
      navigator.clipboard.writeText(code).catch(() => {});
      toast.success('🎫 Инвайт создан и скопирован!');
      loadInvites();
    } catch (e: any) {
      toast.error('Ошибка создания инвайта: ' + (e.message || e.code));
    }
  };

  const waveInvites = async () => {
    if (!user) return;
    setWaveLoading(true);
    try {
      if (waveTarget === 'all') {
        // Волна на всех пользователей — создаём по одному инвайту каждому
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(d => d.data() as UserProfile);
        const batch: Promise<void>[] = [];
        for (const u of users) {
          if (u.uid === user.uid) continue; // себе не отправляем
          for (let n = 0; n < Math.min(waveCount, 5); n++) {
            const code = generateInvite();
            batch.push(setDoc(doc(db, 'invites', code), {
              code,
              used: false,
              createdBy: user.uid,
              createdAt: Date.now(),
              isWave: true,
              receivedBy: u.uid,
              receivedByUsername: u.username,
            }));
          }
        }
        await Promise.all(batch);
        toast.success(`🌊 Волна запущена! Отправлено ${batch.length} инвайтов ${users.length - 1} пользователям`, { duration: 5000 });
      } else {
        // Волна конкретному пользователю
        const targetName = waveTargetUser.trim().toLowerCase();
        if (!targetName) { toast.error('Укажи ник пользователя'); setWaveLoading(false); return; }
        const q = query(collection(db, 'users'), where('username', '==', targetName));
        const snap = await getDocs(q);
        if (snap.empty) { toast.error('Пользователь не найден'); setWaveLoading(false); return; }
        const targetUser = snap.docs[0].data() as UserProfile;
        const batch: Promise<void>[] = [];
        for (let n = 0; n < waveCount; n++) {
          const code = generateInvite();
          batch.push(setDoc(doc(db, 'invites', code), {
            code,
            used: false,
            createdBy: user.uid,
            createdAt: Date.now(),
            isWave: true,
            receivedBy: targetUser.uid,
            receivedByUsername: targetUser.username,
          }));
        }
        await Promise.all(batch);
        toast.success(`🌊 Отправлено ${waveCount} инвайтов пользователю @${targetUser.username}!`);
      }
      loadInvites();
    } catch (e: any) { toast.error('Ошибка волны: ' + e.message); }
    setWaveLoading(false);
  };

  const addSocialLink = () => {
    if (!newSocial.platform || !newSocial.url) { toast.error('Укажи платформу и ссылку'); return; }
    updateForm('socialLinks', [...(form.socialLinks || []), { ...newSocial }]);
    setNewSocial({ platform: 'discord', url: '', color: '#ffffff' });
  };

  const removeSocial = (i: number) => {
    const arr = [...(form.socialLinks || [])]; arr.splice(i, 1);
    updateForm('socialLinks', arr);
  };

  const createCustomBadge = async () => {
    if (!newBadge.name || !newBadge.emoji) { toast.error('Заполни название и эмодзи'); return; }
    if (!user) return;
    try {
      await addDoc(collection(db, 'customBadges'), { ...newBadge, createdBy: user.uid, isCustom: true });
      toast.success('Бейдж создан!');
      setNewBadge({ name: '', emoji: '', description: '', imageUrl: '' });
      loadCustomBadges();
    } catch (e: any) { toast.error('Ошибка: ' + e.message); }
  };

  const giveBadge = async () => {
    if (!adminBadgeTarget || !adminBadgeId) { toast.error('Выбери пользователя и бейдж'); return; }
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('username', '==', adminBadgeTarget.toLowerCase())));
      if (snap.empty) { toast.error('Пользователь не найден'); return; }
      const ref = snap.docs[0].ref;
      const cur = snap.docs[0].data().badges || [];
      if (cur.includes(adminBadgeId)) { toast.error('Бейдж уже есть'); return; }
      await updateDoc(ref, { badges: [...cur, adminBadgeId] });
      toast.success('Бейдж выдан!');
    } catch (e: any) { toast.error('Ошибка: ' + e.message); }
  };

  const createBadgeKey = async () => {
    if (!adminKeyBadgeId) { toast.error('Выбери бейдж'); return; }
    if (!user) return;
    const code = generateInvite();
    try {
      await setDoc(doc(db, 'badgeKeys', code), {
        badgeId: adminKeyBadgeId,
        code,
        used: false,
        createdBy: user.uid,
        createdAt: Date.now(),
      });
      navigator.clipboard.writeText(code).catch(() => {});
      toast.success(`✅ Ключ создан и скопирован!\n${code}`, { duration: 6000 });
      loadAdminData();
    } catch (e: any) {
      toast.error('Ошибка создания ключа: ' + (e.message || e.code));
    }
  };

  const redeemBadgeKey = async () => {
    if (!user || !badgeKeyInput.trim()) { toast.error('Введи ключ'); return; }
    const trimmedKey = badgeKeyInput.trim();
    try {
      const keyRef = doc(db, 'badgeKeys', trimmedKey);
      const keySnap = await getDoc(keyRef);
      if (!keySnap.exists()) { toast.error('Ключ не найден'); return; }
      const keyData = keySnap.data();
      if (keyData.used) { toast.error('Ключ уже использован'); return; }
      const badgeId = keyData.badgeId;
      if (!badgeId) { toast.error('Повреждённый ключ'); return; }
      const cur = profile?.badges || [];
      if (cur.includes(badgeId)) { toast.error('У тебя уже есть этот бейдж'); return; }
      const newBadges = [...cur, badgeId];
      await updateDoc(doc(db, 'users', user.uid), { badges: newBadges });
      await updateDoc(keyRef, { used: true, usedBy: user.uid, usedAt: Date.now() });
      if (profile) setProfile({ ...profile, badges: newBadges });
      const badgeName = SYSTEM_BADGES[badgeId]?.name || badgeId;
      toast.success(`🏅 Бейдж "${badgeName}" получен!`);
      setBadgeKeyInput('');
    } catch (e: any) {
      toast.error('Ошибка: ' + (e.message || 'Неизвестная ошибка'));
    }
  };

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <span style={{ fontSize: 28, filter: 'grayscale(1)' }}>⚡</span>
      </motion.div>
    </div>
  );

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'stats', label: 'Статистика', emoji: '📊' },
    { id: 'profile', label: 'Профиль', emoji: '👤' },
    { id: 'badges', label: 'Бейджики', emoji: '🏅' },
    { id: 'social', label: 'Соцсети', emoji: '🔗' },
    { id: 'music', label: 'Музыка', emoji: '🎵' },
    { id: 'discord', label: 'Discord', emoji: '💬' },
    { id: 'invites', label: 'Инвайты', emoji: '🎫' },
    { id: 'settings', label: 'Настройки', emoji: '⚙️' },
    ...(profile.isAdmin ? [{ id: 'admin' as Tab, label: 'Админ', emoji: '👑' }] : []),
  ];

  const nextViewBadge = VIEW_BADGE_THRESHOLDS.find(vb => (profile.views || 0) < vb.views);
  const earnedViewBadges = VIEW_BADGE_THRESHOLDS.filter(vb => (profile.views || 0) >= vb.views);

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      {/* Top bar */}
      <div style={S.topbar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <span style={{ filter: 'grayscale(1)', fontSize: 18 }}>⚡</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>WhiteLok</span>
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Дашборд</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a
            href={`/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'rgba(255,255,255,0.6)', fontSize: 13, textDecoration: 'none',
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Мой профиль
          </a>
          <button
            onClick={() => signOut(auth).then(() => navigate('/auth'))}
            style={S.btnGhost}
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div style={S.sidebar}>
        {/* User preview */}
        <div style={{ padding: '8px 8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile.displayName?.[0] || '?').toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.displayName || profile.username}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>@{profile.username}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: tab === t.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.45)',
                fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                textAlign: 'left', transition: 'all 0.15s', width: '100%',
              }}
            >
              <span style={{ fontSize: 15, filter: 'grayscale(1)', lineHeight: 1 }}>{t.emoji}</span>
              {t.label}
              {t.id === 'invites' && receivedInvites.filter(i => !i.used).length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#fff', color: '#000', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                  {receivedInvites.filter(i => !i.used).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Stats mini */}
        <div style={{ padding: '12px 8px 4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{profile.views || 0}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>просмотров</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{(profile.badges || []).length}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>бейджей</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={S.main}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{ maxWidth: 700 }}
          >

            {/* ===== STATS TAB ===== */}
            {tab === 'stats' && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>Статистика</h2>

                {/* Main stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    {
                      label: 'Всего просмотров',
                      value: profile.views || 0,
                      emoji: '👁',
                      sub: 'за всё время',
                      color: 'rgba(255,255,255,0.06)',
                    },
                    {
                      label: 'Бейджиков',
                      value: (profile.badges || []).length + earnedViewBadges.length,
                      emoji: '🏅',
                      sub: 'получено',
                      color: 'rgba(255,255,255,0.06)',
                    },
                    {
                      label: 'Соцсетей',
                      value: (profile.socialLinks || []).length,
                      emoji: '🔗',
                      sub: 'привязано',
                      color: 'rgba(255,255,255,0.06)',
                    },
                  ].map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      style={{
                        background: s.color, border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16, padding: '20px 18px',
                      }}
                    >
                      <div style={{ fontSize: 22, filter: 'grayscale(1)', marginBottom: 8 }}>{s.emoji}</div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 28, letterSpacing: '-1px', lineHeight: 1 }}>{s.value.toLocaleString()}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>{s.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>{s.sub}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Profile info */}
                <div style={S.card}>
                  <span style={S.sectionTitle}>Профиль</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Юзернейм</span>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>@{profile.username}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Цифровой UID</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'monospace' }}>#{profile.numericUid}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Дата регистрации</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                        {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ru-RU') : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Показ просмотров</span>
                      <span style={{ color: profile.showViews !== false ? '#4ade80' : 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                        {profile.showViews !== false ? 'Включено' : 'Выключено'}
                      </span>
                    </div>
                    {profile.isAdmin && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,215,0,0.04)', borderRadius: 10, border: '1px solid rgba(255,215,0,0.1)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Роль</span>
                        <span style={{ color: '#ffd700', fontSize: 13, fontWeight: 600 }}>👑 Администратор</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress to next badge */}
                <div style={S.card}>
                  <span style={S.sectionTitle}>Прогресс медалек</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {VIEW_BADGE_THRESHOLDS.map((vb, idx) => {
                      const earned = (profile.views || 0) >= vb.views;
                      const pct = Math.min(100, ((profile.views || 0) / vb.views) * 100);
                      const isNext = !earned && VIEW_BADGE_THRESHOLDS.slice(0, idx).every(prev => (profile.views || 0) >= prev.views);
                      return (
                        <div key={vb.id} style={{
                          padding: '14px 16px',
                          background: earned ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                          borderRadius: 12,
                          border: `1px solid ${earned ? 'rgba(255,255,255,0.12)' : isNext ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: earned ? 0 : 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 18, filter: 'grayscale(1)' }}>{vb.emoji}</span>
                              <div>
                                <p style={{ color: earned ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: earned ? 600 : 400 }}>{vb.label}</p>
                                {isNext && !earned && (
                                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                                    Осталось {(vb.views - (profile.views || 0)).toLocaleString()} просмотров
                                  </p>
                                )}
                              </div>
                            </div>
                            <span style={{ color: earned ? '#4ade80' : 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: earned ? 600 : 400 }}>
                              {earned ? '✓ Получено' : `${(profile.views || 0).toLocaleString()} / ${vb.views.toLocaleString()}`}
                            </span>
                          </div>
                          {!earned && (
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 }}
                                style={{ height: '100%', background: isNext ? '#fff' : 'rgba(255,255,255,0.25)', borderRadius: 99 }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {nextViewBadge && (
                    <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                        🎯 Следующая медалька: <span style={{ color: '#fff' }}>{nextViewBadge.label}</span> — нужно ещё{' '}
                        <span style={{ color: '#fff', fontWeight: 600 }}>{(nextViewBadge.views - (profile.views || 0)).toLocaleString()}</span> просмотров
                      </p>
                    </div>
                  )}
                </div>

                {/* Views graph (decorative) */}
                <div style={S.card}>
                  <span style={S.sectionTitle}>График просмотров (7 дней)</span>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                    {statsHistory.map((d, i) => {
                      const maxVal = Math.max(...statsHistory.map(x => x.views), 1);
                      const h = Math.max(8, (d.views / maxVal) * 70);
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: '100%', height: h, background: 'rgba(255,255,255,0.15)', borderRadius: 4, transition: 'height 0.5s ease' }} />
                          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
                    Детальная статистика появится после накопления данных
                  </p>
                </div>
              </div>
            )}

            {/* ===== PROFILE TAB ===== */}
            {tab === 'profile' && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>Профиль</h2>

                <div style={S.card}>
                  <span style={S.sectionTitle}>Основное</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={S.label}>Отображаемое имя</label>
                      <input style={S.input} value={form.displayName || ''} onChange={e => updateForm('displayName', e.target.value)} placeholder="Твоё имя" />
                    </div>
                    <div>
                      <label style={S.label}>Локация</label>
                      <input style={S.input} value={form.location || ''} onChange={e => updateForm('location', e.target.value)} placeholder="Москва, Россия" />
                    </div>
                    <div>
                      <label style={S.label}>URL аватара</label>
                      <input style={S.input} value={form.avatarUrl || ''} onChange={e => updateForm('avatarUrl', e.target.value)} placeholder="https://..." />
                    </div>
                    <div>
                      <label style={S.label}>URL баннера</label>
                      <input style={S.input} value={form.bannerUrl || ''} onChange={e => updateForm('bannerUrl', e.target.value)} placeholder="https://... (изображение или GIF)" />
                    </div>
                    <div>
                      <label style={S.label}>Акцентный цвет</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input type="color" value={form.accentColor || '#ffffff'} onChange={e => updateForm('accentColor', e.target.value)} style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'monospace' }}>{form.accentColor || '#ffffff'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={S.card}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={S.sectionTitle}>О себе (Markdown)</span>
                    <button
                      onClick={() => setPreviewBio(!previewBio)}
                      style={{ ...S.btnGhost, padding: '6px 12px', fontSize: 12 }}
                    >
                      {previewBio ? 'Редактировать' : 'Превью'}
                    </button>
                  </div>

                  {!previewBio && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                      {[
                        { label: 'B', insert: '**текст**', title: 'Жирный' },
                        { label: 'I', insert: '*текст*', title: 'Курсив' },
                        { label: 'S', insert: '~~текст~~', title: 'Зачёркнутый' },
                        { label: 'H1', insert: '# Заголовок', title: 'Заголовок 1' },
                        { label: 'H2', insert: '## Заголовок', title: 'Заголовок 2' },
                        { label: '`code`', insert: '`код`', title: 'Код' },
                        { label: '> Цит', insert: '> цитата', title: 'Цитата' },
                        { label: '— — —', insert: '---', title: 'Разделитель' },
                        { label: '[Link]', insert: '[текст](url)', title: 'Ссылка' },
                        { label: '• Список', insert: '- пункт', title: 'Список' },
                      ].map(btn => (
                        <button
                          key={btn.label}
                          title={btn.title}
                          onClick={() => {
                            const bio = form.bio || '';
                            updateForm('bio', bio + (bio ? '\n' : '') + btn.insert);
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.7)', borderRadius: 6, padding: '4px 8px',
                            fontSize: 11, cursor: 'pointer',
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {previewBio ? (
                    <div className="prose-bio" style={{ minHeight: 100, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                      {form.bio ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.bio}</ReactMarkdown> : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Пусто...</span>}
                    </div>
                  ) : (
                    <textarea
                      style={{ ...S.input, minHeight: 120, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
                      value={form.bio || ''}
                      onChange={e => updateForm('bio', e.target.value)}
                      placeholder="Опиши себя... Поддерживается **markdown**"
                    />
                  )}
                </div>

                <div style={S.card}>
                  <span style={S.sectionTitle}>Внешний вид</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={S.label}>Анимация появления</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {ANIMATIONS.map(a => (
                          <button key={a} onClick={() => updateForm('animation', a)} style={{
                            padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '1px solid',
                            background: form.animation === a ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                            borderColor: form.animation === a ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                            color: form.animation === a ? '#fff' : 'rgba(255,255,255,0.4)',
                          }}>{a}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={S.label}>Шрифт</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {FONTS.map(f => (
                          <button key={f} onClick={() => updateForm('font', f)} style={{
                            padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '1px solid',
                            fontFamily: f,
                            background: form.font === f ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                            borderColor: form.font === f ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                            color: form.font === f ? '#fff' : 'rgba(255,255,255,0.4)',
                          }}>{f}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== BADGES TAB ===== */}
            {tab === 'badges' && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>Бейджики</h2>

                <div style={S.card}>
                  <span style={S.sectionTitle}>Мои бейджики</span>
                  {(profile.badges || []).length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Нет бейджиков. Активируй ключ или набери просмотры.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(profile.badges || []).map(bid => {
                        const b = SYSTEM_BADGES[bid] || customBadges.find(c => c.id === bid);
                        if (!b) return null;
                        return (
                          <div key={bid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
                            <span style={{ fontSize: 20, filter: 'grayscale(1)' }}>{b.emoji || '🏅'}</span>
                            <div>
                              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{b.name}</p>
                              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{b.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={S.card}>
                  <span style={S.sectionTitle}>Медальки за просмотры</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {VIEW_BADGE_THRESHOLDS.map(vb => {
                      const earned = (profile.views || 0) >= vb.views;
                      const pct = Math.min(100, ((profile.views || 0) / vb.views) * 100);
                      return (
                        <div key={vb.id} style={{ padding: '12px', background: earned ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${earned ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 16, filter: 'grayscale(1)' }}>{vb.emoji}</span>
                              <span style={{ color: earned ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: earned ? 600 : 400 }}>{vb.label}</span>
                            </div>
                            <span style={{ color: earned ? '#4ade80' : 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                              {earned ? '✓ Получено' : `${profile.views || 0} / ${vb.views}`}
                            </span>
                          </div>
                          {!earned && (
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 99 }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={S.card}>
                  <span style={S.sectionTitle}>Активировать ключ бейджика</span>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginBottom: 10 }}>
                    Ключ — 20 символов (буквы и цифры). Каждый ключ одноразовый.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{ ...S.input, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                      value={badgeKeyInput}
                      onChange={e => setBadgeKeyInput(e.target.value.trim())}
                      onKeyDown={e => e.key === 'Enter' && redeemBadgeKey()}
                      placeholder="Введи 20-символьный ключ..."
                      maxLength={20}
                    />
                    <button onClick={redeemBadgeKey} style={S.btnPrimary}>Активировать</button>
                  </div>
                  {badgeKeyInput.length > 0 && badgeKeyInput.length !== 20 && (
                    <p style={{ color: 'rgba(255,165,0,0.7)', fontSize: 11, marginTop: 6 }}>
                      Ключ должен быть 20 символов (сейчас: {badgeKeyInput.length})
                    </p>
                  )}
                </div>

                {customBadges.length > 0 && (
                  <div style={S.card}>
                    <span style={S.sectionTitle}>Кастомные бейджики</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {customBadges.map(cb => (
                        <div key={cb.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
                          {cb.imageUrl ? <img src={cb.imageUrl} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} /> : <span style={{ fontSize: 18, filter: 'grayscale(1)' }}>{cb.emoji}</span>}
                          <div>
                            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{cb.name}</p>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{cb.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.isAdmin && (
                  <div style={S.card}>
                    <span style={S.sectionTitle}>Создать кастомный бейдж</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <label style={S.label}>Название</label>
                          <input style={S.input} value={newBadge.name} onChange={e => setNewBadge(p => ({ ...p, name: e.target.value }))} placeholder="Название бейджа" />
                        </div>
                        <div style={{ width: 80 }}>
                          <label style={S.label}>Эмодзи</label>
                          <input style={S.input} value={newBadge.emoji} onChange={e => setNewBadge(p => ({ ...p, emoji: e.target.value }))} placeholder="🏆" />
                        </div>
                      </div>
                      <div>
                        <label style={S.label}>Описание</label>
                        <input style={S.input} value={newBadge.description} onChange={e => setNewBadge(p => ({ ...p, description: e.target.value }))} placeholder="Описание бейджа" />
                      </div>
                      <div>
                        <label style={S.label}>URL картинки (опционально)</label>
                        <input style={S.input} value={newBadge.imageUrl} onChange={e => setNewBadge(p => ({ ...p, imageUrl: e.target.value }))} placeholder="https://..." />
                      </div>
                      <button onClick={createCustomBadge} style={S.btnPrimary}>Создать бейдж</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== SOCIAL TAB ===== */}
            {tab === 'social' && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>Соцсети</h2>
                <div style={S.card}>
                  <span style={S.sectionTitle}>Мои ссылки</span>
                  {(form.socialLinks || []).length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 12 }}>Нет ссылок</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {(form.socialLinks || []).map((l, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14, color: l.color || '#fff' }}>
                              <path d={SOCIAL_ICONS[l.platform]?.svg || ''} />
                            </svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{SOCIAL_ICONS[l.platform]?.label || l.platform}</p>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.url}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 20, height: 20, borderRadius: 4, background: l.color || '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                              <input type="color" value={l.color || '#ffffff'} onChange={e => {
                                const arr = [...(form.socialLinks || [])];
                                arr[i] = { ...arr[i], color: e.target.value };
                                updateForm('socialLinks', arr);
                              }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                            </div>
                            <button onClick={() => removeSocial(i)} style={S.btnDanger}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={S.label}>Платформа</label>
                        <select
                          style={{ ...S.input, appearance: 'none' as any }}
                          value={newSocial.platform}
                          onChange={e => setNewSocial(p => ({ ...p, platform: e.target.value }))}
                        >
                          {Object.entries(SOCIAL_ICONS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>Цвет</label>
                        <input type="color" value={newSocial.color} onChange={e => setNewSocial(p => ({ ...p, color: e.target.value }))} style={{ height: 40, width: 50, borderRadius: 8 }} />
                      </div>
                    </div>
                    <div>
                      <label style={S.label}>Ссылка</label>
                      <input style={S.input} value={newSocial.url} onChange={e => setNewSocial(p => ({ ...p, url: e.target.value }))} placeholder="https://..." />
                    </div>
                    <button onClick={addSocialLink} style={S.btnPrimary}>Добавить</button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== MUSIC TAB ===== */}
            {tab === 'music' && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>Музыка</h2>
                <div style={S.card}>
                  <span style={S.sectionTitle}>Трек на странице</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={S.label}>Название трека</label>
                      <input style={S.input} value={musicForm.title} onChange={e => { setMusicForm(p => ({ ...p, title: e.target.value })); mark(); }} placeholder="Название" />
                    </div>
                    <div>
                      <label style={S.label}>Исполнитель</label>
                      <input style={S.input} value={musicForm.artist} onChange={e => { setMusicForm(p => ({ ...p, artist: e.target.value })); mark(); }} placeholder="Исполнитель" />
                    </div>
                    <div>
                      <label style={S.label}>URL аудио (mp3/ogg)</label>
                      <input style={S.input} value={musicForm.url} onChange={e => { setMusicForm(p => ({ ...p, url: e.target.value })); mark(); }} placeholder="https://...mp3" />
                    </div>
                    <div>
                      <label style={S.label}>URL обложки</label>
                      <input style={S.input} value={musicForm.coverUrl} onChange={e => { setMusicForm(p => ({ ...p, coverUrl: e.target.value })); mark(); }} placeholder="https://...jpg" />
                    </div>
                    {musicForm.url && (
                      <div>
                        <label style={S.label}>Превью</label>
                        <audio controls src={musicForm.url} style={{ width: '100%', filter: 'invert(1)', borderRadius: 8 }} />
                      </div>
                    )}
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                      Используй прямые ссылки на mp3. Рекомендуем: catbox.moe, litterbox, или другие CDN
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== DISCORD TAB ===== */}
            {tab === 'discord' && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>Discord</h2>
                <div style={S.card}>
                  <span style={S.sectionTitle}>Привязка Discord</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={S.label}>Discord никнейм</label>
                      <input style={S.input} value={discordForm.discordUsername} onChange={e => { setDiscordForm(p => ({ ...p, discordUsername: e.target.value })); mark(); }} placeholder="username" />
                    </div>
                    <div>
                      <label style={S.label}>Тег / дискриминатор</label>
                      <input style={S.input} value={discordForm.discordTag} onChange={e => { setDiscordForm(p => ({ ...p, discordTag: e.target.value })); mark(); }} placeholder="#0000 или username" />
                    </div>
                    <div>
                      <label style={S.label}>URL аватара Discord</label>
                      <input style={S.input} value={discordForm.discordAvatar} onChange={e => { setDiscordForm(p => ({ ...p, discordAvatar: e.target.value })); mark(); }} placeholder="https://cdn.discordapp.com/avatars/..." />
                    </div>
                    <div>
                      <label style={S.label}>О себе (Discord bio)</label>
                      <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={discordForm.discordBio} onChange={e => { setDiscordForm(p => ({ ...p, discordBio: e.target.value })); mark(); }} placeholder="Описание из Discord..." />
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                      Аватар: правый клик на аватар в Discord → Открыть в браузере → скопировать URL
                    </p>
                  </div>
                </div>
                {discordForm.discordUsername && (
                  <div style={{ ...S.card, background: 'rgba(88,101,242,0.06)', borderColor: 'rgba(88,101,242,0.15)' }}>
                    <span style={S.sectionTitle}>Превью</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {discordForm.discordAvatar ? (
                        <img src={discordForm.discordAvatar} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(88,101,242,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 24 24" fill="#5865F2" style={{ width: 22, height: 22 }}>
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                          </svg>
                        </div>
                      )}
                      <div>
                        <p style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{discordForm.discordUsername}</p>
                        {discordForm.discordTag && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{discordForm.discordTag}</p>}
                        {discordForm.discordBio && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }}>{discordForm.discordBio}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== INVITES TAB ===== */}
            {tab === 'invites' && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>Инвайт-коды</h2>

                {/* Incoming invites (from wave) */}
                {receivedInvites.length > 0 && (
                  <div style={{ ...S.card, borderColor: receivedInvites.filter(i => !i.used).length > 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', background: receivedInvites.filter(i => !i.used).length > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>📬</span>
                        <span style={S.sectionTitle}>Входящие инвайты</span>
                        {receivedInvites.filter(i => !i.used).length > 0 && (
                          <span style={{ background: '#fff', color: '#000', fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '2px 8px' }}>
                            {receivedInvites.filter(i => !i.used).length} новых
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
                      Инвайты получены от волны раздачи. Используй их чтобы пригласить других.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {receivedInvites.map(inv => (
                        <div key={inv.code} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                          padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${inv.used ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)'}`,
                          background: inv.used ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.04)',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <code style={{ color: inv.used ? 'rgba(255,255,255,0.2)' : '#fff', fontSize: 12, wordBreak: 'break-all' }}>{inv.code}</code>
                            {inv.used && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginLeft: 8 }}>использован</span>}
                          </div>
                          {!inv.used && (
                            <button
                              onClick={() => { navigator.clipboard.writeText(inv.code); toast.success('Скопировано!'); }}
                              style={{ ...S.btnGhost, padding: '6px 12px', fontSize: 12 }}
                            >
                              Копировать
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* My created invites */}
                <div style={S.card}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🎫</span>
                      <span style={S.sectionTitle}>Мои инвайты</span>
                    </div>
                    <button onClick={createInvite} style={S.btnPrimary}>+ Создать</button>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Всего', value: myInvites.length },
                      { label: 'Активных', value: myInvites.filter(i => !i.used).length },
                      { label: 'Использовано', value: myInvites.filter(i => i.used).length },
                    ].map((s, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{s.value}</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {myInvites.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Нет инвайт-кодов</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {myInvites.map(inv => (
                        <div key={inv.code} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                          padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
                          background: inv.used ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <code style={{ color: inv.used ? 'rgba(255,255,255,0.25)' : '#fff', fontSize: 12, wordBreak: 'break-all' }}>{inv.code}</code>
                            {inv.isWave && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginLeft: 8 }}>волна → @{(inv as any).receivedByUsername}</span>}
                            {inv.used && !inv.isWave && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginLeft: 8 }}>использован</span>}
                          </div>
                          {!inv.used && (
                            <button
                              onClick={() => { navigator.clipboard.writeText(inv.code); toast.success('Скопировано!'); }}
                              style={{ ...S.btnGhost, padding: '6px 12px', fontSize: 12 }}
                            >
                              Копировать
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== SETTINGS TAB ===== */}
            {tab === 'settings' && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>Настройки</h2>
                <div style={S.card}>
                  <span style={S.sectionTitle}>Приватность</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { key: 'showViews', label: 'Показывать просмотры', desc: 'Отображать счётчик просмотров на профиле' },
                      { key: 'showUid', label: 'Показывать UID', desc: 'Отображать цифровой идентификатор' },
                    ].map(s => (
                      <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div>
                          <p style={{ color: '#fff', fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{s.label}</p>
                          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{s.desc}</p>
                        </div>
                        <button
                          onClick={() => updateForm(s.key, !(form as any)[s.key])}
                          style={{
                            width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
                            background: (form as any)[s.key] ? '#fff' : 'rgba(255,255,255,0.12)',
                            position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                          }}
                        >
                          <div style={{
                            position: 'absolute', top: 2, left: (form as any)[s.key] ? 22 : 2,
                            width: 20, height: 20, borderRadius: '50%',
                            background: (form as any)[s.key] ? '#000' : 'rgba(255,255,255,0.4)',
                            transition: 'left 0.2s',
                          }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ ...S.card, borderColor: 'rgba(239,68,68,0.15)' }}>
                  <span style={{ ...S.sectionTitle, color: 'rgba(239,68,68,0.8)' }}>Опасная зона</span>
                  <button onClick={() => signOut(auth).then(() => navigate('/auth'))} style={S.btnDanger}>
                    Выйти из аккаунта
                  </button>
                </div>
              </div>
            )}

            {/* ===== ADMIN TAB ===== */}
            {tab === 'admin' && profile.isAdmin && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.5px' }}>
                  <span style={{ filter: 'grayscale(1)', marginRight: 8 }}>👑</span>Админ-панель
                </h2>

                {/* Wave */}
                <div style={S.card}>
                  <span style={S.sectionTitle}>🌊 Волна раздачи инвайтов</span>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>
                    Разослать инвайт-коды пользователям. Они появятся во вкладке «Инвайты» у получателей.
                  </p>

                  {/* Target selector */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {(['all', 'user'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setWaveTarget(t)}
                        style={{
                          padding: '8px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer', border: '1px solid',
                          background: waveTarget === t ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                          borderColor: waveTarget === t ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                          color: waveTarget === t ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {t === 'all' ? '👥 Всем пользователям' : '👤 Конкретному пользователю'}
                      </button>
                    ))}
                  </div>

                  {waveTarget === 'user' && (
                    <div style={{ marginBottom: 12 }}>
                      <label style={S.label}>Ник пользователя</label>
                      <input
                        style={S.input}
                        value={waveTargetUser}
                        onChange={e => setWaveTargetUser(e.target.value)}
                        placeholder="username (без @)"
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>
                      Кол-во инвайтов {waveTarget === 'all' ? 'на человека' : 'пользователю'}: <strong style={{ color: '#fff' }}>{waveCount}</strong>
                    </label>
                    <input
                      type="range" min={1} max={waveTarget === 'all' ? 5 : 50} value={waveCount}
                      onChange={e => setWaveCount(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#fff' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                      <span>1</span>
                      <span>{waveTarget === 'all' ? 5 : 50}</span>
                    </div>
                  </div>

                  <button onClick={waveInvites} disabled={waveLoading} style={{ ...S.btnPrimary, opacity: waveLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {waveLoading ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⚡</motion.span>
                        Отправка...
                      </>
                    ) : '🌊 Запустить волну'}
                  </button>
                </div>

                {/* Stats */}
                <div style={S.card}>
                  <span style={S.sectionTitle}>Статистика сервиса</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Пользователей', value: allUsers.length },
                      { label: 'Всего просмотров', value: allUsers.reduce((a, u) => a + (u.views || 0), 0) },
                      { label: 'Ключей бейджей', value: userBadgeKeys.length },
                    ].map((s, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{s.value.toLocaleString()}</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Give badge */}
                <div style={S.card}>
                  <span style={S.sectionTitle}>Выдать бейдж напрямую</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={S.label}>Ник пользователя</label>
                      <input style={S.input} value={adminBadgeTarget} onChange={e => setAdminBadgeTarget(e.target.value)} placeholder="username" />
                    </div>
                    <div>
                      <label style={S.label}>Бейдж</label>
                      <select style={{ ...S.input, appearance: 'none' as any }} value={adminBadgeId} onChange={e => setAdminBadgeId(e.target.value)}>
                        <option value="">— выбери —</option>
                        {Object.entries(SYSTEM_BADGES).map(([k, v]) => (
                          <option key={k} value={k}>{v.emoji} {v.name}</option>
                        ))}
                        {customBadges.map(cb => (
                          <option key={cb.id} value={cb.id}>{cb.emoji} {cb.name} (кастом)</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={giveBadge} style={S.btnPrimary}>Выдать</button>
                  </div>
                </div>

                {/* Badge keys */}
                <div style={S.card}>
                  <span style={S.sectionTitle}>Создать ключ бейджика</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={S.label}>Бейдж</label>
                      <select style={{ ...S.input, appearance: 'none' as any }} value={adminKeyBadgeId} onChange={e => setAdminKeyBadgeId(e.target.value)}>
                        <option value="">— выбери бейдж —</option>
                        {Object.entries(SYSTEM_BADGES).filter(([, v]) => !v.adminOnly).map(([k, v]) => (
                          <option key={k} value={k}>{v.emoji} {v.name}</option>
                        ))}
                        {customBadges.map(cb => (
                          <option key={cb.id} value={cb.id}>{cb.emoji} {cb.name}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={createBadgeKey} style={S.btnPrimary}>Создать ключ (20 символов)</button>
                  </div>
                </div>

                {userBadgeKeys.length > 0 && (
                  <div style={S.card}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={S.sectionTitle}>
                        Ключи бейджиков
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 400, marginLeft: 8 }}>
                          ({userBadgeKeys.filter(k => !k.used).length} активных)
                        </span>
                      </span>
                      <button onClick={loadAdminData} style={{ ...S.btnGhost, padding: '4px 10px', fontSize: 12 }}>↻ Обновить</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {userBadgeKeys.map(k => (
                        <div key={k.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: k.used ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <code style={{ color: k.used ? 'rgba(255,255,255,0.25)' : '#fff', fontSize: 11 }}>{k.id}</code>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 8 }}>
                              {SYSTEM_BADGES[k.badgeId]?.emoji} {SYSTEM_BADGES[k.badgeId]?.name || k.badgeId}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span style={{ color: k.used ? 'rgba(239,68,68,0.6)' : 'rgba(74,222,128,0.6)', fontSize: 11 }}>
                              {k.used ? '✗ Исп.' : '✓ Акт.'}
                            </span>
                            {!k.used && (
                              <button
                                onClick={() => { navigator.clipboard.writeText(k.id); toast.success('Ключ скопирован!'); }}
                                style={{ ...S.btnGhost, padding: '3px 8px', fontSize: 11 }}
                              >
                                Копировать
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users list */}
                <div style={S.card}>
                  <span style={S.sectionTitle}>Все пользователи ({allUsers.length})</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {allUsers.map(u => (
                      <div key={u.uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.displayName?.[0] || '?').toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ color: '#fff', fontSize: 13 }}>{u.displayName || u.username}</span>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 6 }}>@{u.username}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                          <span>👁 {u.views || 0}</span>
                          <span style={{ fontFamily: 'monospace' }}>#{u.numericUid}</span>
                          {u.isAdmin && <span style={{ background: 'rgba(255,215,0,0.1)', color: '#ffd700', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>admin</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Save bar */}
      <AnimatePresence>
        {showSaveBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(15,15,15,0.97)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16, padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
              backdropFilter: 'blur(20px)', zIndex: 200,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              minWidth: 320,
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Есть несохранённые изменения</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Сохрани чтобы не потерять</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowSaveBar(false); if (profile) setForm({ ...profile }); }} style={S.btnGhost}>
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {saving && (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', fontSize: 12 }}>⚡</motion.span>
                )}
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
