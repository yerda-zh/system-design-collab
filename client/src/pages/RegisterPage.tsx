import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import api from '../api/http';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const handleRegister = async () => {
    try {
      await api.post('/auth/register', { email, displayName, password });
      navigate('/login');
    } catch {
      setError('Registration failed. Email may already be in use.');
    }
  };

  return (
    <div style={styles.container}>
      {/* Brand above card */}
      <div style={styles.brand}>
        <Layers size={24} color="#A78BFA" />
        <span style={styles.brandName}>System Design Collab</span>
      </div>

      <div style={styles.card}>
        <div style={styles.headingGroup}>
          <h1 style={styles.heading}>Create an account</h1>
          <p style={styles.subheading}>Start designing systems collaboratively</p>
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
          <label style={styles.label} htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            style={{
              ...styles.input,
              borderColor: focusedField === 'email' ? '#7C3AED' : '#e5e7eb',
              boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(124, 58, 237, 0.1)' : 'none',
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
          <label style={styles.label} htmlFor="reg-name">Display name</label>
          <input
            id="reg-name"
            style={{
              ...styles.input,
              borderColor: focusedField === 'name' ? '#7C3AED' : '#e5e7eb',
              boxShadow: focusedField === 'name' ? '0 0 0 3px rgba(124, 58, 237, 0.1)' : 'none',
            }}
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            style={{
              ...styles.input,
              borderColor: focusedField === 'password' ? '#7C3AED' : '#e5e7eb',
              boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(124, 58, 237, 0.1)' : 'none',
            }}
            type="password"
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
          />
        </div>

        <button
          style={{
            ...styles.button,
            ...(isButtonHovered ? {
              boxShadow: '0 6px 16px rgba(124, 58, 237, 0.45)',
              transform: 'translateY(-1px)',
            } : {}),
          }}
          onClick={handleRegister}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
        >
          Create account
        </button>

        <p style={styles.link}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
    padding: '1rem',
    gap: '1.5rem',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
  brandName: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#A78BFA',
    letterSpacing: '-0.01em',
  },
  card: {
    backgroundColor: 'white',
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    border: '1px solid rgba(255,255,255,0.06)',
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
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9375rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'box-shadow 0.15s ease, transform 0.15s ease',
    marginTop: '0.25rem',
  },
  link: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#6b7280',
  },
};
