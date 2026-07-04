import { Database, Zap, MessageSquare, Settings, GitBranch, ArrowLeftRight, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NodeType } from '../types';

export const NODE_CONFIG: Record<NodeType, { color: string; Icon: LucideIcon }> = {
  database:     { color: '#2563eb', Icon: Database },
  cache:        { color: '#16a34a', Icon: Zap },
  queue:        { color: '#d97706', Icon: MessageSquare },
  service:      { color: '#7c3aed', Icon: Settings },
  loadBalancer: { color: '#dc2626', Icon: GitBranch },
  apiGateway:   { color: '#0891b2', Icon: ArrowLeftRight },
  cdn:          { color: '#65a30d', Icon: Globe },
};
