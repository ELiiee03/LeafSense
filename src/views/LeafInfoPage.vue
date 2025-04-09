<template>
    <ion-page>
        <ion-content>

            <ion-fab slot="fixed" vertical="top" horizontal="start" class="back-button">
                <ion-button fill="clear"  color="light" size="large" @click="closePage">
                  <ion-icon :icon="arrowBack" size="large"></ion-icon>
                </ion-button>
                </ion-fab>
            <div class="leaf-container1">
              <div class="leaf-container">
                <img v-if="leafImage" :src="leafImage" alt="Leaf Image" class="leaf-image">
                <ion-grid class="custom-grid">
                  <ion-row>
                      <ion-col>
                          <!-- Display the leaf image -->
                          <div style="width: 170px">
                            <div class="leaf-info">
                              <h1 class="leaf-name" v-if="leafData?.leafInfo">
                                <b>{{ leafData.leafInfo.name }}</b>
                            </h1>
                            <p class="leaf-scientific-name" v-if="leafData?.leafInfo">
                              <i> {{ leafData.leafInfo.scientificName }}</i> 
                            </p>
                            </div>
                        </div>
                      </ion-col>
                      <ion-col size="auto">
                          <ion-chip v-if="inferenceStore.result?.inference?.confidence">{{ formatConfidence(inferenceStore.result.inference.confidence) }}% match</ion-chip>
                      </ion-col>
                  </ion-row>
              </ion-grid>

            </div>

          </div>

          <div class="plant-details-container">
            <PlantDetails v-if="leafData" :leaf-data="leafData" />
          </div>

          <!-- <ion-card class="card-container1">
            <ion-card-header>
              <ion-card-title>Description</ion-card-title>
              <ion-card-subtitle><b>Family Name: </b> {{ leafData?.leafInfo?.familyName || 'No family name available' }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              {{ leafData?.leafInfo?.description || 'No description available' }}
            </ion-card-content>
          </ion-card> -->

          <!-- <CharacteristicsCard /> -->


          <!-- <ion-card class="card-container3">
            <ion-card-header>
              <ion-card-title>Habitat</ion-card-title>
              <!-- <ion-card-subtitle>Card Subtitle</ion-card-subtitle> 
            </ion-card-header>
        
            <ion-card-content>
              {{ leafData?.leafInfo?.habitat || 'No habitat information available' }}
            </ion-card-content>
          </ion-card> -->


          <!-- <ion-card class="card-container3">
            <ion-card-header>
              <ion-card-title>Card Title</ion-card-title>
              <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
            </ion-card-header>
        
            <ion-card-content>
              Here's a small text description for the card content. Nothing more, nothing less.
            </ion-card-content>
          </ion-card> -->


             <!-- save button -->
            <div class="button-container">
                <ion-button class="save" :disabled="leafDataService.isSaving.value" @click="saveLeafInfo">
                  {{ leafDataService.isSaving.value ? 'Saving...' : 'Save' }}
                </ion-button>
                <ion-button class="pin" :disabled="leafDataService.isSaving.value" @click="handlePinClick">
                  <ion-icon size="medium" :icon="locationSharp"></ion-icon>
                </ion-button>
      
                <LocationModal 
                  :is-open="showModal" 
                  @did-dismiss="showModal = false"
                />
           </div>

        </ion-content>

    </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonCol, IonGrid, IonRow, toastController, IonChip, IonButton } from '@ionic/vue';
import { arrowBack, locationSharp } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { ref, onMounted, computed, watch } from 'vue';
import { useInferenceStore } from '@/stores/inferenceStores';
import { useGeoStore } from '@/stores/geolocationStore';
import LocationModal from '@/components/LocationModal.vue';
import PlantDetails from '@/components/Plant details/PlantDetails.vue';
import { useLeafData } from '@/composables/useLeafData';
import { supabase } from '@/supabaseClient';

// State
const showModal = ref(false);
const geoStore = useGeoStore();
const leafImage = ref<string | null>(null);
const imageSrc = ref<string>('');
const router = useRouter();
const inferenceStore = useInferenceStore();
const leafData = computed(() => inferenceStore.result);
const leafDataService = useLeafData();

// Watch network status and sync when online
watch(() => leafDataService.isOnline.value, async (isOnline) => {
  if (isOnline) {
    try {
      console.log('Network is now online, syncing offline data...');
      await leafDataService.syncOfflineData();
      await showToast('Offline data synchronized successfully');
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }
  updateLeafImage();
});

// Update leaf image
function updateLeafImage() {
  console.log('Updating leaf image with data:', leafData.value?.leafInfo);
  if (leafDataService.isOnline.value && leafData.value?.leafInfo?.imageData && leafData.value?.leafInfo?.imageType) {
    // Online mode with base64 image data
    leafImage.value = `data:image/${leafData.value.leafInfo.imageType};base64,${leafData.value.leafInfo.imageData}`;
    console.log('Using online image from server (base64)');
  } else if (leafData.value?.leafInfo?.imagePath) {
    // Using image path (works in both online and offline mode)
    const imagePath = leafData.value.leafInfo.imagePath;
    
    // Handle asset paths properly by checking path type
    if (imagePath.startsWith('assets/')) {
      // For images in the assets folder
      leafImage.value = `/${imagePath}`;
    } else if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      // For full URLs
      leafImage.value = imagePath;
    } else if (imagePath.startsWith('data:')) {
      // For data URLs
      leafImage.value = imagePath;
    } else {
      // For images in the public folder
      leafImage.value = `/${imagePath}`;
    }
    
    console.log('Using image from path:', leafImage.value);
  } else {
    leafImage.value = null;
    console.log('No image available');
  }
}

