import { defineStore } from 'pinia';

interface Location {
  lat: number;
  lng: number;
  address?: string;
  isPinned: boolean;
}

export const useGeoStore = defineStore('geolocation', {
  state: () => ({
    currentLocation: null as Location | null,
    pinnedLocations: [] as Location[],
    showPins: true
  }),
  actions: {
    async updateLocation() {
      const coordinates = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      this.currentLocation = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
        isPinned: false
      };
      await this.geocodeLocation();
    },
    async geocodeLocation() {
      if (this.currentLocation) {
        const { results } = await new google.maps.Geocoder().geocode({
          location: this.currentLocation
        });
        this.currentLocation.address = results[0].formatted_address;
      }
    },
    togglePin() {
      if (this.currentLocation) {
        this.currentLocation.isPinned = !this.currentLocation.isPinned;
        if (this.currentLocation.isPinned) {
          this.pinnedLocations.push({...this.currentLocation});
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