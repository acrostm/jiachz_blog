/**
 * IP Geolocation service using ip-api.com (free service)
 * Provides location information for IP addresses
 */

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  countryCode: string;
  status: string;
}

export interface GeolocationResult {
  success: boolean;
  location: string;
  fullInfo?: LocationInfo;
}

class GeolocationService {
  private readonly apiUrl = "http://ip-api.com/json";

  /**
   * Get location information for an IP address
   */
  async getLocationByIP(ip: string): Promise<GeolocationResult> {
    try {
      // Handle local IPs
      if (ip === "127.0.0.1" || ip === "::1") {
        return {
          success: true,
          location: "本地环境",
        };
      }

      // Handle private IPs
      if (this.isPrivateIP(ip) || ip === "unknown") {
        return {
          success: true,
          location: "本地环境",
        };
      }

      const response = await fetch(`${this.apiUrl}/${ip}?lang=zh-CN`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as LocationInfo;

      if (data.status !== "success") {
        return {
          success: false,
          location: "未知位置",
        };
      }

      // Format location based on country and region
      const location = this.formatLocation(data);

      return {
        success: true,
        location,
        fullInfo: data,
      };
    } catch {
      return {
        success: false,
        location: "未知位置",
      };
    }
  }

  /**
   * Format location string based on country and region
   */
  private formatLocation(data: LocationInfo): string {
    const { country, region, countryCode } = data;

    // Handle China specifically - show province names
    if (countryCode === "CN") {
      return region || country;
    }

    // For other countries, show country name
    return country;
  }

  /**
   * Check if IP is private/local
   */
  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^::1$/,
      /^fc00:/,
    ];

    return privateRanges.some((range) => range.test(ip));
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService();

// Export class for custom instances
export { GeolocationService };

// Utility function for easy use
export async function getIPLocation(ip: string): Promise<string> {
  const result = await geolocationService.getLocationByIP(ip);
  return result.location;
}
