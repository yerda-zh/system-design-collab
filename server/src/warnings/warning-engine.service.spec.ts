jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

import { WarningEngineService } from './warning-engine.service';
import type { Warning, WarningType } from './warning.types';
import type { CanvasStateData, NodeType } from '../canvas/types/canvas.types';

function buildState(
  nodes: Array<{ id: string; type: string; label?: string }>,
  edges: Array<{
    id: string;
    source: string;
    target: string;
    edgeType?: string;
  }>,
): CanvasStateData {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type as NodeType,
      position: { x: 0, y: 0 },
      data: {
        label: n.label ?? n.type,
        nodeType: n.type as NodeType,
      },
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: { edgeType: e.edgeType ?? 'http' },
    })),
    revision: 0,
  };
}

function warningTypes(warnings: Warning[]): WarningType[] {
  return warnings.map((w) => w.type);
}

describe('WarningEngineService', () => {
  let service: WarningEngineService;

  beforeEach(() => {
    service = new WarningEngineService();
  });

  describe('checkSPOF', () => {
    it('fires when a database has 3+ incoming sync connections and no sibling', () => {
      const state = buildState(
        [
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 's3', type: 'service' },
          { id: 'db', type: 'database' },
        ],
        [
          { id: 'e1', source: 's1', target: 'db', edgeType: 'http' },
          { id: 'e2', source: 's2', target: 'db', edgeType: 'http' },
          { id: 'e3', source: 's3', target: 'db', edgeType: 'http' },
        ],
      );
      const warnings = service.analyze(state);
      expect(warningTypes(warnings)).toContain('SPOF');
      const spofWarning = warnings.find((w) => w.type === 'SPOF');
      expect(spofWarning?.nodeId).toBe('db');
    });

    it('does not fire when a sibling database exists and is connected', () => {
      const state = buildState(
        [
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 's3', type: 'service' },
          { id: 'db1', type: 'database' },
          { id: 'db2', type: 'database' },
        ],
        [
          { id: 'e1', source: 's1', target: 'db1', edgeType: 'http' },
          { id: 'e2', source: 's2', target: 'db1', edgeType: 'http' },
          { id: 'e3', source: 's3', target: 'db1', edgeType: 'http' },
          { id: 'e4', source: 'db1', target: 'db2', edgeType: 'internal' },
        ],
      );
      const warnings = service.analyze(state);
      expect(warningTypes(warnings)).not.toContain('SPOF');
    });

    it('does not fire when sibling exists but is unconnected', () => {
      const state = buildState(
        [
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 's3', type: 'service' },
          { id: 'db1', type: 'database' },
          { id: 'db2', type: 'database' }, // unconnected
        ],
        [
          { id: 'e1', source: 's1', target: 'db1', edgeType: 'http' },
          { id: 'e2', source: 's2', target: 'db1', edgeType: 'http' },
          { id: 'e3', source: 's3', target: 'db1', edgeType: 'http' },
        ],
      );
      const warnings = service.analyze(state);
      expect(warningTypes(warnings)).toContain('SPOF');
    });

    it('does not fire on infrastructure nodes (loadBalancer, dns, cdn)', () => {
      const state = buildState(
        [
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 's3', type: 'service' },
          { id: 'lb', type: 'loadBalancer' },
        ],
        [
          { id: 'e1', source: 's1', target: 'lb', edgeType: 'http' },
          { id: 'e2', source: 's2', target: 'lb', edgeType: 'http' },
          { id: 'e3', source: 's3', target: 'lb', edgeType: 'http' },
        ],
      );
      const warnings = service.analyze(state);
      expect(warningTypes(warnings)).not.toContain('SPOF');
    });

    it('does not fire when fewer than 3 incoming connections', () => {
      const state = buildState(
        [
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 'db', type: 'database' },
        ],
        [
          { id: 'e1', source: 's1', target: 'db', edgeType: 'http' },
          { id: 'e2', source: 's2', target: 'db', edgeType: 'http' },
        ],
      );
      const warnings = service.analyze(state);
      expect(warningTypes(warnings)).not.toContain('SPOF');
    });

    it('does not fire when incoming edge is async (non-synchronous)', () => {
      const state = buildState(
        [
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 's3', type: 'service' },
          { id: 'db', type: 'database' },
        ],
        [
          { id: 'e1', source: 's1', target: 'db', edgeType: 'async' },
          { id: 'e2', source: 's2', target: 'db', edgeType: 'async' },
          { id: 'e3', source: 's3', target: 'db', edgeType: 'async' },
        ],
      );
      const warnings = service.analyze(state);
      expect(warningTypes(warnings)).not.toContain('SPOF');
    });
  });

  describe('checkMissingCache', () => {
    it('fires when 3+ services connect directly to a database with no cache', () => {
      const state = buildState(
        [
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 's3', type: 'service' },
          { id: 'db', type: 'database' },
        ],
        [
          { id: 'e1', source: 's1', target: 'db', edgeType: 'http' },
          { id: 'e2', source: 's2', target: 'db', edgeType: 'http' },
          { id: 'e3', source: 's3', target: 'db', edgeType: 'http' },
        ],
      );
      expect(warningTypes(service.analyze(state))).toContain('MISSING_CACHE');
    });

    it('does not fire when a cache layer exists between services and database', () => {
      const state = buildState(
        [
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 's3', type: 'service' },
          { id: 'cache', type: 'cache' },
          { id: 'db', type: 'database' },
        ],
        [
          { id: 'e1', source: 's1', target: 'cache', edgeType: 'internal' },
          { id: 'e2', source: 's2', target: 'cache', edgeType: 'internal' },
          { id: 'e3', source: 's3', target: 'cache', edgeType: 'internal' },
          { id: 'e4', source: 'cache', target: 'db', edgeType: 'internal' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('MISSING_CACHE');
    });

    it('does not count cache nodes as direct database connections', () => {
      // Cache + 2 services connecting to DB — should not fire (only 2 non-cache sources)
      const state = buildState(
        [
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 'cache', type: 'cache' },
          { id: 'db', type: 'database' },
        ],
        [
          { id: 'e1', source: 's1', target: 'db', edgeType: 'internal' },
          { id: 'e2', source: 's2', target: 'db', edgeType: 'internal' },
          { id: 'e3', source: 'cache', target: 'db', edgeType: 'internal' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('MISSING_CACHE');
    });
  });

  describe('checkCascadingFailure', () => {
    it('fires when 4+ application nodes are chained synchronously', () => {
      const state = buildState(
        [
          { id: 'a', type: 'service' },
          { id: 'b', type: 'service' },
          { id: 'c', type: 'service' },
          { id: 'd', type: 'service' },
        ],
        [
          { id: 'e1', source: 'a', target: 'b', edgeType: 'http' },
          { id: 'e2', source: 'b', target: 'c', edgeType: 'http' },
          { id: 'e3', source: 'c', target: 'd', edgeType: 'http' },
        ],
      );
      expect(warningTypes(service.analyze(state))).toContain('CASCADING_FAILURE');
    });

    it('does not fire when an async edge breaks the chain', () => {
      const state = buildState(
        [
          { id: 'a', type: 'service' },
          { id: 'b', type: 'service' },
          { id: 'q', type: 'queue' },
          { id: 'c', type: 'service' },
          { id: 'd', type: 'service' },
        ],
        [
          { id: 'e1', source: 'a', target: 'b', edgeType: 'http' },
          { id: 'e2', source: 'b', target: 'q', edgeType: 'async' },
          { id: 'e3', source: 'q', target: 'c', edgeType: 'pubsub' },
          { id: 'e4', source: 'c', target: 'd', edgeType: 'http' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('CASCADING_FAILURE');
    });

    it('does not fire when chain starts from infrastructure nodes', () => {
      const state = buildState(
        [
          { id: 'client', type: 'client' },
          { id: 'dns', type: 'dns' },
          { id: 'cdn', type: 'cdn' },
          { id: 'lb', type: 'loadBalancer' },
          { id: 'svc', type: 'service' },
        ],
        [
          { id: 'e1', source: 'client', target: 'dns', edgeType: 'http' },
          { id: 'e2', source: 'dns', target: 'cdn', edgeType: 'http' },
          { id: 'e3', source: 'cdn', target: 'lb', edgeType: 'http' },
          { id: 'e4', source: 'lb', target: 'svc', edgeType: 'http' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('CASCADING_FAILURE');
    });

    it('does not fire when chain has fewer than 4 nodes', () => {
      const state = buildState(
        [
          { id: 'a', type: 'service' },
          { id: 'b', type: 'service' },
          { id: 'c', type: 'service' },
        ],
        [
          { id: 'e1', source: 'a', target: 'b', edgeType: 'http' },
          { id: 'e2', source: 'b', target: 'c', edgeType: 'http' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('CASCADING_FAILURE');
    });
  });

  describe('checkNoLoadBalancer', () => {
    it('fires when a service has 3+ incoming caller connections with no load balancer', () => {
      const state = buildState(
        [
          { id: 'c1', type: 'service' },
          { id: 'c2', type: 'service' },
          { id: 'c3', type: 'service' },
          { id: 'svc', type: 'service' },
        ],
        [
          { id: 'e1', source: 'c1', target: 'svc', edgeType: 'http' },
          { id: 'e2', source: 'c2', target: 'svc', edgeType: 'http' },
          { id: 'e3', source: 'c3', target: 'svc', edgeType: 'http' },
        ],
      );
      expect(warningTypes(service.analyze(state))).toContain('NO_LOAD_BALANCER');
    });

    it('does not fire when a load balancer is upstream', () => {
      const state = buildState(
        [
          { id: 'lb', type: 'loadBalancer' },
          { id: 'svc1', type: 'service' },
          { id: 'svc2', type: 'service' },
          { id: 'svc3', type: 'service' },
        ],
        [
          { id: 'e1', source: 'lb', target: 'svc1', edgeType: 'http' },
          { id: 'e2', source: 'lb', target: 'svc2', edgeType: 'http' },
          { id: 'e3', source: 'lb', target: 'svc3', edgeType: 'http' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('NO_LOAD_BALANCER');
    });

    it('does not count outgoing connections to databases or caches', () => {
      const state = buildState(
        [
          { id: 'caller', type: 'service' },
          { id: 'svc', type: 'service' },
          { id: 'db', type: 'database' },
          { id: 'cache', type: 'cache' },
          { id: 'monitor', type: 'monitoring' },
        ],
        [
          { id: 'e1', source: 'caller', target: 'svc', edgeType: 'http' },
          { id: 'e2', source: 'svc', target: 'db', edgeType: 'internal' },
          { id: 'e3', source: 'svc', target: 'cache', edgeType: 'internal' },
          { id: 'e4', source: 'svc', target: 'monitor', edgeType: 'internal' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('NO_LOAD_BALANCER');
    });
  });

  describe('checkDirectClientToDatabase', () => {
    it('fires when client connects directly to database with no service', () => {
      const state = buildState(
        [
          { id: 'client', type: 'client' },
          { id: 'db', type: 'database' },
        ],
        [{ id: 'e1', source: 'client', target: 'db', edgeType: 'http' }],
      );
      expect(warningTypes(service.analyze(state))).toContain('DIRECT_CLIENT_TO_DATABASE');
    });

    it('does not fire when a service exists between client and database', () => {
      const state = buildState(
        [
          { id: 'client', type: 'client' },
          { id: 'svc', type: 'service' },
          { id: 'db', type: 'database' },
        ],
        [
          { id: 'e1', source: 'client', target: 'svc', edgeType: 'http' },
          { id: 'e2', source: 'svc', target: 'db', edgeType: 'internal' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('DIRECT_CLIENT_TO_DATABASE');
    });

    it('does not fire when source is a service (service connecting to own DB is correct)', () => {
      const state = buildState(
        [
          { id: 'svc', type: 'service' },
          { id: 'db', type: 'database' },
        ],
        [{ id: 'e1', source: 'svc', target: 'db', edgeType: 'internal' }],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('DIRECT_CLIENT_TO_DATABASE');
    });
  });

  describe('checkNoDeadLetterQueue', () => {
    it('fires when a queue has consumers but no DLQ sibling', () => {
      const state = buildState(
        [
          { id: 'svc', type: 'service' },
          { id: 'q', type: 'queue' },
          { id: 'worker', type: 'service' },
        ],
        [
          { id: 'e1', source: 'svc', target: 'q', edgeType: 'async' },
          { id: 'e2', source: 'q', target: 'worker', edgeType: 'pubsub' },
        ],
      );
      expect(warningTypes(service.analyze(state))).toContain('NO_DEAD_LETTER_QUEUE');
    });

    it('does not fire when a DLQ queue exists receiving from the main queue', () => {
      const state = buildState(
        [
          { id: 'svc', type: 'service' },
          { id: 'q', type: 'queue' },
          { id: 'dlq', type: 'queue' },
          { id: 'worker', type: 'service' },
          { id: 'dlqWorker', type: 'service' },
        ],
        [
          { id: 'e1', source: 'svc', target: 'q', edgeType: 'async' },
          { id: 'e2', source: 'q', target: 'worker', edgeType: 'pubsub' },
          { id: 'e3', source: 'q', target: 'dlq', edgeType: 'pubsub' },
          { id: 'e4', source: 'dlq', target: 'dlqWorker', edgeType: 'pubsub' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('NO_DEAD_LETTER_QUEUE');
    });

    it('does not fire on the DLQ node itself', () => {
      const state = buildState(
        [
          { id: 'svc', type: 'service' },
          { id: 'q', type: 'queue' },
          { id: 'dlq', type: 'queue' },
          { id: 'worker', type: 'service' },
          { id: 'dlqWorker', type: 'service' },
        ],
        [
          { id: 'e1', source: 'svc', target: 'q', edgeType: 'async' },
          { id: 'e2', source: 'q', target: 'worker', edgeType: 'pubsub' },
          { id: 'e3', source: 'q', target: 'dlq', edgeType: 'pubsub' },
          { id: 'e4', source: 'dlq', target: 'dlqWorker', edgeType: 'pubsub' },
        ],
      );
      const warnings = service.analyze(state);
      const dlqWarnings = warnings.filter(
        (w) => w.type === 'NO_DEAD_LETTER_QUEUE' && w.nodeId === 'dlq',
      );
      expect(dlqWarnings).toHaveLength(0);
    });
  });

  describe('checkSingleQueueConsumer', () => {
    it('fires when a queue has exactly one consumer', () => {
      const state = buildState(
        [
          { id: 'q', type: 'queue' },
          { id: 'worker', type: 'service' },
        ],
        [{ id: 'e1', source: 'q', target: 'worker', edgeType: 'pubsub' }],
      );
      expect(warningTypes(service.analyze(state))).toContain('SINGLE_QUEUE_CONSUMER');
    });

    it('does not fire when queue has 2+ consumers', () => {
      const state = buildState(
        [
          { id: 'q', type: 'queue' },
          { id: 'w1', type: 'service' },
          { id: 'w2', type: 'service' },
        ],
        [
          { id: 'e1', source: 'q', target: 'w1', edgeType: 'pubsub' },
          { id: 'e2', source: 'q', target: 'w2', edgeType: 'pubsub' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('SINGLE_QUEUE_CONSUMER');
    });

    it('does not fire on a DLQ node with one consumer', () => {
      const state = buildState(
        [
          { id: 'q', type: 'queue' },
          { id: 'dlq', type: 'queue' },
          { id: 'worker', type: 'service' },
          { id: 'dlqWorker', type: 'service' },
        ],
        [
          { id: 'e1', source: 'q', target: 'worker', edgeType: 'pubsub' },
          { id: 'e2', source: 'q', target: 'dlq', edgeType: 'pubsub' },
          { id: 'e3', source: 'dlq', target: 'dlqWorker', edgeType: 'pubsub' },
        ],
      );
      const warnings = service.analyze(state);
      const dlqSingleConsumer = warnings.filter(
        (w) => w.type === 'SINGLE_QUEUE_CONSUMER' && w.nodeId === 'dlq',
      );
      expect(dlqSingleConsumer).toHaveLength(0);
    });
  });

  describe('checkNoCdnForClient', () => {
    it('fires when client exists but no CDN is connected to it', () => {
      const state = buildState(
        [
          { id: 'client', type: 'client' },
          { id: 'svc', type: 'service' },
        ],
        [{ id: 'e1', source: 'client', target: 'svc', edgeType: 'http' }],
      );
      expect(warningTypes(service.analyze(state))).toContain('NO_CDN_FOR_CLIENT');
    });

    it('does not fire when CDN is connected to client', () => {
      const state = buildState(
        [
          { id: 'client', type: 'client' },
          { id: 'cdn', type: 'cdn' },
          { id: 'svc', type: 'service' },
        ],
        [
          { id: 'e1', source: 'client', target: 'cdn', edgeType: 'http' },
          { id: 'e2', source: 'cdn', target: 'svc', edgeType: 'http' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('NO_CDN_FOR_CLIENT');
    });

    it('fires when CDN exists but is unconnected', () => {
      const state = buildState(
        [
          { id: 'client', type: 'client' },
          { id: 'cdn', type: 'cdn' },
          { id: 'svc', type: 'service' },
        ],
        [
          { id: 'e1', source: 'client', target: 'svc', edgeType: 'http' },
          // cdn has no edges
        ],
      );
      expect(warningTypes(service.analyze(state))).toContain('NO_CDN_FOR_CLIENT');
    });
  });

  describe('checkNoMonitoring', () => {
    it('fires when diagram has 5+ nodes and no connected monitoring node', () => {
      const state = buildState(
        [
          { id: 'c', type: 'client' },
          { id: 'gw', type: 'apiGateway' },
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 'db', type: 'database' },
        ],
        [
          { id: 'e1', source: 'c', target: 'gw', edgeType: 'http' },
          { id: 'e2', source: 'gw', target: 's1', edgeType: 'http' },
          { id: 'e3', source: 'gw', target: 's2', edgeType: 'http' },
          { id: 'e4', source: 's1', target: 'db', edgeType: 'internal' },
        ],
      );
      expect(warningTypes(service.analyze(state))).toContain('NO_MONITORING');
    });

    it('does not fire when monitoring node is connected', () => {
      const state = buildState(
        [
          { id: 'c', type: 'client' },
          { id: 'gw', type: 'apiGateway' },
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 'db', type: 'database' },
          { id: 'mon', type: 'monitoring' },
        ],
        [
          { id: 'e1', source: 'c', target: 'gw', edgeType: 'http' },
          { id: 'e2', source: 'gw', target: 's1', edgeType: 'http' },
          { id: 'e3', source: 'gw', target: 's2', edgeType: 'http' },
          { id: 'e4', source: 's1', target: 'db', edgeType: 'internal' },
          { id: 'e5', source: 's1', target: 'mon', edgeType: 'internal' },
        ],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('NO_MONITORING');
    });

    it('does not fire when monitoring exists but is unconnected', () => {
      const state = buildState(
        [
          { id: 'c', type: 'client' },
          { id: 'gw', type: 'apiGateway' },
          { id: 's1', type: 'service' },
          { id: 's2', type: 'service' },
          { id: 'db', type: 'database' },
          { id: 'mon', type: 'monitoring' }, // unconnected
        ],
        [
          { id: 'e1', source: 'c', target: 'gw', edgeType: 'http' },
          { id: 'e2', source: 'gw', target: 's1', edgeType: 'http' },
          { id: 'e3', source: 'gw', target: 's2', edgeType: 'http' },
          { id: 'e4', source: 's1', target: 'db', edgeType: 'internal' },
        ],
      );
      expect(warningTypes(service.analyze(state))).toContain('NO_MONITORING');
    });

    it('does not fire when diagram has fewer than 5 nodes', () => {
      const state = buildState(
        [
          { id: 's', type: 'service' },
          { id: 'db', type: 'database' },
        ],
        [{ id: 'e1', source: 's', target: 'db', edgeType: 'internal' }],
      );
      expect(warningTypes(service.analyze(state))).not.toContain('NO_MONITORING');
    });
  });

  describe('well-architected URL shortener produces no warnings', () => {
    it('returns empty warnings array for a complete URL shortener design', () => {
      const state = buildState(
        [
          { id: 'client', type: 'client' },
          { id: 'cdn', type: 'cdn' },
          { id: 'waf', type: 'firewall' },
          { id: 'lb', type: 'loadBalancer' },
          { id: 'gw', type: 'apiGateway' },
          { id: 'svc1', type: 'service' },
          { id: 'svc2', type: 'service' },
          { id: 'cache', type: 'cache' },
          { id: 'db', type: 'database' },
          { id: 's3', type: 'objectStorage' },
          { id: 'mon', type: 'monitoring' },
          { id: 'log', type: 'logging' },
        ],
        [
          { id: 'e1', source: 'client', target: 'cdn', edgeType: 'http' },
          { id: 'e2', source: 'cdn', target: 'waf', edgeType: 'http' },
          { id: 'e3', source: 'waf', target: 'lb', edgeType: 'http' },
          { id: 'e4', source: 'lb', target: 'gw', edgeType: 'http' },
          { id: 'e5', source: 'gw', target: 'svc1', edgeType: 'http' },
          { id: 'e6', source: 'gw', target: 'svc2', edgeType: 'http' },
          { id: 'e7', source: 'svc1', target: 'cache', edgeType: 'internal' },
          { id: 'e8', source: 'svc2', target: 'cache', edgeType: 'internal' },
          { id: 'e9', source: 'cache', target: 'db', edgeType: 'internal' },
          { id: 'e10', source: 'svc1', target: 's3', edgeType: 'internal' },
          { id: 'e11', source: 'svc1', target: 'mon', edgeType: 'internal' },
          { id: 'e12', source: 'svc1', target: 'log', edgeType: 'internal' },
        ],
      );
      const warnings = service.analyze(state);
      expect(warnings).toHaveLength(0);
    });
  });
});
