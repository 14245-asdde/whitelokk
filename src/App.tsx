import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0a0a0a'
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.1)',
          borderTop: '2px solid rgba(255,255,255,0.6)',
          animation: 'spin-slow 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
      <Route path="/:username" element={<ProfilePage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'rgba(20,20,20,0.95)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            fontSize: 13,
            backdropFilter: 'blur(20px)',
          },
          success: {
            iconTheme: { primary: '#fff', secondary: '#000' },
          },
          error: {
            iconTheme: { primary: '#ff6b6b', secondary: '#000' },
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}
