import {
  Database, Zap, MessageSquare, Settings, GitBranch, ArrowLeftRight, Globe,
  Monitor, Smartphone, ExternalLink, Network, Shield,
  Archive, HardDrive, BarChart2, Search, LineChart,
  Cpu, Layers, Radio, Activity, FileText, KeyRound, Lock,
} from 'lucide-react';
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

  // Users & Clients
  client:       { color: '#4F46E5', Icon: Monitor },
  mobileClient: { color: '#C026D3', Icon: Smartphone },
  thirdParty:   { color: '#A16207', Icon: ExternalLink },

  // Networking
  dns:          { color: '#4338CA', Icon: Network },
  firewall:     { color: '#DC2626', Icon: Shield },
  reverseProxy: { color: '#0891B2', Icon: ArrowLeftRight },

  // Storage
  objectStorage: { color: '#0369A1', Icon: Archive },
  blockStorage:  { color: '#1D4ED8', Icon: HardDrive },
  dataWarehouse: { color: '#7E22CE', Icon: BarChart2 },
  searchEngine:  { color: '#B45309', Icon: Search },
  timeSeriesDb:  { color: '#0F766E', Icon: LineChart },

  // Compute
  worker:                { color: '#7C3AED', Icon: Cpu },
  serverless:            { color: '#F59E0B', Icon: Zap },
  containerOrchestrator: { color: '#0284C7', Icon: Layers },

  // Messaging
  eventBus:        { color: '#EA580C', Icon: Radio },
  streamProcessor: { color: '#059669', Icon: Activity },

  // Observability
  monitoring: { color: '#15803D', Icon: BarChart2 },
  logging:    { color: '#E11D48', Icon: FileText },

  // Identity & Security
  identityProvider: { color: '#9333EA', Icon: KeyRound },
  secretManager:    { color: '#BE185D', Icon: Lock },
};
