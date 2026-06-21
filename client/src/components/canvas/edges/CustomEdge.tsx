import { getBezierPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
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

  const commentCount = useCommentStore(
    useShallow((state) =>
      state.comments.filter((c) => c.targetId === id && c.parentId === null).length,
    ),
  );

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const markerId = `arrow-${id}`;

  return (
    <>
      {/* Define the arrowhead marker for this edge */}
      <defs>
        <marker
          id={markerId}
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
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
        {commentCount > 0 && (
          <div
            className="nodrag nopan"
            style={{
              ...styles.commentBadge,
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 20}px)`,
            }}
          >
            {commentCount}
          </div>
        )}
      </EdgeLabelRenderer>
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
  },
};