import { useCollaborationStore } from '../../store/collaborationStore';

const USER_COLORS = [
  '#e11d48', '#d97706', '#16a34a',
  '#2563eb', '#7c3aed', '#db2777',
];

function getUserColor(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return USER_COLORS[hash % USER_COLORS.length];
}

export default function ActiveUsers() {
  const activeUsers = useCollaborationStore((state) => state.activeUsers);

  if (activeUsers.length === 0) return null;

  return (
    <div style={styles.container}>
      {activeUsers.map((user) => (
        <div
          key={user.userId}
          title={user.displayName}
          style={{
            ...styles.avatar,
            backgroundColor: getUserColor(user.userId),
          }}
        >
          {user.displayName.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '13px',
    fontWeight: 600,
    border: '2px solid white',
    cursor: 'default',
  },
};