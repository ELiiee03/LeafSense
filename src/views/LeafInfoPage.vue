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
                <ion-grid class="custom-grid">
                  <ion-row>
                      <ion-col>
                          <!-- <img src="/resources/jackfruit.png" alt="Leaf Image" class="leaf-image"> -->
                      </ion-col>
                      <ion-col size="auto">
                          <div style="width: 170px">
                              <div class="leaf-info">
                                <h3 class="leaf-name" v-if="leafData?.leafInfo">
                                  <b>{{ leafData.leafInfo.name }}</b>
                              </h3>
                              <p class="leaf-scientific-name" v-if="leafData?.leafInfo">
                                  {{ leafData.leafInfo.scientificName }}
                              </p>
                              </div>
                          </div>
                          <ion-chip v-if="inferenceStore.result?.inference?.confidence">{{ formatConfidence(inferenceStore.result.inference.confidence) }}% match</ion-chip>
                      </ion-col>
                  </ion-row>
              </ion-grid>
<!-- 
              <div>
                <div v-if="leafData" class="result">
                  <p><b>Description: </b> {{ leafData.leafInfo?.description || 'No description available' }}</p>
                  <p><b>Family Name: </b> {{ leafData.leafInfo?.familyName || 'No family name available' }}</p>
                  <p><b>Habitat: </b> {{ leafData.leafInfo?.habitat || 'No habitat information available' }}</p>
                  
                   Display confidence from either format
                  <p v-if="inferenceStore.result?.inference.confidence">
                    <b>Confidence:</b> {{ formatConfidence(inferenceStore.result.inference.confidence) }}%
                </p>
                </div>  
                <div v-else>
                    <p>Loading data...</p>
                </div>
            </div> -->

              </div>

             

          </div>
          <ion-card class="card-container1">
            <ion-card-header>
              <ion-card-title>Description</ion-card-title>
              <ion-card-subtitle><b>Family Name: </b> {{ leafData?.leafInfo?.familyName || 'No family name available' }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              {{ leafData?.leafInfo?.description || 'No description available' }}
            </ion-card-content>
          </ion-card>

          <ion-card class="card-container2">
            <ion-card-header>
              <ion-card-title>Characteristics</ion-card-title>
              <!-- <ion-card-subtitle>Card Subtitle</ion-card-subtitle> -->
            </ion-card-header>
        
            <ion-card-content>
              <ion-grid>
                <ion-row class="characteristics-card">
                  <ion-col size="6" size-md="4" size-lg="2">
                    <ion-text>
                      <h2><b>Color</b></h2>

                    </ion-text>
                  </ion-col>
                  <ion-col size="6" size-md="4" size-lg="2">
                    <ion-text>
                      <h2><b>Shape</b></h2>

                    </ion-text>
                  </ion-col>
                  <ion-col size="6" size-md="4" size-lg="2">
                    <ion-text>
                      <h2><b>Margin</b></h2>

                    </ion-text>
                  </ion-col>
                  <ion-col size="6" size-md="4" size-lg="2">
                    <ion-text>
                    <h2><b>Size</b></h2>

                  </ion-text></ion-col>

                </ion-row>
              </ion-grid>
            </ion-card-content>
          </ion-card>

          <ion-card class="card-container3">
            <ion-card-header>
              <ion-card-title>Habitat</ion-card-title>
              <!-- <ion-card-subtitle>Card Subtitle</ion-card-subtitle> -->
            </ion-card-header>
        
            <ion-card-content>
              {{ leafData?.leafInfo?.habitat || 'No habitat information available' }}
            </ion-card-content>
          </ion-card>


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
                <ion-button class="save" @click="saveLeafInfo">Save</ion-button>
                <ion-button class="pin"  @click="handlePinClick">
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
import { IonPage, IonContent, IonCol, IonGrid, IonRow, toastController, IonChip } from '@ionic/vue';
import { arrowBack, locationSharp } from 'ionicons/icons';
import { useRouter, useRoute } from 'vue-router';
import { sqliteService } from '@/services/sqliteService';
import { Network } from '@capacitor/network';
import { supabase } from '@/supabaseClient';
import { ref, defineProps, onMounted, computed } from 'vue';
import { useInferenceStore } from '@/stores/inferenceStores';
import { dbService } from '@/services/dbService';
import { useGeoStore } from '@/stores/geolocationStore';
import LocationModal from '@/components/LocationModal.vue';
import { requestPermissions, getCurrentPosition, geocodeLocation } from '@/services/geolocationService';

// Add this reactive state
const showModal = ref(false);
const locationNote = ref(''); 
const geoStore = useGeoStore();

// onMounted(async () => {
//   await geoStore.setCurrentLocation(); // Changed from updateLocation
// });

// const togglePin = () => {
//   geoStore.togglePin();
// };

// const router = useRouter();
const route = useRoute();
// const router = useRouter();

const inferenceStore = useInferenceStore();
// const leafData = ref<LeafData | null>(null);
const leafData = computed(() => inferenceStore.result);


interface LeafData {
    inference?: {
        predictedClass: string;
        confidence: number;
    };
    leafInfo?: {
        name: string;
        scientificName: string;
        familyName: string;
        description: string;
        habitat: string;
    };
}

const props = defineProps<{
    leafData: LeafData;

}>();

// const leafData = ref<LeafData | null>(props.leafData);


const router = useRouter();
// const leafData = ref<LeafData | null>(null);
const formatConfidence = (confidence: number) => {
    return (confidence * 100).toFixed(2);
};

const getConfidence = (): number | null => {
    return props.leafData?.inference?.confidence || null;
};

const imageSrc = ref<string>('');

// function to close page
function closePage() {
  router.back();
}

// Save functionality
// function saveLeafInfo() {
//     // Implement save functionality
//     console.log('Saving leaf info:', leafData.value);
// }


async function handlePinClick() {
  try {
    await requestPermissions();
    await geoStore.setCurrentLocation('');
    showModal.value = true;
  } catch (error) {
    console.error('Location error:', error);
    const message = error instanceof Error ? error.message : 'Location access required';
    showToast(message, true);
  }
}


async function showToast(message: string, isError = false) {
    const toast = await toastController.create({
        message: message,
        duration: 2000,
        color: isError ? 'danger' : 'success',
        position: 'top'
    });
    await toast.present();
}

async function saveLeafInfo() {
    try {
        // Validate required data
        if (!leafData.value?.leafInfo || !leafData.value?.inference) {
            await showToast('Missing plant data', true);
            return;
        }

        // Check network status
        const networkStatus = await Network.getStatus();
        
        if (networkStatus.connected) {
            try {
                console.log('Starting to save plant data...');
                
                // Save plant data - no longer requiring location
                const { data: inferenceData, error: infError } = await supabase
                    .from('inference_results')
                    .insert({
                        image: imageSrc.value,
                        scientific_name: leafData.value.leafInfo?.scientificName ?? '',
                        family_name: leafData.value.leafInfo?.familyName ?? '',
                        description: leafData.value.leafInfo?.description ?? '',
                        habitat: leafData.value.leafInfo?.habitat ?? '',
                        result: leafData.value.inference?.predictedClass ?? '',
                        confidence: leafData.value.inference.confidence ?? ''
                    })
                    .select();

                if (infError) {
                    console.error('Error saving inference data:', infError);
                    throw infError;
                }

                console.log('Inference data saved successfully:', inferenceData);

                // Check if we have any pinned location from geoStore
                const pinnedLocation = geoStore.currentLocation;
                console.log('Current location from geoStore:', pinnedLocation);
                console.log('Is location pinned?', pinnedLocation?.isPinned);
                
                if (pinnedLocation && pinnedLocation.isPinned) {
                    console.log('Attempting to save pinned location...');
                    
                    try {
                        // First approach: Direct insert with POINT format
                        const geographyData = {
                            user_id: null,
                            leaf_id: inferenceData[0].id,
                            geom: `POINT(${pinnedLocation.lng} ${pinnedLocation.lat})`,
                            title: pinnedLocation.title || '',
                            note: pinnedLocation.note
                        };
                        
                        console.log('Geography data being sent to Supabase:', geographyData);
                        
                        const { data: locationResult, error: locError } = await supabase
                            .from('pinned_locations')
                            .insert(geographyData)
                            .select();

                        if (locError) {
                            console.error('Error saving location data - likely a permission/RLS policy issue');
                            /* Comment out detailed error logging that causes TypeScript errors
                            console.error('Error code:', locError.code);
                            console.error('Error message:', locError.message);
                            console.error('Error details:', locError.details);
                            console.error('Error hint:', locError.hint);
                            */
                            throw locError;
                        }
                        
                        console.log('Location saved successfully:', locationResult);
                    } catch (locError) {
                        console.error('Detailed location save error - check RLS policies in Supabase');
                        /* Comment out checks that cause TypeScript errors
                        if (locError.code && locError.message) {
                            console.error('Supabase error code:', locError.code);
                            console.error('Supabase error message:', locError.message);
                            console.error('Supabase error details:', locError.details);
                            console.error('Supabase error hint:', locError.hint);
                            await showToast('Leaf saved but location failed: ' + locError.message, true);
                        } else {
                        */
                        // Generic error
                        const errorMessage = locError instanceof Error ? locError.message : 'Permission error - check RLS policy';
                        await showToast('Leaf saved but location failed: ' + errorMessage, true);
                        // Continue anyway to not lose leaf data
                    }
                } else {
                    console.log('Location not being saved - either null or not pinned');
                }

                await showToast('Data saved successfully');
                router.back();
            } catch (error) {
                console.error('Save error details:', error);
                const message = error instanceof Error ? error.message : 'Failed to save data';
                await showToast(message, true);
            }
        } else {
            // Offline: Save to SQLite for later sync
            await dbService.saveLeaf({
                imagePath: imageSrc.value,
                leafInfo: JSON.stringify({
                    result: leafData.value?.inference?.predictedClass ?? '',
                    scientificName: leafData.value?.leafInfo?.scientificName ?? '',
                    familyName: leafData.value?.leafInfo?.familyName ?? '',
                    description: leafData.value?.leafInfo?.description ?? '',
                    habitat: leafData.value?.leafInfo?.habitat ?? '',
                }),
                // timestamp: timestamp,
                synced: false
            });
            await showToast('Leaf information saved offline');
            console.log('Leaf info saved to SQLite (offline mode)');
        }
    } catch (error) {
        console.error('Error saving leaf info:', error);
        await showToast('Error saving leaf information', true);
    }
}

onMounted(() => {
  // Add network listener
  Network.addListener('networkStatusChange', async (status) => {
    if (status.connected) {
      try {
        // Sync any offline data when coming back online
        await sqliteService.syncWithSupabase();
      } catch (error) {
        console.error('Error syncing with Supabase:', error);
      }
    }
  });
});


</script>

<style scoped>

.characteristics-card {
  background-color: #135d54;
  border: solid 1px #fff;
  color: #fff;
  text-align: left;
}

ion-chip {
  --background: #416d3f;
  --color: #fff;
  margin-top: 75%;
  margin-left: 30%;
}

.card-container1 {
  margin-top: 80%;
  --background: #fff;
  border-radius: 15px;
}

.card-container2 {
  margin-top: 15px;
  --background: #fff;
  border-radius: 15px;
}

.card-container3 {
  margin-top: 15px;
  --background: #fff;
  border-radius: 15px;
}
.card-container4 {
  margin-top: 15px;
  --background: #fff;
  border-radius: 15px;
}

.modalSheet {
  --background: #fff;
  --border-radius: 25px;
}

.button-container {
  display: flex;
  justify-content: space-between; /* Center the button horizontally */
  width: 100%; /* Full width of the container */
  position: fixed; /* Fix the position */
  bottom: 0; /* Position at the bottom */
  left: 0; /* Align to the left */
  padding: 5px; /* Optional padding for aesthetics */

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

}

.custom-grid {
    border: 2px solid red;
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
    border: 2px solid red;
}
.leaf-image {
    width: 250px; /* Adjust the width as needed */
    height: auto; /* Maintain aspect ratio */
    margin-right: 20px; /* Space between image and other content */
    position: absolute; /* Position the image absolutely */
    top: -120px; /* Adjust the top position as needed */
    left: -1px; /* Adjust the left position as needed */
    z-index: 10; /* Ensure the image is above other elements */
    border: 2px solid red;
    
}

.image-container {
    border: 2px solid red;
    position: absolute; /* Position the container absolutely */
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
    border: 2px solid red;
    position: absolute; /* Position the container absolutely */
    top: 0%; /* Adjust the top position as needed */
    left: 0;
    width: 100%; /* Full width of the viewport */
    height: 35vh; /* 75% of the viewport height */
    background-color: #fff;
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
    background-color: rgb(65, 130, 61);
    overflow: hidden;
  }

  
  ion-content {
    overflow: hidden;
  }
</style>