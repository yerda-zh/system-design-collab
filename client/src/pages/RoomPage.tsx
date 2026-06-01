import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Canvas from '../components/canvas/Canvas';
import ComponentLibrary from '../components/sidebar/ComponentLibrary';
import ActiveUsers from '../components/collaboration/ActiveUsers';
import { saveCanvas } from '../api/canvas';
import { useCanvasStore } from '../store/canvasStore';
import { useCollaborationStore } from '../store/collaborationStore';
import { useCollaboration } from '../hooks/useCollaboration';
import type { NodeType } from '../types';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const { nodes, edges, setRevision, isDirty, markSaved } = useCanvasStore();
  const { isJoined } = useCollaborationStore();
  const { emitOperation, emitCursor } = useCollaboration(roomId!);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = useCallback(async () => {
    if (!roomId || saving) return;
    setSaving(true);
    try {
      const result = await saveCanvas(roomId, nodes, edges);
      setRevision(result.revision);
      markSaved();
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [roomId, nodes, edges, saving, setRevision, markSaved]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const handleAddNode = (nodeType: NodeType) => {
    window.__addNode?.(nodeType);
  };

  const handleSelectNode = useCallback((nodeId: string) => {
    useCanvasStore.getState().setHighlightedNodeId(nodeId);
    setTimeout(() => useCanvasStore.getState().setHighlightedNodeId(null), 2000);
  }, []);

  const handleEmitOperation = useCallback(
    (op: object) => {
      emitOperation(op as Parameters<typeof emitOperation>[0]);
    },
    [emitOperation],
  );

  if (!isJoined) {
    return (
      <div style={styles.loading}>
        <p>Connecting to canvas...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>

        <div style={styles.center}>
          <span style={styles.roomName}>{roomId}</span>
        </div>

        <div style={styles.actions}>
          <ActiveUsers />
          {isDirty && <span style={styles.unsaved}>Unsaved changes</span>}
          {error && <span style={styles.error}>{error}</span>}
          <button
            style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save (Ctrl+S)'}
          </button>
        </div>
      </div>

      <div style={styles.main}>
        <ComponentLibrary
          onAddNode={handleAddNode}
          onSelectNode={handleSelectNode}
        />
        <div style={styles.canvasWrapper}>
          <Canvas
            onEmitOperation={handleEmitOperation}
            onCursorMove={emitCursor}
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh' },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: '#6b7280',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.6rem 1rem',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    zIndex: 10,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#2563eb',
  },
  center: { position: 'absolute', left: '50%', transform: 'translateX(-50%)' },
  roomName: { fontWeight: 600, fontSize: '1rem' },
  actions: { display: 'flex', alignItems: 'center', gap: '1rem' },
  unsaved: { fontSize: '0.85rem', color: '#9ca3af' },
  error: { fontSize: '0.85rem', color: 'red' },
  saveBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  main: { display: 'flex', flex: 1, overflow: 'hidden' },
  canvasWrapper: { flex: 1, height: '100%', position: 'relative' },
};