import type { NodeTypes } from '@xyflow/react';
import BaseNode from './BaseNode';

// React Flow needs a map of node type names to components
// We use one BaseNode component for all types since
// the visual difference is handled by the nodeType in data
export const nodeTypes: NodeTypes = {
  database: BaseNode,
  cache: BaseNode,
  queue: BaseNode,
  service: BaseNode,
  loadBalancer: BaseNode,
  apiGateway: BaseNode,
  cdn: BaseNode,
};