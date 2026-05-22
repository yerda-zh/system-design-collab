import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import { useCanvasStore } from '../../store/canvasStore';
import type { NodeType, NodeData } from '../../types';
import type { Node } from '@xyflow/react';

interface CanvasInnerProps {
  onEmitOperation: (op: object) => void;
  onCursorMove: (x: number, y: number) => void;
}

// We need this inner component because useReactFlow() only works
// inside a ReactFlowProvider — explained below
function CanvasInner({ onEmitOperation, onCursorMove }: CanvasInnerProps) {
  const { screenToFlowPosition } = useReactFlow();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
  } = useCanvasStore();

  // Called by the sidebar when user clicks a component
  // Adds a new node at the center of the visible canvas area
  const handleAddNode = useCallback(
    (nodeType: NodeType) => {
      // screenToFlowPosition converts screen coordinates to canvas coordinates
      // accounting for zoom and pan
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNode: Node<NodeData> = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: {
          label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1),
          nodeType,
        },
      };

      addNode(newNode);
      onEmitOperation({ type: 'addNode', node: newNode });
    },
    [screenToFlowPosition, addNode, onEmitOperation],
  );

  // Expose handleAddNode to the parent via the onAddNode prop pattern
  useEffect(() => {
    // This registers the handleAddNode function so the sidebar can call it
    window.__addNode = handleAddNode;
    return () => {
      window.__addNode = undefined;
    };
  }, [handleAddNode]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const { isApplyingRemote } = useCanvasStore.getState();

      changes.forEach((change) => {
        if (change.type === 'position' && change.dragging === false && change.position && !isApplyingRemote) {
          onEmitOperation({
            type: 'moveNode',
            nodeId: change.id,
            x: change.position.x,
            y: change.position.y,
          });
        }

        if (change.type === 'remove' && !isApplyingRemote) {
          onEmitOperation({ type: 'deleteNode', nodeId: change.id });
        }
      });

      onNodesChange(changes);
    },
    [onNodesChange, onEmitOperation],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const { isApplyingRemote } = useCanvasStore.getState();

      changes.forEach((change) => {
        if (change.type === 'remove' && !isApplyingRemote) {
          onEmitOperation({ type: 'deleteEdge', edgeId: change.id });
        }
      });

      onEdgesChange(changes);
    },
    [onEdgesChange, onEmitOperation],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      // Let React Flow generate the edge with its own ID format
      // by calling onConnect first
      onConnect(connection);

      // Now read the actual edge React Flow just created from the store
      // It will be the last edge in the array
      const edges = useCanvasStore.getState().edges;
      const newEdge = edges[edges.length - 1];

      if (newEdge) {
        onEmitOperation({ type: 'addEdge', edge: {
          id: newEdge.id,
          source: newEdge.source,
          target: newEdge.target,
          sourceHandle: newEdge.sourceHandle ?? undefined,
          targetHandle: newEdge.targetHandle ?? undefined,
        }});
      }
    },
    [onConnect, onEmitOperation],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      onCursorMove(e.clientX, e.clientY);
    },
    [onCursorMove],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={handleConnect}
      onMouseMove={handleMouseMove}
      fitView
    >
      {/* Background shows the dot grid pattern */}
      <Background />
      {/* Controls adds zoom in/out/fit buttons */}
      <Controls />
      {/* MiniMap shows a small overview of the whole canvas */}
      <MiniMap />
    </ReactFlow>
  );
}

interface CanvasProps {
  onEmitOperation: (op: object) => void;
  onCursorMove: (x: number, y: number) => void;
}

// ReactFlowProvider gives React Flow access to internal context
// (zoom level, viewport position, etc.)
// It must wrap any component that uses useReactFlow()
export default function Canvas({ onEmitOperation, onCursorMove }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner
        onEmitOperation={onEmitOperation}
        onCursorMove={onCursorMove}
      />
    </ReactFlowProvider>
  );
}