/**
 * Geographic Navigation Helper
 * Provides location-based navigation utilities
 */

import { GeoCoordinates, GeoRoute, PointOfInterest } from '../model/navigation';

export class GeoNavigationHelper {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @returns Distance in meters
   */
  public static calculateDistance(point1: GeoCoordinates, point2: GeoCoordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate bearing/heading from point1 to point2
   * @returns Bearing in degrees (0-360)
   */
  public static calculateBearing(point1: GeoCoordinates, point2: GeoCoordinates): number {
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    const bearing = ((θ * 180) / Math.PI + 360) % 360;

    return bearing;
  }

  /**
   * Get cardinal direction from bearing
   */
  public static getCardinalDirection(bearing: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  /**
   * Get full direction name from bearing
   */
  public static getDirectionName(bearing: number): string {
    const directions = [
      'Norte',
      'Nordeste',
      'Leste',
      'Sudeste',
      'Sul',
      'Sudoeste',
      'Oeste',
      'Noroeste',
    ];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  /**
   * Format distance for human reading
   */
  public static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} metros`;
    }
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  }

  /**
   * Estimate travel time
   * @param distance Distance in meters
   * @param speed Speed in km/h (default: walking speed 5 km/h)
   * @returns Time in seconds
   */
  public static estimateTravelTime(distance: number, speed: number = 5): number {
    const speedMetersPerSecond = (speed * 1000) / 3600;
    return distance / speedMetersPerSecond;
  }

  /**
   * Format duration for human reading
   */
  public static formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)} segundos`;
    }
    if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (minutes === 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hora${hours > 1 ? 's' : ''} e ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }

  /**
   * Create a simple route between two points
   */
  public static createRoute(
    origin: GeoCoordinates,
    destination: GeoCoordinates,
    waypoints?: GeoCoordinates[]
  ): GeoRoute {
    const points = [origin, ...(waypoints || []), destination];
    let totalDistance = 0;

    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += this.calculateDistance(points[i], points[i + 1]);
    }

    const duration = this.estimateTravelTime(totalDistance);
    const instructions = this.generateInstructions(points);

    return {
      origin,
      destination,
      waypoints,
      distance: totalDistance,
      duration,
      instructions,
    };
  }

  /**
   * Generate basic navigation instructions
   */
  private static generateInstructions(points: GeoCoordinates[]): string[] {
    const instructions: string[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const distance = this.calculateDistance(current, next);
      const bearing = this.calculateBearing(current, next);
      const direction = this.getDirectionName(bearing);

      if (i === 0) {
        instructions.push(`Siga em direção ${direction} por ${this.formatDistance(distance)}`);
      } else {
        instructions.push(`Continue ${direction} por ${this.formatDistance(distance)}`);
      }
    }

    instructions.push('Você chegou ao seu destino');
    return instructions;
  }

  /**
   * Find nearest point of interest
   */
  public static findNearestPOI(
    location: GeoCoordinates,
    pois: PointOfInterest[]
  ): PointOfInterest | null {
    if (pois.length === 0) return null;

    let nearest = pois[0];
    let minDistance = this.calculateDistance(location, pois[0].coordinates);

    for (let i = 1; i < pois.length; i++) {
      const distance = this.calculateDistance(location, pois[i].coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = pois[i];
      }
    }

    return nearest;
  }

  /**
   * Find points of interest within radius
   */
  public static findPOIsInRadius(
    location: GeoCoordinates,
    pois: PointOfInterest[],
    radiusMeters: number
  ): PointOfInterest[] {
    return pois.filter(
      (poi) => this.calculateDistance(location, poi.coordinates) <= radiusMeters
    );
  }

  /**
   * Check if a point is within a bounding box
   */
  public static isInBoundingBox(
    point: GeoCoordinates,
    northEast: GeoCoordinates,
    southWest: GeoCoordinates
  ): boolean {
    return (
      point.latitude <= northEast.latitude &&
      point.latitude >= southWest.latitude &&
      point.longitude <= northEast.longitude &&
      point.longitude >= southWest.longitude
    );
  }

  /**
   * Calculate center point of multiple coordinates
   */
  public static calculateCenter(points: GeoCoordinates[]): GeoCoordinates {
    if (points.length === 0) {
      throw new Error('Cannot calculate center of empty points array');
    }

    let x = 0;
    let y = 0;
    let z = 0;

    for (const point of points) {
      const lat = (point.latitude * Math.PI) / 180;
      const lon = (point.longitude * Math.PI) / 180;

      x += Math.cos(lat) * Math.cos(lon);
      y += Math.cos(lat) * Math.sin(lon);
      z += Math.sin(lat);
    }

    const total = points.length;
    x /= total;
    y /= total;
    z /= total;

    const lon = Math.atan2(y, x);
    const hyp = Math.sqrt(x * x + y * y);
    const lat = Math.atan2(z, hyp);

    return {
      latitude: (lat * 180) / Math.PI,
      longitude: (lon * 180) / Math.PI,
    };
  }

  /**
   * Generate Google Maps URL for navigation
   */
  public static generateGoogleMapsUrl(origin: GeoCoordinates, destination: GeoCoordinates): string {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}`;
  }

  /**
   * Generate WhatsApp location message format
   */
  public static formatLocationMessage(
    coords: GeoCoordinates,
    name?: string,
    address?: string
  ): string {
    let message = `📍 Localização\n`;
    if (name) message += `Nome: ${name}\n`;
    if (address) message += `Endereço: ${address}\n`;
    message += `Coordenadas: ${coords.latitude}, ${coords.longitude}\n`;
    message += `\nVer no mapa: ${this.generateGoogleMapsUrl(coords, coords)}`;
    return message;
  }

  /**
   * Parse coordinates from text
   */
  public static parseCoordinates(text: string): GeoCoordinates | null {
    // Try different formats: "lat,lon" or "lat, lon" or "lat lon"
    const patterns = [
      /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/,
      /lat:\s*(-?\d+\.?\d*).*lon:\s*(-?\d+\.?\d*)/i,
      /latitude:\s*(-?\d+\.?\d*).*longitude:\s*(-?\d+\.?\d*)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);

        // Validate coordinates
        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
          return { latitude: lat, longitude: lon };
        }
      }
    }

    return null;
  }
}
