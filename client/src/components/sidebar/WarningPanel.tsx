import { useState } from 'react';
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
      {/* Header — always visible, toggles the panel */}
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
        <span style={styles.chevron}>{isExpanded ? '▾' : '▸'}</span>
      </button>

      {/* Warning list */}
      {isExpanded && (
        <div style={styles.list}>
          {warnings.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyCheck}>✓</div>
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
      <div
        style={{
          ...styles.severityBar,
          backgroundColor: config.color,
        }}
      />
      <div style={styles.itemContent}>
        <p style={styles.itemTitle}>
          {WARNING_TITLES[warning.type] ?? warning.type}
        </p>
        <p style={styles.itemMessage}>{warning.message}</p>
        <span
          style={{
            ...styles.severityLabel,
            color: config.color,
          }}
        >
          {config.label}
        </span>
      </div>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderTop: '1px solid #e5e7eb',
    backgroundColor: 'white',
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.6rem 1rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderBottom: '1px solid #e5e7eb',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  headerTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#374151',
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
  },
  chevron: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  list: {
    maxHeight: '240px',
    overflowY: 'auto',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '1rem',
  },
  emptyCheck: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.25rem',
  },
  emptyTitle: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#16a34a',
    margin: 0,
  },
  emptySubtitle: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    margin: 0,
  },
  item: {
    width: '100%',
    display: 'flex',
    alignItems: 'stretch',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    textAlign: 'left',
    padding: 0,
  },
  severityBar: {
    width: '4px',
    flexShrink: 0,
  },
  itemContent: {
    padding: '0.5rem 0.75rem',
    flex: 1,
  },
  itemTitle: {
    margin: '0 0 0.2rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#1f2937',
  },
  itemMessage: {
    margin: '0 0 0.25rem',
    fontSize: '0.72rem',
    color: '#6b7280',
    lineHeight: 1.4,
  },
  severityLabel: {
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};