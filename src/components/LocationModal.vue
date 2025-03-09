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
          </ion-item>
          <ion-item>
            <div class="location-details">
              <h3>{{ geoStore.currentLocation?.address }}</h3>
              <p>Latitude: {{ geoStore.currentLocation?.lat.toFixed(4) }}</p>
              <p>Longitude: {{ geoStore.currentLocation?.lng.toFixed(4) }}</p>
              
              <!-- <ion-textarea
                label="Location Notes"
                :value="geoStore.currentLocation?.note"
                @ionInput="geoStore.updateNote($event.target.value)"
                placeholder="Add notes about this location"
              ></ion-textarea>
   -->
              <!-- <ion-button @click="geoStore.togglePin">
                {{ geoStore.currentLocation?.isPinned ? 'Unpin' : 'Pin' }}
              </ion-button> -->
            </div>

          </ion-item>
          <ion-item>
            <div class="map-container" ref="mapContainer"></div>
          </ion-item>
          <ion-list lines="none">
            <ion-item>
              <ion-label position="stacked">Location Title</ion-label>
              <ion-input v-model="locationTitle" placeholder="Enter a title for this location"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Note</ion-label>
              <ion-textarea v-model="locationNote" placeholder="Add notes about this location"></ion-textarea>
            </ion-item>
            <ion-item>
              <ion-label>Pin this location</ion-label>
              <ion-toggle v-model="isPinned" @ionChange="togglePin"></ion-toggle>
            </ion-item>
          </ion-list>
        </ion-list>
        <ion-button class="save-button ion-text-capitalize" @click="saveLocation">
          <ion-icon size="small" :icon="checkmarkSharp" />
          Save Location
        </ion-button>
      </ion-content>
    </ion-modal>
  </template>
  
  <script setup lang="ts">
import { IonModal, IonContent, IonList, IonItem, IonButton, IonInput, IonToggle, IonLabel, IonTextarea } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useGeoStore } from '@/stores/geolocationStore';
import { mapsLoader } from '@/services/googleMapsService'; // Import the shared loader
import { checkmarkSharp } from 'ionicons/icons';
import { inject } from 'vue';
import { toastController } from '@ionic/vue';

  
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
    isPinned.value = !isPinned.value;
    // Also update the geoStore directly
    if (geoStore.currentLocation) {
      geoStore.togglePin();
      console.log('Toggle pin in modal, new isPinned value:', geoStore.currentLocation.isPinned);
    }
  };

  const locationNote = ref('');
  const locationTitle = ref('');
  const isPinned = ref(false);

  const closeModal = () => {
    handleDismiss();
  };

  async function saveLocation() {
    try {
      // Force isPinned to true when saving
      isPinned.value = true;
      
      console.log('LocationModal - Saving location with isPinned:', isPinned.value);
      
      await geoStore.saveLocationData({
        note: locationNote.value,
        title: locationTitle.value,
        isPinned: true // Always set to true when saving from the modal
      });
      
      // Log the updated state after saving
      console.log('LocationModal - After saving, geoStore.currentLocation:', geoStore.currentLocation);
      
      // Show success toast
      const toast = await toastController.create({
        message: 'Location pinned successfully',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      
      // Close the modal
      closeModal();
    } catch (error) {
      console.error('Error saving location:', error);
      
      // Show error toast
      const toast = await toastController.create({
        message: 'Failed to pin location',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  // Initialize isPinned from geoStore when the component mounts
  watch(() => props.isOpen, (isOpen) => {
    if (isOpen && geoStore.currentLocation) {
      isPinned.value = geoStore.currentLocation.isPinned;
      locationNote.value = geoStore.currentLocation.note || '';
      locationTitle.value = geoStore.currentLocation.title || '';
    }
  });
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

  .save-button {
    --background: #93e9be;
    --border-color: #000;
    --border-style: solid;
    --border-radius: 15px;
    align-items: center;
    display: flex;
  }
  </style>