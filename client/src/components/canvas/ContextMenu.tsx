import { useEffect } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { useClampToViewport } from '../../hooks/useClampToViewport';

interface ContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onClose: () => void;
  onAddComment: () => void;
}

export default function ContextMenu({
  x,
  y,
  onDelete,
  onClose,
  onAddComment,
}: ContextMenuProps) {
  const { ref, style: clampStyle } = useClampToViewport<HTMLDivElement>();

  // Close the menu when clicking anywhere outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, ref]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '140px',
        overflow: 'hidden',
        ...clampStyle,
      }}
    >
      <button
        style={styles.commentBtn}
        onClick={() => {
          onAddComment();
          onClose();
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#eff6ff';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
      >
        <MessageCircle size={14} /> Add Comment
      </button>
      <button
        style={styles.deleteBtn}
        onClick={() => {
          onDelete();
          onClose();
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#fee2e2';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
      >
        <Trash2 size={14} /> Delete
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  commentBtn: {
    width: '100%',
    padding: '0.6rem 1rem',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  deleteBtn: {
    width: '100%',
    padding: '0.6rem 1rem',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#dc2626',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
};