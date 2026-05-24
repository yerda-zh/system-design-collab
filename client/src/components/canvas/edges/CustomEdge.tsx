import { getBezierPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { EdgeType } from '../../../types';
import { EDGE_CONFIG } from '../../../types';

type Props = EdgeProps & { data?: { edgeType?: EdgeType; pending?: boolean } };

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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  if (data?.pending) {
    return (
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ ...styles.path, stroke: '#94a3b8', strokeDasharray: '6 3' }}
      />
    );
  }

  const rawType = data?.edgeType;
  const edgeType: EdgeType = rawType && rawType in EDGE_CONFIG ? rawType : 'http';
  const config = EDGE_CONFIG[edgeType];

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ ...styles.path, stroke: config.color }} />
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
      </EdgeLabelRenderer>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  path: {
    strokeWidth: 2,
  },
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
};
