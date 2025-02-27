<template>
    <div class="map-container">
      <div ref="mapRef" class="map"></div>
      <ion-button @click="geoStore.showPins = !geoStore.showPins">
        {{ geoStore.showPins ? 'Hide Pins' : 'Show Pins' }}
      </ion-button>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { useGeoStore } from '@/stores/geolocationStore';
  import { Loader } from '@googlemaps/js-api-loader';
  
  const geoStore = useGeoStore();
  const mapRef = ref<HTMLElement>();
  let map: google.maps.Map;
  let infoWindow: google.maps.InfoWindow;
  
  const loader = new Loader({
    apiKey: import.meta.env.VITE_GMAPS_API_KEY,
    version: 'weekly',
    libraries: ['places', 'geometry'] // Correct library names
  });
  
  onMounted(async () => {
    await loader.load();
    if (mapRef.value) {
      map = new google.maps.Map(mapRef.value, {
        center: geoStore.currentLocation || { lat: 0, lng: 0 },
        zoom: 12
      });
      
      // Add current location marker
      new google.maps.Marker({
        position: geoStore.currentLocation,
        map,
        title: 'Current Location'
      });

      // Initialize InfoWindow
    infoWindow = new google.maps.InfoWindow();
  
     
    // Watch for pinned locations changes
    watch(() => geoStore.pinnedLocations, (pins) => {
      pins.forEach(pin => {
        const marker = new google.maps.Marker({
          position: pin,
          map,
          title: 'Pinned Location',
          icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        });

        // Add click listener to marker to show InfoWindow
        marker.addListener('click', () => {
          infoWindow.setContent(`
            <div>
              <h3>Pinned Leaf</h3>
              <p>Latitude: ${pin.lat}</p>
              <p>Longitude: ${pin.lng}</p>
              <p>Address: ${pin.address}</p>
            </div>
          `);
          infoWindow.open(map, marker);
        });
      });
    }, { deep: true });
    }
  });
  </script>
  
  <style>
  .map-container {
    height: 400px;
    width: 100%;
  }
  
  .map {
    height: 120%;
    width: 100%;
  }
  </style>