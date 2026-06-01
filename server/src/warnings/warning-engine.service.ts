import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { CanvasStateData, CanvasEdge } from '../canvas/types/canvas.types';
import type { Warning } from './warning.types';

// Edge types considered synchronous — failures propagate through them
// Edges without a type default to synchronous for safety
const SYNCHRONOUS_TYPES = new Set(['http', 'grpc', undefined]);

@Injectable()
export class WarningEngineService {
  private readonly logger = new Logger(WarningEngineService.name);

  /**
   * Runs all warning rules against the current canvas state.
   * Returns a flat list of all detected warnings.
   * Never throws — errors are caught and logged so the canvas
   * is never broken by a failing rule.
   */
  analyze(state: CanvasStateData): Warning[] {
    const warnings: Warning[] = [];

    try {
      warnings.push(...this.checkSPOF(state));
      warnings.push(...this.checkMissingCache(state));
      warnings.push(...this.checkCascadingFailure(state));
      warnings.push(...this.checkNoLoadBalancer(state));
      warnings.push(...this.checkDirectClientToDatabase(state));
    } catch (err) {
      this.logger.error('Warning analysis failed', err);
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

    for (const node of nodes) {
        // Count connections in both directions
        const syncConnectionCount = edges.filter(
        (e) =>
            (e.target === node.id || e.source === node.id) &&
            this.isSynchronous(e),
        ).length;

        if (syncConnectionCount < 3) continue;

        const hasSibling = nodes.some(
        (n) => n.id !== node.id && n.type === node.type,
        );

        if (!hasSibling) {
        warnings.push({
            id: uuidv4(),
            nodeId: node.id,
            type: 'SPOF',
            severity: 'high',
            message: `This ${node.type} has ${syncConnectionCount} synchronous connections and no redundant replica. A failure here takes down all dependent services.`,
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
        // Find services connected to this database in either direction
        const directSyncConnected = edges
        .filter(
            (e) =>
            (e.target === db.id || e.source === db.id) &&
            this.isSynchronous(e),
        )
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

    for (const node of nodes) {
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

    const services = nodes.filter((n) => n.type === 'service');

    for (const service of services) {
        // Count connections in both directions
        const syncConnectedEdges = edges.filter(
        (e) =>
            (e.target === service.id || e.source === service.id) &&
            this.isSynchronous(e),
        );

        if (syncConnectedEdges.length < 3) continue;

        const hasLoadBalancer = syncConnectedEdges.some((e) => {
        const connectedNodeId =
            e.target === service.id ? e.source : e.target;
        const connectedNode = nodes.find((n) => n.id === connectedNodeId);
        return connectedNode?.type === 'loadBalancer';
        });

        if (!hasLoadBalancer) {
        warnings.push({
            id: uuidv4(),
            nodeId: service.id,
            type: 'NO_LOAD_BALANCER',
            severity: 'medium',
            message: `This service has ${syncConnectedEdges.length} direct synchronous connections with no load balancer. Consider adding a load balancer to distribute traffic.`,
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

    const clientNodes = nodes.filter(
        (n) => n.type === 'apiGateway' || n.type === 'service',
    );
    const databases = nodes.filter((n) => n.type === 'database');

    for (const client of clientNodes) {
        for (const db of databases) {
        // Check connection in either direction
        const hasDirectEdge = edges.some(
            (e) =>
            (e.source === client.id && e.target === db.id) ||
            (e.source === db.id && e.target === client.id),
        );

        if (!hasDirectEdge) continue;

        const intermediateServices = nodes.filter(
            (n) => n.type === 'service' && n.id !== client.id,
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

  private isSynchronous(edge: CanvasEdge): boolean {
    return SYNCHRONOUS_TYPES.has(edge.data?.edgeType);
  }
}