import { useState } from 'react';
import type { NodeType } from '../../types';
import { NODE_CONFIG } from '../../constants/nodeConfig';

interface ComponentDef {
  nodeType: NodeType;
  label: string;
  description: string;
}

interface ComponentSection {
  section: string;
  items: ComponentDef[];
}

const COMPONENT_SECTIONS: ComponentSection[] = [
  {
    section: 'Clients',
    items: [
      { nodeType: 'client',       label: 'Client',        description: 'Browser, desktop app' },
      { nodeType: 'mobileClient', label: 'Mobile Client', description: 'iOS, Android app' },
      { nodeType: 'thirdParty',   label: 'Third Party',   description: 'External API, payment GW' },
    ],
  },
  {
    section: 'Networking',
    items: [
      { nodeType: 'dns',          label: 'DNS',            description: 'Route 53, GeoDNS' },
      { nodeType: 'firewall',     label: 'Firewall / WAF', description: 'DDoS protection, WAF' },
      { nodeType: 'reverseProxy', label: 'Reverse Proxy',  description: 'Nginx, HAProxy' },
      { nodeType: 'loadBalancer', label: 'Load Balancer',  description: 'Nginx, AWS ALB' },
      { nodeType: 'apiGateway',   label: 'API Gateway',    description: 'Kong, AWS API GW' },
      { nodeType: 'cdn',          label: 'CDN',            description: 'Cloudflare, CloudFront' },
    ],
  },
  {
    section: 'Compute',
    items: [
      { nodeType: 'service',                label: 'Service',                description: 'Microservice, API server' },
      { nodeType: 'worker',                 label: 'Worker',                 description: 'Background job processor' },
      { nodeType: 'serverless',             label: 'Serverless',             description: 'Lambda, Cloud Functions' },
      { nodeType: 'containerOrchestrator',  label: 'Container Orchestrator', description: 'Kubernetes, ECS' },
    ],
  },
  {
    section: 'Storage',
    items: [
      { nodeType: 'database',      label: 'Database',       description: 'PostgreSQL, MySQL, MongoDB' },
      { nodeType: 'cache',         label: 'Cache',          description: 'Redis, Memcached' },
      { nodeType: 'objectStorage', label: 'Object Storage', description: 'S3, GCS, Azure Blob' },
      { nodeType: 'blockStorage',  label: 'Block Storage',  description: 'EBS, Persistent Disk' },
      { nodeType: 'dataWarehouse', label: 'Data Warehouse', description: 'Snowflake, BigQuery' },
      { nodeType: 'searchEngine',  label: 'Search Engine',  description: 'Elasticsearch, Solr' },
      { nodeType: 'timeSeriesDb',  label: 'Time Series DB', description: 'InfluxDB, Prometheus' },
    ],
  },
  {
    section: 'Messaging',
    items: [
      { nodeType: 'queue',           label: 'Message Queue',    description: 'Kafka, RabbitMQ, SQS' },
      { nodeType: 'eventBus',        label: 'Event Bus',        description: 'EventBridge, SNS' },
      { nodeType: 'streamProcessor', label: 'Stream Processor', description: 'Flink, Kafka Streams' },
    ],
  },
  {
    section: 'Observability',
    items: [
      { nodeType: 'monitoring', label: 'Monitoring', description: 'Prometheus, Datadog' },
      { nodeType: 'logging',    label: 'Logging',    description: 'ELK Stack, Splunk' },
    ],
  },
  {
    section: 'Security',
    items: [
      { nodeType: 'identityProvider', label: 'Identity Provider', description: 'Auth0, Cognito, OAuth' },
      { nodeType: 'secretManager',    label: 'Secret Manager',    description: 'Vault, AWS Secrets Mgr' },
    ],
  },
];

interface ComponentLibraryProps {
  onAddNode: (nodeType: NodeType) => void;
}

export default function ComponentLibrary({
  onAddNode,
}: ComponentLibraryProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    e.dataTransfer.setData('application/nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="sidebar-scroll" style={styles.sidebar}>
      <div style={styles.sectionHeader}>
        <span style={styles.title}>Components</span>
      </div>
      <p style={styles.hint}>Click to add · drag to place</p>
      {COMPONENT_SECTIONS.map((group, sectionIndex) => (
        <div key={group.section}>
          <div style={{
            ...styles.sectionLabel,
            ...(sectionIndex > 0 ? styles.sectionLabelBorder : {}),
          }}>
            {group.section}
          </div>
          <div style={styles.list}>
            {group.items.map((comp) => {
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
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '240px',
    height: '100%',
    backgroundColor: '#0F172A',
    borderRight: 'none',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    padding: '0.875rem',
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
  sectionLabel: {
    fontSize: '0.6rem',
    fontWeight: 700,
    color: '#334155',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    padding: '0.75rem 0 0.25rem',
  },
  sectionLabelBorder: {
    borderTop: '1px solid #1E293B',
  },
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
