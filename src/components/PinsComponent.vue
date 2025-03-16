<template>
  <div class="map-container">
    <div ref="mapRef" class="map">
      <!-- Map container -->
    </div>
    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-overlay">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Loading pins...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { IonSpinner } from '@ionic/vue';
import { useGeoStore } from '@/stores/geolocationStore';
import { mapsLoader } from '@/services/googleMapsService';

const geoStore = useGeoStore();
const mapRef = ref<HTMLElement>();
let map: google.maps.Map;
let infoWindow: google.maps.InfoWindow;
let markers: google.maps.Marker[] = [];
const isLoading = computed(() => geoStore.isLoading);

// Function to clear existing markers
function clearMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
}

// Function to add markers for the pins
function addPinMarkers() {
  clearMarkers();
  
  console.log('Adding markers for pins:', geoStore.pinnedLocations);
  
  geoStore.pinnedLocations.forEach(pin => {
    if (pin && pin.lat && pin.lng) {
      const marker = new google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map,
        title: pin.title || 'Pinned Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
      });
      
      markers.push(marker);
      
      // Add click listener to marker to show InfoWindow
      marker.addListener('click', () => {
        infoWindow.setContent(`
          <div class="info-window">
            <h3>${pin.title || 'Pinned Leaf'}</h3>
            ${pin.note ? `<p><strong>Note:</strong> ${pin.note}</p>` : ''}
            <p><strong>Address:</strong> ${pin.address || 'Not available'}</p>
            <p><strong>Coordinates:</strong> ${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}</p>
          </div>
        `);
        infoWindow.open(map, marker);
      });
    }
  });
}

onMounted(async () => {
  try {
    // Initialize Google Maps
    await mapsLoader.load();
    console.log('Google Maps API loaded successfully');
    
    if (mapRef.value) {
      // Set default center for the Philippines
      const defaultCenter = { lat: 8.9475, lng: 125.5406 };
      console.log('Using default center:', defaultCenter);
      
      // Initialize the map with default center
      map = new google.maps.Map(mapRef.value, {
        center: defaultCenter,
        zoom: 8,
        mapTypeId: 'hybrid'
      });
      
      console.log('Map initialized');
      
      // Initialize InfoWindow
      infoWindow = new google.maps.InfoWindow();
      
      // Fetch pinned locations from Supabase
      await geoStore.fetchPinnedLocations();
      console.log('Pins after fetching:', geoStore.pinnedLocations);
      
      // Add markers for the fetched pins
      addPinMarkers();
      
      // Create bounds to fit all markers
      if (geoStore.pinnedLocations.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        let hasValidPins = false;
        
        // Add each pin to bounds
        geoStore.pinnedLocations.forEach(pin => {
          if (pin && pin.lat && pin.lng && !isNaN(pin.lat) && !isNaN(pin.lng)) {
            bounds.extend({ lat: pin.lat, lng: pin.lng });
            hasValidPins = true;
            console.log('Added pin to bounds:', pin.lat, pin.lng);
          }
        });
        
        // Add current location to bounds if available
        if (geoStore.currentLocation && 
            geoStore.currentLocation.lat && 
            geoStore.currentLocation.lng) {
          bounds.extend({ 
            lat: geoStore.currentLocation.lat, 
            lng: geoStore.currentLocation.lng 
          });
          hasValidPins = true;
          console.log('Added current location to bounds:', 
            geoStore.currentLocation.lat, 
            geoStore.currentLocation.lng);
        }
        
        // Fit the map to the bounds if we have valid pins
        if (hasValidPins) {
          map.fitBounds(bounds);
          
          // Zoom out slightly to give context
          setTimeout(() => {
            const currentZoom = map.getZoom();
            if (currentZoom !== undefined && currentZoom > 15) {
              map.setZoom(15);
            }
          }, 100);
          
          console.log('Fit map to bounds of all pins');
        } else {
          // If no valid pins, use default center
          map.setCenter(defaultCenter);
          console.log('No valid pins found, using default center');
        }
      } else {
        console.log('No pins found, using default center');
        map.setCenter(defaultCenter);
      }
      
      // Add current location marker if available
      if (geoStore.currentLocation) {
        const currentLocationMarker = new google.maps.Marker({
          position: { 
            lat: geoStore.currentLocation.lat, 
            lng: geoStore.currentLocation.lng 
          },
          map,
          title: 'Current Location',
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        });
        
        markers.push(currentLocationMarker);
        console.log('Added current location marker');
      }
      
      // Set up realtime subscription for updates
      const subscription = geoStore.subscribeToLocationUpdates();
      
      // Fix Google Maps rendering issues
      setTimeout(() => {
        google.maps.event.trigger(map, 'resize');
      }, 1000);
    } else {
      console.error('Map container not found');
    }
  } catch (error) {
    console.error('Error initializing map:', error);
  }
});

// Watch for changes to pinnedLocations and update markers
watch(() => geoStore.pinnedLocations, () => {
  if (map) {
    addPinMarkers();
  }
}, { deep: true });
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}

.map-container {
  height: 95vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
}

.map {
  height: 100%;
  width: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 10;
}

.info-window {
  padding: 8px;
  max-width: 300px;
}

.info-window h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #416d3f;
}
</style>
