import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function checkInviteCode(code: string): Promise<{ valid: boolean; docId?: string; isTopKey?: boolean }> {
    const trimmed = code.trim();
    try {
      const q = query(
        collection(db, 'inviteCodes'),
        where('code', '==', trimmed),
        where('isUsed', '==', false)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        return { valid: true, docId: snap.docs[0].id, isTopKey: data.isTopKey === true };
      }
      return { valid: false };
    } catch (e) {
      console.error('Invite check error:', e);
      return { valid: false };
    }
  }

  async function markInviteUsed(docId: string, uid: string) {
    try {
      await updateDoc(doc(db, 'inviteCodes', docId), {
        isUsed: true,
        usedBy: uid,
        usedAt: Date.now()
      });
    } catch (e) {
      console.error('Mark invite error:', e);
    }
  }

  // Generate a numeric UID (8 digits)
  function generateNumericUid(): string {
    return String(Math.floor(10000000 + Math.random() * 90000000));
  }

  async function handleRegister() {
    if (!email || !password || !username || !inviteCode) {
      toast.error('Заполни все поля');
      return;
    }
    if (username.length < 3 || username.length > 32) {
      toast.error('Никнейм: от 3 до 32 символов');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Никнейм: только буквы, цифры и _');
      return;
    }
    if (password.length < 6) {
      toast.error('Пароль минимум 6 символов');
      return;
    }
    if (inviteCode.trim().length !== 20) {
      toast.error('Инвайт-код — 20 символов');
      return;
    }

    setLoading(true);
    try {
      // Check username
      const uq = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
      const usnap = await getDocs(uq);
      if (!usnap.empty) {
        toast.error('Этот никнейм уже занят');
        setLoading(false);
        return;
      }

      // Check invite
      const { valid, docId, isTopKey } = await checkInviteCode(inviteCode);
      if (!valid || !docId) {
        toast.error('Инвайт-код недействителен или уже использован');
        setLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const numericUid = generateNumericUid();

      const defaultProfile = {
        uid,
        numericUid,
        username: username.toLowerCase(),
        displayName: username,
        bio: '',
        location: '',
        badges: [],
        socialLinks: [],
        views: 0,
        createdAt: Date.now(),
        backgroundType: 'gradient',
        backgroundGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
        accentColor: '#ffffff',
        socialIconColor: '#ffffff',
        blurEffect: true,
        glassEffect: true,
        cardAnimation: 'fade',
        showViews: true,
        showUid: false,
        topKey: isTopKey === true,
      };

      await setDoc(doc(db, 'users', uid), defaultProfile);
      await markInviteUsed(docId, uid);
      toast.success('Аккаунт создан!');
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'auth/email-already-in-use') toast.error('Этот email уже используется');
      else if (err.code === 'auth/invalid-email') toast.error('Неверный формат email');
      else if (err.code === 'auth/weak-password') toast.error('Пароль слишком слабый');
      else toast.error('Ошибка: ' + (err.message || 'неизвестная'));
    }
    setLoading(false);
  }

  async function handleLogin() {
    if (!email || !password) {
      toast.error('Заполни все поля');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Добро пожаловать!');
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        toast.error('Неверный email или пароль');
      } else {
        toast.error('Ошибка входа: ' + (err.message || ''));
      }
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#080808', position: 'relative', overflow: 'hidden'
    }}>
      {/* Blobs */}
      <div style={{
        position: 'fixed', top: '20%', left: '20%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', right: '15%',
        width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Back */}
      <a href="/" style={{
        position: 'fixed', top: 20, left: 24,
        fontSize: 13, color: 'rgba(255,255,255,0.4)',
        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
        transition: 'color 0.2s', zIndex: 10,
      }}
        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
      >
        ← На главную
      </a>

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 400, padding: '0 16px', zIndex: 5 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span style={{ fontSize: 22, filter: 'invert(1)', fontWeight: 900 }}>W</span>
          </div>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px' }}>WhiteLokk</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
            {mode === 'login' ? 'Войди в свой аккаунт' : 'Создай аккаунт'}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: 28,
          backdropFilter: 'blur(20px)',
        }}>
          {/* Mode toggle */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 24,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 10, padding: 4,
          }}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: '8px 0',
                  borderRadius: 7, border: 'none',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>
                  Никнейм
                </label>
                <input
                  className="input-dark"
                  placeholder="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>
                Email
              </label>
              <input
                className="input-dark"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>
                Пароль
              </label>
              <input
                className="input-dark"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 5 }}>
                  Инвайт-код <span style={{ color: 'rgba(255,255,255,0.25)' }}>(20 символов)</span>
                </label>
                <input
                  className="input-dark"
                  placeholder="Введи инвайт-код"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  maxLength={20}
                  style={{ fontFamily: 'monospace', letterSpacing: '2px' }}
                />
              </div>
            )}

            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              style={{
                marginTop: 8,
                width: '100%', padding: '12px 0',
                background: loading ? 'rgba(255,255,255,0.3)' : '#fff',
                color: '#000', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? '...' : (mode === 'login' ? 'Войти' : 'Создать аккаунт')}
            </button>
          </div>
        </div>

        {mode === 'register' && (
          <div style={{
            marginTop: 16, textAlign: 'center',
            fontSize: 12, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6,
          }}>
            Регистрация только по инвайт-коду.<br />
            Получи его у администратора.
          </div>
        )}
      </div>
    </div>
  );
}