// Update leaf image when data changes
watch(() => leafData.value, () => {
  updateLeafImage();
}, { immediate: true });

// Lifecycle
onMounted(() => {
  updateLeafImage();
});

// Utility functions
const formatConfidence = (confidence: number) => {
    return (confidence * 100).toFixed(2);
};

// Navigation
function closePage() {
  router.back();
}

// Handle location operations
async function handlePinClick() {
  try {
    await geoStore.setCurrentLocation('');
    showModal.value = true;
  } catch (error) {
    console.error('Location error:', error);
    const message = error instanceof Error ? error.message : 'Location access required';
    showToast(message, true);
  }
}

// Toast notifications
async function showToast(message: string, isError = false) {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
    color: isError ? 'danger' : 'success',
    position: 'top'
  });
  await toast.present();
}

// Save plant data
async function saveLeafInfo() {
  let saveSuccessful = false;
  
  try {
    // Validate required data
    if (!leafData.value?.leafInfo || !leafData.value?.inference) {
      await showToast('Missing plant data', true);
      return;
    }

    console.log("Starting save process...");
    
    // Prepare image data - use leafImage directly to ensure we save what's displayed
    let imageToSave = '';
    if (leafImage.value) {
      imageToSave = leafImage.value; // Use the actual image shown in the UI
      console.log("Using leafImage.value for save");
    } else if (leafData.value.leafInfo?.imageData) {
      imageToSave = `data:image/${leafData.value.leafInfo.imageType || 'jpeg'};base64,${leafData.value.leafInfo.imageData}`;
      console.log("Using leafData.value.leafInfo.imageData for save");
    } else if (imageSrc.value) {
      imageToSave = imageSrc.value;
      console.log("Using imageSrc.value for save");
    }

    // Log image data being saved
    console.log('Saving image data:', imageToSave ? 'Image data available' : 'No image available');

    // Prepare inference data
    const inferenceData = {
      predictedClass: leafData.value.inference.predictedClass,
      scientificName: leafData.value.leafInfo.scientificName,
      familyName: leafData.value.leafInfo.familyName,
      description: leafData.value.leafInfo.description,
      habitat: leafData.value.leafInfo.habitat,
      confidence: leafData.value.inference.confidence,
      growthHabits: leafData.value.leafInfo.growthHabits
    };

    // Prepare plant details data
    const aliases = computed(() => {
      if (!leafData.value?.leafInfo?.aliases) return [];
      
      // If aliases is a string (from JSON), parse it
      if (typeof leafData.value.leafInfo.aliases === 'string') {
        try {
          return JSON.parse(leafData.value.leafInfo.aliases);
        } catch (e) {
          console.error('Error parsing aliases:', e);
          return [leafData.value.leafInfo.aliases]; // Return as single item if can't parse
        }
      }
      
      // If already an array, return it
      if (Array.isArray(leafData.value.leafInfo.aliases)) {
        return leafData.value.leafInfo.aliases;
      }
      
      // If single value, wrap in array
      return [leafData.value.leafInfo.aliases];
    });
      
    const plantDetails = {
      aliases: Array.isArray(aliases.value) ? aliases.value : [],
      color: leafData.value.leafInfo?.color ?? '',
      foliage: leafData.value.leafInfo?.foliage ?? '',
      bark: leafData.value.leafInfo?.bark ?? '',
      fruit: leafData.value.leafInfo?.fruit ?? '',
      crown: leafData.value.leafInfo?.crown ?? '',
      trunk: leafData.value.leafInfo?.trunk ?? '',
      leaves: leafData.value.leafInfo?.leaves ?? '',
      retention: leafData.value.leafInfo?.retention ?? '',
      texture: leafData.value.leafInfo?.texture ?? '',
      venation: leafData.value.leafInfo?.foliarVenation ?? '',
      behavior: leafData.value.leafInfo?.uniqueBehavior ?? '',
      edible_uses: leafData.value.leafInfo?.edibleUses ?? '',
      med_uses: leafData.value.leafInfo?.medicinalUses ?? '',
      timber_uses: leafData.value.leafInfo?.timberUses ?? '',
      other_uses: leafData.value.leafInfo?.otherUses ?? '',
      climate: leafData.value.leafInfo?.climate ?? '',
      lifespan: leafData.value.leafInfo?.lifespan ?? '',
      light_needs: leafData.value.leafInfo?.lightNeeds ?? '',
      water_needs: leafData.value.leafInfo?.waterNeeds ?? '',
      soil_req: leafData.value.leafInfo?.soilRequirements ?? ''
    };

    // Check network status before saving
    const isOnline = leafDataService.isOnline.value;
    console.log("Network status before save:", isOnline ? "Online" : "Offline");
    
    // Log the detailed plant data being saved - helpful for debugging
    console.log("Saving plant data:", {
      inferenceData: {
        ...inferenceData,
        confidence: inferenceData.confidence
      },
      plantDetailsFields: Object.keys(plantDetails).map(key => {
        // Use type assertion to fix TypeScript error with plantDetails[key]
        const value = plantDetails[key as keyof typeof plantDetails];
        return `${key}: ${value ? 'present' : 'empty'}`;
      }),
      imageAvailable: !!imageToSave
    });

    // Save the data
    const result = await leafDataService.savePlantData({
      imageData: imageToSave,
      inferenceData,
      plantDetails
    });

    console.log("Save result:", result);
    saveSuccessful = true;

    // Handle location data if needed (only in online mode)
    const pinnedLocation = geoStore.currentLocation;
    if (result && isOnline && pinnedLocation?.isPinned && Array.isArray(result) && result.length > 0) {
      try {
        const { error } = await supabase
          .from('pinned_locations')
          .insert({
            user_id: null,
            leaf_id: result[0].id,
            geom: `POINT(${pinnedLocation.lng} ${pinnedLocation.lat})`,
            title: pinnedLocation.title || '',
            note: pinnedLocation.note
          });

        if (error) {
          console.error('Error saving location:', error);
          await showToast('Leaf saved but location failed', true);
        }
      } catch (error) {
        console.error('Location save error:', error);
        await showToast('Leaf saved but location failed', true);
      }
    }

    // Show appropriate message based on network status
    if (isOnline) {
      await showToast('Leaf information saved successfully');
    } else {
      await showToast('Leaf information saved offline. Will sync when online.');
    }

    // Force UI update before navigating back - IMPORTANT: give toast time to display
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Only navigate back if save was successful
    if (saveSuccessful) {
      router.back();
    }
    
  } catch (error) {
    console.error('Error saving leaf info:', error);
    if (error instanceof Error) {
      await showToast(`Error: ${error.message}`, true);
    } else {
      await showToast('Error saving leaf information', true);
    }
    // Don't navigate back on error - let user see the error message
  }
}
</script>

