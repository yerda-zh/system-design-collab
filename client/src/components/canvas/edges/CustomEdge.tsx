import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getBezierPath, BaseEdge, EdgeLabelRenderer, Position } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import type { EdgeType } from '../../../types';
import { EDGE_CONFIG } from '../../../types';
import { useCommentStore } from '../../../store/commentStore';

type Props = EdgeProps & { data?: { edgeType?: EdgeType } };

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: Props) {
  const rawType = data?.edgeType;
  const edgeType: EdgeType = rawType && rawType in EDGE_CONFIG ? rawType : 'http';
  const config = EDGE_CONFIG[edgeType];

  const topLevelComments = useCommentStore(
    useShallow((state) =>
      state.comments.filter((c) => c.targetId === id && c.parentId === null),
    ),
  );

  const [isCommentTooltipVisible, setIsCommentTooltipVisible] = useState(false);
  const [commentTooltipAnchor, setCommentTooltipAnchor] = useState<DOMRect | null>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  const ARROW_OFFSET = 5;
  const targetOffset = ({
    [Position.Top]:    { dx: 0,            dy:  ARROW_OFFSET },
    [Position.Bottom]: { dx: 0,            dy: -ARROW_OFFSET },
    [Position.Left]:   { dx:  ARROW_OFFSET, dy: 0 },
    [Position.Right]:  { dx: -ARROW_OFFSET, dy: 0 },
  } as Record<string, { dx: number; dy: number }>)[targetPosition] ?? { dx: 0, dy: 0 };

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX: targetX + targetOffset.dx,
    targetY: targetY + targetOffset.dy,
    targetPosition,
  });

  const markerId = `arrow-${id}`;

  return (
    <>
      {/* Define the arrowhead marker for this edge */}
      <defs>
        <marker
          id={markerId}
          markerWidth="12"
          markerHeight="10"
          refX="8"
          refY="4"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon
            points="0 0, 8 4, 0 8"
            fill={config.color}
          />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: config.color,
          strokeWidth: 2,
          markerEnd: `url(#${markerId})`,
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan"
          style={{
            ...styles.label,
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            backgroundColor: config.color,
          }}
        >
          {config.label}
        </div>
        {topLevelComments.length > 0 && (
          <div
            ref={badgeRef}
            className="nodrag nopan"
            style={{
              ...styles.commentBadge,
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 20}px)`,
            }}
            onMouseEnter={() => {
              setIsCommentTooltipVisible(true);
              if (badgeRef.current) setCommentTooltipAnchor(badgeRef.current.getBoundingClientRect());
            }}
            onMouseLeave={() => {
              setIsCommentTooltipVisible(false);
              setCommentTooltipAnchor(null);
            }}
          >
            {topLevelComments.length}
          </div>
        )}
      </EdgeLabelRenderer>

      {isCommentTooltipVisible && topLevelComments.length > 0 && commentTooltipAnchor && createPortal(
        <div style={{
          ...styles.commentTooltip,
          bottom: window.innerHeight - commentTooltipAnchor.top + 6,
          left: commentTooltipAnchor.left,
        }}>
          {topLevelComments.map((c) => (
            <div key={c.id} style={styles.tooltipRow}>
              <span style={{ color: '#2563eb' }}>●</span>
              <span><strong>{c.authorName}:</strong> {c.body}</span>
            </div>
          ))}
          <div style={styles.commentTooltipArrow} />
        </div>,
        document.body,
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  label: {
    position: 'absolute',
    pointerEvents: 'all',
    fontSize: '0.65rem',
    fontWeight: 600,
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  commentBadge: {
    position: 'absolute',
    pointerEvents: 'all',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid white',
    cursor: 'default',
  },
  commentTooltip: {
    position: 'fixed',
    backgroundColor: '#111827',
    color: 'white',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    width: '220px',
    zIndex: 1000,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    pointerEvents: 'none',
  },
  tooltipRow: {
    display: 'flex',
    gap: '0.4rem',
    alignItems: 'flex-start',
    fontSize: '0.72rem',
    lineHeight: 1.5,
    marginBottom: '0.25rem',
  },
  commentTooltipArrow: {
    position: 'absolute',
    bottom: '-4px',
    left: '10px',
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
    borderTop: '4px solid #111827',
  },
};