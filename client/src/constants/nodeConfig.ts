import type { NodeType } from '../types';

export const NODE_CONFIG: Record<NodeType, { color: string; icon: string }> = {
  database:     { color: '#2563eb', icon: '🗄️' },
  cache:        { color: '#16a34a', icon: '⚡' },
  queue:        { color: '#d97706', icon: '📨' },
  service:      { color: '#7c3aed', icon: '⚙️' },
  loadBalancer: { color: '#dc2626', icon: '⚖️' },
  apiGateway:   { color: '#0891b2', icon: '🔀' },
  cdn:          { color: '#65a30d', icon: '🌐' },
};
