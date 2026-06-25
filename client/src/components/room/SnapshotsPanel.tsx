import { useState, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { NodeData, Snapshot } from '../../types';
import { saveSnapshot, getSnapshots, deleteSnapshot } from '../../api/canvas';
import { useCanvasStore } from '../../store/canvasStore';
import { useToastStore } from '../../store/toastStore';
import { socketService, WS_EVENTS } from '../../services/socketService';

interface SnapshotsPanelProps {
  roomId: string;
  onClose: () => void;
}

export default function SnapshotsPanel({ roomId, onClose }: SnapshotsPanelProps) {
  const { setNodes, setEdges } = useCanvasStore();
  const addToast = useToastStore((s) => s.addToast);

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSnapshots(roomId)
      .then((data) => { if (!cancelled) setSnapshots(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [roomId]);

  useEffect(() => {
    const onSnapshotCreated = (snapshot: Snapshot) => {
      setSnapshots((prev) => {
        if (prev.some((s) => s.id === snapshot.id)) return prev;
        return [snapshot, ...prev];
      });
    };

    const onSnapshotDeleted = ({ snapshotId }: { snapshotId: string }) => {
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
    };

    socketService.on(WS_EVENTS.SNAPSHOT_CREATED, onSnapshotCreated as (...args: unknown[]) => void);
    socketService.on(WS_EVENTS.SNAPSHOT_DELETED, onSnapshotDeleted as (...args: unknown[]) => void);

    return () => {
      socketService.off(WS_EVENTS.SNAPSHOT_CREATED, onSnapshotCreated as (...args: unknown[]) => void);
      socketService.off(WS_EVENTS.SNAPSHOT_DELETED, onSnapshotDeleted as (...args: unknown[]) => void);
    };
  }, []);

  const handleSave = async () => {
    const name = nameInput.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      await saveSnapshot(roomId, name);
      setNameInput('');
      addToast('Snapshot saved', 'success');
    } catch {
      addToast('Failed to save snapshot', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (snapshot: Snapshot) => {
    if (!window.confirm(`Delete snapshot "${snapshot.name}"?`)) return;
    try {
      await deleteSnapshot(snapshot.id);
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshot.id));
      addToast('Snapshot deleted', 'success');
    } catch {
      addToast('Failed to delete snapshot', 'error');
    }
  };

  const handleRestore = (snapshot: Snapshot) => {
    if (!window.confirm('This will replace the current canvas. Continue?')) return;
    const nodes = snapshot.nodes as Node<NodeData>[];
    const edges = snapshot.edges as Edge[];

    // Apply locally so the restoring user sees it immediately
    setNodes(nodes);
    setEdges(edges.map((e) => ({ ...e, type: 'custom' })) as Edge[]);

    // Broadcast to server — updates Redis + PostgreSQL and notifies other users
    socketService.emit(WS_EVENTS.CANVAS_RESTORE, { roomId, nodes, edges });
    useCanvasStore.getState().markSaved();

    onClose();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div style={styles.headerInner}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={styles.title}>Snapshots</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={styles.saveSection}>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. v1 - monolith design"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
          <button
            style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div style={styles.list}>
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} style={styles.skeletonCard}>
                  <div style={styles.skeletonLine} />
                  <div style={{ ...styles.skeletonLine, width: '60%' }} />
                </div>
              ))}
            </>
          ) : snapshots.length === 0 ? (
            <p style={styles.empty}>No snapshots yet. Save one above.</p>
          ) : (
            snapshots.map((snapshot) => (
              <div key={snapshot.id} style={styles.card}>
                <div style={styles.cardInfo}>
                  <span style={styles.cardName}>{snapshot.name}</span>
                  <span style={styles.cardDate}>{formatDate(snapshot.createdAt)}</span>
                </div>
                <div style={styles.cardActions}>
                  <button
                    style={styles.restoreBtn}
                    onClick={() => handleRestore(snapshot)}
                  >
                    Restore
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(snapshot)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    pointerEvents: 'none',
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '320px',
    backgroundColor: 'white',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.1), -1px 0 0 #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'all',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1rem',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    fontWeight: 600,
    fontSize: '0.9375rem',
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
    transition: 'color 0.15s',
  },
  saveSection: {
    padding: '0.875rem 1rem',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    backgroundColor: '#fafafa',
    flexShrink: 0,
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '0.875rem',
    boxSizing: 'border-box' as const,
    outline: 'none',
    backgroundColor: 'white',
    color: '#111827',
    transition: 'border-color 0.15s',
  },
  saveBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    transition: 'background-color 0.15s',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  empty: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    textAlign: 'center' as const,
    marginTop: '2rem',
    lineHeight: 1.6,
  },
  skeletonCard: {
    border: '1px solid #f1f5f9',
    borderRadius: '8px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonLine: {
    height: '11px',
    borderRadius: '4px',
    backgroundColor: '#f1f5f9',
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  cardName: {
    fontWeight: 600,
    fontSize: '0.875rem',
    color: '#111827',
  },
  cardDate: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  restoreBtn: {
    flex: 1,
    padding: '0.375rem 0.5rem',
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    transition: 'background-color 0.15s',
  },
  deleteBtn: {
    flex: 1,
    padding: '0.375rem 0.5rem',
    backgroundColor: 'white',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
    transition: 'border-color 0.15s',
  },
};
