import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RoomPage from './pages/RoomPage';
import LandingPage from './pages/LandingPage';
import { useAuthStore } from './store/authStore';
import InvitePage from './pages/InvitePage';
import { ToastContainer } from './components/common/Toast';

export default function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <>
    <ToastContainer />
    <Routes>
      <Route path="/" element={token ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/dashboard" element={token ? <DashboardPage /> : <Navigate to="/" />} />
      <Route path="/room/:roomId" element={token ? <RoomPage /> : <Navigate to="/" />} />
      <Route path="/invite/:token" element={<InvitePage />} />
    </Routes>
    </>
  );
}