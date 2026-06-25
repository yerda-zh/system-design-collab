import { useState, useEffect, useRef } from 'react';
import { isAxiosError } from 'axios';
import { getInviteToken, getInviteTokenPublic, regenerateInvite } from '../../api/rooms';
import { useToastStore } from '../../store/toastStore';

interface SharePopupProps {
  roomId: string;
  isOwner: boolean;
  onClose: () => void;
}

export default function SharePopup({ roomId, isOwner, onClose }: SharePopupProps) {
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [loadError, setLoadError] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const addToast = useToastStore((s) => s.addToast);

  const inviteUrl = inviteToken
    ? `${window.location.origin}/invite/${inviteToken}`
    : '';

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const data = await getInviteToken(roomId);
        setInviteToken(data.inviteToken);
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 403) {
          try {
            const data = await getInviteTokenPublic(roomId);
            setInviteToken(data.inviteToken);
          } catch {
            setLoadError('Could not load invite link');
          }
        } else {
          setLoadError('Could not load invite link');
        }
      }
    };
    fetchToken();
  }, [roomId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      addToast('Link copied!', 'success');
    } catch {
      addToast('Could not copy to clipboard', 'error');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const data = await regenerateInvite(roomId);
      setInviteToken(data.inviteToken);
    } catch {
      addToast('Could not regenerate invite link', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div ref={popupRef} style={styles.popup}>
        <div style={styles.header}>
          <h3 style={styles.title}>Share Canvas</h3>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loadError && <p style={styles.error}>{loadError}</p>}

        {!inviteToken ? (
          <p style={styles.loading}>Loading invite link...</p>
        ) : (
          <>
            <p style={styles.label}>Invite link</p>
            <div style={styles.linkRow}>
              <input
                style={styles.linkInput}
                value={inviteUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button style={styles.copyBtn} onClick={handleCopy}>
                Copy
              </button>
            </div>

            <p style={styles.hint}>
              Anyone with this link can join the canvas as an editor.
            </p>

            {isOwner && (
              <button
                style={styles.regenerateBtn}
                onClick={handleRegenerate}
                disabled={regenerating}
              >
                {regenerating ? 'Regenerating...' : '↻ Regenerate link'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15,23,42,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  },
  popup: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 20px 48px rgba(0,0,0,0.08)',
    padding: '1.5rem',
    width: '420px',
    maxWidth: '90vw',
    border: '1px solid #f1f5f9',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '-0.01em',
  },
  closeBtn: {
    background: 'none',
    border: '1px solid transparent',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: '0.25rem',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s, border-color 0.15s',
    lineHeight: 1,
  },
  label: {
    margin: '0 0 0.375rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  linkRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  linkInput: {
    flex: 1,
    padding: '0.5625rem 0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    color: '#374151',
    backgroundColor: '#f8fafc',
    cursor: 'text',
    outline: 'none',
  },
  copyBtn: {
    padding: '0.5625rem 1rem',
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    transition: 'background-color 0.15s',
  },
  hint: {
    margin: '0 0 1rem',
    fontSize: '0.78rem',
    color: '#9ca3af',
    lineHeight: 1.5,
  },
  regenerateBtn: {
    background: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.8rem',
    color: '#6b7280',
    width: '100%',
    transition: 'border-color 0.15s, color 0.15s',
  },
  loading: { color: '#9ca3af', fontSize: '0.875rem' },
  error: { color: '#dc2626', fontSize: '0.85rem', margin: '0 0 0.75rem' },
};
