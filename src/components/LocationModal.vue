<!-- LocationModal.vue -->
<template>
    <ion-modal 
      class="modalSheet" 
      :is-open="isOpen" 
      :initial-breakpoint="0.25" 
      :breakpoints="[0, 0.25, 0.5, 0.75]"
      @didDismiss="$emit('did-dismiss')"
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
            <div v-if="geoStore.currentLocation">
              <h3>Detected Location</h3>
              <p>Latitude: {{ geoStore.currentLocation.lat }}</p>
              <p>Longitude: {{ geoStore.currentLocation.lng }}</p>
              <ion-button @click="togglePin">
                {{ geoStore.currentLocation.isPinned ? 'Unpin' : 'Pin' }} Location
              </ion-button>
            </div>
            <div v-else>
              <p>Loading data...</p>
            </div>
          </ion-item>
          <ion-item>

          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>
  </template>
  
  <script setup lang="ts">
import { IonModal, IonContent, IonList, IonItem, IonButton } from '@ionic/vue';
import { ref, watch } from 'vue';
  import { useGeoStore } from '@/stores/geolocationStore';
  
  const geoStore = useGeoStore();
//   defineProps({
//     isOpen: Boolean
//   });
  const props = defineProps({
  isOpen: Boolean,
  initialNote: String
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
  </style>