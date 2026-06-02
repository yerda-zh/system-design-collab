import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { token: authToken } = useAuthStore();

  const [status, setStatus] = useState<'idle' | 'joining' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // If not logged in, redirect to login and come back after
  useEffect(() => {
    if (!authToken) {
      navigate(`/login?redirect=/invite/${token}`);
    }
  }, [authToken, token, navigate]);

  const handleJoin = async () => {
    if (!token) return;
    setStatus('joining');
    try {
      const result = await joinRoom(token);
      navigate(`/room/${result.roomId}`);
    } catch {
      setStatus('error');
      setErrorMessage('This invite link is invalid or has expired.');
    }
  };

  if (!authToken) return null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🎨</div>
        <h1 style={styles.title}>You've been invited</h1>
        <p style={styles.subtitle}>
          Join the collaborative system design canvas
        </p>

        {status === 'error' && (
          <p style={styles.error}>{errorMessage}</p>
        )}

        <button
          style={{
            ...styles.joinBtn,
            opacity: status === 'joining' ? 0.6 : 1,
          }}
          onClick={handleJoin}
          disabled={status === 'joining'}
        >
          {status === 'joining' ? 'Joining...' : 'Join Canvas'}
        </button>

        <button
          style={styles.cancelBtn}
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    width: '380px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    textAlign: 'center',
  },
  icon: { fontSize: '3rem' },
  title: { margin: 0, fontSize: '1.5rem', fontWeight: 700 },
  subtitle: { margin: 0, fontSize: '0.95rem', color: '#6b7280' },
  joinBtn: {
    width: '100%',
    padding: '0.85rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  cancelBtn: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  error: { color: '#dc2626', fontSize: '0.85rem', margin: 0 },
};