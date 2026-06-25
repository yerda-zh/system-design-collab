import { useState, memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import type { NodeData } from '../../../types';
import { useWarningStore } from '../../../store/warningStore';
import { useCommentStore } from '../../../store/commentStore';
import { useCanvasStore } from '../../../store/canvasStore';
import { NODE_CONFIG } from '../../../constants/nodeConfig';

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
              ? '#2563eb'
              : config.color,
        boxShadow: isHighlighted
          ? '0 0 0 4px #f59e0b, 0 0 12px rgba(245, 158, 11, 0.5)'
          : hasHighSeverity
            ? '0 0 0 2px #dc2626'
            : hasWarnings
              ? '0 0 0 2px #d97706'
              : selected
                ? '0 0 0 2px #2563eb'
                : '0 2px 6px rgba(0,0,0,0.15)',
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

      <div style={{ ...styles.header, backgroundColor: config.color }}>
        <span style={styles.icon}>{config.icon}</span>
        <span style={styles.typeLabel}>{data.nodeType}</span>
      </div>

      <div style={styles.body}>
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
          style={{
            ...styles.badge,
            backgroundColor: hasHighSeverity ? '#dc2626' : '#d97706',
          }}
          onMouseEnter={() => setIsTooltipVisible(true)}
          onMouseLeave={() => setIsTooltipVisible(false)}
        >
          {warnings.length}
        </div>
      )}

      {isTooltipVisible && hasWarnings && (
        <div style={styles.tooltip}>
          {warnings.map((w) => (
            <div key={w.id} style={styles.tooltipRow}>
              <span style={{ color: w.severity === 'high' ? '#dc2626' : '#d97706' }}>●</span>
              <span>{w.message}</span>
            </div>
          ))}
          <div style={styles.tooltipArrow} />
        </div>
      )}

      {topLevelComments.length > 0 && (
        <div
          style={styles.commentBadge}
          onMouseEnter={() => setIsCommentTooltipVisible(true)}
          onMouseLeave={() => setIsCommentTooltipVisible(false)}
        >
          {topLevelComments.length}
        </div>
      )}

      {isCommentTooltipVisible && topLevelComments.length > 0 && (
        <div style={styles.commentTooltip}>
          {topLevelComments.map((c) => (
            <div key={c.id} style={styles.tooltipRow}>
              <span style={{ color: '#2563eb' }}>●</span>
              <span><strong>{c.authorName}:</strong> {c.body}</span>
            </div>
          ))}
          <div style={styles.commentTooltipArrow} />
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  node: {
    width: '160px',
    backgroundColor: 'white',
    border: '2px solid',
    borderRadius: '8px',
    overflow: 'visible',
    fontFamily: 'sans-serif',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.4rem 0.6rem',
    borderRadius: '6px 6px 0 0',
    overflow: 'hidden',
  },
  icon: { fontSize: '1rem' },
  typeLabel: {
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  body: { padding: '0.5rem 0.6rem', cursor: 'text' },
  label: { fontSize: '0.9rem', fontWeight: 500, color: '#1f2937' },
  labelInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#1f2937',
    padding: 0,
  },
  handle: {
    width: '10px',
    height: '10px',
    backgroundColor: '#94a3b8',
    border: '2px solid white',
  },
  badge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 700,
    border: '2px solid white',
    zIndex: 10,
    cursor: 'default',
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: '6px',
    backgroundColor: '#1f2937',
    color: 'white',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    width: '220px',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
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
    bottom: '-4px',
    right: '8px',
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
    borderTop: '4px solid #1f2937',
  },
  commentBadge: {
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 700,
    border: '2px solid white',
    zIndex: 10,
    cursor: 'default',
  },
  commentTooltip: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: '6px',
    backgroundColor: '#1f2937',
    color: 'white',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    width: '220px',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    pointerEvents: 'none',
  },
  commentTooltipArrow: {
    position: 'absolute',
    bottom: '-4px',
    left: '8px',
    width: 0,
    height: 0,
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent',
    borderTop: '4px solid #1f2937',
  },
};

export default memo(BaseNode);