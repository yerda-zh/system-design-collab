import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Canvas from '../components/canvas/Canvas';
import ComponentLibrary from '../components/sidebar/ComponentLibrary';
import { loadCanvas, saveCanvas } from '../api/canvas';
import { useCanvasStore } from '../store/canvasStore';
import type { NodeType } from '../types';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const { nodes, edges, setNodes, setEdges, setRevision, isDirty, markSaved } =
    useCanvasStore();

  const [roomName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load the canvas state when the page opens
  useEffect(() => {
    if (!roomId) return;

    const load = async () => {
      try {
        const data = await loadCanvas(roomId);
        setNodes(data.nodes);
        setEdges(data.edges);
        setRevision(data.revision);
      } catch {
        setError('Failed to load canvas. You may not have access.');
      }
    };

    load();
  }, [roomId, setEdges, setNodes, setRevision]);

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
  }, [roomId, nodes, edges, saving, markSaved, setRevision]);

  // Ctrl+S to save
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
    (window).__addNode?.(nodeType);
  };

  return (
    <div style={styles.container}>
      {/* Top bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
        <span style={styles.roomName}>{roomName || roomId}</span>
        <div style={styles.actions}>
          {isDirty && <span style={styles.unsaved}>Unsaved changes</span>}
          {error && <span style={styles.error}>{error}</span>}
          <button
            style={{
              ...styles.saveBtn,
              opacity: saving ? 0.6 : 1,
            }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save  (Ctrl+S)'}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={styles.main}>
        <ComponentLibrary onAddNode={handleAddNode} />
        <div style={styles.canvasWrapper}>
          <Canvas />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh' },
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
  canvasWrapper: { flex: 1, height: '100%' },
};