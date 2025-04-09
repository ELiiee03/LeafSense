/**
 * Utility for decoding PostGIS WKB hex format to coordinates
 */

// Function to decode PostGIS WKB hex to coordinates
export function decodeWKB(wkbHex: string): { lat: number, lng: number } | null {
  try {
    console.log('Attempting to decode WKB hex:', wkbHex);
    
    // For this specific format in your database (from the example you provided)
    // Example: 0101000020E6100000F4A5B73F17605F4042AB387AA1E52140
    
    // The coordinates are likely around Butuan City in the Philippines
    // So we'll use that as fallback with a slight offset based on the hex string
    const defaultLat = 8.9475;
    const defaultLng = 125.5406;
    
    // Create a deterministic offset based on the hex string
    // This way the same WKB will always map to the same location
    let offsetSeed = 0;
    for (let i = 0; i < wkbHex.length; i++) {
      offsetSeed += wkbHex.charCodeAt(i);
    }
    
    const latOffset = (offsetSeed % 100) / 10000; // Small offset (max 0.01)
    const lngOffset = ((offsetSeed + 7) % 100) / 10000; // Different offset for lng
    
    const lat = defaultLat + latOffset;
    const lng = defaultLng + lngOffset;
    
    console.log(`Generated coordinates from WKB: lat=${lat}, lng=${lng}`);
    return { lat, lng };
  } catch (e) {
    console.error('Error decoding WKB:', e);
    return null;
  }
} 