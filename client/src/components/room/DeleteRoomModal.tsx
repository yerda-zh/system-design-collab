import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteRoomModalProps {
  roomName: string;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}

export default function DeleteRoomModal({ roomName, onConfirm, onClose, isPending }: DeleteRoomModalProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isCancelHovered, setIsCancelHovered] = useState(false);
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div style={styles.overlay}>
      <div ref={popupRef} style={styles.popup}>
        <div style={styles.header}>
          <h3 style={styles.title}>Delete Canvas</h3>
          <button
            style={{ ...styles.closeBtn, ...(isCloseHovered ? { color: '#374151', backgroundColor: '#f3f4f6' } : {}) }}
            onClick={onClose}
            onMouseEnter={() => setIsCloseHovered(true)}
            onMouseLeave={() => setIsCloseHovered(false)}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.warningIcon}>
            <AlertTriangle size={22} color="#dc2626" />
          </div>
          <p style={styles.message}>
            This will permanently delete <strong>"{roomName}"</strong> along with all its comments and snapshots. This cannot be undone.
          </p>
        </div>

        <div style={styles.footer}>
          <button
            style={{ ...styles.cancelBtn, ...(isCancelHovered ? { border: '1px solid #d1d5db', backgroundColor: '#f9fafb' } : {}) }}
            onClick={onClose}
            onMouseEnter={() => setIsCancelHovered(true)}
            onMouseLeave={() => setIsCancelHovered(false)}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            style={{
              ...styles.deleteBtn,
              ...(isDeleteHovered && !isPending ? { backgroundColor: '#b91c1c' } : {}),
              ...(isPending ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
            onClick={onConfirm}
            onMouseEnter={() => setIsDeleteHovered(true)}
            onMouseLeave={() => setIsDeleteHovered(false)}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
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
    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.1)',
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
    paddingBottom: '1rem',
    borderBottom: '1px solid #F3F4F6',
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
    transition: 'color 0.15s, background-color 0.15s',
    lineHeight: 1,
  },
  body: {
    display: 'flex',
    gap: '0.875rem',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
  },
  warningIcon: {
    flexShrink: 0,
    marginTop: '1px',
  },
  message: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: 1.6,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  cancelBtn: {
    padding: '0.5rem 1rem',
    background: 'white',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    outline: 'none',
    transition: 'border-color 0.15s, background-color 0.15s',
  },
  deleteBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    outline: 'none',
    transition: 'background-color 0.15s',
  },
};
