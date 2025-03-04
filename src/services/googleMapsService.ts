import { Loader } from '@googlemaps/js-api-loader';

// Create a singleton loader instance
export const mapsLoader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAyCfmaKiT3XE3s_PBVRKe8qNzNtfXJLbA', // Fallback to hardcoded key if env var not available
  version: 'weekly',
  libraries: ['places', 'geometry']
});