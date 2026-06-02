import { getBezierPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { EdgeType } from '../../../types';
import { EDGE_CONFIG } from '../../../types';

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
};