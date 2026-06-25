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
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    padding: '1.5rem',
    width: '420px',
    maxWidth: '90vw',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  title: { margin: 0, fontSize: '1.1rem', fontWeight: 700 },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#9ca3af',
    padding: '0.25rem',
  },
  label: {
    margin: '0 0 0.4rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  linkRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  linkInput: {
    flex: 1,
    padding: '0.6rem 0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '0.85rem',
    color: '#374151',
    backgroundColor: '#f9fafb',
    cursor: 'text',
  },
  copyBtn: {
    padding: '0.6rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  hint: {
    margin: '0 0 1rem',
    fontSize: '0.78rem',
    color: '#9ca3af',
  },
  regenerateBtn: {
    background: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.82rem',
    color: '#6b7280',
    width: '100%',
  },
  loading: { color: '#9ca3af', fontSize: '0.9rem' },
  error: { color: '#dc2626', fontSize: '0.85rem', margin: '0 0 0.75rem' },
};
