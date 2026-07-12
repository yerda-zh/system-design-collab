import { useState, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import type { NodeData } from '../../../types';
import { useWarningStore } from '../../../store/warningStore';
import { useCommentStore } from '../../../store/commentStore';
import { useCanvasStore } from '../../../store/canvasStore';
import { NODE_CONFIG } from '../../../constants/nodeConfig';
import { WARNING_TITLES } from '../../../constants/warningTitles';
import { useClampToViewport } from '../../../hooks/useClampToViewport';

const NODE_TYPE_LABELS: Record<string, string> = {
  database:     'Database',
  cache:        'Cache',
  queue:        'Queue',
  service:      'Service',
  loadBalancer: 'Load Balancer',
  apiGateway:   'API Gateway',
  cdn:          'CDN',

  client:       'Client',
  mobileClient: 'Mobile Client',
  thirdParty:   'Third Party',

  dns:          'DNS',
  firewall:     'Firewall / WAF',
  reverseProxy: 'Reverse Proxy',

  objectStorage: 'Object Storage',
  blockStorage:  'Block Storage',
  dataWarehouse: 'Data Warehouse',
  searchEngine:  'Search Engine',
  timeSeriesDb:  'Time Series DB',

  worker:                'Worker',
  serverless:            'Serverless',
  containerOrchestrator: 'Container Orchestrator',

  eventBus:        'Event Bus',
  streamProcessor: 'Stream Processor',

  monitoring: 'Monitoring',
  logging:    'Logging',

  identityProvider: 'Identity Provider',
  secretManager:    'Secret Manager',
};

interface BaseNodeProps {
  id: string;
  data: NodeData;
  selected: boolean;
}

function BaseNode({ id, data, selected }: BaseNodeProps) {
  const config = NODE_CONFIG[data.nodeType];

  // useShallow prevents infinite loop by doing shallow equality
  // comparison on the filtered array instead of reference comparison
  const warnings = useWarningStore(
    useShallow((state) => state.warnings.filter((w) => w.nodeId === id)),
  );

  const hasHighSeverity = warnings.some((w) => w.severity === 'high');
  const hasWarnings = warnings.length > 0;
  const topLevelComments = useCommentStore(
    useShallow((state) =>
      state.comments.filter((c) => c.targetId === id && c.parentId === null),
    ),
  );

  const isHighlighted = useCanvasStore((state) => state.highlightedNodeId === id);

  const [isEditing, setIsEditing] = useState(false);
  const [labelInput, setLabelInput] = useState(data.label);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [isCommentTooltipVisible, setIsCommentTooltipVisible] = useState(false);

  const nodeRef = useRef<HTMLDivElement>(null);
  const warningBadgeRef = useRef<HTMLDivElement>(null);
  const commentBadgeRef = useRef<HTMLDivElement>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<DOMRect | null>(null);
  const [commentTooltipAnchor, setCommentTooltipAnchor] = useState<DOMRect | null>(null);

  const {
    ref: warningTooltipRef,
    style: warningTooltipStyle,
    arrowOffsetX: warningArrowOffsetX,
    arrowSide: warningArrowSide,
  } = useClampToViewport<HTMLDivElement>(
    [isTooltipVisible, tooltipAnchor],
    {
      arrowAnchor: tooltipAnchor
        ? { x: tooltipAnchor.left + tooltipAnchor.width / 2, y: tooltipAnchor.top + tooltipAnchor.height / 2 }
        : undefined,
    },
  );
  const {
    ref: commentTooltipRef,
    style: commentTooltipStyle,
    arrowOffsetX: commentArrowOffsetX,
    arrowSide: commentArrowSide,
  } = useClampToViewport<HTMLDivElement>(
    [isCommentTooltipVisible, commentTooltipAnchor],
    {
      arrowAnchor: commentTooltipAnchor
        ? { x: commentTooltipAnchor.left + commentTooltipAnchor.width / 2, y: commentTooltipAnchor.top + commentTooltipAnchor.height / 2 }
        : undefined,
    },
  );

  const commitEdit = () => {
    const trimmed = labelInput.trim();
    if (!trimmed || trimmed === data.label) {
      setIsEditing(false);
      return;
    }
    window.__updateNodeLabel?.(id, trimmed);
    setIsEditing(false);
  };

  return (
    <div
      ref={nodeRef}
      onDoubleClick={() => {
        setIsEditing(true);
        setLabelInput(data.label);
      }}
      onKeyDown={isEditing ? (e) => e.stopPropagation() : undefined}
      style={{
        ...styles.node,
        borderColor: hasHighSeverity
          ? '#dc2626'
          : hasWarnings
            ? '#d97706'
            : selected
              ? '#7C3AED'
              : config.color,
        boxShadow: isHighlighted
          ? '0 0 0 4px rgba(124,58,237,0.3), 0 0 16px rgba(124,58,237,0.4)'
          : hasHighSeverity
            ? '0 0 0 2px rgba(220,38,38,0.3)'
            : hasWarnings
              ? '0 0 0 2px rgba(217,119,6,0.3)'
              : selected
                ? '0 0 0 3px rgba(124,58,237,0.2)'
                : '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Target handles rendered first — sit below source handles */}
      <Handle type="target" position={Position.Top}    id="top-target"    style={styles.handle} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={styles.handle} />
      <Handle type="target" position={Position.Left}   id="left-target"   style={styles.handle} />
      <Handle type="target" position={Position.Right}  id="right-target"  style={styles.handle} />

      {/* Source handles rendered last — sit on top and get grabbed when dragging */}
      <Handle type="source" position={Position.Top}    id="top-source"    style={styles.handle} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={styles.handle} />
      <Handle type="source" position={Position.Left}   id="left-source"   style={styles.handle} />
      <Handle type="source" position={Position.Right}  id="right-source"  style={styles.handle} />

      <div style={{ ...styles.header, backgroundColor: config.color, backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.05) 100%)' }}>
        <config.Icon size={12} color="white" />
        <span style={styles.typeLabel}>{NODE_TYPE_LABELS[data.nodeType] ?? data.nodeType}</span>
      </div>

      <div style={{ ...styles.body, borderBottom: selected ? '1.5px solid rgba(124,58,237,0.2)' : undefined }}>
        {isEditing ? (
          <input
            autoFocus
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') {
                setLabelInput(data.label);
                setIsEditing(false);
              }
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            style={styles.labelInput}
          />
        ) : (
          <span style={styles.label}>{data.label}</span>
        )}
      </div>

      {hasWarnings && (
        <div
          ref={warningBadgeRef}
          style={{
            ...styles.badge,
            backgroundColor: hasHighSeverity ? '#dc2626' : '#d97706',
          }}
          onMouseEnter={() => {
            setIsTooltipVisible(true);
            if (warningBadgeRef.current) setTooltipAnchor(warningBadgeRef.current.getBoundingClientRect());
          }}
          onMouseLeave={() => {
            setIsTooltipVisible(false);
            setTooltipAnchor(null);
          }}
        >
          {warnings.length}
        </div>
      )}

      {isTooltipVisible && hasWarnings && tooltipAnchor && createPortal(
        <div ref={warningTooltipRef} style={{
          ...styles.tooltip,
          bottom: window.innerHeight - tooltipAnchor.top + 6,
          right: window.innerWidth - tooltipAnchor.right,
          ...warningTooltipStyle,
        }}>
          {warnings.map((w) => (
            <div key={w.id} style={styles.tooltipRow}>
              <span style={{ color: w.severity === 'high' ? '#dc2626' : '#d97706' }}>●</span>
              <span>{WARNING_TITLES[w.type] ?? w.type}</span>
            </div>
          ))}
          <div style={{
            ...styles.tooltipArrow,
            left: warningArrowOffsetX ?? 202,
            ...(warningArrowSide === 'top'
              ? { top: '-4px', borderBottom: '4px solid #111827' }
              : { bottom: '-4px', borderTop: '4px solid #111827' }),
          }} />
        </div>,
        document.body
      )}

      {topLevelComments.length > 0 && (
        <div
          ref={commentBadgeRef}
          style={styles.commentBadge}
          onMouseEnter={() => {
            setIsCommentTooltipVisible(true);
            if (commentBadgeRef.current) setCommentTooltipAnchor(commentBadgeRef.current.getBoundingClientRect());
          }}
          onMouseLeave={() => {
            setIsCommentTooltipVisible(false);
            setCommentTooltipAnchor(null);
          }}
        >
          {topLevelComments.length}
        </div>
      )}

      {isCommentTooltipVisible && topLevelComments.length > 0 && commentTooltipAnchor && createPortal(
        <div ref={commentTooltipRef} style={{
          ...styles.commentTooltip,
          bottom: window.innerHeight - commentTooltipAnchor.top + 6,
          left: commentTooltipAnchor.left,
          ...commentTooltipStyle,
        }}>
          {topLevelComments.map((c) => (
            <div key={c.id} style={styles.tooltipRow}>
              <span style={{ color: '#2563eb' }}>●</span>
              <span><strong>{c.authorName}:</strong> {c.body}</span>
            </div>
          ))}
          <div style={{
            ...styles.commentTooltipArrow,
            left: commentArrowOffsetX ?? 10,
            ...(commentArrowSide === 'top'
              ? { top: '-4px', borderBottom: '4px solid #111827' }
              : { bottom: '-4px', borderTop: '4px solid #111827' }),
          }} />
        </div>,
        document.body
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  node: {
    width: '170px',
    backgroundColor: 'white',
    border: '1.5px solid',
    borderRadius: '10px',
    overflow: 'visible',
    fontFamily: "'Inter', -apple-system, sans-serif",
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.3rem 0.6rem',
    borderRadius: '8px 8px 0 0',
    overflow: 'hidden',
  },
  typeLabel: {
    color: 'white',
    fontSize: '0.6rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  body: {
    padding: '0.6rem 0.7rem',
    cursor: 'text',
    borderTop: '1px solid rgba(0,0,0,0.06)',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#111827',
    lineHeight: 1.4,
  },
  labelInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#111827',
    padding: 0,
    fontFamily: 'inherit',
  },
  handle: {
    width: '9px',
    height: '9px',
    backgroundColor: '#cbd5e1',
    border: '2px solid white',
  },
  badge: {
    position: 'absolute',
    top: '-7px',
    right: '-7px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 700,
    border: '2px solid white',
    zIndex: 10,
    cursor: 'default',
  },
  tooltip: {
    position: 'fixed',
    backgroundColor: '#111827',
    color: 'white',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    width: '220px',
    zIndex: 1000,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    pointerEvents: 'none',
  },
  tooltipRow: {
    display: 'flex',
    gap: '0.4rem',
    alignItems: 'flex-start',
    fontSize: '0.72rem',
    lineHeight: 1.5,
    marginBottom: '0.25rem',
  },
  tooltipArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
  },
  commentBadge: {
    position: 'absolute',
    top: '-7px',
    left: '-7px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 700,
    border: '2px solid white',
    zIndex: 10,
    cursor: 'default',
  },
  commentTooltip: {
    position: 'fixed',
    backgroundColor: '#111827',
    color: 'white',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    width: '220px',
    zIndex: 1000,
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    pointerEvents: 'none',
  },
  commentTooltipArrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
  },
};

export default memo(BaseNode);