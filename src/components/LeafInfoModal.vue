<template>
  <!-- <ion-header>
    <ion-toolbar>
      <ion-title>Inline Modal</ion-title>
    </ion-toolbar>
  </ion-header> -->
  <!-- <ion-content class="ion-padding"> -->
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
            <!-- Use image from Supabase if available, otherwise fallback to default -->
            <img 
              :src="leaf?.image|| '/resources/jackfruit.png'" 
              alt="Leaf Image" 
              class="leaf-image">
            <ion-grid class="custom-grid">
              <ion-row>
                <ion-col>
                  <div style="width: 170px">
                      <div class="leaf-info">
                          <h3 class="leaf-name" v-if="leaf"><b>{{ leaf.result }}</b></h3 >
                          <p class="leaf-scientific-name" v-if="leaf"> {{ leaf.scientific_name }}</p>
                      </div>
                  </div>
                </ion-col>
                <ion-col size="auto">

                </ion-col style="border: 2px solid red;">
              </ion-row style="border: 2px solid red;">
            </ion-grid>

            <!-- <div>
              <div v-if="leaf" class="result">
                  <p><b>Description: </b> {{  }}</p>
                  <p><b>Habitat: </b> {{ leaf.habitat }}</p>
                </div>    
                <div v-else>
                  <p>Loading data...</p>
                </div>
          </div> -->
                  <!-- save button -->
              <!-- <div class="button-container">
                  <ion-button class="save">Save</ion-button>
              </div> -->
          </div>
      </div>
      
            <!-- Leaf results -->
            <ion-card class="card-container1">
              <ion-card-header>
                <ion-card-title>Description</ion-card-title>
                <ion-card-subtitle v-if="leaf"><b>Family Name: </b> {{ leaf.familyName }}</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div v-if="leaf">
                {{ leaf.description }}
                </div>
                <div v-else>
                  <p>Loading data...</p>
                </div>
              </ion-card-content>
            </ion-card>

            <!-- Leaf Characteristics -->
            <ion-card class="card-container2">
              <ion-card-header>
                <ion-card-title>Characteristics</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div v-if="leaf">
                  <ion-grid class="characteristics-grid">
                    <ion-row>
                      <ion-col v-for="(char, index) in characteristics" :key="index" size="6">
                        <ion-card class="characteristic-card">
                          <div class="char-content">
                            <h3>{{ char.name }}</h3>
                            <p>{{ char.value }}</p>
                          </div>
                        </ion-card>
                      </ion-col>
                    </ion-row>
                  </ion-grid>
                </div>
                <div v-else>
                  <p>Loading characteristics...</p>
                </div>
              </ion-card-content>
            </ion-card>
            
          <ion-card class="card-container3">
            <ion-card-header>
              <ion-card-title>Habitat</ion-card-title>
              <!-- <ion-card-subtitle>Card Subtitle</ion-card-subtitle> -->
            </ion-card-header>
        
            <ion-card-content>
              <div v-if="leaf">
                {{ leaf.habitat || 'No habitat information available' }}
              </div>
              <div v-else>
                <p>Loading data...</p>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-grid>
            <ion-row>
              <ion-col></ion-col>
              <ion-col></ion-col>
              <ion-col></ion-col>
            </ion-row>
          </ion-grid>
      </ion-content>
    </ion-modal>
  <!-- </ion-content> -->
</template>

<script lang="ts" setup>
  import { IonButton, IonModal, IonFab, IonHeader, IonToolbar, IonContent, IonTitle, IonCol, IonGrid, IonRow, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle } from '@ionic/vue';
  import { watch, ref, computed } from 'vue';
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
  familyName?: string;
  habitat: string;
  color?: string;
  shape?: string;
  margin?: string;
  growthHabits?: string;
  image?: string;
}

interface Leaf {
  id: number;
  leafInfo: LeafInfo;
}

const leaf = ref(props.leaf);

// Computed properties for characteristics
const characteristics = computed(() => [
  { name: 'Color', value: leaf.value?.color || 'Not available' },
  { name: 'Shape', value: leaf.value?.shape || 'Not available' },
  { name: 'Margin', value: leaf.value?.margin || 'Not available' },
  { name: 'Growth Habits', value: leaf.value?.growth_habits || 'Not available' }
]);

