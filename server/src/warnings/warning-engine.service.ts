import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { CanvasStateData, CanvasEdge } from '../canvas/types/canvas.types';
import type { Warning } from './warning.types';

// Edge types considered synchronous — failures propagate through them
// Edges without a type default to synchronous for safety
const SYNCHRONOUS_TYPES = new Set([
  'http', 'grpc', 'tcp', 'dbProtocol', 'internal', 'webhook', undefined,
]);

@Injectable()
export class WarningEngineService {
  private readonly logger = new Logger(WarningEngineService.name);

  private readonly INFRASTRUCTURE_TYPES = new Set([
    'dns',
    'cdn',
    'firewall',
    'loadBalancer',
    'reverseProxy',
    'apiGateway',
    'client',
    'mobileClient',
  ]);

  private readonly CALLER_TYPES = new Set([
    'service',
    'worker',
    'apiGateway',
    'client',
    'mobileClient',
    'thirdParty',
    'reverseProxy',
  ]);

  private readonly TARGET_PEER_TYPES = new Set([
    'service',
    'worker',
    'serverless',
    'containerOrchestrator',
  ]);

  /**
   * Runs all warning rules against the current canvas state.
   * Returns a flat list of all detected warnings.
   * Never throws — errors are caught and logged so the canvas
   * is never broken by a failing rule.
   */
  analyze(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];

    const checks: Array<() => Warning[]> = [
      () => this.checkSPOF(state),
      () => this.checkMissingCache(state),
      () => this.checkCascadingFailure(state),
      () => this.checkNoLoadBalancer(state),
      () => this.checkDirectClientToDatabase(state),
      () => this.checkNoApiGateway(state),
      () => this.checkNoFirewall(state),
      () => this.checkDatabaseNoReadReplica(state),
      () => this.checkSingleQueueConsumer(state),
      () => this.checkSynchronousWriteCriticalPath(state),
      () => this.checkNoDeadLetterQueue(state),
      () => this.checkNoCdnForClient(state),
      () => this.checkNoObjectStorageForMedia(state),
      () => this.checkUnboundedFanout(state),
      () => this.checkNoCacheForSearch(state),
      () => this.checkNoRateLimiting(state),
      () => this.checkNoMonitoring(state),
      () => this.checkNoLogging(state),
    ];

    for (const check of checks) {
      try {
        warnings.push(...check());
      } catch (err) {
        this.logger.error('Warning analysis failed', err);
      }
    }

