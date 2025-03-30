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
    <!-- Error message -->
    <div v-if="isError && !isLoading" class="error-overlay">
      <ion-icon name="alert-circle" color="danger" size="large"></ion-icon>
      <p>Error loading pins: {{ error?.message || 'Unknown error' }}</p>
      <ion-button @click="refetch" size="small">Try Again</ion-button>
    </div>
    <!-- No pins message -->
    <div v-if="!isLoading && !isError && (!pinnedLocations || pinnedLocations.length === 0)" class="info-overlay">
      <ion-icon name="information-circle" size="large"></ion-icon>
      <p>No pinned locations found</p>
      <p class="hint">Pinned locations will appear here after you save them</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { IonSpinner, IonIcon, IonButton } from '@ionic/vue';
import { useGeoStore } from '@/stores/geolocationStore';
import { mapsLoader } from '@/services/googleMapsService';
import { usePinnedLocations, useRealtimeLocationUpdates, PinLocation } from '@/services/queryService';

// Keep the store for current location functionality
const geoStore = useGeoStore();

// Use TanStack Query for pinned locations
const { data: pinnedLocations, isLoading: pinsLoading, isError, error, refetch } = usePinnedLocations();
const { setupSubscription } = useRealtimeLocationUpdates();

const mapRef = ref<HTMLElement>();
let map: google.maps.Map;
let infoWindow: google.maps.InfoWindow;
let markers: google.maps.Marker[] = [];
let realtimeSubscription: any = null;

// A ref to force-stop the loading spinner after a timeout
const forceHideSpinner = ref(false);

// We can combine loading states if needed
const isLoading = computed(() => {
  // If force hide is true, always return false regardless of actual loading state
  if (forceHideSpinner.value) return false;
  
  const loading = pinsLoading.value || geoStore.isLoading;
  console.log('Loading state:', { pinsLoading: pinsLoading.value, storeLoading: geoStore.isLoading, combined: loading });
  return loading;
});

// Function to clear existing markers
function clearMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
}

// Function to add markers for the pins
function addPinMarkers() {
  clearMarkers();
  
  if (!pinnedLocations.value || pinnedLocations.value.length === 0) {
    console.warn('No pinned locations available to add markers for');
    return;
  }
  
  console.log('Adding markers for pins:', pinnedLocations.value);
  
  pinnedLocations.value.forEach((pin, index) => {
    if (pin && pin.lat && pin.lng && !isNaN(pin.lat) && !isNaN(pin.lng)) {
      console.log(`Creating marker ${index + 1} at position:`, pin.lat, pin.lng);
      
      const marker = new google.maps.Marker({
        position: { lat: pin.lat, lng: pin.lng },
        map,
        title: pin.title || (pin.leafInfo ? pin.leafInfo.name : 'Pinned Location'),
        animation: google.maps.Animation.DROP,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new google.maps.Size(40, 40)
        },
        optimized: true // Better performance for multiple markers
      });
      
      markers.push(marker);
      
      // Add click listener to marker to show InfoWindow
      marker.addListener('click', () => {
        // Create leaf info section if available
        let leafInfoSection = '';
        if (pin.leafInfo) {
          leafInfoSection = `
            <div class="leaf-info-section">
              <h4>Leaf Information</h4>
              <p><strong>Name:</strong> ${pin.leafInfo.name || 'Unknown'}</p>
              <p><strong>Scientific Name:</strong> ${pin.leafInfo.scientificName || 'Unknown'}</p>
              <p><strong>Family:</strong> ${pin.leafInfo.familyName || 'Unknown'}</p>
            </div>
          `;
        } else if (pin.leaf_id) {
          leafInfoSection = `
            <div class="leaf-info-section">
              <h4>Leaf Information</h4>
              <p><strong>Leaf ID:</strong> ${pin.leaf_id}</p>
              <p><em>Additional details not available</em></p>
            </div>
          `;
        }
        
        const content = `
          <div class="info-window">
            <h3>${pin.title || (pin.leafInfo ? pin.leafInfo.name : 'Pinned Leaf')}</h3>
            ${pin.note ? `<p><strong>Note:</strong> ${pin.note}</p>` : ''}
            <p><strong>Address:</strong> ${pin.address || 'Not available'}</p>
            <p><strong>Coordinates:</strong> ${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}</p>
            ${leafInfoSection}
          </div>
        `;
        
        console.log(`Opening info window for marker ${index + 1}`);
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });
    } else {
      console.warn(`Invalid pin data for index ${index}:`, pin);
    }
  });
  
  console.log(`Added ${markers.length} markers to the map`);
  
  // After adding markers, make sure the map is visible
  if (markers.length > 0) {
    // Make sure the map is fully rendered
    setTimeout(() => {
      google.maps.event.trigger(map, 'resize');
    }, 500);
  }
}