// Save growth habits to the leaf object if they don't exist
watch(leaf, (newLeaf) => {
  if (newLeaf && !newLeaf.growthHabits) {
    // Try to extract growth habits from description or set a default
    const descriptionLower = (newLeaf.description || '').toLowerCase();
    let detectedHabit = 'Not specified';
    
    // Simple detection logic - can be made more sophisticated
    if (descriptionLower.includes('tree')) {
      detectedHabit = 'tree';
    } else if (descriptionLower.includes('shrub')) {
      detectedHabit = 'shrub';
    } else if (descriptionLower.includes('herb')) {
      detectedHabit = 'herb';
    } else if (descriptionLower.includes('grass')) {
      detectedHabit = 'grass';
    }
    
    // Add the growth habit to the leaf
    newLeaf.growthHabits = detectedHabit;
  }
}, { immediate: true, deep: true });

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
  --background: #f8faf5
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

/* Characteristics styles */
.card-container2 {
  margin-top: 15px;
  --background: #fff;
  border-radius: 15px;
}

.characteristics-grid {
  display: flex;
  justify-content: center;
}

.characteristic-card {
  padding: 10px;
  margin-top: 1px;
  margin-left: 1px;
  border-radius: 12px;
  width: 100%;
  text-align: left;
  background: #E6F4E6;
}

.char-content h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.char-content p {
  margin: 2px 0 0;
  font-size: 0.9rem;
  color: #666;
}

.leaf-name, .leaf-scientific-name {
    margin: 0; /* Remove default margin */
    padding: 2px 0; /* Add padding for spacing */
    text-align: left; 
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8); 
  border: none;
}

.custom-grid {
  width: 100% ; /* Adjust the width as needed */
  height: 5%; /* Adjust the height as needed */
  position: absolute; /* Position thde container absolutely */
  top: 110px; /* Adjust the top position as needed */
  bottom: 0; /* Position at bottom */
  z-index: 2; /* Position above the image */
  border: none;
}

ion-fab-button {
    --background: #416d3f;
    --box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.4), 0px 6px 12px 4px rgba(0, 0, 0, 0.3);
  }
  .card-container1 {
    margin-top: 85%;
    background: white;
    border-radius: 15px;
  }

  .card-container3 {
    margin-top: 15px;
    --background: #fff;
    border-radius: 15px;
  }


.leaf-info {
  display: flex;
  flex-direction: column;
  text-align: left;
  margin-top: 50px;
  border: none;
  max-width: 85%;
  margin-left: 5px;
  z-index: 3; 
  width: 100%;
}
.leaf-image {
  width: 100%; /* Full width of container */
  height: 100%; /* Full height of container */
  margin: 0; /* Remove margins */
  object-fit: cover; /* Ensure the image covers the area */
  border-radius: inherit; /* Match parent's border radius */
  border: none; /* Remove border or adjust as needed */
  position: absolute; /* Position absolutely within container */
  top: 0;
  left: 0;
  z-index: 1; /* Ensure image is above other content if needed */
  object-fit: cover;
}

.image-container {
  position: relative; /* Position the container absolutely */
  top: 0; /* Adjust the top position as needed */
  left: 0;
  width: 100%; /* Full width of the viewport */
  height: 45vh; /* 75% of the viewport height */
  background-color: rgb(252, 251, 251);
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
  top: 0%; /* Adjust the top position as needed */
  left: 0;
  width: 100%; /* Full width of the viewport */
  height: 35vh; /* 75% of the viewport height */
  display: flex; /* Center content */
  flex-direction: column; /* Stack child elements vertically */
  justify-content: center; /* Center vertically */
  align-items: center; /* Center horizontally */
  box-sizing: border-box; /* Include padding/border in the dimensions */
  padding: 15px; /* Optional padding for aesthetics */
  /*border-top-right-radius: 95px;*/
   border-bottom-right-radius: 30px;
   border-bottom-left-radius: 30px;
  --background-color: white;
  }
</style>