    return warnings;
  }

  /**
   * Rule 1 — Single Point of Failure
   * A node with 3+ synchronous incoming connections
   * and no sibling of the same type in the diagram.
   */
    private checkSPOF(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    // Only check application nodes for SPOF, not infrastructure
    const checkableNodes = nodes.filter(
      (n) => !this.INFRASTRUCTURE_TYPES.has(n.type),
    );

    for (const node of checkableNodes) {
        // Only count incoming synchronous connections from caller-type nodes
        const syncIncomingCount = edges.filter(
        (e) =>
            e.target === node.id &&
            this.isSynchronous(e),
        ).length;

        if (syncIncomingCount < 3) continue;

        const hasSibling = nodes.some(
        (n) =>
            n.id !== node.id &&
            n.type === node.type &&
            this.isConnectedNode(n.id, edges),
        );

        if (!hasSibling) {
        warnings.push({
            id: uuidv4(),
            nodeId: node.id,
            type: 'SPOF',
            severity: 'high',
            message: `This ${node.type} has ${syncIncomingCount} synchronous dependents and no redundant replica. A failure here takes down all dependent services.`,
        });
        }
    }

    return warnings;
    }

  /**
   * Rule 2 — Missing Cache
   * A database node with 3+ services connecting directly
   * via synchronous edges and no cache in between.
   */
    private checkMissingCache(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const databases = nodes.filter((n) => n.type === 'database');
    const caches = nodes.filter((n) => n.type === 'cache');

    for (const db of databases) {
        // Count only direct connections from non-cache, non-infrastructure nodes
        // Cache nodes connecting to a database is correct behavior — they are
        // the cache layer doing a read-through on cache miss
        const directSyncConnected = edges
        .filter((e) => {
          if (
            (e.target !== db.id && e.source !== db.id) ||
            !this.isSynchronous(e)
          )
            return false;

          const connectedNodeId =
            e.target === db.id ? e.source : e.target;
          const connectedNode = nodes.find((n) => n.id === connectedNodeId);

          // Exclude cache nodes and infrastructure nodes from the count
          return (
            connectedNode !== undefined &&
            connectedNode.type !== 'cache' &&
            !this.INFRASTRUCTURE_TYPES.has(connectedNode.type)
          );
        })
        .map((e) => (e.target === db.id ? e.source : e.target));

        if (directSyncConnected.length < 3) continue;

        const hasCacheLayer = caches.some((cache) => {
        const cacheConnectedToSource = directSyncConnected.some((nodeId) =>
            edges.some(
            (e) =>
                (e.source === nodeId && e.target === cache.id) ||
                (e.source === cache.id && e.target === nodeId),
            ),
        );
        const cacheConnectedToDb = edges.some(
            (e) =>
            (e.source === cache.id && e.target === db.id) ||
            (e.source === db.id && e.target === cache.id),
        );
        return cacheConnectedToSource && cacheConnectedToDb;
        });

        if (!hasCacheLayer) {
        warnings.push({
            id: uuidv4(),
            nodeId: db.id,
            type: 'MISSING_CACHE',
            severity: 'medium',
            message: `This database has ${directSyncConnected.length} services connecting directly with no cache layer. Consider adding a cache for read-heavy paths.`,
        });
        }
    }

    return warnings;
    }

  /**
   * Rule 3 — Cascading Failure Risk
   * A chain of 4+ nodes connected exclusively by synchronous edges.
   * An async or pub/sub edge anywhere in the chain breaks the warning.
   */
  private checkCascadingFailure(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;
    const warnedNodes = new Set<string>();

    // Only start chains from application nodes, not infrastructure
    const applicationNodes = nodes.filter(
      (n) => !this.INFRASTRUCTURE_TYPES.has(n.type),
    );

    for (const node of applicationNodes) {
      const chain = this.findLongestSyncChain(
        node.id,
        edges,
        new Set<string>(),
      );

      if (chain.length >= 4) {
        for (const nodeId of chain) {
          if (warnedNodes.has(nodeId)) continue;
          warnedNodes.add(nodeId);

          warnings.push({
            id: uuidv4(),
            nodeId,
            type: 'CASCADING_FAILURE',
            severity: 'high',
            message: `This node is part of a synchronous chain of ${chain.length} services. A failure anywhere in this chain propagates to all downstream services.`,
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Recursively finds the longest chain of synchronously connected nodes
   * starting from a given node. Uses visited set to prevent infinite loops.
   */
  private findLongestSyncChain(
    nodeId: string,
    edges: CanvasEdge[],
    visited: Set<string>,
  ): string[] {
    if (visited.has(nodeId)) return [];

    const nextVisited = new Set(visited);
    nextVisited.add(nodeId);

    const syncOutgoing = edges.filter(
      (e) => e.source === nodeId && this.isSynchronous(e),
    );

    if (syncOutgoing.length === 0) return [nodeId];

    let longest: string[] = [];

    for (const edge of syncOutgoing) {
      const chain = this.findLongestSyncChain(
        edge.target,
        edges,
        nextVisited,
      );
      if (chain.length > longest.length) {
        longest = chain;
      }
    }

    return [nodeId, ...longest];
  }

  /**
   * Rule 4 — No Load Balancer
   * A service node with 3+ synchronous incoming connections
   * but no load balancer among the sources.
   */
    private checkNoLoadBalancer(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const services = nodes.filter(
      (n) => n.type === 'service' || n.type === 'worker',
    );

    for (const service of services) {
        // Only count incoming connections FROM caller-type nodes
        const incomingSyncFromCallers = edges.filter((e) => {
          if (e.target !== service.id) return false;
          if (!this.isSynchronous(e)) return false;
          const sourceNode = nodes.find((n) => n.id === e.source);
          return sourceNode ? this.CALLER_TYPES.has(sourceNode.type) : false;
        });

        if (incomingSyncFromCallers.length < 3) continue;

        // Load balancer detection scans ALL incoming sync edges, not just
        // the caller-filtered set — loadBalancer is deliberately excluded
        // from CALLER_TYPES so it doesn't inflate the count, but it must
        // still be found here or it could never suppress this warning.
        const hasLoadBalancer = edges.some((e) => {
          if (e.target !== service.id) return false;
          if (!this.isSynchronous(e)) return false;
          const sourceNode = nodes.find((n) => n.id === e.source);
          return sourceNode?.type === 'loadBalancer';
        });

        if (!hasLoadBalancer) {
        warnings.push({
            id: uuidv4(),
            nodeId: service.id,
            type: 'NO_LOAD_BALANCER',
            severity: 'medium',
            message: `This service receives ${incomingSyncFromCallers.length} direct synchronous connections from callers with no load balancer upstream. Consider adding a load balancer to distribute traffic.`,
        });
        }
    }

    return warnings;
    }

  /**
   * Rule 5 — Direct Client to Database
   * An API gateway or service connected directly to a database
   * with no intermediate service layer between them.
   */
    private checkDirectClientToDatabase(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    // Only these node types should never connect directly to a database
    const CLIENT_FACING_TYPES = new Set([
      'client',
      'mobileClient',
      'apiGateway',
      'thirdParty',
    ]);

    const clientFacingNodes = nodes.filter(
        (n) => CLIENT_FACING_TYPES.has(n.type),
    );
    const databases = nodes.filter((n) => n.type === 'database');

    for (const client of clientFacingNodes) {
        for (const db of databases) {
        // Check connection in either direction
        const hasDirectEdge = edges.some(
            (e) =>
            (e.source === client.id && e.target === db.id) ||
            (e.source === db.id && e.target === client.id),
        );

        if (!hasDirectEdge) continue;

        // Check if there is an intermediate service between client and database
        const intermediateServices = nodes.filter(
            (n) => n.type === 'service' || n.type === 'worker',
        );

        const hasIntermediate = intermediateServices.some((service) => {
            const clientToService = edges.some(
            (e) =>
                (e.source === client.id && e.target === service.id) ||
                (e.source === service.id && e.target === client.id),
            );
            const serviceToDb = edges.some(
            (e) =>
                (e.source === service.id && e.target === db.id) ||
                (e.source === db.id && e.target === service.id),
            );
            return clientToService && serviceToDb;
        });

        if (!hasIntermediate) {
            warnings.push({
            id: uuidv4(),
            nodeId: db.id,
            type: 'DIRECT_CLIENT_TO_DATABASE',
            severity: 'medium',
            message: `${client.data.label} connects directly to this database with no intermediate service layer. This couples your API layer directly to your data layer.`,
            });
        }
        }
    }

    return warnings;
    }

  /**
   * Rule 6 — No API Gateway
   * External clients exist but no API Gateway is present anywhere
   * to centralize auth, rate limiting, and SSL termination.
   */
  private checkNoApiGateway(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const clientNodes = nodes.filter(
      (n) => n.type === 'client' || n.type === 'mobileClient',
    );
    if (clientNodes.length === 0) return warnings;

    // An unconnected apiGateway node on the canvas does not satisfy this rule
    const hasConnectedApiGateway = nodes
      .filter((n) => n.type === 'apiGateway')
      .some((n) => edges.some((e) => e.source === n.id || e.target === n.id));
    if (hasConnectedApiGateway) return warnings;

    for (const client of clientNodes) {
      warnings.push({
        id: uuidv4(),
        nodeId: client.id,
        type: 'NO_API_GATEWAY',
        severity: 'medium',
        message: 'External clients connect directly to services with no API Gateway. Consider adding an API Gateway for centralized auth, rate limiting, and SSL termination.',
      });
    }

    return warnings;
  }

  /**
   * Rule 7 — No Firewall
   * External clients exist but no Firewall/WAF is present anywhere
   * to filter or protect public traffic.
   */
  private checkNoFirewall(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const clientNodes = nodes.filter(
      (n) => n.type === 'client' || n.type === 'mobileClient',
    );
    if (clientNodes.length === 0) return warnings;

    // An unconnected firewall node on the canvas does not satisfy this rule
    const hasConnectedFirewall = nodes
      .filter((n) => n.type === 'firewall')
      .some((n) => edges.some((e) => e.source === n.id || e.target === n.id));
    if (hasConnectedFirewall) return warnings;

    for (const client of clientNodes) {
      warnings.push({
        id: uuidv4(),
        nodeId: client.id,
        type: 'NO_FIREWALL',
        severity: 'medium',
        message: 'No firewall or WAF in the diagram. Public traffic has no DDoS protection or request filtering layer.',
      });
    }

    return warnings;
  }

  /**
   * Rule 8 — Database No Read Replica
   * A lone database handles 3+ synchronous incoming (read) connections
   * with no other database node to act as a read replica.
   */
  private checkDatabaseNoReadReplica(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const databases = nodes.filter((n) => n.type === 'database');

    for (const db of databases) {
      const hasReplica = nodes.some(
        (n) =>
          n.id !== db.id &&
          n.type === 'database' &&
          this.isConnectedNode(n.id, edges),
      );
      if (hasReplica) continue;

      const incomingSyncCount = edges.filter((e) => {
        if (e.target !== db.id) return false;
        if (!this.isSynchronous(e)) return false;
        const sourceNode = nodes.find((n) => n.id === e.source);
        return sourceNode ? this.CALLER_TYPES.has(sourceNode.type) : false;
      }).length;

      if (incomingSyncCount < 3) continue;

      warnings.push({
        id: uuidv4(),
        nodeId: db.id,
        type: 'DATABASE_NO_READ_REPLICA',
        severity: 'medium',
        message: 'This database handles all read traffic with no read replica. Under high read load, consider adding a read replica to distribute queries.',
      });
    }

    return warnings;
  }

  /**
   * Rule 9 — Single Queue Consumer
   * A queue or event bus has exactly one downstream service/worker
   * consuming from it — a single point of failure for message processing.
   */
  private checkSingleQueueConsumer(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const queueNodes = nodes.filter(
      (n) => n.type === 'queue' || n.type === 'eventBus',
    );

    for (const queue of queueNodes) {
      // Skip DLQ nodes — a DLQ having one consumer is correct architecture
      if (this.isDlqNode(queue.id, edges, nodes)) continue;

      // Count downstream service/worker consumers only
      const consumers = edges.filter((e) => {
        if (e.source !== queue.id) return false;
        const edgeType = e.data?.edgeType;
        if (edgeType !== 'async' && edgeType !== 'pubsub') return false;
        const targetNode = nodes.find((n) => n.id === e.target);
        return (
          targetNode !== undefined &&
          (targetNode.type === 'service' || targetNode.type === 'worker')
        );
      });

      if (consumers.length === 1) {
        warnings.push({
          id: uuidv4(),
          nodeId: queue.id,
          type: 'SINGLE_QUEUE_CONSUMER',
          severity: 'medium',
          message:
            'This queue has only one consumer. If the consumer goes down, messages will queue indefinitely. Consider adding multiple consumer instances.',
        });
      }
    }

    return warnings;
  }

  /**
   * Rule 10 — Synchronous Write on Critical Path
   * A user-facing service (reached by a client or API gateway) writes
   * synchronously to a database, coupling user latency to DB latency.
   */
  private checkSynchronousWriteCriticalPath(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const services = nodes.filter((n) => n.type === 'service');
    const databases = nodes.filter((n) => n.type === 'database');

    for (const service of services) {
      const writesToDbSync = edges.some(
        (e) =>
          ((e.source === service.id && databases.some((d) => d.id === e.target)) ||
            (e.target === service.id && databases.some((d) => d.id === e.source))) &&
          (e.data?.edgeType === 'http' || e.data?.edgeType === 'grpc'),
      );

      if (!writesToDbSync) continue;

      const isUserFacing = edges.some((e) => {
        const otherId = this.getOtherNodeId(e, service.id);
        if (!otherId) return false;
        const otherNode = nodes.find((n) => n.id === otherId);
        return (
          otherNode?.type === 'client' ||
          otherNode?.type === 'mobileClient' ||
          otherNode?.type === 'apiGateway'
        );
      });

      if (!isUserFacing) continue;

      warnings.push({
        id: uuidv4(),
        nodeId: service.id,
        type: 'SYNCHRONOUS_WRITE_CRITICAL_PATH',
        severity: 'medium',
        message: 'This service writes synchronously to a database on the user-facing request path. Database slowdowns will directly impact user latency. Consider async writes via a queue.',
      });
    }

    return warnings;
  }

  /**
   * Rule 11 — No Dead Letter Queue
   * A queue with consumers needs another Queue/EventBus node directly
   * downstream to serve as its DLQ. DLQ nodes themselves are exempt —
   * they don't need a DLQ of their own.
   */
  private checkNoDeadLetterQueue(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const queueNodes = nodes.filter(
      (n) => n.type === 'queue' || n.type === 'eventBus',
    );

    for (const queue of queueNodes) {
      // Skip nodes that are themselves DLQs — they don't need their own DLQ
      if (this.isDlqNode(queue.id, edges, nodes)) continue;

      // Check if this queue has at least one downstream consumer
      const hasConsumer = edges.some((e) => {
        if (e.source !== queue.id) return false;
        const edgeType = e.data?.edgeType;
        if (edgeType !== 'async' && edgeType !== 'pubsub') return false;
        const targetNode = nodes.find((n) => n.id === e.target);
        return (
          targetNode !== undefined &&
          (targetNode.type === 'service' || targetNode.type === 'worker')
        );
      });

      if (!hasConsumer) continue;

      // Check if this queue has a direct DLQ — another Queue/EventBus node
      // that receives messages directly from this queue via async/pubsub
      const hasDlq = edges.some((e) => {
        if (e.source !== queue.id) return false;
        const edgeType = e.data?.edgeType;
        if (edgeType !== 'async' && edgeType !== 'pubsub') return false;
        const targetNode = nodes.find((n) => n.id === e.target);
        return (
          targetNode !== undefined &&
          (targetNode.type === 'queue' || targetNode.type === 'eventBus')
        );
      });

      if (!hasDlq) {
        warnings.push({
          id: uuidv4(),
          nodeId: queue.id,
          type: 'NO_DEAD_LETTER_QUEUE',
          severity: 'medium',
          message:
            'This queue has no dead letter queue configured. Failed messages have nowhere to go and will be silently dropped or cause infinite retries.',
        });
      }
    }

    return warnings;
  }

  /**
   * Rule 12 — No CDN for Clients
   * Client-facing diagrams with no CDN serve all static assets from origin.
   */
  private checkNoCdnForClient(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const clientNodes = nodes.filter(
      (n) => n.type === 'client' || n.type === 'mobileClient',
    );

    if (clientNodes.length === 0) return warnings;

    const cdnNodes = nodes.filter((n) => n.type === 'cdn');

    // A CDN only counts if it is actually connected to a client node
    // An unconnected CDN node on the canvas does not satisfy this rule
    const hasConnectedCdn = cdnNodes.some((cdn) =>
      edges.some(
        (e) =>
          (e.source === cdn.id &&
            clientNodes.some((c) => c.id === e.target)) ||
          (e.target === cdn.id &&
            clientNodes.some((c) => c.id === e.source)),
      ),
    );

    if (!hasConnectedCdn) {
      for (const client of clientNodes) {
        warnings.push({
          id: uuidv4(),
          nodeId: client.id,
          type: 'NO_CDN_FOR_CLIENT',
          severity: 'medium',
          message:
            'No CDN connected to this client. Static assets and media will be served from origin on every request. Add a CDN to reduce latency for global users.',
        });
      }
    }

    return warnings;
  }

  /**
   * Rule 13 — No Object Storage for Media
   * A non-trivial system stores everything in a relational database
   * with no object storage for binaries/media.
   */
  private checkNoObjectStorageForMedia(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    if (nodes.length < 5) return warnings;

    // An unconnected objectStorage node on the canvas does not satisfy this rule
    const hasConnectedObjectStorage = nodes
      .filter((n) => n.type === 'objectStorage')
      .some((n) => edges.some((e) => e.source === n.id || e.target === n.id));
    if (hasConnectedObjectStorage) return warnings;

    const databases = nodes.filter((n) => n.type === 'database');
    const services = nodes.filter((n) => n.type === 'service');

    for (const service of services) {
      const connectsToDb = edges.some(
        (e) =>
          (e.source === service.id && databases.some((d) => d.id === e.target)) ||
          (e.target === service.id && databases.some((d) => d.id === e.source)),
      );

      if (!connectsToDb) continue;

      warnings.push({
        id: uuidv4(),
        nodeId: service.id,
        type: 'NO_OBJECT_STORAGE_FOR_MEDIA',
        severity: 'medium',
        message: 'No object storage detected. If this system handles file uploads or media, storing binaries in a relational database will not scale. Consider adding S3-compatible object storage.',
      });
    }

    return warnings;
  }

  /**
   * Rule 14 — Unbounded Fan-out
   * A service makes synchronous calls to 5+ peer services, multiplying
   * failure blast radius and creating tight coupling.
   */
  private checkUnboundedFanout(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const services = nodes.filter((n) => n.type === 'service');

    for (const service of services) {
      const outgoingToPeers = edges.filter((e) => {
        if (e.source !== service.id) return false;
        if (e.target === service.id) return false;
        if (!this.isSynchronous(e)) return false;
        const targetNode = nodes.find((n) => n.id === e.target);
        return targetNode ? this.TARGET_PEER_TYPES.has(targetNode.type) : false;
      });

      if (outgoingToPeers.length < 5) continue;

      warnings.push({
        id: uuidv4(),
        nodeId: service.id,
        type: 'UNBOUNDED_FANOUT',
        severity: 'high',
        message: 'This service makes synchronous calls to 5+ downstream services. This creates tight coupling and multiplies failure blast radius. Consider an event bus or queue to decouple.',
      });
    }

    return warnings;
  }

  /**
   * Rule 15 — No Cache for Search
   * A search engine receives direct synchronous queries from 2+ services
   * with no cache layer absorbing repeated queries.
   */
  private checkNoCacheForSearch(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const searchEngines = nodes.filter((n) => n.type === 'searchEngine');
    const caches = nodes.filter((n) => n.type === 'cache');

    for (const search of searchEngines) {
      const directSyncServices = edges
        .filter(
          (e) =>
            (e.target === search.id || e.source === search.id) &&
            this.isSynchronous(e),
        )
        .map((e) => (e.target === search.id ? e.source : e.target))
        .filter((id) => nodes.some((n) => n.id === id && n.type === 'service'));

      if (directSyncServices.length < 3) continue;

      const hasCacheLayer = caches.some((cache) => {
        const cacheConnectedToService = directSyncServices.some((serviceId) =>
          edges.some(
            (e) =>
              (e.source === serviceId && e.target === cache.id) ||
              (e.source === cache.id && e.target === serviceId),
          ),
        );
        const cacheConnectedToSearch = edges.some(
          (e) =>
            (e.source === cache.id && e.target === search.id) ||
            (e.source === search.id && e.target === cache.id),
        );
        return cacheConnectedToService && cacheConnectedToSearch;
      });

      if (hasCacheLayer) continue;

      warnings.push({
        id: uuidv4(),
        nodeId: search.id,
        type: 'NO_CACHE_FOR_SEARCH',
        severity: 'medium',
        message: 'Search engine receives direct queries with no cache layer. Search queries are expensive — add a cache for frequent or repeated queries.',
      });
    }

    return warnings;
  }

  /**
   * Rule 16 — No Rate Limiting
   * External traffic reaches an API Gateway or Service with no
   * firewall anywhere in the diagram to enforce rate limits.
   */
  private checkNoRateLimiting(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    const hasFirewall = nodes.some((n) => n.type === 'firewall');
    if (hasFirewall) return warnings;

    const externalNodes = nodes.filter(
      (n) => n.type === 'client' || n.type === 'mobileClient' || n.type === 'thirdParty',
    );
    const targets = nodes.filter(
      (n) => n.type === 'apiGateway' || n.type === 'service',
    );

    for (const external of externalNodes) {
      const connectsToTarget = edges.some((e) => {
        const otherId = this.getOtherNodeId(e, external.id);
        if (!otherId) return false;
        return targets.some((t) => t.id === otherId);
      });

      if (!connectsToTarget) continue;

      warnings.push({
        id: uuidv4(),
        nodeId: external.id,
        type: 'NO_RATE_LIMITING',
        severity: 'medium',
        message: 'No rate limiting or WAF detected on incoming traffic. The system is vulnerable to traffic spikes and abuse. Add a firewall or configure rate limiting on the API Gateway.',
      });
    }

    return warnings;
  }

  /**
   * Rule 17 — No Monitoring
   * A non-trivial system has no monitoring node for observability.
   */
  private checkNoMonitoring(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    if (nodes.length < 5) return warnings;

    // A monitoring node only counts if it is connected to an application
    // node it could actually be observing — an unconnected monitoring
    // node on the canvas does not satisfy this rule
    const hasConnectedMonitoring = nodes
      .filter((n) => n.type === 'monitoring')
      .some((n) =>
        edges.some((e) => {
          const otherId = this.getOtherNodeId(e, n.id);
          if (!otherId) return false;
          const otherNode = nodes.find((node) => node.id === otherId);
          return (
            otherNode?.type === 'service' ||
            otherNode?.type === 'worker' ||
            otherNode?.type === 'database' ||
            otherNode?.type === 'cache'
          );
        }),
      );
    if (hasConnectedMonitoring) return warnings;

    const computeNodes = nodes.filter(
      (n) =>
        n.type === 'service' ||
        n.type === 'worker' ||
        n.type === 'serverless' ||
        n.type === 'containerOrchestrator',
    );

    for (const node of computeNodes) {
      warnings.push({
        id: uuidv4(),
        nodeId: node.id,
        type: 'NO_MONITORING',
        severity: 'medium',
        message: 'No monitoring detected in this architecture. Without observability you cannot detect failures, latency spikes, or capacity issues in production.',
      });
    }

    return warnings;
  }

  /**
   * Rule 18 — No Logging
   * A non-trivial system has no centralized logging node.
   */
  private checkNoLogging(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];
    const { nodes, edges } = state;

    if (nodes.length < 5) return warnings;

    // A logging node only counts if it is connected to an application node
    // it could actually be collecting logs from — an unconnected logging
    // node on the canvas does not satisfy this rule
    const hasConnectedLogging = nodes
      .filter((n) => n.type === 'logging')
      .some((n) =>
        edges.some((e) => {
          const otherId = this.getOtherNodeId(e, n.id);
          if (!otherId) return false;
          const otherNode = nodes.find((node) => node.id === otherId);
          return (
            otherNode?.type === 'service' ||
            otherNode?.type === 'worker' ||
            otherNode?.type === 'database' ||
            otherNode?.type === 'cache'
          );
        }),
      );
    if (hasConnectedLogging) return warnings;

    const computeNodes = nodes.filter(
      (n) =>
        n.type === 'service' ||
        n.type === 'worker' ||
        n.type === 'serverless' ||
        n.type === 'containerOrchestrator',
    );

    for (const node of computeNodes) {
      warnings.push({
        id: uuidv4(),
        nodeId: node.id,
        type: 'NO_LOGGING',
        severity: 'medium',
        message: 'No centralized logging detected. Without log aggregation, debugging production issues requires accessing individual service logs manually.',
      });
    }

    return warnings;
  }

  private getOtherNodeId(edge: CanvasEdge, nodeId: string): string | null {
    if (edge.source === nodeId) return edge.target;
    if (edge.target === nodeId) return edge.source;
    return null;
  }

  private isConnectedNode(nodeId: string, edges: CanvasEdge[]): boolean {
    return edges.some((e) => e.source === nodeId || e.target === nodeId);
  }

  private isDlqNode(nodeId: string, edges: CanvasEdge[], nodes: CanvasStateData['nodes']): boolean {
    // A node is a DLQ if it is a Queue or EventBus that receives messages
    // FROM another Queue or EventBus node via async or pubsub edge
    return edges.some((e) => {
      if (e.target !== nodeId) return false;
      const edgeType = e.data?.edgeType;
      if (edgeType !== 'async' && edgeType !== 'pubsub') return false;
      const sourceNode = nodes.find((n) => n.id === e.source);
      return (
        sourceNode !== undefined &&
        (sourceNode.type === 'queue' || sourceNode.type === 'eventBus')
      );
    });
  }

  private isSynchronous(edge: CanvasEdge): boolean {
    return SYNCHRONOUS_TYPES.has(edge.data?.edgeType);
  }
}