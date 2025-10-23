/**
 * Navigation Layer
 * Provides navigation features for WhatsApp bots
 * Integrates conversational flow navigation and geographic navigation
 */

import { Page, Browser } from 'puppeteer';
import { CreateConfig } from '../../config/create-config';
import { SenderLayer } from './sender.layer';
import { NavigationManager } from '../helpers/navigation-manager';
import { GeoNavigationHelper } from '../helpers/geo-navigation';
import {
  NavigationMap,
  NavigationNode,
  NavigationOption,
  NavigationSession,
  NavigationContext,
  NavigationPath,
  NavigationEventType,
  GeoCoordinates,
  GeoRoute,
  PointOfInterest,
} from '../model/navigation';

export class NavigationLayer extends SenderLayer {
  private navigationManager: NavigationManager;

  constructor(
    public browser: Browser,
    public page: Page,
    session?: string,
    options?: CreateConfig
  ) {
    super(browser, page, session, options);
    this.navigationManager = new NavigationManager();
  }

  /**
   * Create and register a new navigation map
   */
  public async createNavigationMap(
    id: string,
    name: string,
    startNodeId: string,
    description?: string
  ): Promise<NavigationMap> {
    const map: NavigationMap = {
      id,
      name,
      description,
      startNodeId,
      nodes: new Map(),
    };

    this.navigationManager.registerMap(map);
    return map;
  }

  /**
   * Add a node to a navigation map
   */
  public async addNavigationNode(
    mapId: string,
    node: NavigationNode
  ): Promise<void> {
    const map = this.navigationManager.getMap(mapId);
    if (!map) {
      throw new Error(`Navigation map ${mapId} not found`);
    }
    map.nodes.set(node.id, node);
  }

  /**
   * Start a navigation session for a user
   */
  public async startNavigationSession(
    chatId: string,
    mapId: string
  ): Promise<NavigationSession> {
    const session = this.navigationManager.createSession(mapId, chatId);

    // Send initial node content to user
    const currentNode = this.navigationManager.getCurrentNode(session.id);
    if (currentNode) {
      await this.sendNavigationNode(chatId, currentNode, session.id);
    }

    return session;
  }

  /**
   * Get active navigation session for a chat
   */
  public async getActiveNavigationSession(
    chatId: string,
    mapId?: string
  ): Promise<NavigationSession | undefined> {
    return this.navigationManager.getActiveSession(chatId, mapId);
  }

  /**
   * Handle user navigation input
   */
  public async handleNavigationInput(
    chatId: string,
    input: string
  ): Promise<NavigationNode | null> {
    const session = this.navigationManager.getActiveSession(chatId);
    if (!session) {
      return null;
    }

    const currentNode = this.navigationManager.getCurrentNode(session.id);
    if (!currentNode || !currentNode.options) {
      return null;
    }

    // Try to match input with option
    const option = currentNode.options.find(
      (opt) =>
        opt.id === input ||
        opt.label.toLowerCase() === input.toLowerCase() ||
        opt.id === input.trim()
    );

    if (option) {
      const nextNode = this.navigationManager.selectOption(session.id, option.id);
      await this.sendNavigationNode(chatId, nextNode, session.id);
      return nextNode;
    }

    return null;
  }

