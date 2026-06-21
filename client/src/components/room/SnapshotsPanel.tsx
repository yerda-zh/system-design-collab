import { useState, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { NodeData, Snapshot } from '../../types';
import { saveSnapshot, getSnapshots, deleteSnapshot } from '../../api/canvas';
import { useCanvasStore } from '../../store/canvasStore';
import { socketService, WS_EVENTS } from '../../services/socketService';

interface SnapshotsPanelProps {
  roomId: string;
  onClose: () => void;
}

export default function SnapshotsPanel({ roomId, onClose }: SnapshotsPanelProps) {
  const { setNodes, setEdges } = useCanvasStore();

  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (snapshot: Snapshot) => {
    if (!window.confirm(`Delete snapshot "${snapshot.name}"?`)) return;
    await deleteSnapshot(snapshot.id);
    setSnapshots((prev) => prev.filter((s) => s.id !== snapshot.id));
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
          <span style={styles.title}>Snapshots</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
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
          {saveSuccess && <span style={styles.success}>Snapshot saved!</span>}
        </div>

        <div style={styles.list}>
          {loading ? (
            <p style={styles.empty}>Loading...</p>
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
    boxShadow: '-4px 0 16px rgba(0,0,0,0.12)',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'all',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
  },
  title: { fontWeight: 600, fontSize: '1rem' },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#6b7280',
    padding: '0 0.25rem',
  },
  saveSection: {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  input: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    outline: 'none',
  },
  saveBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  success: {
    fontSize: '0.8rem',
    color: '#16a34a',
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
    textAlign: 'center',
    marginTop: '1rem',
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  cardName: {
    fontWeight: 500,
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
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
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
  },
};
