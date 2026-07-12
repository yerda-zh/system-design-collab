import { useState } from 'react';
import type { EdgeType } from '../../types';
import { EDGE_CONFIG } from '../../types';
import { useClampToViewport } from '../../hooks/useClampToViewport';

interface EdgeTypePopupProps {
  x: number;
  y: number;
  onSelect: (edgeType: EdgeType) => void;
  onClose: () => void;
}

const EDGE_TYPES: EdgeType[] = [
  'http',
  'grpc',
  'async',
  'pubsub',
  'websocket',
  'tcp',
  'dbProtocol',
  'eventStream',
  'internal',
  'webhook',
];

export default function EdgeTypePopup({ x, y, onSelect, onClose }: EdgeTypePopupProps) {
  const [hovered, setHovered] = useState<EdgeType | null>(null);
  const { ref, style: clampStyle } = useClampToViewport<HTMLDivElement>();

  return (
    <>
      <div style={styles.backdrop} onClick={onClose} />
      <div ref={ref} style={{ ...styles.popup, top: y, left: x, ...clampStyle }}>
        <p style={styles.title}>Connection type</p>
        {EDGE_TYPES.map((edgeType) => {
          const config = EDGE_CONFIG[edgeType];
          return (
            <button
              key={edgeType}
              style={{
                ...styles.btn,
                borderLeftColor: config.color,
                backgroundColor: hovered === edgeType ? `${config.color}18` : 'transparent',
              }}
              onMouseEnter={() => setHovered(edgeType)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(edgeType)}
            >
              <span style={{ ...styles.dot, backgroundColor: config.color }} />
              {config.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 999,
  },
  popup: {
    position: 'fixed',
    zIndex: 1000,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    padding: '0.5rem',
    minWidth: '160px',
    maxHeight: '70vh',
    overflowY: 'auto',
  },
  title: {
    margin: '0 0 0.4rem 0.4rem',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    padding: '0.45rem 0.6rem',
    background: 'transparent',
    border: 'none',
    borderLeft: '3px solid',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#1f2937',
    marginBottom: '0.2rem',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
};
