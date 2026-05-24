import { Handle, Position } from '@xyflow/react';
import type { NodeData, NodeType } from '../../../types';

// Configuration for each node type — color and label
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
  data: NodeData;
  selected: boolean;
}

export default function BaseNode({ data, selected }: BaseNodeProps) {
  const config = NODE_CONFIG[data.nodeType];

  return (
    <div
      style={{
        ...styles.node,
        borderColor: selected ? '#2563eb' : config.color,
        boxShadow: selected ? `0 0 0 2px #2563eb` : '0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      {/* Handles are the connection points on the node */}
      {/* They appear as small dots where you can drag edges from */}
      <Handle type="source" position={Position.Top}    id="top-source"    style={styles.handle} />
      <Handle type="target" position={Position.Top}    id="top-target"    style={styles.handle} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={styles.handle} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={styles.handle} />
      <Handle type="source" position={Position.Left}   id="left-source"   style={styles.handle} />
      <Handle type="target" position={Position.Left}   id="left-target"   style={styles.handle} />
      <Handle type="source" position={Position.Right}  id="right-source"  style={styles.handle} />
      <Handle type="target" position={Position.Right}  id="right-target"  style={styles.handle} />

      <div
        style={{ ...styles.header, backgroundColor: config.color }}
      >
        <span style={styles.icon}>{config.icon}</span>
        <span style={styles.typeLabel}>{data.nodeType}</span>
      </div>

      <div style={styles.body}>
        <span style={styles.label}>{data.label}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  node: {
    width: '160px',
    backgroundColor: 'white',
    border: '2px solid',
    borderRadius: '8px',
    overflow: 'hidden',
    fontFamily: 'sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.6rem',
  },
  icon: { fontSize: '1rem' },
  typeLabel: {
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  body: {
    padding: '0.5rem 0.6rem',
  },
  label: { fontSize: '0.9rem', fontWeight: 500, color: '#1f2937' },
  handle: {
    width: '10px',
    height: '10px',
    backgroundColor: '#94a3b8',
    border: '2px solid white',
  },
};