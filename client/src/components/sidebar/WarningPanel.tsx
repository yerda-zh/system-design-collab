import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useWarningStore } from '../../store/warningStore';
import type { Warning, WarningSeverity } from '../../types/warnings';

const SEVERITY_CONFIG: Record<WarningSeverity, { color: string; label: string }> = {
  high:   { color: '#dc2626', label: 'High' },
  medium: { color: '#d97706', label: 'Medium' },
};

const WARNING_TITLES: Record<string, string> = {
  SPOF:                      'Single Point of Failure',
  MISSING_CACHE:             'Missing Cache Layer',
  CASCADING_FAILURE:         'Cascading Failure Risk',
  NO_LOAD_BALANCER:          'No Load Balancer',
  DIRECT_CLIENT_TO_DATABASE: 'Direct Client → Database',
};

interface WarningPanelProps {
  onSelectNode: (nodeId: string) => void;
}

export default function WarningPanel({ onSelectNode }: WarningPanelProps) {
  const warnings = useWarningStore((state) => state.warnings);
  const [isExpanded, setIsExpanded] = useState(true);

  const highCount = warnings.filter((w) => w.severity === 'high').length;
  const mediumCount = warnings.filter((w) => w.severity === 'medium').length;

  return (
    <div style={styles.container}>
      <button
        style={styles.header}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>Warnings</span>
          {warnings.length > 0 && (
            <div style={styles.counts}>
              {highCount > 0 && (
                <span style={{ ...styles.countBadge, backgroundColor: '#dc2626' }}>
                  {highCount}
                </span>
              )}
              {mediumCount > 0 && (
                <span style={{ ...styles.countBadge, backgroundColor: '#d97706' }}>
                  {mediumCount}
                </span>
              )}
            </div>
          )}
        </div>
        {isExpanded ? <ChevronDown size={14} color="#475569" /> : <ChevronRight size={14} color="#475569" />}
      </button>

      {isExpanded && (
        <div style={styles.list}>
          {warnings.length === 0 ? (
            <div style={styles.emptyState}>
              <CheckCircle2 size={20} color="#16a34a" />
              <p style={styles.emptyTitle}>Architecture looks good</p>
              <p style={styles.emptySubtitle}>No issues detected</p>
            </div>
          ) : (
            warnings.map((warning) => (
              <WarningItem
                key={warning.id}
                warning={warning}
                onClick={() => onSelectNode(warning.nodeId)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface WarningItemProps {
  warning: Warning;
  onClick: () => void;
}

function WarningItem({ warning, onClick }: WarningItemProps) {
  const config = SEVERITY_CONFIG[warning.severity];

  return (
    <button style={styles.item} onClick={onClick}>
      <div style={{ ...styles.severityBar, backgroundColor: config.color }} />
      <div style={styles.itemContent}>
        <p style={styles.itemTitle}>
          {WARNING_TITLES[warning.type] ?? warning.type}
        </p>
        <p style={styles.itemMessage}>{warning.message}</p>
        <span style={{ ...styles.severityLabel, color: config.color }}>
          {config.label}
        </span>
      </div>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderTop: '1px solid #1E293B',
    backgroundColor: '#0F172A',
    flexShrink: 0,
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.875rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderBottom: '1px solid transparent',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  headerTitle: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
  },
  counts: {
    display: 'flex',
    gap: '0.25rem',
  },
  countBadge: {
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: '10px',
    lineHeight: '16px',
  },
  list: {
    maxHeight: '220px',
    overflowY: 'auto',
    borderTop: '1px solid #1E293B',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.875rem 1rem',
  },
  emptyTitle: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#16a34a',
    margin: 0,
  },
  emptySubtitle: {
    fontSize: '0.7rem',
    color: '#475569',
    margin: 0,
  },
  item: {
    width: '100%',
    display: 'flex',
    alignItems: 'stretch',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid #1E293B',
    cursor: 'pointer',
    textAlign: 'left' as const,
    padding: 0,
    transition: 'background-color 0.15s',
  },
  severityBar: {
    width: '3px',
    flexShrink: 0,
  },
  itemContent: {
    padding: '0.5rem 0.625rem',
    flex: 1,
  },
  itemTitle: {
    margin: '0 0 0.2rem',
    fontSize: '0.775rem',
    fontWeight: 600,
    color: '#F1F5F9',
  },
  itemMessage: {
    margin: '0 0 0.25rem',
    fontSize: '0.7rem',
    color: '#64748B',
    lineHeight: 1.4,
  },
  severityLabel: {
    fontSize: '0.62rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
};
