import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import type {
  NodeChange,
  EdgeChange,
  Connection,
  NodeMouseHandler,
  EdgeMouseHandler,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { useCanvasStore } from '../../store/canvasStore';
import type { NodeType, NodeData, EdgeType } from '../../types';
import ContextMenu from './ContextMenu';
import CursorOverlay from './CursorOverlay';
import EdgeTypePopup from './EdgeTypePopup';

interface ContextMenuState {
  x: number;
  y: number;
  targetId: string;
  targetType: 'node' | 'edge';
}

interface CanvasInnerProps {
  onEmitOperation: (op: object) => void;
  onCursorMove: (x: number, y: number) => void;
  onOpenComments: (targetId: string, targetType: 'node' | 'edge') => void;
}

function CanvasInner({ onEmitOperation, onCursorMove, onOpenComments }: CanvasInnerProps) {
  const { screenToFlowPosition, fitView } = useReactFlow();

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addNode,
    addPendingEdge,
    addEdgeWithType,
    highlightedNodeId,
  } = useCanvasStore();

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [pendingConnection, setPendingConnection] = useState<{
    connection: Connection;
    edgeId: string;
    x: number;
    y: number;
  } | null>(null);

  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Registers add node handler for sidebar clicks
  const handleAddNode = useCallback(
    (nodeType: NodeType) => {
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

  useEffect(() => {
    window.__addNode = handleAddNode;
    return () => {
      window.__addNode = undefined;
    };
  }, [handleAddNode]);

  // Pan and zoom to the highlighted node when a warning is clicked
  useEffect(() => {
    if (!highlightedNodeId) return;
    fitView({
      nodes: [{ id: highlightedNodeId }],
      duration: 500,
      padding: 0.5,
    });
  }, [highlightedNodeId, fitView]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const { isApplyingRemote } = useCanvasStore.getState();

      changes.forEach((change) => {
        if (
          change.type === 'position' &&
          change.dragging === false &&
          change.position &&
          !isApplyingRemote
        ) {
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
      addPendingEdge(connection);
      const newEdge = useCanvasStore.getState().edges.at(-1);
      if (!newEdge) return;
      setPendingConnection({
        connection,
        edgeId: newEdge.id,
        x: mousePositionRef.current.x,
        y: mousePositionRef.current.y,
      });
    },
    [addPendingEdge],
  );

  const handleEdgeTypeSelect = useCallback(
    (edgeType: EdgeType) => {
      if (!pendingConnection) return;
      useCanvasStore.getState().removeEdge(pendingConnection.edgeId);
      addEdgeWithType(pendingConnection.connection, edgeType);
      const newEdge = useCanvasStore.getState().edges.at(-1);
      if (newEdge) {
        onEmitOperation({
          type: 'addEdge',
          edge: {
            id: newEdge.id,
            source: newEdge.source,
            target: newEdge.target,
            sourceHandle: newEdge.sourceHandle ?? undefined,
            targetHandle: newEdge.targetHandle ?? undefined,
            data: { edgeType },
          },
        });
      }
      setPendingConnection(null);
    },
    [pendingConnection, addEdgeWithType, onEmitOperation],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
      const canvasPosition = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      onCursorMove(canvasPosition.x, canvasPosition.y);
    },
    [onCursorMove, screenToFlowPosition],
  );

  const handleNodeContextMenu: NodeMouseHandler = useCallback(
    (e, node) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetId: node.id,
        targetType: 'node',
      });
    },
    [],
  );

  const handleEdgeContextMenu: EdgeMouseHandler = useCallback(
    (e, edge) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        targetId: edge.id,
        targetType: 'edge',
      });
    },
    [],
  );

  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextMenuDelete = useCallback(() => {
    if (!contextMenu) return;
    if (contextMenu.targetType === 'node') {
      useCanvasStore.getState().removeNode(contextMenu.targetId);
      onEmitOperation({ type: 'deleteNode', nodeId: contextMenu.targetId });
    } else {
      useCanvasStore.getState().removeEdge(contextMenu.targetId);
      onEmitOperation({ type: 'deleteEdge', edgeId: contextMenu.targetId });
    }
  }, [contextMenu, onEmitOperation]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/nodeType') as NodeType;
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
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

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onMouseMove={handleMouseMove}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneClick={handlePaneClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <CursorOverlay />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={handleContextMenuDelete}
          onClose={() => setContextMenu(null)}
          onAddComment={() => {
            onOpenComments(contextMenu.targetId, contextMenu.targetType);
            setContextMenu(null);
          }}
        />
      )}

      {pendingConnection && (
        <EdgeTypePopup
          x={pendingConnection.x}
          y={pendingConnection.y}
          onSelect={handleEdgeTypeSelect}
          onClose={() => {
            useCanvasStore.getState().removeEdge(pendingConnection.edgeId);
            setPendingConnection(null);
          }}
        />
      )}
    </>
  );
}

interface CanvasProps {
  onEmitOperation: (op: object) => void;
  onCursorMove: (x: number, y: number) => void;
  onOpenComments: (targetId: string, targetType: 'node' | 'edge') => void;
}

export default function Canvas({ onEmitOperation, onCursorMove, onOpenComments }: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner
        onEmitOperation={onEmitOperation}
        onCursorMove={onCursorMove}
        onOpenComments={onOpenComments}
      />
    </ReactFlowProvider>
  );
}