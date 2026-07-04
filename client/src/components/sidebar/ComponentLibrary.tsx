import { useState } from 'react';
import type { NodeType } from '../../types';
import { NODE_CONFIG } from '../../constants/nodeConfig';
import WarningPanel from './WarningPanel';

const COMPONENTS: { nodeType: NodeType; label: string; description: string }[] = [
  { nodeType: 'database',     label: 'Database',      description: 'PostgreSQL, MySQL, MongoDB' },
  { nodeType: 'cache',        label: 'Cache',         description: 'Redis, Memcached' },
  { nodeType: 'queue',        label: 'Message Queue', description: 'Kafka, RabbitMQ, SQS' },
  { nodeType: 'service',      label: 'Service',       description: 'Microservice, API server' },
  { nodeType: 'loadBalancer', label: 'Load Balancer', description: 'Nginx, AWS ALB' },
  { nodeType: 'apiGateway',   label: 'API Gateway',   description: 'Kong, AWS API GW' },
  { nodeType: 'cdn',          label: 'CDN',           description: 'Cloudflare, CloudFront' },
];

interface ComponentLibraryProps {
  onAddNode: (nodeType: NodeType) => void;
  onSelectNode: (nodeId: string) => void;
}

export default function ComponentLibrary({
  onAddNode,
  onSelectNode,
}: ComponentLibraryProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData('application/nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={styles.sidebar}>
      <div className="sidebar-scroll" style={styles.components}>
        <div style={styles.sectionHeader}>
          <span style={styles.title}>Components</span>
        </div>
        <p style={styles.hint}>Click to add · drag to place</p>
        <div style={styles.list}>
          {COMPONENTS.map((comp) => {
            const { color, Icon } = NODE_CONFIG[comp.nodeType];
            const isHovered = hoveredItem === comp.nodeType;
            return (
              <div
                key={comp.nodeType}
                style={{
                  ...styles.item,
                  ...(isHovered ? {
                    backgroundColor: '#334155',
                    borderColor: '#475569',
                    transform: 'translateX(2px)',
                  } : {}),
                }}
                draggable
                onClick={() => onAddNode(comp.nodeType)}
                onDragStart={(e) => handleDragStart(e, comp.nodeType)}
                onMouseEnter={() => setHoveredItem(comp.nodeType)}
                onMouseLeave={() => setHoveredItem(null)}
                title={comp.description}
              >
                <div style={{ ...styles.iconWrap, backgroundColor: `${color}22`, color }}>
                  <Icon size={18} />
                </div>
                <div style={styles.itemText}>
                  <p style={styles.itemLabel}>{comp.label}</p>
                  <p style={styles.itemDesc}>{comp.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <WarningPanel onSelectNode={onSelectNode} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '220px',
    backgroundColor: '#0F172A',
    borderRight: '1px solid #1E293B',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexShrink: 0,
    overflowX: 'hidden',
  },
  components: {
    padding: '0.875rem',
    flex: 1,
    overflowY: 'auto',
  },
  sectionHeader: {
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  hint: { margin: '0.25rem 0 0.875rem', fontSize: '0.7rem', color: '#334155' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.55rem 0.625rem',
    borderRadius: '8px',
    border: '1px solid #1E293B',
    cursor: 'grab',
    transition: 'all 0.12s ease',
    backgroundColor: '#1E293B',
  },
  iconWrap: {
    width: '30px',
    height: '30px',
    borderRadius: '7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemText: { flex: 1, minWidth: 0 },
  itemLabel: { margin: 0, fontWeight: 500, fontSize: '0.8125rem', color: '#F1F5F9' },
  itemDesc: { margin: 0, fontSize: '0.68rem', color: '#475569', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
};
