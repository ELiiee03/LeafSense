<template>
    <ion-modal 
      class="modalSheet" 
      :is-open="isOpen" 
      :initial-breakpoint="0.5" 
      :breakpoints="[0.25 , 0.5, 0.95]"
      @didDismiss="$emit('did-dismiss')"
      @ionModalDidPresent="initMap"
    >
      <ion-content class="ion-padding">
        <ion-list>
          <ion-item>
            <!-- <div v-if="geoStore.currentLocation">
              <h3>Detected Location</h3>
              <p>Latitude: {{ geoStore.currentLocation.lat }}</p>
              <p>Longitude: {{ geoStore.currentLocation.lng }}</p>
              <ion-button @click="togglePin">
                {{ geoStore.currentLocation.isPinned ? 'Unpin' : 'Pin' }} Location
              </ion-button>
            </div>
            <div v-else>
              <p>Loading data...</p>
            </div> -->
          </ion-item>
          <ion-item>
            <div class="location-details">
              <h3>{{ geoStore.currentLocation?.address }}</h3>
              <p>Latitude: {{ geoStore.currentLocation?.lat.toFixed(4) }}</p>
              <p>Longitude: {{ geoStore.currentLocation?.lng.toFixed(4) }}</p>
              
              <ion-textarea
                label="Location Notes"
                :value="geoStore.currentLocation?.note"
                @ionInput="geoStore.updateNote($event.target.value)"
                placeholder="Add notes about this location"
              ></ion-textarea>
  
              <ion-button @click="geoStore.togglePin">
                {{ geoStore.currentLocation?.isPinned ? 'Unpin' : 'Pin' }}
              </ion-button>
            </div>

          </ion-item>
          <ion-item>
            <div class="map-container" ref="mapContainer"></div>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>
  </template>
  
  <script setup lang="ts">
import { IonModal, IonContent, IonList, IonItem, IonButton } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useGeoStore } from '@/stores/geolocationStore';
  // import { Loader } from '@googlemaps/js-api-loader';
  import { mapsLoader } from '@/services/googleMapsService'; // Import the shared loader
  
  const geoStore = useGeoStore();
  const mapContainer = ref<HTMLElement>();
  let map: google.maps.Map | null = null;

  const props = defineProps({
  isOpen: Boolean,
  initialNote: String
  });

  // Initialize Google Maps loader
// const loader = new Loader({
//   apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, 
//   version: 'weekly',
//   libraries: ['places', 'geometry']
// });

async function initMap() {
  if (!mapContainer.value || !geoStore.currentLocation) return;

  try {
    await mapsLoader.load(); 

    // for customizations
    map = new google.maps.Map(mapContainer.value, {
      center: {
        lat: geoStore.currentLocation.lat,
        lng: geoStore.currentLocation.lng
      },
      zoom: 15,
      mapTypeId: 'hybrid',
      disableDefaultUI: true
    });

    new google.maps.Marker({
      map,
      position: {
        lat: geoStore.currentLocation.lat,
        lng: geoStore.currentLocation.lng
      },
      title: 'Selected Location'
    });

    // Add null check for map
    map?.addListener('bounds_changed', () => {
      if (map) {
        google.maps.event.trigger(map, 'resize');
      }
    });
    
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

// Clear map when modal closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen && map) {
    map.unbindAll();
    map = null;
  }
});

  
const emit = defineEmits(['update:note', 'did-dismiss']);
const localNote = ref(props.initialNote);

watch(() => props.initialNote, (newVal) => {
  localNote.value = newVal;
});

const handleNoteUpdate = () => {
  emit('update:note', localNote.value);
};

const handleDismiss = () => {
  handleNoteUpdate();
  emit('did-dismiss');
};
  
//   const emit = defineEmits(['did-dismiss']);
  
  const togglePin = () => {
    geoStore.togglePin();
  };
  </script>
  
  <style scoped>
  .modalSheet {
    --background: #fff;
    --border-radius: 25px;
  }

  .map-container {
    flex: 1;
    width: 100%;
    height: 250px;
    margin-top: 10px;
  }

  .map {
    width: 100%;
    height: 100%;
  }

  .modalSheet {
    --height: 100%;  /* Required for proper breakpoints */
  }
  </style>