// import { defineStore } from 'pinia';
// import { getCurrentPosition, geocodeLocation } from '@/services/geolocationService';

// interface Location {
//   lat: number;
//   lng: number;
//   address?: string;
//   isPinned: boolean;
// }

// export const useGeoStore = defineStore('geolocation', {
//   state: () => ({
//     currentLocation: null as Location | null,
//     pinnedLocations: [] as Location[],
//     showPins: true
//   }),
//   actions: {
//     async updateLocation() {
//       try {
//         const coordinates = await getCurrentPosition();
//         this.currentLocation = {
//           ...coordinates,
//           isPinned: false
//         };
//         this.currentLocation.address = await geocodeLocation(coordinates.lat, coordinates.lng);
//       } catch (error) {
//         console.error('Error getting current position:', error);
//       }
//     },
//     togglePin() {
//       if (this.currentLocation) {
//         this.currentLocation.isPinned = !this.currentLocation.isPinned;
//         if (this.currentLocation.isPinned) {
//           this.pinnedLocations.push({ ...this.currentLocation });
//         } else {
//           this.pinnedLocations = this.pinnedLocations.filter(loc =>
//             loc.lat !== this.currentLocation?.lat ||
//             loc.lng !== this.currentLocation?.lng
//           );
//         }
//       }
//     }
//   }
// });
// stores/geolocationStore.ts
// stores/geolocationStore.ts
import { defineStore } from 'pinia';
import { Geolocation } from '@capacitor/geolocation';
import { geocodeLocation } from '@/services/geolocationService';

interface LocationData {
  lat: number;
  lng: number;
  note: string;
  isPinned: boolean;
  address?: string;
}

export const useGeoStore = defineStore('geolocation', {
  state: () => ({
    currentLocation: null as LocationData | null,
    pinnedLocations: [] as LocationData[],
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
    }
  }
});