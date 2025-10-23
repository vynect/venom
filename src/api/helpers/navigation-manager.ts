/**
 * Navigation Manager
 * Core logic for managing navigation maps and sessions
 */

import {
  NavigationMap,
  NavigationNode,
  NavigationOption,
  NavigationContext,
  NavigationSession,
  NavigationPath,
  NavigationEvent,
  NavigationEventType,
  NavigationConfig,
} from '../model/navigation';

export class NavigationManager {
  private maps: Map<string, NavigationMap>;
  private sessions: Map<string, NavigationSession>;
  private eventListeners: Map<NavigationEventType, Array<(event: NavigationEvent) => void>>;
  private config: NavigationConfig;

  constructor(config?: NavigationConfig) {
    this.maps = new Map();
    this.sessions = new Map();
    this.eventListeners = new Map();
    this.config = {
      enableHistory: true,
      maxHistorySize: 100,
      sessionTimeout: 3600000, // 1 hour
      autoSave: true,
      ...config,
    };
  }

  /**
   * Register a navigation map
   */
  public registerMap(map: NavigationMap): void {
    this.maps.set(map.id, map);
  }

  /**
   * Get a navigation map by ID
   */
  public getMap(mapId: string): NavigationMap | undefined {
    return this.maps.get(mapId);
  }

  /**
   * Create a new navigation session
   */
  public createSession(mapId: string, userId: string): NavigationSession {
    const map = this.maps.get(mapId);
    if (!map) {
      throw new Error(`Navigation map with ID ${mapId} not found`);
    }

    const sessionId = `${mapId}_${userId}_${Date.now()}`;
    const context: NavigationContext = {
      userId,
      currentNodeId: map.startNodeId,
      history: this.config.enableHistory ? [map.startNodeId] : [],
      data: {},
      startTime: new Date(),
      lastUpdateTime: new Date(),
    };

    const session: NavigationSession = {
      id: sessionId,
      mapId,
      context,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    this.emitEvent({
      type: NavigationEventType.SESSION_STARTED,
      sessionId,
      nodeId: map.startNodeId,
      timestamp: new Date(),
    });

    return session;
  }

  /**
   * Get active session for a user and map
   */
  public getActiveSession(userId: string, mapId?: string): NavigationSession | undefined {
    for (const session of this.sessions.values()) {
      if (
        session.context.userId === userId &&
        session.isActive &&
        (!mapId || session.mapId === mapId)
      ) {
        // Check if session has timed out
        const now = Date.now();
        const lastUpdate = session.updatedAt.getTime();
        if (now - lastUpdate > this.config.sessionTimeout!) {
          this.endSession(session.id);
          continue;
        }
        return session;
      }
    }
    return undefined;
  }

  /**
   * Get current node for a session
   */
  public getCurrentNode(sessionId: string): NavigationNode | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const map = this.maps.get(session.mapId);
    if (!map) return undefined;

    return map.nodes.get(session.context.currentNodeId);
  }

