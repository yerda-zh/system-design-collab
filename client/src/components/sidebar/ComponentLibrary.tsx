import type { NodeType } from '../../types';
import WarningPanel from './WarningPanel';

// SVG icons for each component type (replaces emojis)
const NODE_ICONS: Record<string, React.ReactNode> = {
  database: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  cache: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  queue: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  service: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  ),
  loadBalancer: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  apiGateway: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  cdn: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

const COMPONENTS: {
  nodeType: NodeType;
  label: string;
  description: string;
  color: string;
}[] = [
  { nodeType: 'database',     label: 'Database',      description: 'PostgreSQL, MySQL, MongoDB', color: '#3b82f6' },
  { nodeType: 'cache',        label: 'Cache',         description: 'Redis, Memcached',           color: '#f97316' },
  { nodeType: 'queue',        label: 'Message Queue', description: 'Kafka, RabbitMQ, SQS',       color: '#8b5cf6' },
  { nodeType: 'service',      label: 'Service',       description: 'Microservice, API server',   color: '#10b981' },
  { nodeType: 'loadBalancer', label: 'Load Balancer', description: 'Nginx, AWS ALB',             color: '#06b6d4' },
  { nodeType: 'apiGateway',   label: 'API Gateway',   description: 'Kong, AWS API GW',           color: '#f59e0b' },
  { nodeType: 'cdn',          label: 'CDN',           description: 'Cloudflare, CloudFront',     color: '#6366f1' },
];

interface ComponentLibraryProps {
  onAddNode: (nodeType: NodeType) => void;
  onSelectNode: (nodeId: string) => void;
}

export default function ComponentLibrary({
  onAddNode,
  onSelectNode,
}: ComponentLibraryProps) {
  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData('application/nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.components}>
        <div style={styles.sectionHeader}>
          <span style={styles.title}>Components</span>
        </div>
        <p style={styles.hint}>Click to add · drag to place</p>
        <div style={styles.list}>
          {COMPONENTS.map((comp) => (
            <div
              key={comp.nodeType}
              style={styles.item}
              draggable
              onClick={() => onAddNode(comp.nodeType)}
              onDragStart={(e) => handleDragStart(e, comp.nodeType)}
              title={comp.description}
            >
              <div style={{ ...styles.iconWrap, color: comp.color, backgroundColor: `${comp.color}14` }}>
                {NODE_ICONS[comp.nodeType]}
              </div>
              <div style={styles.itemText}>
                <p style={styles.itemLabel}>{comp.label}</p>
                <p style={styles.itemDesc}>{comp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning panel docked to the bottom of the sidebar */}
      <WarningPanel onSelectNode={onSelectNode} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '224px',
    backgroundColor: 'white',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  components: {
    padding: '0.875rem',
    flex: 1,
    overflowY: 'auto',
  },
  sectionHeader: {
    marginBottom: '0.25rem',
  },
  title: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#374151',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  hint: { margin: '0.25rem 0 0.875rem', fontSize: '0.72rem', color: '#9ca3af' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.3125rem' },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem 0.625rem',
    borderRadius: '6px',
    border: '1px solid transparent',
    cursor: 'grab',
    transition: 'background-color 0.15s, border-color 0.15s',
    backgroundColor: '#fafafa',
  },
  iconWrap: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemText: { flex: 1, minWidth: 0 },
  itemLabel: { margin: 0, fontWeight: 600, fontSize: '0.8125rem', color: '#1f2937' },
  itemDesc: { margin: 0, fontSize: '0.7rem', color: '#9ca3af', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
};