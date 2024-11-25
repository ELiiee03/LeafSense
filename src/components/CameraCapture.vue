<template>
  <!-- <GlobalHeader /> -->
  <ion-page>
  <ion-content class="ion-padding">
    <!-- <h4><b>LeafSense.</b></h4> -->
    <ion-grid>
      <ion-row>
        <ion-col></ion-col>
        <ion-col size="8">Tap Camera button to scan</ion-col>
        <ion-col></ion-col>
      </ion-row>
    </ion-grid>

    <!-- Camera button -->
    <ion-fab slot="fixed" vertical="bottom" horizontal="center" >
      <ion-fab-button class="pulse-animation" @click="takePhoto" >
        <!-- <ion-loading trigger="open-loading" message="Loading..." duration="3000" spinner="circles"></ion-loading> -->
        <ion-icon size="large" :icon="cameraReverse"></ion-icon>
      </ion-fab-button>
    </ion-fab>

    <!-- Model to display the image -->
    
    <ion-modal :is-open="isOpen"  @didDismiss="resetModal">
      <ion-header class="ion-no-border">
        <ion-toolbar>
          <ion-title><b>LeafSense.</b></ion-title>
          <ion-buttons slot="end">
            <ion-button @click="setOpen(false)"><ion-icon size="large" :icon="closeOutline" slot="start"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <!-- Content display -->
      <ion-content class="ion-padding">
        
        <!-- <ion-loading trigger="open-loading" message="Loading..." duration="3000" spinner="circles"></ion-loading> -->
        <!-- Display the captured image -->
        <!-- <div v-if="imageSrc">
          <img :src="imageSrc" alt="Captured image" style="width: 100%;" />
        </div> -->
        <div v-if="imageSrc">
          <img :src="imageSrc" alt="Captured image" style="width: 100%;" />
          
        </div>
        <div v-else>
          <p>No image captured</p>
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
          <!-- Geotagging slot -->
      <!-- <Geotagging :identifiedLeaf="leaf" /> -->
      <!-- <Geotagging @updateTaggedLocations="updateTaggedLocations" :identifiedLeaf="identifiedLeaf" /> -->
      <Geotagging v-if="leaf" @updateTaggedLocations="updateTaggedLocations" :identifiedLeaf="leaf" />
      <!-- <Pins :taggedLocations="taggedLocations" /> -->
      </ion-content>
    </ion-modal>

  </ion-content>
  </ion-page>
</template>


<script setup lang="ts">
  import { IonModal, IonButton, IonContent, IonHeader, IonTitle, IonFab,  IonToolbar, IonPage, IonGrid, IonRow, IonCol, IonFabButton, IonLoading} from '@ionic/vue';
  import { onMounted, ref } from 'vue';
  import { Camera, CameraResultType } from '@capacitor/camera';
  import { closeOutline, cameraReverse } from 'ionicons/icons';
// import { defineEmits } from 'vue';
  import axios from 'axios';
  import Geotagging from '@/components/Geotagging.vue';
  // import Pins from '@/components/Pins.vue';
  
// import { add } from 'ionicons/icons';

// Modal state
  const isOpen = ref(false);
  const imageSrc = ref('');
  const leaf = ref<Leaf | null>(null);
// const location = ref<{ latitude: number; longitude: number } | null>(null);
  
const fetchLeafData = async () => {
  const leafId = 3;
  try {
    const response = await axios.get('/data.json');
    leaf.value = response.data.find((leaf: Leaf) => leaf.id === leafId) || null;
  } catch (error) {
    console.error('Error fetching leaf data:', error);
  }
};

const setOpen = async (open: boolean) => {
  isOpen.value = open;
  if (open) {
    await fetchLeafData();
  }
};

  const resetModal = () => {
  isOpen.value = false;
  imageSrc.value = '';
  leaf.value = null;
};

  // const imageSrc = ref('');
  const takePhoto = async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
    });

    imageSrc.value = image.webPath || '';

    setOpen(true);

};


const taggedLocations = ref([]);

  const updateTaggedLocations = (newTaggedLocations: any) => {
    taggedLocations.value = newTaggedLocations;
  };

// Http requests
interface Leaf {
  id: number;
  name: string;
  scientificName: string;
  description: string;
  uses: string;
  habitat: string;
  medicinalValues: string;
}

onMounted(() => {
  // Initial fetch if needed
  fetchLeafData();
});


// Create a reactive reference with the correct type
// const leaf = ref<Leaf | null>(null); // Single Post object

// const leafId = 3;
// // const posts = ref([]);

// onMounted(() => {
//   setTimeout(() => {
//   axios.get('/data.json')
//     .then(response => {
//       leaf.value = response.data.find((leaf: Leaf) => leaf.id === leafId) || null;; // Store the response data in the reactive variable
//     })
//     .catch(error => {
//       console.error('Error fetching photos:', error);
//     });
//   }, 3000);
// });

</script>

<style>
  :root {
    /**
   * Setting the variables for DEMO purposes only.
   * Values will be set automatically when building an iOS or Android app.
   */
    --ion-safe-area-top: 20px;
    --ion-safe-area-bottom: 20px;
}
@keyframes pulse {
  0%, 100% {
    /**transform: scale(1);**/
    box-shadow: 0 0 30px rgba(0, 128, 0, 0.5);
  }
  50% {
    /**transform: scale(1.1);**/
    box-shadow: 0 0 50px rgba(0, 128, 0, 1);
  }
}
  
  .pulse-animation {
    animation: pulse 1.5s infinite;
    background-color: transparent; /* Ensure the background is transparent */
    border-radius: 50%; /* Ensure the button is circular */
  }
</style>

<style scoped>
  ion-fab {
    margin-top: var(--ion-safe-area-top, 0);
    margin-bottom: var(--ion-safe-area-bottom, 0);
  }
  ion-col {
    text-align: center;
  }
  ion-grid {
    margin-top: 75%;
  }
  ion-fab-button {
    --background: #034e28;
  }
</style>
