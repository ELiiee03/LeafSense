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
                          <img src="/resources/jackfruit.png" alt="Leaf Image" class="leaf-image">
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
                      </ion-col>
                  </ion-row>
              </ion-grid>

              <div>
                <div v-if="leafData" class="result">
                  <p><b>Description: </b> {{ leafData.leafInfo?.description || 'No description available' }}</p>
                  <p><b>Family Name: </b> {{ leafData.leafInfo?.familyName || 'No family name available' }}</p>
                  <p><b>Habitat: </b> {{ leafData.leafInfo?.habitat || 'No habitat information available' }}</p>
                  
                  <!-- Display confidence from either format -->
                  <p v-if="inferenceStore.result?.inference.confidence">
                    <b>Confidence:</b> {{ formatConfidence(inferenceStore.result.inference.confidence) }}%
                </p>
                </div>  
                <div v-else>
                    <p>Loading data...</p>
                </div>
            </div>

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
              </div>

             

          </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonCol, IonGrid, IonRow, toastController } from '@ionic/vue';
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

const currentLocation = ref<{
  lat: number;
  lng: number;
  note: string;
  isPinned: boolean;
  address?: string;
} | null>(null);

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
    await geoStore.setCurrentLocation(locationNote.value);
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
                if (!currentLocation.value) {
                    await showToast('Location data not available', true);
                    return;
                }

                // Save plant data
                const { data: inferenceData, error: infError } = await supabase
                    .from('inference_results')
                    .insert({
                        image: imageSrc.value,
                        scientific_name: leafData.value.leafInfo.scientificName,
                        family_name: leafData.value.leafInfo.familyName,
                        description: leafData.value.leafInfo.description,
                        habitat: leafData.value.leafInfo.habitat,
                        confidence: leafData.value.inference.confidence
                    })
                    .select();

                if (infError) throw infError;

                // Save location if pinned
                if (currentLocation.value.isPinned) {
                    const { error: locError } = await supabase
                        .from('pinned_locations')
                        .insert({
                            lat: currentLocation.value.lat,
                            lng: currentLocation.value.lng,
                            note: currentLocation.value.note,
                            inference_result_id: inferenceData[0].id,
                            address: currentLocation.value.address
                        });

                    if (locError) throw locError;
                }

                await showToast('Data saved successfully');
                router.back();
            } catch (error) {
                console.error('Save error:', error);
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
    border: 2px solid red;
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
    padding: 15px; /* Optional padding for aesthetics */
    border-top-right-radius: 95px;

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