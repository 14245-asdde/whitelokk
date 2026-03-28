import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 32, filter: 'grayscale(1)', animation: 'spin 1s linear infinite' }}>⚡</div>
          <div style={{ width: 120, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, bottom: 0, width: '50%',
              background: 'rgba(255,255,255,0.3)', borderRadius: 99,
              animation: 'bar-load 1s ease-in-out infinite',
            }} />
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes bar-load { 0% { left: -50%; } 100% { left: 100%; } }`}</style>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/auth" replace />} />
      <Route path="/:username" element={<ProfilePage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(18,18,18,0.98)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          },
          success: { iconTheme: { primary: '#fff', secondary: '#000' } },
          error: { iconTheme: { primary: '#fff', secondary: '#000' } },
        }}
      />
    </BrowserRouter>
  );
}
