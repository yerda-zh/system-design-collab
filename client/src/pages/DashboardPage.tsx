import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRooms, getSharedRooms, createRoom, joinRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';
import type { Room } from '../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [sharedRooms, setSharedRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const [mine, shared] = await Promise.all([
          getMyRooms(),
          getSharedRooms(),
        ]);
        setMyRooms(mine);
        setSharedRooms(shared);
      } catch {
        setError('Failed to load rooms');
      }
    };

    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const room = await createRoom(newRoomName.trim());
      setNewRoomName('');
      setMyRooms((prev) => [room, ...prev]);
    } catch {
      setError('Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!inviteInput.trim()) return;
    try {
      // Extract the token from a full URL or use it directly
      const token = inviteInput.trim().split('/').pop() ?? inviteInput.trim();
      const result = await joinRoom(token);
      setInviteInput('');
      navigate(`/room/${result.roomId}`);
    } catch {
      setError('Invalid invite link');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>System Design Collab</h1>
        <div style={styles.userInfo}>
          <span>{user?.displayName}</span>
          <button style={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.content}>
        {/* Create new room */}
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
            <button style={styles.button} onClick={handleCreateRoom}>
              Create
            </button>
          </div>
        </div>

        {/* Join via invite */}
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
            <button style={styles.button} onClick={handleJoinRoom}>
              Join
            </button>
          </div>
        </div>

        {/* My canvases */}
        <div style={styles.section}>
          <h2>My Canvases</h2>
          {myRooms.length === 0 ? (
            <p style={styles.empty}>No canvases yet. Create one above.</p>
          ) : (
            <div style={styles.grid}>
              {myRooms.map((room) => (
                <div
                  key={room.id}
                  style={styles.roomCard}
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <p style={styles.roomName}>{room.name}</p>
                  <p style={styles.roomDate}>
                    {new Date(room.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared with me */}
        <div style={styles.section}>
          <h2>Shared with Me</h2>
          {sharedRooms.length === 0 ? (
            <p style={styles.empty}>No shared canvases yet.</p>
          ) : (
            <div style={styles.grid}>
              {sharedRooms.map((room) => (
                <div
                  key={room.id}
                  style={styles.roomCard}
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <p style={styles.roomName}>{room.name}</p>
                  <p style={styles.roomDate}>
                    {new Date(room.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
  },
  roomName: { margin: '0 0 0.5rem', fontWeight: 600 },
  roomDate: { margin: 0, fontSize: '0.85rem', color: '#888' },
  error: { color: 'red', padding: '0 2rem' },
  empty: { color: '#888' },
};