  /**
   * Navigate to a specific node
   */
  public navigateToNode(sessionId: string, nodeId: string): NavigationNode {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const map = this.maps.get(session.mapId);
    if (!map) {
      throw new Error(`Map ${session.mapId} not found`);
    }

    const node = map.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found in map ${map.id}`);
    }

    const previousNodeId = session.context.currentNodeId;

    // Emit exit event for previous node
    this.emitEvent({
      type: NavigationEventType.NODE_EXITED,
      sessionId,
      nodeId: previousNodeId,
      timestamp: new Date(),
    });

    // Update session
    session.context.currentNodeId = nodeId;
    session.context.lastUpdateTime = new Date();
    session.updatedAt = new Date();

    if (this.config.enableHistory) {
      session.context.history.push(nodeId);
      if (session.context.history.length > this.config.maxHistorySize!) {
        session.context.history.shift();
      }
    }

    // Emit enter event for new node
    this.emitEvent({
      type: NavigationEventType.NODE_ENTERED,
      sessionId,
      nodeId,
      timestamp: new Date(),
    });

    // End session if this is an end node
    if (node.type === 'end') {
      this.endSession(sessionId);
    }

    return node;
  }

  /**
   * Select an option and navigate
   */
  public selectOption(sessionId: string, optionId: string): NavigationNode {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const currentNode = this.getCurrentNode(sessionId);
    if (!currentNode) {
      throw new Error(`Current node not found`);
    }

    if (!currentNode.options) {
      throw new Error(`Current node ${currentNode.id} has no options`);
    }

    const option = currentNode.options.find((opt) => opt.id === optionId);
    if (!option) {
      throw new Error(`Option ${optionId} not found in node ${currentNode.id}`);
    }

    // Check condition if exists
    if (option.condition && !option.condition(session.context)) {
      throw new Error(`Condition not met for option ${optionId}`);
    }

    this.emitEvent({
      type: NavigationEventType.OPTION_SELECTED,
      sessionId,
      nodeId: currentNode.id,
      optionId,
      timestamp: new Date(),
    });

    return this.navigateToNode(sessionId, option.targetNodeId);
  }

  /**
   * Go back to previous node
   */
  public goBack(sessionId: string): NavigationNode | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!this.config.enableHistory || session.context.history.length < 2) {
      return undefined;
    }

    // Remove current node from history
    session.context.history.pop();
    // Get previous node
    const previousNodeId = session.context.history[session.context.history.length - 1];

    return this.navigateToNode(sessionId, previousNodeId);
  }

  /**
   * Find shortest path between two nodes (BFS)
   */
  public findPath(mapId: string, startNodeId: string, targetNodeId: string): NavigationPath | null {
    const map = this.maps.get(mapId);
    if (!map) {
      throw new Error(`Map ${mapId} not found`);
    }

    if (startNodeId === targetNodeId) {
      return {
        nodes: [startNodeId],
        distance: 0,
        estimatedSteps: 0,
      };
    }

    const queue: Array<{ nodeId: string; path: string[] }> = [
      { nodeId: startNodeId, path: [startNodeId] },
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentNode = map.nodes.get(current.nodeId);

      if (!currentNode) continue;

      if (current.nodeId === targetNodeId) {
        return {
          nodes: current.path,
          distance: current.path.length - 1,
          estimatedSteps: current.path.length - 1,
        };
      }

      if (visited.has(current.nodeId)) continue;
      visited.add(current.nodeId);

      if (currentNode.options) {
        for (const option of currentNode.options) {
          if (!visited.has(option.targetNodeId)) {
            queue.push({
              nodeId: option.targetNodeId,
              path: [...current.path, option.targetNodeId],
            });
          }
        }
      }
    }

    return null; // No path found
  }

  /**
   * Update session context data
   */
  public updateSessionData(sessionId: string, data: Record<string, any>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.context.data = { ...session.context.data, ...data };
    session.updatedAt = new Date();
  }

  /**
   * Get session context data
   */
  public getSessionData(sessionId: string): Record<string, any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return session.context.data;
  }

  /**
   * End a navigation session
   */
  public endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.updatedAt = new Date();

      this.emitEvent({
        type: NavigationEventType.SESSION_ENDED,
        sessionId,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Register event listener
   */
  public on(eventType: NavigationEventType, callback: (event: NavigationEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Emit navigation event
   */
  private emitEvent(event: NavigationEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach((callback) => callback(event));
    }
  }

  /**
   * Get all sessions for a user
   */
  public getUserSessions(userId: string): NavigationSession[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.context.userId === userId
    );
  }

  /**
   * Clear inactive sessions (cleanup)
   */
  public clearInactiveSessions(): number {
    let count = 0;
    const now = Date.now();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (!session.isActive || now - session.updatedAt.getTime() > this.config.sessionTimeout!) {
        this.sessions.delete(sessionId);
        count++;
      }
    }

    return count;
  }

  /**
   * Export map to JSON
   */
  public exportMap(mapId: string): string {
    const map = this.maps.get(mapId);
    if (!map) {
      throw new Error(`Map ${mapId} not found`);
    }

    const exportData = {
      id: map.id,
      name: map.name,
      description: map.description,
      startNodeId: map.startNodeId,
      nodes: Array.from(map.nodes.entries()).map(([id, node]) => ({ id, ...node })),
      metadata: map.metadata,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import map from JSON
   */
  public importMap(jsonData: string): NavigationMap {
    const data = JSON.parse(jsonData);
    const nodes = new Map<string, NavigationNode>();

    for (const node of data.nodes) {
      const { id, ...nodeData } = node;
      nodes.set(id, nodeData as NavigationNode);
    }

    const map: NavigationMap = {
      id: data.id,
      name: data.name,
      description: data.description,
      startNodeId: data.startNodeId,
      nodes,
      metadata: data.metadata,
    };

    this.registerMap(map);
    return map;
  }
}
