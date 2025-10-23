/**
 * Navigation Map System for Venom Bot
 * Provides conversational flow navigation and geographic navigation features
 */

/**
 * Geographic coordinates for location-based navigation
 */
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
}

/**
 * Navigation node in a conversational flow
 */
export interface NavigationNode {
  id: string;
  title: string;
  description?: string;
  type: 'menu' | 'message' | 'action' | 'location' | 'end';
  content?: string;
  options?: NavigationOption[];
  action?: string; // Action identifier for custom handlers
  metadata?: Record<string, any>;
}

/**
 * Navigation option/choice for a node
 */
export interface NavigationOption {
  id: string;
  label: string;
  targetNodeId: string;
  condition?: (context: NavigationContext) => boolean;
  metadata?: Record<string, any>;
}

/**
 * Navigation path between nodes
 */
export interface NavigationPath {
  nodes: string[];
  distance: number;
  estimatedSteps: number;
}

/**
 * Context for navigation sessions
 */
export interface NavigationContext {
  userId: string;
  currentNodeId: string;
  history: string[];
  data: Record<string, any>;
  startTime: Date;
  lastUpdateTime: Date;
}

/**
 * Navigation map definition
 */
export interface NavigationMap {
  id: string;
  name: string;
  description?: string;
  startNodeId: string;
  nodes: Map<string, NavigationNode>;
  metadata?: Record<string, any>;
}

/**
 * Geographic route with waypoints
 */
export interface GeoRoute {
  origin: GeoCoordinates;
  destination: GeoCoordinates;
  waypoints?: GeoCoordinates[];
  distance?: number; // in meters
  duration?: number; // in seconds
  instructions?: string[];
}

/**
 * Point of interest for geographic navigation
 */
export interface PointOfInterest {
  id: string;
  name: string;
  description?: string;
  coordinates: GeoCoordinates;
  category?: string;
  metadata?: Record<string, any>;
}

/**
 * Navigation session state
 */
export interface NavigationSession {
  id: string;
  mapId: string;
  context: NavigationContext;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Navigation event types
 */
export enum NavigationEventType {
  SESSION_STARTED = 'session_started',
  NODE_ENTERED = 'node_entered',
  NODE_EXITED = 'node_exited',
  OPTION_SELECTED = 'option_selected',
  SESSION_ENDED = 'session_ended',
  ERROR = 'error',
}

/**
 * Navigation event
 */
export interface NavigationEvent {
  type: NavigationEventType;
  sessionId: string;
  nodeId?: string;
  optionId?: string;
  timestamp: Date;
  data?: any;
}

/**
 * Configuration for navigation system
 */
export interface NavigationConfig {
  enableHistory?: boolean;
  maxHistorySize?: number;
  sessionTimeout?: number; // in milliseconds
  autoSave?: boolean;
}
