import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRooms, getSharedRooms, createRoom, joinRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import SharePopup from '../components/room/SharePopup';
import type { Room } from '../types';

function SkeletonCard() {
  return (
    <div
      style={{
        height: '80px',
        borderRadius: '8px',
        backgroundColor: '#f3f4f6',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

function EmptyCanvases() {
  return (
    <div style={styles.emptyState}>
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <rect x="1" y="1" width="78" height="58" rx="4" stroke="#d1d5db" strokeWidth="2" strokeDasharray="6 4" />
      </svg>
      <p style={styles.emptyTitle}>No canvases yet</p>
      <p style={styles.emptySubtitle}>Create your first canvas above</p>
    </div>
  );
}

function EmptyShared() {
  return (
    <div style={styles.emptyState}>
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <rect x="1" y="1" width="78" height="58" rx="4" stroke="#d1d5db" strokeWidth="2" strokeDasharray="6 4" />
      </svg>
      <p style={styles.emptyTitle}>Nothing shared with you yet</p>
      <p style={styles.emptySubtitle}>Ask a teammate to share their canvas invite link</p>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);

  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [sharedRooms, setSharedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [sharingRoomId, setSharingRoomId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const [mine, shared] = await Promise.all([getMyRooms(), getSharedRooms()]);
        setMyRooms(mine);
        setSharedRooms(shared);
      } catch {
        addToast('Failed to load rooms', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [addToast]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const room = await createRoom(newRoomName.trim());
      setNewRoomName('');
      setMyRooms((prev) => [room, ...prev]);
    } catch {
      addToast('Failed to create room', 'error');
    }
  };

  const handleJoinRoom = async () => {
    if (!inviteInput.trim()) return;
    try {
      const token = inviteInput.trim().split('/').pop() ?? inviteInput.trim();
      const result = await joinRoom(token);
      setInviteInput('');
      navigate(`/room/${result.roomId}`);
    } catch {
      addToast('Invalid invite link', 'error');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>System Design Collab</h1>
        <div style={styles.userInfo}>
          <span>{user?.displayName}</span>
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <h2>New Canvas</h2>
          <div style={styles.row}>
            <input
              style={styles.input}
              placeholder="Canvas name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
            <button style={styles.button} onClick={handleCreateRoom}>Create</button>
          </div>
        </div>

        <div style={styles.section}>
          <h2>Join Canvas</h2>
          <div style={styles.row}>
            <input
              style={styles.input}
              placeholder="Paste invite link or token"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
            <button style={styles.button} onClick={handleJoinRoom}>Join</button>
          </div>
        </div>

        <div style={styles.section}>
          <h2>My Canvases</h2>
          {loading ? (
            <div style={styles.grid}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : myRooms.length === 0 ? (
            <EmptyCanvases />
          ) : (
            <div style={styles.grid}>
              {myRooms.map((room) => (
                <div
                  key={room.id}
                  style={styles.roomCard}
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <button
                    style={styles.shareIconBtn}
                    onClick={(e) => { e.stopPropagation(); setSharingRoomId(room.id); }}
                    title="Share"
                  >
                    🔗
                  </button>
                  <p style={styles.roomName}>{room.name}</p>
                  <p style={styles.roomDate}>{new Date(room.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h2>Shared with Me</h2>
          {loading ? (
            <div style={styles.grid}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : sharedRooms.length === 0 ? (
            <EmptyShared />
          ) : (
            <div style={styles.grid}>
              {sharedRooms.map((room) => (
                <div
                  key={room.id}
                  style={styles.roomCard}
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <button
                    style={styles.shareIconBtn}
                    onClick={(e) => { e.stopPropagation(); setSharingRoomId(room.id); }}
                    title="Share"
                  >
                    🔗
                  </button>
                  <p style={styles.roomName}>{room.name}</p>
                  <p style={styles.roomDate}>{new Date(room.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {sharingRoomId && (
        <SharePopup
          roomId={sharingRoomId}
          isOwner={myRooms.some((r) => r.id === sharingRoomId)}
          onClose={() => setSharingRoomId(null)}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'white',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  title: { margin: 0, fontSize: '1.3rem' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '1rem' },
  logoutBtn: {
    padding: '0.4rem 0.8rem',
    backgroundColor: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  content: { maxWidth: '900px', margin: '0 auto', padding: '2rem' },
  section: { marginBottom: '2rem' },
  row: { display: 'flex', gap: '0.5rem' },
  input: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' },
  roomCard: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
    position: 'relative',
  },
  shareIconBtn: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0.2rem',
    lineHeight: 1,
    borderRadius: '4px',
  },
  roomName: { margin: '0 0 0.5rem', fontWeight: 600 },
  roomDate: { margin: 0, fontSize: '0.85rem', color: '#888' },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '2rem 1rem',
  },
  emptyTitle: { color: '#6b7280', fontSize: '0.95rem' },
  emptySubtitle: { color: '#9ca3af', fontSize: '0.82rem' },
};
