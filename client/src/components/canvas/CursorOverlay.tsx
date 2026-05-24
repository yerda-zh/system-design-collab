import { useReactFlow } from '@xyflow/react';
import { useCollaborationStore } from '../../store/collaborationStore';
import { useAuthStore } from '../../store/authStore';

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
  const { user } = useAuthStore();

  // flowToScreenPosition converts canvas coordinates back to screen coordinates
  // accounting for the current zoom level and pan position of THIS user's viewport
  const { flowToScreenPosition } = useReactFlow();

  return (
    <>
      {Array.from(cursors.values())
        // Don't render our own cursor
        .filter((cursor) => cursor.userId !== user?.id)
        .map((cursor) => {
          // Convert canvas position to screen position for this user's viewport
          const screenPos = flowToScreenPosition({
            x: cursor.x,
            y: cursor.y,
          });

          return (
            <div
              key={cursor.userId}
              style={{
                position: 'fixed',
                left: screenPos.x,
                top: screenPos.y,
                pointerEvents: 'none',
                zIndex: 1000,
                transform: 'translate(-2px, -2px)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path
                  d="M0 0 L0 12 L3.5 9 L6 14 L7.5 13.5 L5 8.5 L9 8.5 Z"
                  fill={getUserColor(cursor.userId)}
                  stroke="white"
                  strokeWidth="1"
                />
              </svg>
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
          );
        })}
    </>
  );
}