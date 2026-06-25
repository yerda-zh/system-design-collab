import { CanvasStateData } from './types/canvas.types';
import { CanvasOperation } from './types/operations';
import { sanitizeText } from '../common/utils/sanitize';

/**
 * Applies a canvas operation to a state object.
 * Returns the updated state. Does not mutate the original.
 *
 * Rules:
 * - addNode: always applies
 * - deleteNode: no-op if node doesn't exist
 * - moveNode: last write wins
 * - updateNode: last write wins
 * - addEdge: applies only if both source and target nodes exist
 * - deleteEdge: no-op if edge doesn't exist
 */

export function applyOperation(
  state: CanvasStateData,
  operation: CanvasOperation,
): CanvasStateData {
  // Work on a shallow copy — we never mutate the original state
  const nodes = [...state.nodes];
  const edges = [...state.edges];

  switch (operation.type) {
    case 'addNode': {
      // Idempotent — skip if node with this ID already exists
      const exists = nodes.some((n) => n.id === operation.node.id);
      if (exists) break;
      nodes.push(operation.node);
      break;
    }

    case 'deleteNode': {
      const index = nodes.findIndex((n) => n.id === operation.nodeId);
      // No-op if node doesn't exist — it may have been deleted already
      if (index === -1) break;
      nodes.splice(index, 1);
      // Also remove any edges connected to the deleted node
      const filtered = edges.filter(
        (e) => e.source !== operation.nodeId && e.target !== operation.nodeId,
      );
      edges.splice(0, edges.length, ...filtered);
      break;
    }

    case 'moveNode': {
      const node = nodes.find((n) => n.id === operation.nodeId);
      // No-op if node doesn't exist
      if (!node) break;
      // Last write wins — update position directly
      node.position = { x: operation.x, y: operation.y };
      break;
    }

    case 'updateNode': {
      const node = nodes.find((n) => n.id === operation.nodeId);
      if (!node) break;
      // Last write wins
      node.data.label = sanitizeText(operation.label);
      break;
    }

    case 'addEdge': {
      // Only add edge if both endpoints exist
      const sourceExists = nodes.some((n) => n.id === operation.edge.source);
      const targetExists = nodes.some((n) => n.id === operation.edge.target);
      if (!sourceExists || !targetExists) break;

      const edgeExists = edges.some((e) => e.id === operation.edge.id);
      if (edgeExists) break;

      edges.push(operation.edge);
      break;
    }

    case 'deleteEdge': {
      const index = edges.findIndex((e) => e.id === operation.edgeId);
      // No-op if edge doesn't exist
      if (index === -1) break;
      edges.splice(index, 1);
      break;
    }
  }

  return { nodes, edges, revision: state.revision };
}

/**
 * Determines whether an incoming operation needs to be
 * rebased against the current server state.
 *
 * Returns true if the operation is behind the server revision.
 */

export function needsRebase(
  clientRevision: number,
  serverRevision: number,
): boolean {
  return clientRevision < serverRevision;
}