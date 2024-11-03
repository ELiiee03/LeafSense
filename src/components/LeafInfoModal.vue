<template>
    <!-- <ion-header>
      <ion-toolbar>
        <ion-title>Inline Modal</ion-title>
      </ion-toolbar>
    </ion-header> -->
    <ion-content class="ion-padding">
      <!-- <ion-button expand="block" @click="setOpen(true)">Open</ion-button> -->
  
      <ion-modal :is-open="isOpen" @didDismiss="onClose">
        <ion-header class="ion-no-border">
          <ion-toolbar>
            <ion-title><b>LeafSense.</b></ion-title>
            <ion-buttons slot="end">
              <ion-button @click="onClose">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <!-- Display the captured image if available -->
        <!-- Display the captured image if available -->
          <div>
            <img src="/resources/pine needle.jpg" alt="Leaf Image" style="width: 100%;" />
          </div>
     
         <!-- Iterate over the posts and display them -->
      <div v-if="leaf">
        <h2><b>{{ leaf.name }}</b></h2>
        <p><b>Scientific Name: </b> {{ leaf.scientificName }}</p>
        <p><b>Description: </b> {{ leaf.description }}</p>
        <p><b>Uses: </b> {{ leaf.uses }}</p>
        <p><b>Habitat: </b> {{ leaf.habitat }}</p>
      </div>
      <div v-else>
        <p>Loading data...</p>
      </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </template>
  
  <script lang="ts" setup>
    import { IonButtons, IonButton, IonModal, IonHeader, IonToolbar, IonContent, IonTitle } from '@ionic/vue';
    import { watch, ref } from 'vue';
    import { defineProps } from 'vue';
  import axios from 'axios';
    
// Define props
const props = defineProps({
  isOpen: Boolean,
  onClose: Function,
  imageSrc: String // Accept imageSrc as a prop to display the captured image
});

// Define Leaf interface and reactive state
interface Leaf {
  id: number;
  name: string;
  scientificName: string;
  description: string;
  uses: string;
  habitat: string;
}

const leaf = ref<Leaf | null>(null); // Leaf data object
const leafId = 3; // Example ID for fetching a specific leaf

// Watch for isOpen prop changes
watch(
  () => props.isOpen,
  (newIsOpen) => {
    if (newIsOpen) {
      // Only fetch data when modal is opened
      fetchLeafData();
    } else {
      // Clear data when modal is closed
      leaf.value = null;
    }
  }
);

// Function to fetch data
const fetchLeafData = () => {
  axios.get('/data.json')
    .then(response => {
      leaf.value = response.data.find((leaf: Leaf) => leaf.id === leafId) || null;
    })
    .catch(error => {
      console.error('Error fetching leaf data:', error);
    });
};
  </script>