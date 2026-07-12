import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { LayoutGrid, AlertTriangle } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { NodeType } from '../../types';
import { useWarningStore } from '../../store/warningStore';
import ComponentLibrary from './ComponentLibrary';
import WarningPanel from './WarningPanel';

type PanelId = 'components' | 'warnings';

interface SidebarLayoutProps {
  onAddNode: (nodeType: NodeType) => void;
  onSelectNode: (nodeId: string) => void;
}

export default function SidebarLayout({ onAddNode, onSelectNode }: SidebarLayoutProps) {
  const [activePanel, setActivePanel] = useState<PanelId | null>('components');
  const warnings = useWarningStore(useShallow((state) => state.warnings));
  const prevWarningsLength = useRef(0);

  useEffect(() => {
    if (warnings.length > 0 && prevWarningsLength.current === 0) {
      setActivePanel('warnings');
    }
    prevWarningsLength.current = warnings.length;
  }, [warnings.length]);

  const hasHighSeverity = warnings.some((w) => w.severity === 'high');

  const togglePanel = (panel: PanelId) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.rail}>
        <IconButton
          icon={<LayoutGrid size={18} />}
          label="Components"
          isActive={activePanel === 'components'}
          onClick={() => togglePanel('components')}
        />
        <IconButton
          icon={<AlertTriangle size={18} />}
          label="Warnings"
          isActive={activePanel === 'warnings'}
          onClick={() => togglePanel('warnings')}
          badge={
            warnings.length > 0 ? (
              <span style={{
                ...styles.badge,
                backgroundColor: hasHighSeverity ? '#DC2626' : '#D97706',
              }}>
                {Math.min(warnings.length, 99)}
              </span>
            ) : null
          }
        />
      </div>

      {activePanel && (
        <div className="sidebar-panel" style={styles.panelContent}>
          {activePanel === 'components' && <ComponentLibrary onAddNode={onAddNode} />}
          {activePanel === 'warnings' && <WarningPanel onSelectNode={onSelectNode} />}
        </div>
      )}
    </div>
  );
}

interface IconButtonProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: ReactNode;
}

function IconButton({ icon, label, isActive, onClick, badge }: IconButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      title={label}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.iconButton,
        ...(isActive
          ? { backgroundColor: 'rgba(124, 58, 237, 0.2)', color: '#A78BFA' }
          : isHovered
            ? { backgroundColor: 'rgba(255,255,255,0.06)', color: '#94A3B8' }
            : { backgroundColor: 'transparent', color: '#475569' }),
      }}
    >
      {icon}
      {badge}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    height: '100%',
    flexShrink: 0,
    // Establishes its own stacking context above CursorOverlay's fixed,
    // z-index: 1000 cursor markers, which otherwise render on top of the
    // sidebar whenever a collaborator's cursor screen position overlaps it.
    position: 'relative',
    zIndex: 1001,
  },
  rail: {
    width: '48px',
    height: '100%',
    backgroundColor: '#0A0F1A',
    borderRight: '1px solid #1E293B',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '0.75rem',
    gap: '0.25rem',
  },
  iconButton: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    color: 'white',
    fontSize: '9px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelContent: {
    width: '240px',
    height: '100%',
    overflow: 'hidden',
  },
};
