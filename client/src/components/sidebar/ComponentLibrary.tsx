import type { NodeType } from '../../types';

// Each item the user can drag onto the canvas
const COMPONENTS: { nodeType: NodeType; label: string; icon: string; description: string }[] = [
  { nodeType: 'database',     label: 'Database',      icon: '🗄️', description: 'PostgreSQL, MySQL, MongoDB' },
  { nodeType: 'cache',        label: 'Cache',         icon: '⚡', description: 'Redis, Memcached' },
  { nodeType: 'queue',        label: 'Message Queue', icon: '📨', description: 'Kafka, RabbitMQ, SQS' },
  { nodeType: 'service',      label: 'Service',       icon: '⚙️', description: 'Microservice, API server' },
  { nodeType: 'loadBalancer', label: 'Load Balancer', icon: '⚖️', description: 'Nginx, AWS ALB' },
  { nodeType: 'apiGateway',   label: 'API Gateway',   icon: '🔀', description: 'Kong, AWS API GW' },
  { nodeType: 'cdn',          label: 'CDN',           icon: '🌐', description: 'Cloudflare, CloudFront' },
];

interface ComponentLibraryProps {
  onAddNode: (nodeType: NodeType) => void;
}

export default function ComponentLibrary({ onAddNode }: ComponentLibraryProps) {
  const handleDragStart = (
    e: React.DragEvent,
    nodeType: NodeType,
  ) => {
    // Store the node type in the drag event's data transfer
    // so the canvas drop handler knows what type to create
    e.dataTransfer.setData('application/nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={styles.sidebar}>
      <h3 style={styles.title}>Components</h3>
      <p style={styles.hint}>Click or drag onto canvas</p>
      <div style={styles.list}>
        {COMPONENTS.map((comp) => (
          <div
            key={comp.nodeType}
            style={styles.item}
            draggable
            onClick={() => onAddNode(comp.nodeType)}
            onDragStart={(e) => handleDragStart(e, comp.nodeType)}
          >
            <span style={styles.icon}>{comp.icon}</span>
            <div>
              <p style={styles.itemLabel}>{comp.label}</p>
              <p style={styles.itemDesc}>{comp.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '220px',
    backgroundColor: 'white',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    overflowY: 'auto',
  },
  title: { margin: '0 0 0.25rem', fontSize: '1rem' },
  hint: { margin: '0 0 1rem', fontSize: '0.75rem', color: '#9ca3af' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  icon: { fontSize: '1.4rem' },
  itemLabel: { margin: 0, fontWeight: 600, fontSize: '0.85rem' },
  itemDesc: { margin: 0, fontSize: '0.72rem', color: '#9ca3af' },
};