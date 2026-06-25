import { useEffect } from 'react';
import { useToastStore } from '../../store/toastStore';
import type { ToastType } from '../../store/toastStore';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const BG: Record<ToastType, string> = {
  success: '#16a34a',
  error: '#dc2626',
  info: '#2563eb',
};

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{ ...styles.toast, backgroundColor: BG[type] }}>
      <span style={styles.message}>{message}</span>
      <button style={styles.close} onClick={onClose}>✕</button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div style={styles.container}>
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    minWidth: '240px',
    maxWidth: '360px',
    animation: 'slideInRight 0.2s ease-out',
  },
  message: {
    flex: 1,
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  close: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.8)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
  },
};
