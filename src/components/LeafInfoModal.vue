<template>
  <!-- <ion-header>
    <ion-toolbar>
      <ion-title>Inline Modal</ion-title>
    </ion-toolbar>
  </ion-header> -->
  <ion-content class="ion-padding">
    <!-- <ion-button expand="block" @click="setOpen(true)">Open</ion-button> -->

    <ion-modal :is-open="isOpen" @didDismiss="onClose">
      <!-- <ion-header class="ion-no-border">
        <ion-toolbar>
         <ion-title><b>LeafSense.</b></ion-title>
          <ion-buttons slot="end">
            <ion-button @click="onClose">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header> -->
      <ion-fab slot="fixed" vertical="top" horizontal="end" class="back-button">
        <ion-button fill="clear"  color="light" size="large" @click="onClose">
          <ion-icon :icon="arrowBack" size="large"></ion-icon>
        </ion-button>
        </ion-fab>
      <ion-content class="ion-padding">
        <div class="leaf-container1">
          <div class="leaf-container">
            <ion-grid class="custom-grid">
              <ion-row>
                <ion-col>
                  <img src="/resources/jackfruit.png" alt="Leaf Image" class="leaf-image">
                </ion-col>
                <ion-col size="auto">
                  <div style="width: 170px">
                      <div class="leaf-info">
                          <h3 class="leaf-name" v-if="leaf"><b>{{ leaf.result }}</b></h3 >
                          <p class="leaf-scientific-name" v-if="leaf"> {{ leaf.scientific_name }}</p>
                      </div>
                  </div>
                </ion-col style="border: 2px solid red;">
              </ion-row style="border: 2px solid red;">
            </ion-grid>

            <!-- Leaf results -->
            <div>
              <div v-if="leaf" class="result">
                  <p><b>Description: </b> {{ leaf.description }}</p>
                  <p><b>Habitat: </b> {{ leaf.habitat }}</p>
                </div>    
                <div v-else>
                  <p>Loading data...</p>
                </div>
          </div>
                  <!-- save button -->
              <!-- <div class="button-container">
                  <ion-button class="save">Save</ion-button>
              </div> -->
          </div>

      </div>
      </ion-content>
    </ion-modal>
  </ion-content>
</template>

<script lang="ts" setup>
  import { IonButtons, IonButton, IonModal, IonFab, IonHeader, IonToolbar, IonContent, IonTitle } from '@ionic/vue';
  import { watch, ref } from 'vue';
  import { defineProps } from 'vue';
import axios from 'axios';
import { arrowBack } from 'ionicons/icons';
  
// Define props
const props = defineProps<{
  isOpen: boolean;
  onClose: () => void; // Explicitly define the type
  imageSrc?: string; // Optional string type for image source
  leaf: any;
}>();

// Define Leaf interface and reactive state
interface LeafInfo {
  name: string;
  scientificName: string;
  description: string;
  familyName: string;
  habitat: string;
}

interface Leaf {
  id: number;
  leafInfo: LeafInfo;
}

const leaf = ref(props.leaf);

// const leaf = ref<Leaf | null>(null); // Leaf data object
// const leafId = 3; // Example ID for fetching a specific leaf

// Watch for isOpen prop changes
// watch(
// () => props.isOpen,
// (newIsOpen) => {
//   if (newIsOpen) {
//     // Only fetch data when modal is opened
//     fetchLeafData();
//   } else {
//     // Clear data when modal is closed
//     leaf.value = null;
//   }
// }
// );

watch(
  () => props.leaf,
  (newLeaf) => {
    leaf.value = newLeaf;
  }
);

// Function to fetch data
// const fetchLeafData = () => {
// axios.get('/data.json')
//   .then(response => {
//     leaf.value = response.data.find((leaf: Leaf) => leaf.id === leafId) || null;
//   })
//   .catch(error => {
//     console.error('Error fetching leaf data:', error);
//   });
// };
</script>
<style scoped>

ion-content {
  --ion-background-color: transparent;
   background-color: rgb(65, 130, 61);
}

.button-container {
  display: flex;
  justify-content: center; /* Center the button horizontally */
  width: 100%; /* Full width of the container */
  position: fixed; /* Fix the position */
  bottom: 0; /* Position at the bottom */
  left: 0; /* Align to the left */
  padding: 5px; /* Optional padding for aesthetics */
}

.save {
  width: 100%; /* Full width of the container */
  max-width: 300px; /* Optional max width */
  height: 20px; /* Adjust the height as needed */
  --background: #416d3f;
  --ripple-color: rgb(64, 241, 44);
  --background-hover: #9ce0be;
}

.back-button {
    margin-left: 0px;
    --background-hover: #9ce0be;
    left: 0; /* Align to the left */
}


.leaf-name, .leaf-scientific-name {
    margin: 0; /* Remove default margin */
    padding: 2px 0; /* Add padding for spacing */
    text-align: left; 

}

.custom-grid {
    width: 100% ; /* Adjust the width as needed */
    height: 10%; /* Adjust the height as needed */
    position: absolute; /* Position the container absolutely */
    top: 0; /* Adjust the top position as needed */
}

ion-fab-button {
    --background: #416d3f;
    --box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.4), 0px 6px 12px 4px rgba(0, 0, 0, 0.3);
  }


.leaf-info {
    display: flex;
    flex-direction: column;
    text-align: left;
    margin-top: 25px;
}
.leaf-image {
    width: 250px; /* Adjust the width as needed */
    height: auto; /* Maintain aspect ratio */
    margin-right: 20px; /* Space between image and other content */
    position: absolute; /* Position the image absolutely */
    top: -120px; /* Adjust the top position as needed */
    left: -1px; /* Adjust the left position as needed */
    z-index: 10; /* Ensure the image is above other elements */
}

.image-container {
    position: absolute; /* Position the container absolutely */
    top: 0; /* Adjust the top position as needed */
    left: 0;
    width: 100%; /* Full width of the viewport */
    height: 45vh; /* 75% of the viewport height */
    background-color: rgb(233, 224, 224);
    display: flex; /* Center content */
    flex-direction: column; /* Stack child elements vertically */
    justify-content: center; /* Center vertically */
    align-items: center; /* Center horizontally */
    box-sizing: border-box; /* Include padding/border in the dimensions */
    border-bottom-right-radius: 50px;
    border-bottom-left-radius: 50px;
    overflow: hidden;
    padding-left: 20px;
    text-align: left; /* Align text to the left */
    align-items: flex-start; /* Align items to the start (left) */ 
}


/* Add your styles here */
.leaf-container {
    position: absolute; /* Position the container absolutely */
    top: 30%; /* Adjust the top position as needed */
    left: 0;
    width: 100%; /* Full width of the viewport */
    height: 80vh; /* 75% of the viewport height */
    background-color: #e5e8e0;
    display: flex; /* Center content */
    flex-direction: column; /* Stack child elements vertically */
    justify-content: center; /* Center vertically */
    align-items: center; /* Center horizontally */
    box-sizing: border-box; /* Include padding/border in the dimensions */
    padding: 20px; /* Optional padding for aesthetics */
    border-top-right-radius: 95px;

  }
</style>