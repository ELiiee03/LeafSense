<template>
  <!-- <GlobalHeader /> -->
  <!-- <ion-page> -->
    <!-- <ion-content class="ion-padding"> -->
    <!-- <HomeContent /> -->

    <!-- <h4><b>LeafSense.</b></h4> -->
    <ion-grid>

      <!-- <ion-button expand="block" @click="navigateToHomeContent">Block</ion-button> -->
      <ion-row>
        <ion-col>      
          <!-- <HomeContent /> -->
        </ion-col>
        <ion-col></ion-col>
      </ion-row>
    </ion-grid>

    <!-- <HomeContent /> -->

    
    <!-- Camera button -->
    <ion-fab slot="fixed" vertical="bottom" horizontal="center">
      <ion-fab-button @click="takePhoto">
        <!-- <ion-icon size="large" :icon="aperture" /> -->
        <ion-icon src="/lastnajod.svg" name="scanner" class="scanner-icon"></ion-icon>
      </ion-fab-button>
    </ion-fab>

    <!-- Loading spinner overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <ion-spinner name="crescent" color="light"></ion-spinner>
      <p>Processing image...</p>
    </div>

    <!-- Model to display the image -->
    <ion-modal :is-open="isOpen">
      <!-- <ion-header class="ion-no-border transparent-header">
        <ion-toolbar  class="transparent-toolbar">
          <ion-title><b>LeafSense.</b></ion-title>
          <ion-buttons slot="end">
            <ion-button @click="setOpen(false)">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header> -->

      <!-- Content display -->
      <ion-content class="ion-padding">
        <ion-fab slot="fixed" vertical="top" horizontal="start">
          <ion-fab-button @click="setOpen(false)" size="small">
            <ion-icon :icon="chevronBackOutline" size="small"></ion-icon>
          </ion-fab-button>
          </ion-fab>

        <!-- Display the captured image -->

        <!-- <div v-if="imageSrc">
          <img :src="imageSrc" alt="Captured image" style="width: 100%;" />
        </div> -->
        <div v-if="imageSrc" class="image-container">
          <img :src="imageSrc" alt="Captured image" class="image" />
        </div>
        <div v-else>
          <p>No image captured</p>
        </div>
        
      <!-- inference result display -->
      <div v-if="inferenceResult?.leafInfo" class="result">
        <div class="leaf-info">
          <div class="leaf-text">
            <h2 class="leaf-name"><b>{{ inferenceResult?.leafInfo.name }}</b></h2>
            <p class="leaf-scientific-name"><i>{{ inferenceResult?.leafInfo.scientificName }}</i></p>
          </div>
          <ion-fab-button @click="navigateToLeafInfo" class="leaf-fab-button" size="small">
            <ion-icon size="small" :icon="arrowForwardOutline"></ion-icon>
          </ion-fab-button>
        </div>
        <!-- <h2><b>{{ leaf.name }}</b></h2>
        <p><b>Scientific Name: </b> {{ leaf.scientificName }}</p>
        <p><b>Description: </b> {{ leaf.description }}</p>
        <p><b>Uses: </b> {{ leaf.uses }}</p>
        <p><b>Habitat: </b> {{ leaf.habitat }}</p> -->
      </div>
      <div v-else>
        <p>Loading data...</p>
      </div>
      </ion-content>
    </ion-modal>

  <!-- </ion-content> -->
  <!-- </ion-page> -->
</template>


<script setup lang="ts">
  import { IonModal, IonButton, IonContent, IonHeader, IonTitle, IonFab, IonFabButton, IonToolbar, IonPage, IonGrid, IonRow, IonCol, toastController } from '@ionic/vue';
  import { onMounted, ref } from 'vue';
  import { Capacitor } from '@capacitor/core';
  import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
  import { aperture, arrowForwardOutline, chevronBackOutline } from 'ionicons/icons';
  import { Network } from '@capacitor/network';
  import { useRouter } from 'vue-router';
// import { defineEmits } from 'vue';
  // import axios from 'axios';
  import { inferenceService } from '@/services/inferenceService';
  import { useInferenceStore } from '@/stores/inferenceStores';
  // import { sqliteService } from '@/services/sqliteService'; // Import sqliteService
  

// Modal state
  const isOpen = ref(false);
  const imageSrc = ref('');
  const isLoading = ref(false);
  const router = useRouter();
  const inferenceStore = useInferenceStore();
  // const emit = defineEmits(['captureImage']);

// Add this helper function at the top of your script section
const showToast = async (message: string, isError: boolean = false) => {
  const toast = await toastController.create({
    message: message,
    duration: 3000,
    color: isError ? 'danger' : 'primary',
    position: 'bottom'
  });
  await toast.present();
};

  // Function to open or close the modal
  const setOpen = (open: boolean) => {
    isOpen.value = open;
};

