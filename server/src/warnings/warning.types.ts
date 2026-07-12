export type WarningType =
  | 'SPOF'
  | 'MISSING_CACHE'
  | 'CASCADING_FAILURE'
  | 'NO_LOAD_BALANCER'
  | 'DIRECT_CLIENT_TO_DATABASE'
  | 'NO_API_GATEWAY'
  | 'NO_FIREWALL'
  | 'DATABASE_NO_READ_REPLICA'
  | 'SINGLE_QUEUE_CONSUMER'
  | 'SYNCHRONOUS_WRITE_CRITICAL_PATH'
  | 'NO_DEAD_LETTER_QUEUE'
  | 'NO_CDN_FOR_CLIENT'
  | 'NO_OBJECT_STORAGE_FOR_MEDIA'
  | 'UNBOUNDED_FANOUT'
  | 'NO_CACHE_FOR_SEARCH'
  | 'NO_RATE_LIMITING'
  | 'NO_MONITORING'
  | 'NO_LOGGING';

export type WarningSeverity = 'high' | 'medium';

export interface Warning {
  id: string;
  nodeId: string;
  type: WarningType;
  severity: WarningSeverity;
  message: string;
}