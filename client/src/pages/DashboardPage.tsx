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
        height: '96px',
        borderRadius: '8px',
        backgroundColor: '#f1f5f9',
        animation: 'pulse 1.5s ease-in-out infinite',
        border: '1px solid #e5e7eb',
      }}
    />
  );
}

function EmptyCanvases() {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      </div>
      <p style={styles.emptyTitle}>No canvases yet</p>
      <p style={styles.emptySubtitle}>Create your first canvas to get started</p>
    </div>
  );
}

function EmptyShared() {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
        </svg>
      </div>
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

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoMark}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" fill="white" />
              <rect x="11" y="2" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.7" />
              <rect x="2" y="11" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.7" />
              <rect x="11" y="11" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.5" />
            </svg>
          </div>
          <span style={styles.title}>System Design Collab</span>
        </div>
        <div style={styles.userInfo}>
          <div style={styles.avatar} title={user?.displayName}>{initials}</div>
          <span style={styles.displayName}>{user?.displayName}</span>
          <button style={styles.logoutBtn} onClick={logout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Action row */}
        <div style={styles.actionRow}>
          <div style={styles.actionCard}>
            <p style={styles.actionLabel}>New canvas</p>
            <div style={styles.row}>
              <input
                style={styles.input}
                placeholder="Canvas name..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <button style={styles.primaryBtn} onClick={handleCreateRoom}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create
              </button>
            </div>
          </div>

          <div style={styles.actionCard}>
            <p style={styles.actionLabel}>Join via invite</p>
            <div style={styles.row}>
              <input
                style={styles.input}
                placeholder="Paste invite link or token..."
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button style={styles.secondaryBtn} onClick={handleJoinRoom}>Join</button>
            </div>
          </div>
        </div>

        {/* My Canvases */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>My Canvases</h2>
            {myRooms.length > 0 && (
              <span style={styles.countBadge}>{myRooms.length}</span>
            )}
          </div>
          {loading ? (
            <div style={styles.grid}>
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
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
                  <div style={styles.roomCardTop}>
                    <div style={styles.roomCardIcon}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 21V9" />
                      </svg>
                    </div>
                    <button
                      style={styles.shareIconBtn}
                      onClick={(e) => { e.stopPropagation(); setSharingRoomId(room.id); }}
                      title="Share canvas"
                      aria-label="Share canvas"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                      </svg>
                    </button>
                  </div>
                  <p style={styles.roomName}>{room.name}</p>
                  <p style={styles.roomDate}>{new Date(room.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared with Me */}
        <div style={{ ...styles.section, ...styles.sharedSection }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Shared with Me</h2>
            {sharedRooms.length > 0 && (
              <span style={styles.countBadge}>{sharedRooms.length}</span>
            )}
          </div>
          {loading ? (
            <div style={styles.grid}>
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : sharedRooms.length === 0 ? (
            <EmptyShared />
          ) : (
            <div style={styles.grid}>
              {sharedRooms.map((room) => (
                <div
                  key={room.id}
                  style={{ ...styles.roomCard, ...styles.sharedCard }}
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <div style={styles.roomCardTop}>
                    <div style={{ ...styles.roomCardIcon, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                      </svg>
                    </div>
                    <button
                      style={styles.shareIconBtn}
                      onClick={(e) => { e.stopPropagation(); setSharingRoomId(room.id); }}
                      title="Share canvas"
                      aria-label="Share canvas"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                      </svg>
                    </button>
                  </div>
                  <p style={styles.roomName}>{room.name}</p>
                  <p style={styles.roomDate}>{new Date(room.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
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
  container: { minHeight: '100vh', backgroundColor: '#f8fafc' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 2rem',
    height: '56px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
  },
  logoMark: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: '#f97316',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#111827',
    letterSpacing: '-0.01em',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#fff7ed',
    border: '1.5px solid #fed7aa',
    color: '#ea580c',
    fontSize: '0.75rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  displayName: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#6b7280',
    transition: 'border-color 0.15s, color 0.15s',
  },
  content: { maxWidth: '960px', margin: '0 auto', padding: '2rem 2rem' },
  actionRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '2.5rem',
  },
  actionCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
  },
  actionLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  section: { marginBottom: '2.5rem' },
  sharedSection: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    marginBottom: '1rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#111827',
    letterSpacing: '-0.01em',
  },
  countBadge: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '1px 7px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  row: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  input: {
    flex: 1,
    padding: '0.5625rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    fontSize: '0.9rem',
    color: '#111827',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5625rem 1rem',
    backgroundColor: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    transition: 'background-color 0.15s',
    flexShrink: 0,
  },
  secondaryBtn: {
    padding: '0.5625rem 1rem',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.875rem',
  },
  roomCard: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s, border-color 0.2s',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  sharedCard: {
    backgroundColor: '#fafff5',
    borderColor: '#d1fae5',
  },
  roomCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.25rem',
  },
  roomCardIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  shareIconBtn: {
    background: 'none',
    border: '1px solid transparent',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.15s, border-color 0.15s',
  },
  roomName: {
    margin: 0,
    fontWeight: 600,
    fontSize: '0.875rem',
    color: '#111827',
    letterSpacing: '-0.01em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  roomDate: { margin: 0, fontSize: '0.75rem', color: '#9ca3af' },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '2.5rem 1rem',
  },
  emptyIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.25rem',
  },
  emptyTitle: { color: '#374151', fontSize: '0.875rem', fontWeight: 500 },
  emptySubtitle: { color: '#9ca3af', fontSize: '0.8rem' },
};
