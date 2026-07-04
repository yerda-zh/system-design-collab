import { useState, useCallback, useEffect } from 'react';
import { Share2, History, Save } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Canvas from '../components/canvas/Canvas';
import ComponentLibrary from '../components/sidebar/ComponentLibrary';
import ActiveUsers from '../components/collaboration/ActiveUsers';
import SharePopup from '../components/room/SharePopup';
import SnapshotsPanel from '../components/room/SnapshotsPanel';
import CommentPanel from '../components/room/CommentPanel';
import { saveCanvas } from '../api/canvas';
import { getRoom, updateRoomName } from '../api/rooms';
import { useCanvasStore } from '../store/canvasStore';
import { useCollaborationStore } from '../store/collaborationStore';
import { useCollaboration } from '../hooks/useCollaboration';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import type { NodeType } from '../types';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const { nodes, edges, setRevision, isDirty, markSaved } = useCanvasStore();
  const { isJoined, isConnected } = useCollaborationStore();
  const { emitOperation, emitCursor } = useCollaboration(roomId!);
  const addToast = useToastStore((s) => s.addToast);

  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isHoveringName, setIsHoveringName] = useState(false);
  const [activeCommentTarget, setActiveCommentTarget] = useState<{
    targetId: string;
    targetType: 'node' | 'edge';
  } | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const fetchRoom = async () => {
      try {
        const room = await getRoom(roomId);
        setIsOwner(room.ownerId === user?.id);
        setRoomName(room.name);
      } catch {
        // Room metadata is non-critical — ROOM_NOT_FOUND WS event handles redirect
        // if the room has been deleted
      }
    };
    fetchRoom();
  }, [roomId, user?.id]);

  const handleSave = useCallback(async () => {
    if (!roomId || saving) return;
    setSaving(true);
    try {
      const result = await saveCanvas(roomId, nodes, edges);
      setRevision(result.revision);
      markSaved();
      addToast('Canvas saved', 'success');
    } catch {
      addToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }, [roomId, nodes, edges, saving, setRevision, markSaved, addToast]);

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

  const commitNameEdit = useCallback(async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === roomName) {
      setIsEditingName(false);
      return;
    }
    try {
      const updated = await updateRoomName(roomId!, trimmed);
      setRoomName(updated.name);
      addToast('Room renamed', 'success');
    } catch {
      addToast('Failed to rename canvas', 'error');
    }
    setIsEditingName(false);
  }, [nameInput, roomName, roomId, addToast]);

  const handleAddNode = (nodeType: NodeType) => {
    window.__addNode?.(nodeType);
  };

  const handleSelectNode = useCallback((nodeId: string) => {
    useCanvasStore.getState().setHighlightedNodeId(nodeId);
    setTimeout(() => useCanvasStore.getState().setHighlightedNodeId(null), 2000);
  }, []);

  const handleOpenComments = useCallback(
    (targetId: string, targetType: 'node' | 'edge') => {
      setActiveCommentTarget({ targetId, targetType });
    },
    [],
  );

  const handleEmitOperation = useCallback(
    (op: object) => {
      emitOperation(op as Parameters<typeof emitOperation>[0]);
    },
    [emitOperation],
  );

  if (!isJoined) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Connecting to canvas...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        {/* Left: back button */}
        <div style={styles.topBarLeft}>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')} title="Back to dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Dashboard</span>
          </button>
        </div>

        {/* Center: room name */}
        <div style={styles.center}>
          {isOwner && isEditingName ? (
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={commitNameEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitNameEdit();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              style={styles.roomNameInput}
            />
          ) : (
            <div
              style={{ ...styles.roomNameRow, cursor: isOwner ? 'pointer' : 'default' }}
              onMouseEnter={() => isOwner && setIsHoveringName(true)}
              onMouseLeave={() => setIsHoveringName(false)}
              onClick={() => {
                if (isOwner) {
                  setIsEditingName(true);
                  setNameInput(roomName);
                }
              }}
              title={isOwner ? 'Click to rename' : undefined}
            >
              <span style={styles.roomName}>
                {roomName || roomId}
              </span>
              {isOwner && isHoveringName && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Right: actions */}
        <div style={styles.actions}>
          <ActiveUsers />
          {isDirty && (
            <span style={styles.unsaved}>
              <span style={styles.unsavedDot} />
              Unsaved
            </span>
          )}
          <button
            style={{
              ...styles.ghostBtn,
              ...(hoveredBtn === 'share' ? { backgroundColor: '#F9FAFB' } : {}),
            }}
            onClick={() => setShowShare(true)}
            onMouseEnter={() => setHoveredBtn('share')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Share2 size={14} />
            Share
          </button>
          <button
            style={{
              ...styles.ghostBtn,
              ...(hoveredBtn === 'snapshots' ? { backgroundColor: '#F9FAFB' } : {}),
            }}
            onClick={() => setShowSnapshots(true)}
            onMouseEnter={() => setHoveredBtn('snapshots')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <History size={14} />
            Snapshots
          </button>
          <button
            style={{
              ...styles.saveBtn,
              opacity: saving ? 0.65 : 1,
              ...(hoveredBtn === 'save' && !saving ? {
                boxShadow: '0 6px 16px rgba(124, 58, 237, 0.45)',
                transform: 'translateY(-1px)',
              } : {}),
            }}
            onClick={handleSave}
            disabled={saving}
            onMouseEnter={() => setHoveredBtn('save')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            {saving ? 'Saving...' : <><Save size={13} /> Save</>}
          </button>
        </div>
      </div>

      {!isConnected && (
        <div style={styles.disconnectBanner}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Connection lost — trying to reconnect...
        </div>
      )}

      <div style={styles.main}>
        <ComponentLibrary onAddNode={handleAddNode} onSelectNode={handleSelectNode} />
        <div style={styles.canvasWrapper}>
          <Canvas
            onEmitOperation={handleEmitOperation}
            onCursorMove={emitCursor}
            onOpenComments={handleOpenComments}
          />
        </div>
      </div>

      {showShare && roomId && (
        <SharePopup roomId={roomId} isOwner={isOwner} onClose={() => setShowShare(false)} />
      )}

      {showSnapshots && roomId && (
        <SnapshotsPanel roomId={roomId} onClose={() => setShowSnapshots(false)} />
      )}

      {activeCommentTarget && roomId && (
        <CommentPanel
          targetId={activeCommentTarget.targetId}
          targetType={activeCommentTarget.targetType}
          roomId={roomId}
          onClose={() => setActiveCommentTarget(null)}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc' },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    gap: '1rem',
    backgroundColor: '#f8fafc',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '2.5px solid #e5e7eb',
    borderTop: '2.5px solid #7C3AED',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0.875rem',
    height: '48px',
    backgroundColor: 'white',
    boxShadow: '0 1px 0 #E5E7EB',
    zIndex: 10,
    flexShrink: 0,
  },
  topBarLeft: { display: 'flex', alignItems: 'center', minWidth: '120px' },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#6b7280',
    padding: '0.375rem 0.5rem',
    borderRadius: '6px',
    transition: 'color 0.15s, background-color 0.15s',
  },
  center: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  roomNameRow: { display: 'flex', alignItems: 'center', gap: '0.375rem' },
  roomName: {
    fontWeight: 600,
    fontSize: '0.9375rem',
    color: '#111827',
    letterSpacing: '-0.01em',
  },
  roomNameInput: {
    fontWeight: 600,
    fontSize: '0.9375rem',
    border: '1px solid #7C3AED',
    outline: '3px solid rgba(124,58,237,0.12)',
    borderRadius: '5px',
    padding: '2px 6px',
    background: 'white',
    color: '#111827',
    letterSpacing: '-0.01em',
    minWidth: '120px',
  },
  actions: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '120px', justifyContent: 'flex-end' },
  unsaved: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.78rem',
    color: '#9ca3af',
    fontWeight: 500,
  },
  unsavedDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#f59e0b',
    display: 'inline-block',
    flexShrink: 0,
  },
  disconnectBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    backgroundColor: '#fffbeb',
    color: '#92400e',
    fontSize: '0.8rem',
    fontWeight: 500,
    padding: '0.5rem',
    borderBottom: '1px solid #fde68a',
    flexShrink: 0,
  },
  ghostBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.375rem 0.625rem',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    transition: 'background-color 0.15s ease',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.375rem 0.75rem',
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 600,
    transition: 'background 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
  },
  main: { display: 'flex', flex: 1, overflow: 'hidden' },
  canvasWrapper: { flex: 1, height: '100%', position: 'relative' },
};