  /**
   * Send navigation node to user
   */
  private async sendNavigationNode(
    chatId: string,
    node: NavigationNode,
    sessionId: string
  ): Promise<void> {
    let message = '';

    if (node.title) {
      message += `*${node.title}*\n\n`;
    }

    if (node.content) {
      message += `${node.content}\n\n`;
    }

    // Handle different node types
    switch (node.type) {
      case 'menu':
        if (node.options && node.options.length > 0) {
          message += 'Escolha uma opção:\n';
          node.options.forEach((option, index) => {
            message += `${index + 1}. ${option.label}\n`;
          });
        }
        break;

      case 'end':
        message += '\n_Navegação finalizada_';
        break;
    }

    await this.sendText(chatId, message);

    // For menu nodes, also send as list menu if available
    if (node.type === 'menu' && node.options && node.options.length > 0) {
      try {
        const sections = [
          {
            title: node.title || 'Opções',
            rows: node.options.map((option, index) => ({
              rowId: option.id,
              title: option.label,
              description: option.metadata?.description || '',
            })),
          },
        ];

        await this.sendListMenu(
          chatId,
          node.title || 'Menu',
          node.content || 'Escolha uma opção',
          'Ver opções',
          sections
        );
      } catch (error) {
        // Fallback to text if list menu fails
        console.log('List menu not available, using text fallback');
      }
    }
  }

  /**
   * Navigate to specific node in session
   */
  public async navigateToNode(
    chatId: string,
    nodeId: string
  ): Promise<NavigationNode | null> {
    const session = this.navigationManager.getActiveSession(chatId);
    if (!session) {
      return null;
    }

    const node = this.navigationManager.navigateToNode(session.id, nodeId);
    await this.sendNavigationNode(chatId, node, session.id);
    return node;
  }

  /**
   * Go back to previous node
   */
  public async navigateBack(chatId: string): Promise<NavigationNode | null> {
    const session = this.navigationManager.getActiveSession(chatId);
    if (!session) {
      return null;
    }

    const node = this.navigationManager.goBack(session.id);
    if (node) {
      await this.sendNavigationNode(chatId, node, session.id);
    }
    return node;
  }

  /**
   * End navigation session
   */
  public async endNavigationSession(chatId: string): Promise<void> {
    const session = this.navigationManager.getActiveSession(chatId);
    if (session) {
      this.navigationManager.endSession(session.id);
      await this.sendText(chatId, 'Navegação finalizada. Obrigado!');
    }
  }

  /**
   * Get navigation path between two nodes
   */
  public async findNavigationPath(
    mapId: string,
    startNodeId: string,
    targetNodeId: string
  ): Promise<NavigationPath | null> {
    return this.navigationManager.findPath(mapId, startNodeId, targetNodeId);
  }

  /**
   * Update session data
   */
  public async updateNavigationData(
    chatId: string,
    data: Record<string, any>
  ): Promise<void> {
    const session = this.navigationManager.getActiveSession(chatId);
    if (session) {
      this.navigationManager.updateSessionData(session.id, data);
    }
  }

  /**
   * Get session data
   */
  public async getNavigationData(chatId: string): Promise<Record<string, any> | null> {
    const session = this.navigationManager.getActiveSession(chatId);
    if (!session) {
      return null;
    }
    return this.navigationManager.getSessionData(session.id);
  }

  /**
   * Register navigation event listener
   */
  public onNavigationEvent(
    eventType: NavigationEventType,
    callback: (event: any) => void
  ): void {
    this.navigationManager.on(eventType, callback);
  }

  // ============= GEOGRAPHIC NAVIGATION =============

  /**
   * Send location with navigation info
   */
  public async sendLocationWithNavigation(
    chatId: string,
    coords: GeoCoordinates,
    name?: string,
    address?: string
  ): Promise<void> {
    // Send location using WhatsApp location feature
    await this.sendLocation(
      chatId,
      coords.latitude.toString(),
      coords.longitude.toString(),
      name || 'Localização'
    );

    // Send formatted message with details
    const message = GeoNavigationHelper.formatLocationMessage(coords, name, address);
    await this.sendText(chatId, message);
  }

