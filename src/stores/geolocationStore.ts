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
        
        // If the location is pinned, add it to pinnedLocations
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
            
            // Add hardcoded coordinates for testing if no valid ones found
            // You can remove this in production
            locations.push({
              id: item.id || 'temp-id',
              lat: 8.9475, // Hardcoded for testing
              lng: 125.5406, // Hardcoded for testing
              note: item.note || '',
              title: item.title || '',
              isPinned: true,
              address: item.address || ''
            });
            
            console.log('Added hardcoded location for testing');
          }
          
          console.log('Added', locations.length, 'locations with hardcoded coordinates for testing');
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
    }
  }
});