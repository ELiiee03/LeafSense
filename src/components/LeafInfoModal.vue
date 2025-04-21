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
      <ion-fab slot="fixed" vertical="top" horizontal="start" class="back-button">
        <ion-button fill="clear"  color="light" size="large" @click="onClose">
          <ion-icon :icon="arrowBack" size="large"></ion-icon>
        </ion-button>
        </ion-fab>
      <ion-content class="ion-padding-0">
        <!-- Top image with name overlay -->
        <div class="image-container">
          <img 
            :src="getLeafImage" 
            alt="Leaf Image" 
            class="leaf-image">
          
          <!-- Plant name overlay -->
          <div class="name-overlay">
            <h1 class="plant-name">{{ getPlantName }}</h1>
            <p class="scientific-name">{{ getScientificName }}</p>
            <p class="family-name">{{ getFamilyName }}</p>
          </div>
          
          <!-- Match percentage pill -->
          <div class="match-pill" v-if="getConfidence !== null && getConfidence !== undefined">
            {{ formatConfidence(getConfidence) }}% match
          </div>
        </div>

        <!-- Tabbed Interface -->
        <div class="tab-container">
          <ion-segment v-model="selectedTab" mode="md">
            <ion-segment-button value="overview">
              <ion-label>Overview</ion-label>
            </ion-segment-button>
            <ion-segment-button value="features">
              <ion-label>Features</ion-label>
            </ion-segment-button>
            <ion-segment-button value="uses">
              <ion-label>Uses</ion-label>
            </ion-segment-button>
            <ion-segment-button value="ecology">
              <ion-label>Ecology</ion-label>
            </ion-segment-button>
          </ion-segment>
    
          <!-- Overview Tab -->
          <div v-if="selectedTab === 'overview'" class="tab-content">
            <div class="card">
              <h2>Description</h2>
              <p>{{ leaf?.description || leaf?.leafInfo?.description || 'No description available' }}</p>
            </div>
            
            <div class="two-column-cards">
              <div class="card">
                <div class="card-header">
                  <div class>
                    <ion-icon :icon="leafOutline" class="alias-icon"></ion-icon>
                  </div>
                  <h2>Habitat</h2>
                </div>
                <p>{{ leaf?.habitat || leaf?.leafInfo?.habitat || 'Habitat information unavailable' }}</p>
              </div>
              
              <div class="card alias-card">
                <div class="card-header">
                  <div class>
                    <ion-icon :icon="pricetagOutline" class="alias-icon"></ion-icon>
                  </div>
                  <h2>Also Known As</h2>
                </div>
                <div class="alias-container" v-if="aliases && aliases.length > 0">
                  <ion-chip 
                    v-for="alias in processedAliases" 
                    :key="alias" 
                    class="alias-chip"
                  >
                    {{ alias }}
                  </ion-chip>
                </div>
                <p v-else>No alternate names available</p>
              </div>
            </div>
          </div>

          <!-- Features Tab -->
          <div v-if="selectedTab === 'features'" class="tab-content">
            <div class="card">
              <h2 class="physical-characteristics-title">Physical Characteristics</h2>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-label">Color</span>
                  <span class="feature-value">{{ leaf?.color || 'Information not available' }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Foliage</span>
                  <span class="feature-value">{{ leaf?.foliage || 'Information not available' }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Bark</span>
                  <span class="feature-value">{{ leaf?.bark || 'Information not available' }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Fruit</span>
                  <span class="feature-value">{{ leaf?.fruit || 'Information not available' }}</span>
                </div>
              </div>
            </div>

            <div class="card">
              <h2 class="shape-structure-title">Shape & Structure</h2>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-label">Crown</span>
                  <span class="feature-value">{{ leaf?.crown || 'Information not available' }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Trunk</span>
                  <span class="feature-value">{{ leaf?.trunk || 'Information not available' }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Leaves</span>
                  <span class="feature-value">{{ leaf?.leaves || 'Information not available' }}</span>
                </div>
              </div>
            </div>

            <div class="card">
              <h2 class="leaf-characteristics-title">Leaf Characteristics</h2>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-label">Retention</span>
                  <span class="feature-value">{{ leaf?.retention || leaf?.leafInfo?.retention || 'Information not available' }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Texture</span>
                  <span class="feature-value">{{ leaf?.texture || leaf?.leafInfo?.texture || 'Information not available' }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Venation</span>
                  <span class="feature-value">{{ leaf?.venation || leaf?.leafInfo?.venation || leaf?.leafInfo?.foliarVenation || 'Information not available' }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Behavior</span>
                  <span class="feature-value">{{ leaf?.behavior || leaf?.leafInfo?.behavior || leaf?.leafInfo?.uniqueBehavior || 'Information not available' }}</span>
                </div>
                <div class="feature-item">
                  <span class="feature-label">Growth Habits</span>
                  <span class="feature-value">{{ leaf?.growthHabits || leaf?.leafInfo?.growthHabits || leaf?.leafInfo?.growthHabits || 'Information not available' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Uses Tab -->
          <div v-if="selectedTab === 'uses'" class="tab-content">
            <div class="card">
              <div class="card-header">
                <div class="icon-badge uses-icon-badge">
                  <ion-icon :icon="restaurantOutline" class="card-icon"></ion-icon>
                </div>
                <h2>Edible Uses</h2>
              </div>
              <p>{{ leaf?.edible_uses || leaf?.leafInfo?.edibleUses || 'Information not available' }}</p>
            </div>

            <div class="card">
              <div class="card-header">
                <div class="icon-badge uses-icon-badge">
                  <ion-icon :icon="medkitOutline" class="card-icon"></ion-icon>
                </div>
                <h2>Medicinal Uses</h2>
              </div>
              <p>{{ leaf?.med_uses || leaf?.leafInfo?.medicinalUses || 'Information not available' }}</p>
            </div>

            <div class="card">
              <div class="card-header">
                <div class="icon-badge uses-icon-badge">
                  <ion-icon :icon="constructOutline" class="card-icon"></ion-icon>
                </div>
                <h2>Timber Uses</h2>
              </div>
              <p>{{ leaf?.timber_uses || leaf?.leafInfo?.timberUses || 'Information not available' }}</p>
            </div>

            <div class="card">
              <div class="card-header">
                <div class="icon-badge uses-icon-badge">
                  <ion-icon :icon="ellipsisHorizontalCircleOutline" class="card-icon"></ion-icon>
                </div>
                <h2>Other Uses</h2>
              </div>
              <p>{{ leaf?.other_uses || leaf?.leafInfo?.otherUses || 'Information not available' }}</p>
            </div>
          </div>

          <!-- Ecology Tab -->
          <div v-if="selectedTab === 'ecology'" class="tab-content">
            <div class="two-column-cards">
              <div class="card ecology-card">
                <div class="ecology-content">
                  <div class="icon-badge">
                    <ion-icon :icon="thermometerOutline" class="ecology-icon"></ion-icon>
                  </div>
                  <h3>Climate</h3>
                  <p>{{ leaf?.climate || leaf?.leafInfo?.climate || 'Information not available' }}</p>
                </div>
              </div>
              
              <div class="card ecology-card">
                <div class="ecology-content">
                  <div class="icon-badge">
                    <ion-icon :icon="syncOutline" class="ecology-icon"></ion-icon>
                  </div>
                  <h3>Lifespan</h3>
                  <p>{{ leaf?.lifespan || leaf?.leafInfo?.lifespan || 'Information not available' }}</p>
                </div>
              </div>
              
              <div class="card ecology-card">
                <div class="ecology-content">
                  <div class="icon-badge">
                    <ion-icon :icon="sunnyOutline" class="ecology-icon"></ion-icon>
                  </div>
                  <h3>Light Needs</h3>
                  <p>{{ leaf?.light_needs || leaf?.leafInfo?.lightNeeds || 'Information not available' }}</p>
                </div>
              </div>
              
              <div class="card ecology-card">
                <div class="ecology-content">
                  <div class="icon-badge">
                    <ion-icon :icon="waterOutline" class="ecology-icon"></ion-icon>
                  </div>
                  <h3>Water Needs</h3>
                  <p>{{ leaf?.water_needs || leaf?.leafInfo?.waterNeeds || 'Information not available' }}</p>
                </div>
              </div>
            </div>
            
            <div class="card">
              <h2>Soil Requirements</h2>
              <p>{{ leaf?.soil_req || leaf?.leafInfo?.soilRequirements || 'Information not available' }}</p>
            </div>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  <!-- </ion-content> -->
</template>

<script lang="ts" setup>
  import { IonButton, IonModal, IonFab, IonContent, 
           IonCol, IonGrid, IonRow, IonSegment, 
           IonSegmentButton, IonLabel, IonIcon, IonChip } from '@ionic/vue';
  import { watch, ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue';
  import { defineProps } from 'vue';
  import { arrowBack, leafOutline, restaurantOutline, 
           medkitOutline, constructOutline, ellipsisHorizontalCircleOutline,
           thermometerOutline, syncOutline, sunnyOutline, waterOutline, pricetagOutline } from 'ionicons/icons';
  import { supabase } from '@/supabaseClient';
  import { Network } from '@capacitor/network';
  
// Define props
const props = defineProps<{
  isOpen: boolean;
  onClose: () => void;
  onDataChange?: (leafId: string) => void;
  imageSrc?: string;
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
  foliage?: string;
  bark?: string;
  fruit?: string;
  flowers?: string;
  retention?: string;
  texture?: string;
  venation?: string;
  behavior?: string;
  edibleUses?: string;
  medicinalUses?: string;
  timberUses?: string;
  trunk?: string;
  leaves?: string;
  crown?: string;
  soilRequirements?: string;
  climate?: string;
  lifespan?: string;
  lightNeeds?: string;
  waterNeeds?: string;
  otherUses?: string;
  aliases?: string;
}

interface Leaf {
  id: number;
  leafInfo: LeafInfo;
}

const leaf = ref(props.leaf);
const selectedTab = ref('overview');
const isOnline = ref(true);

// Check network status on component mount
const checkNetworkStatus = async () => {
  const status = await Network.getStatus();
  isOnline.value = status.connected;
  console.log('LeafInfoModal network status:', isOnline.value ? 'Online' : 'Offline');
};

// Listen for network status changes
const setupNetworkListeners = () => {
  Network.addListener('networkStatusChange', (status) => {
    isOnline.value = status.connected;
    console.log('LeafInfoModal network changed:', isOnline.value ? 'Online' : 'Offline');
    
    // If we come back online and have a leaf ID, set up subscription
    if (isOnline.value && leaf.value?.id) {
      setupLeafSubscription(leaf.value.id);
    } else if (!isOnline.value) {
      // Clean up subscriptions when going offline
      cleanupLeafSubscription();
    }
  });
};

// Extract aliases from the leaf data if available
const aliases = computed(() => {
  const rawAliases = leaf.value?.aliases;
  console.log('Raw aliases data:', rawAliases, typeof rawAliases);
  
  if (!rawAliases) return [];
  
  // Direct string check for debugging
  if (typeof rawAliases === 'string') {
    console.log('Processing aliases as string');
    
    // Check if it looks like a stringified array with quotes and commas
    if (rawAliases.includes('[') && rawAliases.includes(']') && 
        (rawAliases.includes('"') || rawAliases.includes("'"))) {
      
      console.log('Detected stringified array:', rawAliases);
      
      // Very aggressive cleanup - strip all non-alphanumeric chars except commas
      const cleanStr = rawAliases
        .replace(/[\[\]"'\\]/g, '') // Remove brackets, quotes, backslashes
        .trim();
      
      console.log('After cleanup:', cleanStr);
      
      // Split by comma and trim each item
      const items = cleanStr.split(',').map((s: string) => s.trim()).filter(Boolean);
      console.log('Final split items:', items);
      return items;
    }
    
    // Handle other string formats
    try {
      if (rawAliases.startsWith('[') && rawAliases.endsWith(']')) {
        try {
          const parsed = JSON.parse(rawAliases);
          console.log('JSON parsed result:', parsed);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          console.error('Failed to JSON parse:', e);
          // Just use a basic split as fallback
          const stripped = rawAliases.replace(/[\[\]"'\\]/g, '');
          return stripped.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      
      // For single string or comma-separated values
      if (rawAliases.includes(',')) {
        return rawAliases.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      
      return [rawAliases];
    } catch (e) {
      console.error('Error in aliases processing:', e);
      return [rawAliases];
    }
  }
  
  // If it's already an array
  if (Array.isArray(rawAliases)) {
    console.log('Already an array:', rawAliases);
    return rawAliases;
  }
  
  // Fallback
  return [String(rawAliases)];
});

// New computed property to handle alias processing for display
const processedAliases = computed(() => {
  if (!aliases.value || aliases.value.length === 0) return [];
  
  // Check if we have a single entry that contains commas (likely still needs splitting)
  if (aliases.value.length === 1 && typeof aliases.value[0] === 'string' && aliases.value[0].includes(',')) {
    // Clean up and split the string
    return aliases.value[0]
      .replace(/[\[\]"'\\]/g, '') // Remove brackets, quotes, backslashes
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean); // Remove empty items
  }
  
  // Otherwise return the aliases but clean up any remaining quotes/brackets
  return aliases.value.map((alias: string) => {
    if (typeof alias === 'string') {
      return alias.replace(/[\[\]"'\\]/g, '').trim();
    }
    return alias;
  });
});

// Computed properties for characteristics
// const characteristics = computed(() => [
//   { name: 'Color', value: leaf.value?.color || 'Not available' },
//   { name: 'Shape', value: leaf.value?.shape || 'Not available' },
//   { name: 'Margin', value: leaf.value?.margin || 'Not available' },
//   { name: 'Growth Habits', value: leaf.value?.growth_habits || 'Not available' }
// ]);

// Format confidence score
const formatConfidence = (confidence: number | null) => {
  if (confidence === null || confidence === undefined) return 0;
  
  // If confidence is already between 0-100, return as is
  if (confidence > 1) {
    return confidence.toFixed(2);
  }
  
  // Otherwise convert from 0-1 to 0-100
  return (confidence * 100).toFixed(2);
};

// Add subscription variable
let detailsSubscription: any = null;

// Set up realtime subscription when a leaf is loaded
const setupLeafSubscription = (leafId: string | number) => {
  if (!leafId || !isOnline.value) return;
  
  // Clean up any existing subscription
  cleanupLeafSubscription();
  
  console.log('Setting up realtime subscription for leaf ID:', leafId);
  
  // Subscribe to changes in inference_results for this specific leaf
  detailsSubscription = supabase
    .channel(`leaf_details_${leafId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events
        schema: 'public',
        table: 'inference_results',
        filter: `id=eq.${leafId}`
      },
      (payload) => {
        console.log('Leaf details changed:', payload);
        
        // Refresh leaf data - for simplicity, emit an event to notify parent
        if (props.onDataChange) {
          props.onDataChange(String(leafId));
        }
      }
    )
    .subscribe();
    
  // Only set up more subscriptions if we're online
  if (isOnline.value) {
    // Also subscribe to plant_details changes for this leaf
    const plantDetailsSubscription = supabase
      .channel(`plant_details_${leafId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plant_details',
          filter: `inference_result_id=eq.${leafId}`
        },
        (payload) => {
          console.log('Plant details changed:', payload);
          
          // Refresh leaf data
          if (props.onDataChange) {
            props.onDataChange(String(leafId));
          }
        }
      )
      .subscribe();
  }
};

// Cleanup function
const cleanupLeafSubscription = () => {
  if (detailsSubscription) {
    console.log('Cleaning up leaf subscription');
    supabase.removeChannel(detailsSubscription);
    detailsSubscription = null;
  }
};

// Watch for leaf changes to set up subscription
watch(
  () => props.leaf?.id,
  (newLeafId) => {
    if (newLeafId && isOnline.value) {
      setupLeafSubscription(newLeafId);
    }
  },
  { immediate: true }
);

// Clean up on unmount
onBeforeUnmount(() => {
  cleanupLeafSubscription();
  // Remove network listeners
  Network.removeAllListeners();
});

// Initialize component
onMounted(async () => {
  await checkNetworkStatus();
  setupNetworkListeners();
});

// Watch for leaf prop changes
watch(
  () => props.leaf,
  (newLeaf) => {
    console.log('LeafInfoModal received new leaf data:', newLeaf);
    
    // Handle both direct and nested data formats
    if (newLeaf) {
      // Extract and normalize aliases data
      let aliasesData;
      
      if (newLeaf.leafInfo?.aliases) {
        aliasesData = newLeaf.leafInfo.aliases;
      } else if (newLeaf.aliases) {
        aliasesData = newLeaf.aliases;
      }
      
      // Process aliases into a clean array format
      let processedAliases = [];
      if (aliasesData) {
        if (typeof aliasesData === 'string') {
          try {
            // If it's a JSON string array
            if (aliasesData.startsWith('[') && aliasesData.endsWith(']')) {
              try {
                processedAliases = JSON.parse(aliasesData);
              } catch (parseError) {
                console.error('JSON parse failed in watch function:', parseError);
                
                // Extract quoted strings with regex
                const matches = aliasesData.match(/"([^"]+)"/g) || [];
                if (matches.length > 0) {
                  processedAliases = matches.map((match: string) => match.replace(/^"|"$/g, ''));
                } else {
                  // Remove brackets and split
                  const cleaned = aliasesData
                    .replace(/^\[|\]$/g, '')
                    .replace(/\\"/g, '"')
                    .replace(/"/g, '');
                  
                  processedAliases = cleaned.split(',').map((item: string) => item.trim());
                }
              }
            } else {
              // Single string or comma-separated list
              processedAliases = aliasesData.includes(',') 
                ? aliasesData.split(',').map((item: string) => item.trim())
                : [aliasesData];
            }
          } catch (e) {
            console.error('Error parsing aliases in watch:', e);
            processedAliases = [aliasesData];
          }
        } else if (Array.isArray(aliasesData)) {
          processedAliases = aliasesData;
        } else {
          processedAliases = [aliasesData];
        }
      }
      
      // If data is in leafInfo nested structure
      if (newLeaf.leafInfo) {
        leaf.value = {
          id: newLeaf.id,
          result: newLeaf.leafInfo.name || 'Unknown Plant',
          scientific_name: newLeaf.leafInfo.scientificName || '',
          description: newLeaf.leafInfo.description || '',
          family_name: newLeaf.leafInfo.familyName || '',
          habitat: newLeaf.leafInfo.habitat || '',
          image: newLeaf.leafInfo.image || newLeaf.image || null,
          confidence: newLeaf.inference?.confidence || 0.8,
          aliases: processedAliases,
          foliage: newLeaf.leafInfo.foliage || '',
          bark: newLeaf.leafInfo.bark || '',
          fruit: newLeaf.leafInfo.fruit || '',
          flowers: newLeaf.leafInfo.flowers || '',
          retention: newLeaf.leafInfo.retention || '',
          texture: newLeaf.leafInfo.texture || '',
          venation: newLeaf.leafInfo.venation || '',
          behavior: newLeaf.leafInfo.behavior || '',
          edible_uses: newLeaf.leafInfo.edibleUses || '',
          med_uses: newLeaf.leafInfo.medicinalUses || '',
          timber_uses: newLeaf.leafInfo.timberUses || '',
          color: newLeaf.leafInfo.color || '',
          shape: newLeaf.leafInfo.shape || '',
          margin: newLeaf.leafInfo.margin || '',
          growthHabits: newLeaf.leafInfo.growthHabits || '',
          trunk: newLeaf.leafInfo.trunk || '',
          leaves: newLeaf.leafInfo.leaves || '',
          crown: newLeaf.leafInfo.crown || '',
          soil_req: newLeaf.leafInfo.soilRequirements || '',
          climate: newLeaf.leafInfo.climate || '',
          lifespan: newLeaf.leafInfo.lifespan || '',
          light_needs: newLeaf.leafInfo.lightNeeds || '',
          water_needs: newLeaf.leafInfo.waterNeeds || '',
          other_uses: newLeaf.leafInfo.otherUses || '',
          // Copy other fields as needed
        };
      } else {
        // Direct data structure
        leaf.value = {
          ...newLeaf,
          aliases: processedAliases
        };
      }
    }
  },
  { immediate: true }
);

// Computed getters to handle both data structures
const getLeafImage = computed(() => {
  return leaf.value?.image || 
         leaf.value?.leafInfo?.image || 
         '/resources/jackfruit.png';
});

const getPlantName = computed(() => {
  return leaf.value?.result || 
         leaf.value?.leafInfo?.name || 
         'Plant Name';
});

const getScientificName = computed(() => {
  return leaf.value?.scientific_name || 
         leaf.value?.leafInfo?.scientificName || 
         'Scientific Name';
});

const getFamilyName = computed(() => {
  // Log the family name values for debugging
  console.log('Family name values:', {
    direct: leaf.value?.family_name,
    leafInfo: leaf.value?.leafInfo?.familyName
  });
  
  const familyName = leaf.value?.family_name || 
                    leaf.value?.leafInfo?.familyName || 
                    'Unknown Family';
  
  return 'Family: ' + familyName;
});

const getConfidence = computed(() => {
  // Log the confidence values to debug
  console.log('Confidence values:', {
    direct: leaf.value?.confidence,
    inference: leaf.value?.inference?.confidence
  });
  
  // Don't provide a fallback value, let the formatConfidence function handle it
  return leaf.value?.confidence || 
         leaf.value?.inference?.confidence;
});
</script>

<style scoped>
ion-content {
  --background: #f0f5f0;
}

.ion-padding-0 {
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
}

.back-button {
  z-index: 999;
  margin-top: 10px;
  margin-left: 1px;
}

.image-container {
  position: relative;
  width: 100%;
  height: 40vh;
  overflow: hidden;
}

.leaf-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name-overlay {
  position: absolute;
  bottom: 30px;
  left: 20px;
  z-index: 2;
}

.plant-name {
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.6);
}

.scientific-name {
  color: #fff;
  font-size: 18px;
  font-style: italic;
  margin: 0;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.6);
}

.family-name {
  color: #fff;
  font-size: 15px;
  margin: 5px 0 0 0;
  opacity: 0.9;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.6);
  font-weight: 400;
}

.match-pill {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: #416d3f;
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 14px;
}

.tab-container {
  padding: 0 0 20px 0;
}

ion-segment {
  margin: 0;
  padding: 15px 10px;
  --background: transparent;
}

ion-segment-button {
  --color: #666;
  --color-checked: #333;
  --background-checked: #fff;
  --border-radius: 20px;
  --indicator-color: transparent;
  font-size: 14px;
  text-transform: none;
  min-height: 35px;
}

.tab-content {
  padding: 0 15px 20px;
}

/* Features tab specific styling */
.tab-content .card {
  margin-bottom: 18px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  margin-top: 5px;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  line-height: 1.4;
}

.feature-item:last-child {
  border-bottom: none;
  padding-bottom: 5px;
}

.feature-item:first-child {
  padding-top: 5px;
}

.card {
  background: #fff;
  border-radius: 15px;
  padding: 22px 20px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.card h2 {
  color: #333;
  font-size: 20px;
  margin-top: 0;
  margin-bottom: 18px;
  font-weight: 600;
}

/* Add specific styles for category titles */
.physical-characteristics-title,
.shape-structure-title,
.leaf-characteristics-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.two-column-cards {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 0 -5px;
}

.two-column-cards .card {
  flex: 1 1 40%;
  min-width: calc(50% - 15px);
  margin: 0 0 15px 0;
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #f2f7f2;
  margin-right: 15px;
  box-shadow: 0 1px 3px rgba(65, 109, 63, 0.08);
  border: 1px solid rgba(65, 109, 63, 0.12);
  flex-shrink: 0;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
}

.card-icon {
  color: #416d3f;
  font-size: 20px;
}

.alias-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 15px;
}

.alias-card h2 {
  color: black;
  font-size: 20px;
  font-weight: 600;
  margin-top: 0;
}

.alias-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}
.alias-icon {
  margin-right: 10px;
  font-size: 20px;
  color: #416d3f;
}

.alias-chip {
  --background:  #A1EEBD;
  --color: #333333;
  font-size: 13px;
  height: 30px;
  --border-radius: 18px;
  margin: 5px 3px;
  padding: 0 18px;
  font-weight: 500;
  box-shadow: none;
}

.ecology-card {
  text-align: center;
  padding: 15px;
}

.ecology-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 15px;
}

.ecology-content .icon-badge {
  margin-right: 0;
  margin-bottom: 15px;
  width: 46px;
  height: 46px;
}

.ecology-icon {
  color: #416d3f;
  font-size: 22px;
}

.ecology-content h3 {
  margin: 0 0 10px 0;
  font-size: 17px;
  color: #333;
  font-weight: 600;
}

/* Add a general card text style */
.card p {
  color: #555;
  line-height: 1.5;
  margin: 0;
}

.feature-label {
  color: #666;
  font-weight: 500;
  flex: 0 0 auto;
  margin-right: 15px;
  min-width: 90px;
  text-align: left;
}

.feature-value {
  color: #333;
  text-align: right;
  flex: 1;
  padding-left: 15px;
}

.icon-badge:hover {
  transform: scale(1.05);
  background-color: #e6efe6;
}

/* Specific styles for Uses tab icons */
.uses-icon-badge {
  background-color: #f2f7f2;
}
</style>