import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Share2, LayoutGrid, Link2, Trash2 } from 'lucide-react';
import { getMyRooms, getSharedRooms, createRoom, joinRoom, deleteRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import SharePopup from '../components/room/SharePopup';
import DeleteRoomModal from '../components/room/DeleteRoomModal';
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
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoveredShareId, setHoveredShareId] = useState<string | null>(null);
  const [hoveredDeleteId, setHoveredDeleteId] = useState<string | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [isCreateBtnHovered, setIsCreateBtnHovered] = useState(false);
  const [isJoinBtnHovered, setIsJoinBtnHovered] = useState(false);

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

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchRooms();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
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

  const handleDeleteRoom = async () => {
    if (!deletingRoomId) return;
    setIsDeletePending(true);
    try {
      await deleteRoom(deletingRoomId);
      setMyRooms((prev) => prev.filter((r) => r.id !== deletingRoomId));
      addToast('Canvas deleted', 'success');
    } catch {
      addToast('Failed to delete canvas', 'error');
    } finally {
      setIsDeletePending(false);
      setDeletingRoomId(null);
    }
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div style={styles.container}>
      {/* Dark navbar */}
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
          <button
            style={{
              ...styles.logoutBtn,
              ...(isLogoutHovered ? { color: '#F1F5F9' } : {}),
            }}
            onClick={logout}
            onMouseEnter={() => setIsLogoutHovered(true)}
            onMouseLeave={() => setIsLogoutHovered(false)}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Hero action cards */}
        <div style={styles.heroRow}>
          {/* Create Canvas card */}
          <div style={styles.heroCardPurple}>
            <LayoutGrid size={28} color="rgba(255,255,255,0.75)" />
            <div style={styles.heroText}>
              <p style={styles.heroTitle}>Create Canvas</p>
              <p style={styles.heroSubtitle}>Start a new system design</p>
            </div>
            <div style={styles.heroInputRow}>
              <input
                className="hero-input-purple"
                style={styles.heroPurpleInput}
                placeholder="Canvas name..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              />
              <button
                style={{
                  ...styles.heroPurpleBtn,
                  ...(isCreateBtnHovered ? { backgroundColor: '#EDE9FE' } : {}),
                }}
                onClick={handleCreateRoom}
                onMouseEnter={() => setIsCreateBtnHovered(true)}
                onMouseLeave={() => setIsCreateBtnHovered(false)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create
              </button>
            </div>
          </div>

          {/* Join Canvas card */}
          <div style={styles.heroCardDark}>
            <Link2 size={28} color="#475569" />
            <div style={styles.heroText}>
              <p style={styles.heroTitleDark}>Join Canvas</p>
              <p style={styles.heroSubtitleDark}>Enter invite link or token</p>
            </div>
            <div style={styles.heroInputRow}>
              <input
                className="hero-input-dark"
                style={styles.heroDarkInput}
                placeholder="Paste link or token..."
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button
                style={{
                  ...styles.heroDarkBtn,
                  ...(isJoinBtnHovered ? { backgroundColor: '#475569' } : {}),
                }}
                onClick={handleJoinRoom}
                onMouseEnter={() => setIsJoinBtnHovered(true)}
                onMouseLeave={() => setIsJoinBtnHovered(false)}
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* My Canvases */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.accentBar} />
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
                  style={{
                    ...styles.roomCard,
                    ...(hoveredCardId === room.id ? {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      transform: 'translateY(-2px)',
                    } : {}),
                  }}
                  onClick={() => navigate(`/room/${room.id}`)}
                  onMouseEnter={() => setHoveredCardId(room.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  <div style={styles.roomCardHeader}>
                    <p style={styles.roomName}>{room.name}</p>
                    <div style={styles.cardActions}>
                      <button
                        style={{ ...styles.shareIconBtn, ...(hoveredShareId === room.id ? { color: '#7C3AED' } : {}) }}
                        onClick={(e) => { e.stopPropagation(); setSharingRoomId(room.id); }}
                        onMouseEnter={(e) => { e.stopPropagation(); setHoveredShareId(room.id); }}
                        onMouseLeave={(e) => { e.stopPropagation(); setHoveredShareId(null); }}
                        title="Share canvas"
                        aria-label="Share canvas"
                      >
                        <Share2 size={13} />
                      </button>
                      <button
                        style={{ ...styles.shareIconBtn, ...(hoveredDeleteId === room.id ? { color: '#dc2626' } : {}) }}
                        onClick={(e) => { e.stopPropagation(); setDeletingRoomId(room.id); }}
                        onMouseEnter={(e) => { e.stopPropagation(); setHoveredDeleteId(room.id); }}
                        onMouseLeave={(e) => { e.stopPropagation(); setHoveredDeleteId(null); }}
                        title="Delete canvas"
                        aria-label="Delete canvas"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p style={styles.roomDate}>{new Date(room.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <div style={{ ...styles.accentStrip, opacity: hoveredCardId === room.id ? 1 : 0.6 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared with Me */}
        <div style={{ ...styles.section, ...styles.sharedSection }}>
          <div style={styles.sectionHeader}>
            <div style={styles.accentBar} />
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
                  style={{
                    ...styles.roomCard,
                    ...(hoveredCardId === room.id ? {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      transform: 'translateY(-2px)',
                    } : {}),
                  }}
                  onClick={() => navigate(`/room/${room.id}`)}
                  onMouseEnter={() => setHoveredCardId(room.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  <div style={styles.roomCardHeader}>
                    <p style={styles.roomName}>{room.name}</p>
                    <button
                      style={{ ...styles.shareIconBtn, ...(hoveredShareId === room.id ? { color: '#7C3AED' } : {}) }}
                      onClick={(e) => { e.stopPropagation(); setSharingRoomId(room.id); }}
                      onMouseEnter={(e) => { e.stopPropagation(); setHoveredShareId(room.id); }}
                      onMouseLeave={(e) => { e.stopPropagation(); setHoveredShareId(null); }}
                      title="Share canvas"
                      aria-label="Share canvas"
                    >
                      <Share2 size={13} />
                    </button>
                  </div>
                  <p style={styles.roomDate}>{new Date(room.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <span style={styles.sharedBadge}>Shared</span>
                  <div style={{ ...styles.accentStrip, opacity: hoveredCardId === room.id ? 1 : 0.6 }} />
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
      {deletingRoomId && (
        <DeleteRoomModal
          roomName={myRooms.find((r) => r.id === deletingRoomId)?.name ?? ''}
          onConfirm={handleDeleteRoom}
          onClose={() => setDeletingRoomId(null)}
          isPending={isDeletePending}
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
    backgroundColor: '#0F172A',
    borderBottom: '1px solid #1E293B',
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
    backgroundColor: '#7C3AED',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#F1F5F9',
    letterSpacing: '-0.01em',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#1E293B',
    border: '1.5px solid #334155',
    color: '#C4B5FD',
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
    color: '#94A3B8',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#64748B',
    transition: 'color 0.15s',
  },
  content: { maxWidth: '960px', margin: '0 auto', padding: '2rem 2rem' },
  heroRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '2.5rem',
  },
  heroCardPurple: {
    background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
    boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  heroCardDark: {
    background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    border: '1px solid #334155',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    borderRadius: '12px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  heroText: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  heroTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'white',
    letterSpacing: '-0.01em',
  },
  heroSubtitle: {
    margin: 0,
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.6)',
  },
  heroTitleDark: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#F1F5F9',
    letterSpacing: '-0.01em',
  },
  heroSubtitleDark: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#475569',
  },
  heroInputRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  heroPurpleInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    color: 'white',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  heroPurpleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.5rem 0.875rem',
    backgroundColor: 'white',
    color: '#7C3AED',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    transition: 'background-color 0.15s ease',
  },
  heroDarkInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#F1F5F9',
    fontSize: '0.875rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  heroDarkBtn: {
    padding: '0.5rem 0.875rem',
    backgroundColor: '#334155',
    color: '#F1F5F9',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    transition: 'background-color 0.15s ease',
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
  accentBar: {
    width: '3px',
    height: '20px',
    backgroundColor: '#7C3AED',
    borderRadius: '2px',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '-0.01em',
  },
  countBadge: {
    backgroundColor: '#F5F3FF',
    color: '#7C3AED',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '1px 7px',
    borderRadius: '10px',
    border: '1px solid #EDE9FE',
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  roomCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.125rem',
    flexShrink: 0,
  },
  shareIconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9CA3AF',
    padding: '2px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    transition: 'color 0.15s',
  },
  roomName: {
    margin: 0,
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
  },
  roomDate: {
    margin: '0.25rem 0 0',
    fontSize: '0.75rem',
    color: '#9CA3AF',
  },
  sharedBadge: {
    display: 'inline-block',
    fontSize: '0.65rem',
    backgroundColor: '#F5F3FF',
    color: '#7C3AED',
    padding: '1px 6px',
    borderRadius: '10px',
    fontWeight: 600,
    border: '1px solid #EDE9FE',
    marginTop: '0.25rem',
    alignSelf: 'flex-start',
  },
  accentStrip: {
    height: '3px',
    backgroundColor: '#7C3AED',
    borderRadius: '0 0 8px 8px',
    marginTop: '0.75rem',
    transition: 'opacity 0.15s ease',
  },
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