  /**
   * Send route directions
   */
  public async sendRouteDirections(
    chatId: string,
    route: GeoRoute
  ): Promise<void> {
    let message = '🗺️ *Direções de Navegação*\n\n';
    message += `📍 Origem: ${route.origin.latitude}, ${route.origin.longitude}\n`;
    message += `📍 Destino: ${route.destination.latitude}, ${route.destination.longitude}\n\n`;

    if (route.distance) {
      message += `📏 Distância: ${GeoNavigationHelper.formatDistance(route.distance)}\n`;
    }

    if (route.duration) {
      message += `⏱️ Tempo estimado: ${GeoNavigationHelper.formatDuration(route.duration)}\n\n`;
    }

    if (route.instructions && route.instructions.length > 0) {
      message += '*Instruções:*\n';
      route.instructions.forEach((instruction, index) => {
        message += `${index + 1}. ${instruction}\n`;
      });
    }

    // Add Google Maps link
    const mapsUrl = GeoNavigationHelper.generateGoogleMapsUrl(
      route.origin,
      route.destination
    );
    message += `\n🗺️ Abrir no Google Maps: ${mapsUrl}`;

    await this.sendText(chatId, message);
  }

  /**
   * Calculate and send distance between two locations
   */
  public async sendDistanceInfo(
    chatId: string,
    point1: GeoCoordinates,
    point2: GeoCoordinates,
    label1?: string,
    label2?: string
  ): Promise<void> {
    const distance = GeoNavigationHelper.calculateDistance(point1, point2);
    const bearing = GeoNavigationHelper.calculateBearing(point1, point2);
    const direction = GeoNavigationHelper.getDirectionName(bearing);
    const time = GeoNavigationHelper.estimateTravelTime(distance);

    let message = '📏 *Informações de Distância*\n\n';
    if (label1) message += `De: ${label1}\n`;
    if (label2) message += `Para: ${label2}\n\n`;

    message += `Distância: ${GeoNavigationHelper.formatDistance(distance)}\n`;
    message += `Direção: ${direction} (${Math.round(bearing)}°)\n`;
    message += `Tempo estimado (caminhando): ${GeoNavigationHelper.formatDuration(time)}`;

    await this.sendText(chatId, message);
  }

  /**
   * Find and send nearby points of interest
   */
  public async sendNearbyPOIs(
    chatId: string,
    location: GeoCoordinates,
    pois: PointOfInterest[],
    radiusMeters: number = 1000
  ): Promise<void> {
    const nearby = GeoNavigationHelper.findPOIsInRadius(location, pois, radiusMeters);

    if (nearby.length === 0) {
      await this.sendText(
        chatId,
        `Nenhum ponto de interesse encontrado em um raio de ${GeoNavigationHelper.formatDistance(radiusMeters)}`
      );
      return;
    }

    let message = `📍 *Pontos de Interesse Próximos*\n`;
    message += `Raio: ${GeoNavigationHelper.formatDistance(radiusMeters)}\n\n`;

    nearby.forEach((poi, index) => {
      const distance = GeoNavigationHelper.calculateDistance(location, poi.coordinates);
      message += `${index + 1}. *${poi.name}*\n`;
      if (poi.description) message += `   ${poi.description}\n`;
      if (poi.category) message += `   Categoria: ${poi.category}\n`;
      message += `   Distância: ${GeoNavigationHelper.formatDistance(distance)}\n\n`;
    });

    await this.sendText(chatId, message);
  }

  /**
   * Create and send a geographic route
   */
  public async createAndSendRoute(
    chatId: string,
    origin: GeoCoordinates,
    destination: GeoCoordinates,
    waypoints?: GeoCoordinates[]
  ): Promise<GeoRoute> {
    const route = GeoNavigationHelper.createRoute(origin, destination, waypoints);
    await this.sendRouteDirections(chatId, route);
    return route;
  }

  /**
   * Export navigation map
   */
  public async exportNavigationMap(mapId: string): Promise<string> {
    return this.navigationManager.exportMap(mapId);
  }

  /**
   * Import navigation map
   */
  public async importNavigationMap(jsonData: string): Promise<NavigationMap> {
    return this.navigationManager.importMap(jsonData);
  }

  /**
   * Get navigation manager (for advanced usage)
   */
  public getNavigationManager(): NavigationManager {
    return this.navigationManager;
  }
}
