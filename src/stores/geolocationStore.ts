// stores/geolocationStore.ts
import { defineStore } from 'pinia';
import { Geolocation } from '@capacitor/geolocation';
import { geocodeLocation } from '@/services/geolocationService';
import { supabase } from '@/supabaseClient';

interface LocationData {
  lat: number;
  lng: number;
  note: string;
  isPinned: boolean;
  address?: string;
  title?: string;
  id?: string; // Add ID for database records
}

export const useGeoStore = defineStore('geolocation', {
  state: () => ({
    currentLocation: null as LocationData | null,
    pinnedLocations: [] as LocationData[],
    isLoading: false,
  }),
  actions: {
    async setCurrentLocation(note = '') {
      try {
        // First request permissions
        const permission = await Geolocation.requestPermissions();
        
        if (permission.location === 'denied') {
          throw new Error('Location permission was denied');
        }
        
        if (permission.location !== 'granted') {
          throw new Error('Location permission not granted');
        }

        // Then get the position
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });

        const address = await geocodeLocation(
          position.coords.latitude, 
          position.coords.longitude
        );

        this.currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          note,
          isPinned: false,
          address
        };

        return this.currentLocation;
      } catch (error) {
        console.error('Error setting location:', error);
        throw error;
      }
    },

    togglePin() {
      if (this.currentLocation) {
        this.currentLocation.isPinned = !this.currentLocation.isPinned;
        if (this.currentLocation.isPinned) {
          this.pinnedLocations.push({ ...this.currentLocation });
        } else {
          this.pinnedLocations = this.pinnedLocations.filter(loc => 
            loc.lat !== this.currentLocation?.lat || 
            loc.lng !== this.currentLocation?.lng
          );
        }
      }
    },

    updateNote(newNote: string) {
      if (this.currentLocation) {
        this.currentLocation.note = newNote;
      }
    },

    async saveLocationData(locationData: { note: string; title: string; isPinned: boolean }) {
      if (this.currentLocation) {
        console.log('In geolocationStore.saveLocationData with data:', locationData);
        
        // Ensure the currentLocation has all properties properly set
        this.currentLocation = {
          ...this.currentLocation,
          note: locationData.note,
          title: locationData.title,
          isPinned: locationData.isPinned
        };
        
        console.log('Updated currentLocation:', this.currentLocation);
        
        // If the location is pinned, add it to pinnedLocations and save to Supabase
        if (locationData.isPinned) {
          // Check if it already exists in pinnedLocations
          const existingIndex = this.pinnedLocations.findIndex(loc => 
            loc.lat === this.currentLocation?.lat && 
            loc.lng === this.currentLocation?.lng
          );
          
          if (existingIndex !== -1) {
            // Update existing entry
            this.pinnedLocations[existingIndex] = { ...this.currentLocation };
          } else {
            // Add new entry
            this.pinnedLocations.push({ ...this.currentLocation });
          }
          
          // Save to Supabase
          try {
            console.log('Saving pinned location to Supabase');
            
            const locationToSave = {
              user_id: null, // Update with actual user ID if available
              zgeom: `POINT(${this.currentLocation.lng} ${this.currentLocation.lat})`,
              title: this.currentLocation.title || '',
              note: this.currentLocation.note || '',
              address: this.currentLocation.address || ''
            };
            
            console.log('Data being sent to Supabase:', locationToSave);
            
            const { data, error } = await supabase
              .from('pinned_locations')
              .insert(locationToSave)
              .select();
              
            if (error) {
              console.error('Error saving location to Supabase:', error);
            } else {
              console.log('Location saved to Supabase successfully:', data);
            }
          } catch (error) {
            console.error('Exception when saving to Supabase:', error);
          }
        }
        
        return this.currentLocation;
      }
      
      throw new Error('No current location available');
    },

    // New function to fetch pinned locations from Supabase
    async fetchPinnedLocations() {
      try {
        this.isLoading = true;
        console.log('Fetching pinned locations from Supabase...');
        
        const { data, error } = await supabase
          .from('pinned_locations')
          .select('*');
        
        if (error) {
          console.error('Error fetching pinned locations:', error);
          throw error;
        }
        
        // Log the raw data
        console.log('Raw data from Supabase:', data);
        
        // Convert Supabase data to LocationData format
        const locations: LocationData[] = [];
        
        if (data && Array.isArray(data)) {
          for (const item of data) {
            console.log('Processing item:', item);
            
            // Extract lat/lng from the geometry column or use direct columns if available
            let lat, lng;
            
            // Try to extract from zgeom (PostGIS format)
            if (item.zgeom) {
              // Try different PostGIS formats
              
              // Format 1: POINT(lng lat)
              let match = item.zgeom.match(/POINT\(([^ ]+) ([^)]+)\)/);
              if (match) {
                lng = parseFloat(match[1]);
                lat = parseFloat(match[2]);
                console.log('Parsed coordinates from zgeom (format 1):', lat, lng);
              } 
              // Format 2: Other PostGIS formats like "0101000020E6100000..."
              else if (typeof item.zgeom === 'string' && item.zgeom.startsWith('01')) {
                console.log('Found PostGIS binary format, converting...');
                // We would need a proper PostGIS binary parser here
                // For now, look for alternative properties
              }
              // Format 3: Object format { type: 'Point', coordinates: [lng, lat] }
              else if (typeof item.zgeom === 'object' && item.zgeom?.type === 'Point') {
                try {
                  lng = item.zgeom.coordinates[0];
                  lat = item.zgeom.coordinates[1];
                  console.log('Parsed coordinates from zgeom object format:', lat, lng);
                } catch (e) {
                  console.warn('Failed to parse zgeom object:', e);
                }
              }
              else {
                console.warn('Unrecognized zgeom format:', item.zgeom);
              }
            }
            
            // Try geom as a fallback
            if ((!lat || !lng) && item.geom) {
              let match = item.geom.match(/POINT\(([^ ]+) ([^)]+)\)/);
              if (match) {
                lng = parseFloat(match[1]);
                lat = parseFloat(match[2]);
                console.log('Parsed coordinates from geom fallback:', lat, lng);
              }
              else if (typeof item.geom === 'object' && item.geom?.type === 'Point') {
                try {
                  lng = item.geom.coordinates[0];
                  lat = item.geom.coordinates[1];
                  console.log('Parsed coordinates from geom object format:', lat, lng);
                } catch (e) {
                  console.warn('Failed to parse geom object:', e);
                }
              }
            }
            
            // Try to extract from meta_data if available
            if ((!lat || !lng) && item.meta_data && typeof item.meta_data === 'object') {
              try {
                const metaData = item.meta_data;
                if (metaData.lat && metaData.lng) {
                  lat = parseFloat(metaData.lat);
                  lng = parseFloat(metaData.lng);
                  console.log('Parsed coordinates from meta_data:', lat, lng);
                }
              } catch (e) {
                console.warn('Failed to parse meta_data:', e);
              }
            }
            
            // Use direct lat/lng columns if available or if zgeom parsing failed
            if (!lat && item.lat) lat = parseFloat(item.lat);
            if (!lng && item.lng) lng = parseFloat(item.lng);
            
            // Only add the location if we have valid coordinates
            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
              locations.push({
                id: item.id || 'temp-id',
                lat: lat,
                lng: lng,
                note: item.note || '',
                title: item.title || '',
                isPinned: true,
                address: item.address || ''
              });
              
              console.log('Added location with coordinates:', lat, lng);
            } else {
              console.warn('Skipping item with invalid coordinates:', item);
            }
          }
          
          console.log('Added', locations.length, 'locations with actual coordinates');
        }
        
        this.pinnedLocations = locations;
        return locations;
      } catch (error) {
        console.error('Error in fetchPinnedLocations:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // Subscribe to realtime updates for pinned locations
    subscribeToLocationUpdates() {
      return supabase
        .channel('pinned_locations_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'pinned_locations' 
        }, (payload) => {
          console.log('Realtime update received:', payload);
          // Refresh the pins when data changes
          this.fetchPinnedLocations();
        })
        .subscribe();
    },

    // New function to fetch raw location data for debugging
    async debugFetchRawLocationData() {
      try {
        console.log('Fetching raw location data for debugging...');
        
        const { data, error } = await supabase
          .from('pinned_locations')
          .select('*');
        
        if (error) {
          console.error('Error fetching raw location data:', error);
          throw error;
        }
        
        console.log('Raw location data:', data);
        
        // Check if we have data
        if (!data || data.length === 0) {
          console.warn('No location data found in database');
          return [];
        }
        
        // Check what columns exist in the data
        const sampleItem = data[0];
        console.log('Sample item columns:', Object.keys(sampleItem));
        
        // Check specifically for geometry columns
        if (sampleItem.zgeom) {
          console.log('Found zgeom column:', sampleItem.zgeom);
        } else if (sampleItem.geom) {
          console.log('Found geom column:', sampleItem.geom);
        } else {
          console.warn('No geometry column found in data');
        }
        
        return data;
      } catch (error) {
        console.error('Error in debugFetchRawLocationData:', error);
        throw error;
      }
    }
  }
});