<style scoped>

/* Remove the custom-grid1 class that was creating the overlay */
/* .custom-grid1 {
  width: 100%;
  height: 100%;
  position: absolute;
  margin-top: 70px;
  top: 30px;
  left: 0;
} */

.characteristics-card {
  background-color: #135d54;
  border: solid 1px #fff;
  color: #fff;
  text-align: left;
}

ion-chip {
  --background: #416d3f;
  --color: #fff;
  margin-top: 85%;
  margin-left: 0%;
  align-self: flex-end;
  z-index: 3; /* Above the gradient */
}

.card-container1 {
  margin-top: 20px;
  --background: #F8F8FF;
  border-radius: 15px;
}

.card-container2 {
  margin-top: 15px;
  --background: #fff;
  border-radius: 15px;
}

.card-container3 {
  margin-top: 15px;
  margin-bottom: 80px;
  --background: #F8F8FF;
  border-radius: 15px;
}
.card-container4 {
  margin-top: 15px;
  --background: #F8F8FF;
  border-radius: 15px;
}

.modalSheet {
  --background: #F8F8FF;
  --border-radius: 25px;
}

.button-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  padding: 10px;
  --background: #F8F8FF;
  backdrop-filter: blur(0px);
  z-index: 1000;
}

.save {
  width: 70%; /* Adjust the width as needed */
  max-width: 300px;
  margin-left: 8px;
  --background: #416d3f;
  --ripple-color: rgb(64, 241, 44);
  --background-hover: #9ce0be;
  --border-radius: 15px;
  --box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.4), 0px 6px 12px 4px rgba(0, 0, 0, 0.3);
}

.pin {
  width: 25%; /* Adjust the width as needed */
  max-width: 150px;
  height: 30px;
  color: #fff;
  margin-top: 5px;
  margin-right: 8px;
  --background: #416d3f;
  --ripple-color: rgb(64, 241, 44);
  --background-hover: #9ce0be;
  --border-radius: 15px;
  --box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.4), 0px 6px 12px 4px rgba(0, 0, 0, 0.3);
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
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8); 
}

.custom-grid {
    width: 100% ; /* Adjust the width as needed */
    height: 5%; /* Adjust the height as needed */
    position: absolute; /* Position the container absolutely */
    top: 110px; /* Adjust the top position as needed */
    bottom: 0; /* Position at bottom */
    z-index: 2; /* Position above the image */
    border: none;
}

ion-fab-button {
    --background: #416d3f;
    --box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.4), 0px 6px 12px 4px rgba(0, 0, 0, 0.3);
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
  }

  .ion-page {
    --ion-background-color: transparent;
    width: 100%;
    height: 100vh;
    --background: #E4EFE7;
    overflow: hidden;
  }

  ion-col {
    border: none;
  }

  
  ion-content {
    overflow: hidden;
  }

  .plant-details-container {
    margin-top: 38vh;
    padding: 0 10px;
  }
</style>