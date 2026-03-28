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
        uid: cred.user.uid,
        username: username.toLowerCase(),
        displayName: username,
        bio: '',
        avatarUrl: '',
        bannerUrl: '',
        accentColor: '#ffffff',
        socialLinks: [],
        badges: isAdmin ? ['admin', 'moderator', 'coder'] : [],
        music: null,
        discordId: '',
        discordUsername: '',
        discordAvatar: '',
        discordTag: '',
        discordBio: '',
        location: '',
        views: 0,
        numericUid,
        showUid: false,
        showViews: true,
        animation: 'fadeUp',
        font: 'Inter',
        createdAt: Date.now(),
        isAdmin,
      });
      await updateDoc(invRef, { used: true, usedBy: cred.user.uid, usedAt: Date.now() });
      toast.success('Аккаунт создан!');
    } catch (err: any) {
      const msg = err?.code === 'auth/email-already-in-use' ? 'Email уже используется' :
        err?.code === 'auth/invalid-email' ? 'Некорректный email' : 'Ошибка регистрации';
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-5 blur-3xl" style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-5 blur-3xl" style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />

      <div className="relative w-full max-w-sm z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-2xl grayscale">⚡</span>
          <span className="text-xl font-black tracking-tight text-white">WhiteLok</span>
        </Link>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-strong rounded-2xl p-6"
        >
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: mode === m ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                }}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 10 : -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={mode === 'login' ? handleLogin : handleRegister}
              className="flex flex-col gap-3"
            >
              {mode === 'register' && (
                <div>
                  <label className="block text-xs text-white/40 mb-1 font-medium">Никнейм</label>
                  <input
                    className="input-dark"
                    placeholder="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-white/40 mb-1 font-medium">Email</label>
                <input
                  className="input-dark"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1 font-medium">Пароль</label>
                <input
                  className="input-dark"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
              {mode === 'register' && (
                <div>
                  <label className="block text-xs text-white/40 mb-1 font-medium">Инвайт-код</label>
                  <input
                    className="input-dark"
                    placeholder="20-символьный код"
                    value={invite}
                    onChange={e => setInvite(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 flex items-center justify-center gap-2"
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : null}
                {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
              </button>
            </motion.form>
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-white/20 text-xs mt-6">
          WhiteLok · Только по инвайту
        </p>
      </div>
    </div>
  );
}
