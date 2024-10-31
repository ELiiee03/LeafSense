<template>
  <ion-header class="ion-no-border">
    <ion-toolbar>
      <ion-title><b>LeafSense.</b></ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-page>
  <ion-content class="ion-padding">
    <h4><b>LeafSense.</b></h4>
    <ion-grid>
      <ion-row>
        <ion-col></ion-col>
        <ion-col size="8">Tap Camera button to scan</ion-col>
        <ion-col></ion-col>
      </ion-row>
    </ion-grid>

    <!-- Camera button -->
    <ion-fab slot="fixed" vertical="bottom" horizontal="center">
      <ion-fab-button @click="takePhoto">
        <ion-icon src="/resources/camera-outline.svg" name="camera-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>

    <!-- Model to display the image -->
    <ion-modal :is-open="isOpen">
      <ion-header class="ion-no-border">
        <ion-toolbar>
          <ion-title><b>LeafSense.</b></ion-title>
          <ion-buttons slot="end">
            <ion-button @click="setOpen(false)">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <!-- Content display -->
      <ion-content class="ion-padding">
        <!-- Display the captured image -->
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
      </div>
      <div v-else>
        <p>Loading data...</p>
      </div>
      </ion-content>
    </ion-modal>

  </ion-content>
  </ion-page>
</template>


<script setup lang="ts">
  import { IonModal, IonButton, IonContent, IonHeader, IonTitle, IonFab,  IonToolbar, IonPage, IonGrid, IonRow, IonCol } from '@ionic/vue';
  import { onMounted, ref } from 'vue';
  import { Camera, CameraResultType } from '@capacitor/camera';
  import axios from 'axios';
  
// import { add } from 'ionicons/icons';

// Modal state
  const isOpen = ref(false);
  const imageSrc = ref('');

  // Function to open or close the modal
  const setOpen = (open: boolean) => {
    isOpen.value = open;
  };

  // const imageSrc = ref('');
  const takePhoto = async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
    });

    imageSrc.value = image.webPath || '';

      // Open the modal to display the captured image
    setOpen(true);
};
// Http requests
// Define the interface for a Post
interface Leaf {
  id: number;
  name: string;
  scientificName: string;
  description: string;
  uses: string;
  habitat: string;
}

// Create a reactive reference with the correct type
const leaf = ref<Leaf | null>(null); // Single Post object

const leafId = 3;
// const posts = ref([]);

onMounted(() => {
  setTimeout(() => {
  axios.get('/data.json')
    .then(response => {
      leaf.value = response.data.find((leaf: Leaf) => leaf.id === leafId) || null;; // Store the response data in the reactive variable
    })
    .catch(error => {
      console.error('Error fetching photos:', error);
    });
  }, 3000);
});

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
</style>