// Function to debug pins and display in console
function debugPins() {
  console.group('🌍 DEBUG: Pinned Locations');
  
  if (!pinnedLocations.value || pinnedLocations.value.length === 0) {
    console.log(`Total pins: 0`);
    console.warn('⚠️ No pins found');
  } else {
    console.log(`Total pins: ${pinnedLocations.value.length}`);
    
    pinnedLocations.value.forEach((pin, index) => {
      console.group(`📍 Pin #${index + 1}`);
      console.log(`Title: ${pin.title || 'Untitled'}`);
      console.log(`Coordinates: ${pin.lat}, ${pin.lng}`);
      console.log(`Address: ${pin.address || 'N/A'}`);
      console.log(`Note: ${pin.note || 'N/A'}`);
      console.log(`ID: ${pin.id || 'N/A'}`);
      console.groupEnd();
    });
  }
  
  console.groupEnd();
}

// Function to fit map to markers
function fitMapToPins() {
  if (!map || !pinnedLocations.value || pinnedLocations.value.length === 0) return;
  
  const bounds = new google.maps.LatLngBounds();
  let hasValidPins = false;
  
  // Add each pin to bounds
  pinnedLocations.value.forEach(pin => {
    if (pin && pin.lat && pin.lng && !isNaN(pin.lat) && !isNaN(pin.lng)) {
      bounds.extend({ lat: pin.lat, lng: pin.lng });
      hasValidPins = true;
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
  }
}

onMounted(async () => {
  // Create a global timeout to make sure the spinner always stops
  setTimeout(() => {
    if (isLoading.value) {
      console.warn('Global timeout reached, forcing spinner to hide');
      forceHideSpinner.value = true;
    }
  }, 15000); // 15 second global timeout
  
  try {
    // Set a safety timeout to prevent the spinner from getting stuck
    const loadingTimeout = setTimeout(() => {
      if (isLoading.value) {
        console.warn('Loading timeout reached, forcing spinner to hide');
        geoStore.isLoading = false;
        // Force a refetch with loading disabled
        refetch({ throwOnError: true, cancelRefetch: false });
      }
    }, 10000); // 10 seconds max loading time
    
    // Initialize Google Maps first, before data fetching
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
      infoWindow = new google.maps.InfoWindow({
        maxWidth: 350
      });
      
      // Force resize to prevent gray map
      google.maps.event.trigger(map, 'resize');
      
      // Clear the safety timeout since we've initialized successfully
      clearTimeout(loadingTimeout);
      
      // Set up realtime subscription for pinned locations
      realtimeSubscription = setupSubscription();
      
      // Add current location marker if available
      if (geoStore.currentLocation) {
        const currentLocationMarker = new google.maps.Marker({
          position: { 
            lat: geoStore.currentLocation.lat, 
            lng: geoStore.currentLocation.lng 
          },
          map,
          title: 'Current Location',
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          }
        });
        
        // Add click listener for current location
        currentLocationMarker.addListener('click', () => {
          infoWindow.setContent(`
            <div class="info-window">
              <h3>Current Location</h3>
              ${geoStore.currentLocation?.address ? `<p><strong>Address:</strong> ${geoStore.currentLocation.address}</p>` : ''}
              <p><strong>Coordinates:</strong> ${geoStore.currentLocation?.lat.toFixed(6)}, ${geoStore.currentLocation?.lng.toFixed(6)}</p>
            </div>
          `);
          infoWindow.open(map, currentLocationMarker);
        });
        
        markers.push(currentLocationMarker);
      }
      
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

// Clean up the subscription when the component unmounts
onUnmounted(() => {
  if (realtimeSubscription) {
    realtimeSubscription.unsubscribe();
  }
});

// Watch for changes to pinnedLocations from TanStack Query and update markers
watch(pinnedLocations, (newPins) => {
  console.log('pinnedLocations changed:', newPins);
  
  // Ensure loading state is reset
  if (geoStore.isLoading) {
    geoStore.isLoading = false;
  }
  
  if (map) {
    // Debug pins after data changes
    debugPins();
    
    // Add markers to map
    addPinMarkers();
    
    // Fit map to show all pins
    fitMapToPins();
    
    // Force map redraw in case it's stuck
    setTimeout(() => {
      google.maps.event.trigger(map, 'resize');
    }, 500);
  } else {
    console.warn('Map not initialized when pins changed');
  }
}, { immediate: true });

// Also watch for errors to make sure loading state gets reset
watch(isError, (hasError) => {
  if (hasError) {
    console.error('Error in pins query:', error.value);
    // Ensure loading state is reset on error
    if (geoStore.isLoading) {
      geoStore.isLoading = false;
    }
  }
});
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  --background: transparent;
}

.map-container {
  height: 95vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5; /* Light background in case map doesn't load */
  z-index: 1;
}

.map {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
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
  padding: 12px;
  max-width: 300px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.info-window h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: #416d3f;
  font-weight: bold;
  font-size: 18px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 5px;
}

.info-window h4 {
  margin: 12px 0 8px;
  color: #416d3f;
  font-weight: bold;
  font-size: 16px;
}

.info-window p {
  margin: 5px 0;
  font-size: 14px;
  line-height: 1.4;
}

.leaf-info-section {
  margin-top: 10px;
  padding-top: 5px;
  border-top: 1px dashed #eaeaea;
}

.error-overlay {
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

.info-overlay {
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

.info-overlay p {
  margin: 5px 0;
  font-size: 14px;
  line-height: 1.4;
}

.hint {
  font-size: 12px;
  color: #ccc;
}
</style>