// In script setup
interface InferenceResult {
  inference: {
    predictedClass: string;
    confidence: number;
  };
  leafInfo: {
    name: string;
    scientificName: string;
    familyName: string;
    description: string;
    habitat: string;
    color: any;
    shape: any;
    margin: any;
    growthHabits: any;
    imageData: any;
    imageType: any;
  };
}

// Update the ref to use the new interface
const inferenceResult = ref<InferenceResult | null>(null);


// In the takePhoto function:
const takePhoto = async () => {
  try {
    const networkStatus = await Network.getStatus();
    
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: networkStatus.connected ? CameraResultType.DataUrl : CameraResultType.Uri,
      source: CameraSource.Prompt
    });

    // Show loading spinner AFTER photo is selected, before processing
    isLoading.value = true;

    let finalImagePath = '';
    if (networkStatus.connected) {
      imageSrc.value = image.dataUrl || '';
    } else {
      // Convert capacitor file URI to native path
      finalImagePath = Capacitor.convertFileSrc(image.path || '');
      imageSrc.value = finalImagePath;
    }

    // Use path instead of webPath for native operations
    const result = await inferenceService.performInference(
      networkStatus.connected ? image.dataUrl! : finalImagePath
    );
    
    // Ensure all required fields are present
    const completeResult = {
      ...result,
      leafInfo: {
        ...result.leafInfo,
        // Add missing properties with default values if they don't exist
        color: result.leafInfo && 'color' in (result.leafInfo as any) ? (result.leafInfo as any).color : '',
        shape: result.leafInfo && 'shape' in (result.leafInfo as any) ? (result.leafInfo as any).shape : '',
        margin: result.leafInfo && 'margin' in (result.leafInfo as any) ? (result.leafInfo as any).margin : '',
        growthHabits: result.leafInfo && 'growthHabits' in (result.leafInfo as any) ? (result.leafInfo as any).growthHabits : '',
        imageData: result.leafInfo && 'imageData' in (result.leafInfo as any) ? (result.leafInfo as any).imageData : null,
        imageType: result.leafInfo && 'imageType' in (result.leafInfo as any) ? (result.leafInfo as any).imageType : null
      }
    };
    
    inferenceStore.setInferenceResult(completeResult);
    inferenceResult.value = completeResult;
    
    // Hide loading spinner right before opening modal
    isLoading.value = false;
    setOpen(true);

  } catch (error) {
    console.error('Error:', error);
    showToast(`Error: ${error}`, true);
    isLoading.value = false;
  }
};

const navigateToLeafInfo = () => {
  setOpen(false);
  router.push({ name: 'leafinfo' });
};

const navigateToHomeContent = () => {
  setOpen(false);
  router.push({ name: 'homecontent' });
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

// // Create a reactive reference with the correct type
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
</style>

<style scoped>

.scanner-icon {
  width: 24px; /* Adjust the width as needed */
  height: 24px; /* Adjust the height as needed */
  color: white; /* Set the desired color */
}

.leaf-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.leaf-text {
  flex: 1;
}

.leaf-name, .leaf-scientific-name {
  margin: 0; /* Remove default margin */
  padding: 2px 0; /* Add padding for spacing */
  text-align: left; 
}
.leaf-name {
  margin-top: 1px;
  padding-top: 0px;
}
.arrow-icon {
  display: flex;
  margin: 0 10px; /* Adjust the spacing as needed */
  font-size: 24px; /* Adjust the size as needed */
}
.result > * {
  margin: 0px; /* Adjust the spacing as needed */
}

.result {
  position: absolute;
  top: 80%;
  left: 50%;
  width: 90%; /* Full width of the viewport */
  height: 13%;
  transform: translateX(-50%);
  z-index: 10; /* Ensure it is in front of the image */
  background-color: rgba(216, 232, 164, 0.841); /* Optional: semi-transparent background */
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.image-container {
  position: absolute; /* Position the container absolutely */
  top: 0%; /* Adjust the top position as needed */
  left: 0;
  width: 100vw; /* Full width of the viewport */
  height:   100vh; /* 75% of the viewport height */
  background-color: #fff;
  display: flex; /* Center content */
  flex-direction: column; /* Stack child elements vertically */
  justify-content: center; /* Center vertically */
  align-items: center; /* Center horizontally */
  box-sizing: border-box; /* Include padding/border in the dimensions */
  padding: 20px; /* Optional padding for aesthetics */
  overflow: hidden;
}

.image {
  position: absolute; /* Position the container absolutely */
  width: 100vw;
  height: 100%;
  object-fit: cover; /* Ensure the image covers the container without distortion */
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: white;
}

ion-content {
  --background: #99BC85;
}

  ion-fab {
    margin-top: 0px;
    margin-bottom: 0px;
  }
  ion-col {
    text-align: center;
  }
  ion-grid {
    margin-top: 0;
  }
  ion-fab-button {
    --background: #61a765;
    --box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.4), 0px 6px 12px 4px rgba(0, 0, 0, 0.3);
  }

</style>
