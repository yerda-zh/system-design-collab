import { CheckCircle2 } from 'lucide-react';
import { useWarningStore } from '../../store/warningStore';
import type { Warning, WarningSeverity } from '../../types/warnings';
import { WARNING_TITLES } from '../../constants/warningTitles';

const SEVERITY_CONFIG: Record<WarningSeverity, { color: string; label: string }> = {
  high:   { color: '#dc2626', label: 'High' },
  medium: { color: '#d97706', label: 'Medium' },
};

interface WarningPanelProps {
  onSelectNode: (nodeId: string) => void;
}

export default function WarningPanel({ onSelectNode }: WarningPanelProps) {
  const warnings = useWarningStore((state) => state.warnings);

  const highCount = warnings.filter((w) => w.severity === 'high').length;
  const mediumCount = warnings.filter((w) => w.severity === 'medium').length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
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

      <div className="sidebar-scroll" style={styles.list}>
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
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#0F172A',
  },
  header: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #1E293B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
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
    flex: 1,
    overflowY: 'auto',
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
