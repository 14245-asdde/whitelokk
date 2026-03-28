import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

function generateNumericUid(): string {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [invite, setInvite] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 8 ? 2
    : password.length < 12 ? 3 : 4;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username || !invite) { toast.error('Заполни все поля'); return; }
    if (username.length < 3 || username.length > 20) { toast.error('Ник: 3–20 символов'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { toast.error('Ник: только буквы, цифры и _'); return; }
    if (password.length < 6) { toast.error('Пароль минимум 6 символов'); return; }
    setLoading(true);
    try {
      const invRef = doc(db, 'invites', invite.trim());
      const invSnap = await getDoc(invRef);
      if (!invSnap.exists() || invSnap.data().used) {
        toast.error('Инвайт-код недействителен или уже использован');
        setLoading(false); return;
      }
      const uq = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
      const uSnap = await getDocs(uq);
      if (!uSnap.empty) { toast.error('Этот ник уже занят'); setLoading(false); return; }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const numericUid = generateNumericUid();
      const isAdmin = username.toLowerCase() === 'ebatelmamok100_7';
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid, username: username.toLowerCase(), displayName: username,
        bio: '', avatarUrl: '', bannerUrl: '', accentColor: '#ffffff', socialLinks: [],
        badges: isAdmin ? ['admin', 'moderator', 'coder'] : [], music: null,
        discordId: '', discordUsername: '', discordAvatar: '', discordTag: '', discordBio: '',
        location: '', views: 0, numericUid, showUid: false, showViews: true,
        animation: 'fadeUp', font: 'Inter', createdAt: Date.now(), isAdmin,
      });
      await updateDoc(invRef, { used: true, usedBy: cred.user.uid, usedAt: Date.now() });
      toast.success('Аккаунт создан!');
    } catch (err: any) {
      const msg = err?.code === 'auth/email-already-in-use' ? 'Email уже используется'
        : err?.code === 'auth/invalid-email' ? 'Некорректный email' : 'Ошибка регистрации';
      toast.error(msg);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Заполни все поля'); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Добро пожаловать!');
    } catch (err: any) {
      const msg = err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential'
        ? 'Неверный email или пароль' : 'Ошибка входа';
      toast.error(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#080808' }}>
      {/* Фон */}
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-scan-line" />
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="relative w-full max-w-[380px] z-10">
        {/* Логотип */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Link to="/" className="flex flex-col items-center gap-3 mb-9 group no-underline">
            <div className="auth-logo-icon">⚡</div>
            <div className="text-center">
              <div className="text-[18px] font-black tracking-tight text-white leading-none">WhiteLok</div>
              <div className="text-[10px] text-white/20 font-semibold tracking-[0.18em] uppercase mt-1">
                Только по инвайту
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Карточка */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          className="auth-card p-6"
        >
          {/* Заголовок */}
          <div className="mb-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode + '-header'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-[17px] font-bold text-white leading-snug">
                  {mode === 'login' ? 'С возвращением' : 'Создать аккаунт'}
                </h1>
                <p className="text-[13px] text-white/30 mt-0.5">
                  {mode === 'login' ? 'Войди в свой аккаунт WhiteLok' : 'Зарегистрируйся с инвайт-кодом'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Табы */}
          <div className="auth-tabs mb-5">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`auth-tab ${mode === m ? 'active' : ''}`}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          {/* Форма */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={mode === 'login' ? handleLogin : handleRegister}
              className="flex flex-col gap-4"
            >
              {/* Никнейм */}
              {mode === 'register' && (
                <div>
                  <label className="auth-input-label">Никнейм</label>
                  <div className="auth-input-wrap">
                    <span className="auth-input-prefix">@</span>
                    <input
                      className="auth-input"
                      style={{ paddingLeft: '26px' }}
                      placeholder="username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="auth-input-label">Email</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Пароль */}
              <div>
                <label className="auth-input-label">Пароль</label>
                <div className="auth-input-wrap">
                  <svg className="auth-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    className="auth-input"
                    style={{ paddingRight: '40px' }}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Индикатор силы пароля */}
                {mode === 'register' && password.length > 0 && (
                  <div className="auth-strength-bar">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`auth-strength-segment ${i <= passwordStrength ? 'active' : ''} ${i <= passwordStrength && passwordStrength === 4 ? 'strong' : ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Инвайт-код */}
              {mode === 'register' && (
                <div>
                  <label className="auth-input-label">Инвайт-код</label>
                  <div className="auth-input-wrap">
                    <svg className="auth-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <input
                      className="auth-input"
                      style={{ fontFamily: 'monospace' }}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      value={invite}
                      onChange={e => setInvite(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}

              {/* Кнопка */}
              <button type="submit" disabled={loading} className="auth-submit-btn mt-1">
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <span style={{ opacity: 0.6 }}>Загрузка...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</span>
                    <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Разделитель + переключение */}
          <div className="auth-divider" />
          <p className="text-center text-[12px] text-white/25 mt-4">
            {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <button
              className="auth-footer-link"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </motion.div>

        {/* Подвал */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-3 mt-6"
        >
          <span className="text-white/15 text-[11px]">© 2024 WhiteLok</span>
          <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <span className="text-white/15 text-[11px]">Закрытая бета</span>
        </motion.div>
      </div>
    </div>
  );
}
