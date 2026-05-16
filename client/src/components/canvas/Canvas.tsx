import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import { useCanvasStore } from '../../store/canvasStore';
import type { NodeType, NodeData } from '../../types';
import type { Node } from '@xyflow/react';

// We need this inner component because useReactFlow() only works
// inside a ReactFlowProvider — explained below
function CanvasInner() {
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
    },
    [screenToFlowPosition, addNode],
  );

  // Expose handleAddNode to the parent via the onAddNode prop pattern
  useEffect(() => {
    // This registers the handleAddNode function so the sidebar can call it
    window.__addNode = handleAddNode;
    return () => {
      window.__addNode = undefined;
    };
  }, [handleAddNode]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
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

// ReactFlowProvider gives React Flow access to internal context
// (zoom level, viewport position, etc.)
// It must wrap any component that uses useReactFlow()
export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner/>
    </ReactFlowProvider>
  );
}