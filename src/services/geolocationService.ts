// geolocationService.ts
import { Geolocation } from '@capacitor/geolocation';

export const requestPermissions = async () => {
  // First check current permissions
  const currentStatus = await Geolocation.checkPermissions();
  
  if (currentStatus.location === 'denied') {
    throw new Error('Location permission was permanently denied');
  }

  // Request permissions if not already granted
  const permission = await Geolocation.requestPermissions();
  
  if (permission.location !== 'granted') {
    throw new Error('Location permission denied');
  }
};

export const getCurrentPosition = async () => {
  // Check if location services are enabled
  const isEnabled = await Geolocation.checkPermissions().then(status => status.location === 'granted');
  
  if (!isEnabled) {
    throw new Error('Location services are not enabled');
  }

  // Get coordinates with accuracy validation
  const coordinates = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10000 // 10 seconds
  });

  if (coordinates.coords.accuracy > 100) { // 100 meters accuracy threshold
    throw new Error('Location accuracy too low');
  }

  return {
    lat: coordinates.coords.latitude,
    lng: coordinates.coords.longitude
  };
};

export const geocodeLocation = async (lat: number, lng: number) => {
  try {
    const geocoder = new google.maps.Geocoder();
    const response = await geocoder.geocode({ location: { lat, lng } });
    
    if (!response.results[0]) {
      throw new Error('No results found');
    }
    
    return response.results[0].formatted_address;
    
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode location');
  }
};