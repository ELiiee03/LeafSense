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
            <ion-button @click="onClose">
              <ion-icon size="large" :icon="closeOutline" slot="start"></ion-icon>
            </ion-button>
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
      <p><b>Medicinal values: </b> {{ leaf.medicinalValues }}</p>
    </div>
    <div v-else>
      <p>Loading data...</p>
    </div>
    <!-- <Geotagging /> -->
     <!-- <Pins /> -->
      </ion-content>
    </ion-modal>
  </ion-content>
</template>

<script lang="ts" setup>
  import { IonIcon, IonButtons, IonButton, IonModal, IonHeader, IonToolbar, IonContent, IonTitle } from '@ionic/vue';
  import { watch, ref } from 'vue';
  import { defineProps, defineEmits } from 'vue';
  import axios from 'axios';
  import { closeOutline } from 'ionicons/icons';
  // import Pins from '@/components/Pins.vue';
  // import Geotagging from './Geotagging.vue';
// import Pins from './Pins.vue';
  
// Define props
const props = defineProps<{
  isOpen: boolean;
  onClose: () => void; // Explicitly define the type
  imageSrc?: string; // Optional string type for image source
  leaf?: {
    name: string;
    scientificName: string;
    description: string;
    uses: string;
    habitat: string;
    medicinalValues: string;
  };
}>();

// Define Leaf interface and reactive state
interface Leaf {
id: number;
name: string;
scientificName: string;
description: string;
uses: string;
habitat: string;
medicinalValues: string;
}

const emits = defineEmits(['updateTaggedLocations']);
const leaf = ref(props.leaf || null);

watch(
  () => props.isOpen,
  (newIsOpen) => {
    if (newIsOpen && !props.leaf) {
      fetchLeafData();
    } else {
      leaf.value = props.leaf || null;
    }
  }
);

const fetchLeafData = () => {
  axios.get('/data.json')
    .then(response => {
      leaf.value = response.data.find((leaf: any) => leaf.id === 3) || null;
    })
    .catch(error => {
      console.error('Error fetching leaf data:', error);
    });
};
</script>
<style scoped>

</style>