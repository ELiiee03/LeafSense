<!-- <template>
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
 -->

 <template>
  <div class="map-container">
    <div ref="mapRef" class="map">
      <ion-button class="pin" @click="geoStore.showPins = !geoStore.showPins">
        {{ geoStore.showPins ? 'Hide Pins' : 'Show Pins' }}
      </ion-button>
    </div>
    <!-- <ion-button @click="geoStore.showPins = !geoStore.showPins">
      {{ geoStore.showPins ? 'Hide Pins' : 'Show Pins' }}
    </ion-button> -->
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
  try {
    await loader.load();
    console.log('Google Maps API loaded successfully');
    
    if (mapRef.value) {
      map = new google.maps.Map(mapRef.value, {
        center: geoStore.currentLocation || { lat: 0, lng: 0 },
        zoom: 12
      });
      console.log('Map initialized', map);

      setTimeout(() => {
        google.maps.event.trigger(map, 'resize');
      }, 3000);

      // Add current location marker
      if (geoStore.currentLocation) {
        new google.maps.Marker({
          position: geoStore.currentLocation,
          map,
          title: 'Current Location'
        });
        console.log('Current location marker added', geoStore.currentLocation);
      }

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
          console.log('Pinned location marker added', pin);

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
    } else {
      console.error('Map container not found');
    }
  } catch (error) {
    console.error('Error loading Google Maps API', error);
  }
});
</script>

<style>

html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}

.map-container {
  height: 100vh;
  width: 100vw;
  position: relative;
}

.map {
  height: 100%;
  width: 100%;
}

.pin {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
}
</style>
