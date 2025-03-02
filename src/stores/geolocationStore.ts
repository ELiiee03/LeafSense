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
import { defineStore } from 'pinia';
import { getCurrentPosition, geocodeLocation } from '@/services/geolocationService';

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  isPinned: boolean;
}

export const useGeoStore = defineStore('geolocation', {
  state: () => ({
    currentLocation: null as LocationData | null,
    pinnedLocations: [] as LocationData[],
    showPins: true
  }),
  actions: {
    async setCurrentLocation() {
      try {
        const coordinates = await getCurrentPosition();
        const address = await geocodeLocation(coordinates.lat, coordinates.lng);
        
        this.currentLocation = {
          lat: coordinates.lat,
          lng: coordinates.lng,
          address,
          isPinned: false
        };
      } catch (error) {
        console.error('Error updating location:', error);
        throw error; // Re-throw for component handling
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
    }
  }
});