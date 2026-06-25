import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/http';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.accessToken, res.data.user);

      // If there's a redirect param (e.g. from invite link), go there
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      navigate(redirect ?? '/dashboard');
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Brand mark */}
        <div style={styles.brand}>
          <div style={styles.logoMark}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white" />
              <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.7" />
              <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.7" />
              <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5" />
            </svg>
          </div>
          <span style={styles.brandName}>System Design Collab</span>
        </div>

        <div style={styles.headingGroup}>
          <h1 style={styles.heading}>Welcome back</h1>
          <p style={styles.subheading}>Sign in to your account to continue</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="7" cy="7" r="6" stroke="#dc2626" strokeWidth="1.5" />
              <path d="M7 4v3M7 9.5v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="login-email">Email</label>
          <input
            id="login-email"
            style={{
              ...styles.input,
              borderColor: focusedField === 'email' ? '#f97316' : '#e5e7eb',
              boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(249,115,22,0.12)' : 'none',
            }}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="login-password">Password</label>
          <input
            id="login-password"
            style={{
              ...styles.input,
              borderColor: focusedField === 'password' ? '#f97316' : '#e5e7eb',
              boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(249,115,22,0.12)' : 'none',
            }}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        <button style={styles.button} onClick={handleLogin}>
          Sign in
        </button>

        <p style={styles.link}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    border: '1px solid #f1f5f9',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '0.25rem',
  },
  logoMark: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#f97316',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandName: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#1f2937',
    letterSpacing: '-0.01em',
  },
  headingGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '-0.02em',
  },
  subheading: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '0.625rem 0.75rem',
    fontSize: '0.875rem',
    color: '#dc2626',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#374151',
  },
  input: {
    padding: '0.625rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    fontSize: '0.9375rem',
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    width: '100%',
  },
  button: {
    padding: '0.6875rem 1rem',
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9375rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    marginTop: '0.25rem',
  },
  link: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#6b7280',
  },
};