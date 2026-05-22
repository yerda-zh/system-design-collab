import { useCollaborationStore } from '../../store/collaborationStore';

// Assign a consistent color to each user based on their userId
const USER_COLORS = [
  '#e11d48', '#d97706', '#16a34a',
  '#2563eb', '#7c3aed', '#db2777',
];

function getUserColor(userId: string): string {
  // Simple hash of the userId to pick a color
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return USER_COLORS[hash % USER_COLORS.length];
}

export default function CursorOverlay() {
  const cursors = useCollaborationStore((state) => state.cursors);

  return (
    <>
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={cursor.userId}
          style={{
            position: 'fixed',
            left: cursor.x,
            top: cursor.y,
            pointerEvents: 'none', // don't block mouse events
            zIndex: 1000,
            transform: 'translate(-2px, -2px)',
          }}
        >
          {/* Cursor pointer */}
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              d="M0 0 L0 12 L3.5 9 L6 14 L7.5 13.5 L5 8.5 L9 8.5 Z"
              fill={getUserColor(cursor.userId)}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          {/* Name label */}
          <div
            style={{
              backgroundColor: getUserColor(cursor.userId),
              color: 'white',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              marginTop: '2px',
              whiteSpace: 'nowrap',
            }}
          >
            {cursor.displayName}
          </div>
        </div>
      ))}
    </>
  );
}