import { Handle, Position } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import type { NodeData, NodeType } from '../../../types';
import { useWarningStore } from '../../../store/warningStore';
import { useCommentStore } from '../../../store/commentStore';
import { useCanvasStore } from '../../../store/canvasStore';

const NODE_CONFIG: Record<NodeType, { color: string; icon: string }> = {
  database:     { color: '#2563eb', icon: '🗄️' },
  cache:        { color: '#16a34a', icon: '⚡' },
  queue:        { color: '#d97706', icon: '📨' },
  service:      { color: '#7c3aed', icon: '⚙️' },
  loadBalancer: { color: '#dc2626', icon: '⚖️' },
  apiGateway:   { color: '#0891b2', icon: '🔀' },
  cdn:          { color: '#65a30d', icon: '🌐' },
};

interface BaseNodeProps {
  id: string;
  data: NodeData;
  selected: boolean;
}

export default function BaseNode({ id, data, selected }: BaseNodeProps) {
  const config = NODE_CONFIG[data.nodeType];

  // useShallow prevents infinite loop by doing shallow equality
  // comparison on the filtered array instead of reference comparison
  const warnings = useWarningStore(
    useShallow((state) => state.warnings.filter((w) => w.nodeId === id)),
  );

  const hasHighSeverity = warnings.some((w) => w.severity === 'high');
  const hasWarnings = warnings.length > 0;
  const commentCount = useCommentStore(
    useShallow((state) =>
      state.comments.filter((c) => c.targetId === id && c.parentId === null).length,
    ),
  );

  const highlightedNodeId = useCanvasStore((state) => state.highlightedNodeId);
  const isHighlighted = highlightedNodeId === id;

  return (
    <div
      style={{
        ...styles.node,
        borderColor: hasHighSeverity
          ? '#dc2626'
          : hasWarnings
            ? '#d97706'
            : selected
              ? '#2563eb'
              : config.color,
        boxShadow: isHighlighted
          ? '0 0 0 4px #f59e0b, 0 0 12px rgba(245, 158, 11, 0.5)'
          : hasHighSeverity
            ? '0 0 0 2px #dc2626'
            : hasWarnings
              ? '0 0 0 2px #d97706'
              : selected
                ? '0 0 0 2px #2563eb'
                : '0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      {/* Target handles rendered first — sit below source handles */}
      <Handle type="target" position={Position.Top}    id="top-target"    style={styles.handle} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={styles.handle} />
      <Handle type="target" position={Position.Left}   id="left-target"   style={styles.handle} />
      <Handle type="target" position={Position.Right}  id="right-target"  style={styles.handle} />

      {/* Source handles rendered last — sit on top and get grabbed when dragging */}
      <Handle type="source" position={Position.Top}    id="top-source"    style={styles.handle} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={styles.handle} />
      <Handle type="source" position={Position.Left}   id="left-source"   style={styles.handle} />
      <Handle type="source" position={Position.Right}  id="right-source"  style={styles.handle} />

      <div style={{ ...styles.header, backgroundColor: config.color }}>
        <span style={styles.icon}>{config.icon}</span>
        <span style={styles.typeLabel}>{data.nodeType}</span>
      </div>

      <div style={styles.body}>
        <span style={styles.label}>{data.label}</span>
      </div>

      {hasWarnings && (
        <div
          style={{
            ...styles.badge,
            backgroundColor: hasHighSeverity ? '#dc2626' : '#d97706',
          }}
        >
          {warnings.length}
        </div>
      )}

      {commentCount > 0 && (
        <div style={styles.commentBadge}>
          {commentCount}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  node: {
    width: '160px',
    backgroundColor: 'white',
    border: '2px solid',
    borderRadius: '8px',
    overflow: 'visible',
    fontFamily: 'sans-serif',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.6rem',
    borderRadius: '6px 6px 0 0',
    overflow: 'hidden',
  },
  icon: { fontSize: '1rem' },
  typeLabel: {
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  body: { padding: '0.5rem 0.6rem' },
  label: { fontSize: '0.9rem', fontWeight: 500, color: '#1f2937' },
  handle: {
    width: '10px',
    height: '10px',
    backgroundColor: '#94a3b8',
    border: '2px solid white',
  },
  badge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 700,
    border: '2px solid white',
    zIndex: 10,
  },
  commentBadge: {
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 700,
    border: '2px solid white',
    zIndex: 10,
  },
};