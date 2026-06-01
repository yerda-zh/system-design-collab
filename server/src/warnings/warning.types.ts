export type WarningType =
  | 'SPOF'
  | 'MISSING_CACHE'
  | 'CASCADING_FAILURE'
  | 'NO_LOAD_BALANCER'
  | 'DIRECT_CLIENT_TO_DATABASE';

export type WarningSeverity = 'high' | 'medium';

export interface Warning {
  id: string;
  nodeId: string;
  type: WarningType;
  severity: WarningSeverity;
  message: string;
}