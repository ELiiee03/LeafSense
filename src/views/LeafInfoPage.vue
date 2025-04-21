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
                              <i>{{ leafData.leafInfo.scientificName.replace(/\s+/g, ' ') }}</i>
                            </p>
                            <div class="fam-name" v-if="leafData?.leafInfo">
                              <span class="label">Family Name:</span>
                              <span class="value">{{ leafData.leafInfo.familyName || 'No family name available' }}</span>
                            </div>
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
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { useInferenceStore } from '@/stores/inferenceStores';
import { useGeoStore } from '@/stores/geolocationStore';
import LocationModal from '@/components/LocationModal.vue';
import PlantDetails from '@/components/Plant details/PlantDetails.vue';
import { useLeafData } from '@/composables/useLeafData';
import { supabase } from '@/supabaseClient';
import { Network } from '@capacitor/network';

// State
const showModal = ref(false);
const geoStore = useGeoStore();
const leafImage = ref<string | null>(null);
const imageSrc = ref<string>('');
const router = useRouter();
const inferenceStore = useInferenceStore();
const leafData = computed(() => inferenceStore.result);
const leafDataService = useLeafData();

// Add reactive reference for UI network state 
const uiNetworkState = ref(true);

// Watch network status and sync when online
watch(() => leafDataService.isOnline.value, async (isOnline, previousState) => {
  if (isOnline) {
    try {
      console.log('Network is now online, syncing offline data...');
      // Add timeout to prevent hanging
      const syncPromise = leafDataService.syncOfflineData();
      await Promise.race([
        syncPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sync timeout')), 10000)
        )
      ]).catch(err => {
        console.error('Sync operation timed out or failed:', err);
      });
      
      // Double check we're still online after sync
      const currentStatus = await Network.getStatus().catch(() => ({ connected: false }));
      if (currentStatus.connected) {
        await showToast('Offline data synchronized successfully');
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }
  // Update the UI network state
  uiNetworkState.value = isOnline;
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
  
  // Define a more robust network status check function
  const checkAndUpdateNetworkStatus = async () => {
    try {
      const status = await Promise.race([
        Network.getStatus(),
        new Promise<{connected: false}>((_, reject) => 
          setTimeout(() => reject(new Error('Network status check timeout')), 2000)
        )
      ]).catch(() => ({ connected: false }));
      
      console.log(`Network status check: ${status.connected ? 'online' : 'offline'}`);
      uiNetworkState.value = status.connected;
      leafDataService.setOnlineStatus(status.connected);
      
      return status.connected;
    } catch (err) {
      console.error('Error checking network status:', err);
      // Default to current state if we can't check
      return uiNetworkState.value;
    }
  };
  
  // Check network status immediately
  checkAndUpdateNetworkStatus();
  
  // Set up network change listener with debouncing to avoid rapid changes
  let networkChangeTimeout: any = null;
  
  Network.addListener('networkStatusChange', status => {
    console.log('Network status changed:', status.connected ? 'online' : 'offline');
    
    // Clear any pending timeout
    if (networkChangeTimeout) {
      clearTimeout(networkChangeTimeout);
    }
    
    // Important: Immediately update UI for offline state to prevent hanging operations
    if (!status.connected) {
      // For offline transitions, update immediately without waiting
      uiNetworkState.value = false;
      leafDataService.setOnlineStatus(false);
      console.log('Network went offline, updated state immediately');
    }
    
    // For all network changes, still use debounce for complete state update
    networkChangeTimeout = setTimeout(async () => {
      // Double-check the current status to be sure
      const confirmedStatus = await checkAndUpdateNetworkStatus();
      
      // Only trigger sync if we're coming online
      if (confirmedStatus && !uiNetworkState.value) {
        try {
          console.log('Network confirmed as online, syncing offline data...');
          await leafDataService.syncOfflineData();
          await showToast('Offline data synchronized successfully');
        } catch (syncError) {
          console.error('Failed to sync offline data:', syncError);
        }
      }
      
      // Update UI state after confirmation
      uiNetworkState.value = confirmedStatus;
      leafDataService.setOnlineStatus(confirmedStatus);
    }, 500); // 500ms debounce
  });
});

// Clean up network listeners
onUnmounted(() => {
  Network.removeAllListeners();
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
  // Create a variable to store plant details that's accessible throughout the function
  let capturedPlantDetails = {};
  
  try {
    // Validate required data
    if (!leafData.value?.leafInfo || !leafData.value?.inference) {
      await showToast('Missing plant data', true);
      return;
    }

    console.log("Starting save process...");
    
    // Get the latest network status directly to ensure accuracy with a timeout
    // Add a timeout to the network status check to prevent hanging
    const networkStatus = await Promise.race([
      Network.getStatus(),
      new Promise<{connected: false}>((_, reject) => 
        setTimeout(() => reject(new Error('Network check timeout')), 1500)  // Reduced timeout
      )
    ]).catch(err => {
      console.warn('Network check timed out or failed, assuming offline:', err);
      return { connected: false };
    });
    
    console.log("Current network status:", networkStatus.connected ? "online" : "offline");
    
    // Update both UI and service network states
    uiNetworkState.value = networkStatus.connected;
    leafDataService.setOnlineStatus(networkStatus.connected);
    
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

    // Store plantDetails in the outer variable for later use
    capturedPlantDetails = plantDetails;
    
    // Prepare the data package once to reuse it if needed
    const dataPackage = {
      imageData: imageToSave,
      inferenceData,
      plantDetails
    };

    let result;
    
    // Always try offline save first to avoid network transition issues
    if (!networkStatus.connected) {
      // Directly use offline save if we know we're offline
      console.log("Network is offline, using direct offline save");
      result = await leafDataService.savePlantData(dataPackage, true); // Force offline mode
      saveSuccessful = true;
    } else {
      // For online mode, use a shorter timeout to prevent hanging
      try {
        console.log("Attempting online save with timeout protection");
        
        // Set a shorter timeout for online save to detect network issues quickly
        const savePromise = Promise.race([
          leafDataService.savePlantData(dataPackage, false), // try online
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Online save timeout')), 5000);
          })
        ]);
        
        // Wait for the save to complete
        result = await savePromise;
        console.log("Online save completed successfully:", result);
        saveSuccessful = true;
      } catch (error) {
        console.error("Online save failed:", error);
        
        // If it's a timeout or network error, try offline save immediately
        leafDataService.setOnlineStatus(false);
        uiNetworkState.value = false;
        
        console.log("Attempting fallback offline save");
        try {
          // Force offline mode for reliable saving
          result = await leafDataService.savePlantData(dataPackage, true);
          console.log("Offline save succeeded:", result);
          saveSuccessful = true;
          await showToast('Saved in offline mode', false);
        } catch (offlineError) {
          console.error("Even offline save failed:", offlineError);
          await showToast('Could not save data. Please try again.', true);
        }
      }
    }

    // Handle location data if needed (only if we have a result and were online)
    const pinnedLocation = geoStore.currentLocation;
    if (saveSuccessful && networkStatus.connected && pinnedLocation?.isPinned && Array.isArray(result) && result.length > 0) {
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

    if (!saveSuccessful) {
      await showToast('Leaf information could not be saved', true);
      return;
    }

    // Show appropriate message based on save state
    if (networkStatus.connected && !(result as any)?.offline) {
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
    
    // Final fallback - force offline save as last resort
    try {
      console.log('Emergency fallback - forcing offline save');
      
      const fallbackResult = await leafDataService.savePlantData({
        imageData: leafImage.value || '',
        inferenceData: {
          predictedClass: leafData.value?.inference.predictedClass || '',
          scientificName: leafData.value?.leafInfo.scientificName || '',
          familyName: leafData.value?.leafInfo.familyName || '',
          description: leafData.value?.leafInfo.description || '',
          habitat: leafData.value?.leafInfo.habitat || '',
          confidence: leafData.value?.inference.confidence || 0,
          growthHabits: leafData.value?.leafInfo.growthHabits || ''
        },
        plantDetails: capturedPlantDetails
      }, true); // Force offline mode
      
      if (fallbackResult) {
        saveSuccessful = true;
        await showToast('Emergency offline save successful', false);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (saveSuccessful) {
          router.back();
        }
      }
    } catch (fallbackError) {
      console.error('Emergency fallback save also failed:', fallbackError);
      await showToast('Unable to save data. Please try again.', true);
    }
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
    margin-top: 60%;  /* Remove top margin */
    margin-left: 0%;
    align-self: flex-end;
    z-index: 3;
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


.leaf-name, .leaf-scientific-name, .fam-name {
    margin: 0; /* Remove default margin */
    padding: 1px 0; /* Reduce padding from 2px to 1px */
    text-align: left; 
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8); 
}

.leaf-scientific-name {
    margin: 0;
    padding: 1px 0;
    text-align: left;
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    white-space: nowrap; /* Force to stay on one line */
    width: auto; /* Allow text to take its natural width */
    overflow: visible;
    text-overflow: clip;
}

.fam-name {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: nowrap;
    width: 100%;
}

.fam-name .label {
    margin-right: 5px;
    white-space: nowrap;
}

.fam-name .value {
    white-space: normal;
}

.custom-grid {
    width: 100%;
    height: auto;
    position: absolute;
    top: auto;  /* Remove fixed top position */
    bottom: 10px;  /* Position from bottom instead */
    z-index: 2;
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
    margin-top: 0;  /* Remove top margin */
    border: none;
    max-width: 100%;
    width: 100%;
    margin-left: 5px;
    z-index: 3;
    padding-bottom: 0;  /* Semi-transparent background */
    padding: 8px;  /* Add padding around text */
    border-radius: 5px;  /* Optional: rounded corners */
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