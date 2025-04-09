<template>
  <div class="recent-identifications">
    <div class="header">
      <div class="header-left">
        <h4 class="section-title">
          <ion-icon :icon="timeOutline" class="icon" />
          Recent Identifications
        </h4>
      </div>
      <router-link to="/logs" class="view-all">View All →</router-link>
    </div>

    <!-- Add ion-refresher for manual refresh -->
    <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
      <ion-refresher-content
        pullingText="Pull to refresh"
        refreshingText="Refreshing..."
      >
      </ion-refresher-content>
    </ion-refresher>

    <div v-if="isLoading" class="loading-container">
      <ion-spinner name="dots" />
      <p>Loading recent identifications...</p>
    </div>

    <div v-else-if="recentLeaves?.length === 0" class="empty-container">
      <ion-icon :icon="leafOutline" class="empty-icon" />
      <p>No leaf identifications yet</p>
      <p class="empty-subtitle">Identify your first leaf to see it here</p>
      
      <!-- Test card to verify LeafCard component works -->
      <!-- <div class="test-card-section">
        <p>Test card below:</p>
        <LeafCard :leaf="testLeaf" class="card-item" />
      </div> -->
    </div>

    <div v-else class="scroll-wrapper">
      <div class="scroll-container">
        <LeafCard 
          v-for="leaf in recentLeaves" 
          :key="leaf.id"
          :leaf="leaf"
          class="card-item"
          @click="openLeafInfo(leaf)"
        />
      </div>
    </div>

    <!-- Add LeafInfoModal -->
    <LeafInfoModal 
      :isOpen="isModalOpen" 
      :onClose="() => setModalOpen(false)" 
      :leaf="selectedLeafData"
      :onDataChange="handleLeafDataChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
import { timeOutline, leafOutline } from 'ionicons/icons'
import LeafCard from './LeafCards.vue'
import LeafInfoModal from './LeafInfoModal.vue'
import { supabase } from '@/supabaseClient'
import { RouterLink } from 'vue-router'
import { IonSpinner, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/vue'
import defaultLeafImage from '@/assets/pine needle.jpg'
import { useQuery } from '@tanstack/vue-query'
import { sqliteService } from '@/services/sqliteService'
import { Network } from '@capacitor/network'

// Define types for leaf data
interface LeafData {
  id: string;
  created_at: string;
  formattedDate?: string;
  inference: {
    confidence: number;
  };
  leafInfo: {
    name: string;
    scientificName: string;
    image?: string;
  };
}

// Extended type for internal processing with date object
interface ExtendedLeafData extends LeafData {
  dateObj: Date;
}

// Type for grouped data
interface GroupedData {
  [key: string]: ExtendedLeafData[];
}

// Loading state (Note: recentLeaves is provided by useQuery below)

// Test leaf for debugging
const testLeaf: LeafData = {
  id: "test-id",
  created_at: new Date().toISOString(),
  formattedDate: "Today (Test)",
  inference: {
    confidence: 0.95
  },
  leafInfo: {
    name: "Test Leaf",
    scientificName: "Testus Leafus",
    image: defaultLeafImage
  }
}

// Format the date in a human-readable way (Today, Yesterday, etc.)
const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  
  // Reset hours, minutes, and seconds for date comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const threeDaysAgo = new Date(today)
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const oneWeekAgo = new Date(today)
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  const identificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  if (identificationDate.getTime() === today.getTime()) {
    return 'Today'
  } else if (identificationDate.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  } else if (identificationDate >= threeDaysAgo && identificationDate < yesterday) {
    return '3 days ago'
  } else if (identificationDate >= oneWeekAgo && identificationDate < threeDaysAgo) {
    return 'A week ago'
  } else {
    // Fall back to a standard date format for older dates
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
}

// Utility function to generate a random ID
const generateRandomId = () => {
  return 'id-' + Math.random().toString(36).substring(2, 15);
}

// Get recent identifications with vue-query
const { data: recentLeaves, isLoading, error, refetch: fetchRecentIdentifications } = useQuery({
  queryKey: ['recentIdentifications'],
  queryFn: async () => {
    const isOnline = (await Network.getStatus()).connected;
    if (isOnline) {
      const { data, error } = await supabase
        .from('inference_results')
        .select('id, created_at, result, scientific_name, confidence, image')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data.map(item => ({
        id: item.id?.toString() || generateRandomId(),
        created_at: item.created_at || new Date().toISOString(),
        formattedDate: formatRelativeDate(item.created_at),
        inference: { 
          confidence: typeof item.confidence === 'number' ? item.confidence : 0
        },
        leafInfo: {
          name: item.result || 'Unknown Leaf',
          scientificName: item.scientific_name || 'Unknown Species',
          image: item.image || ''
        }
      }));
    } else {
      // Offline mode: fetch from SQLite
      const offlineResults = await sqliteService.getUnsyncedResults();
      return offlineResults.map(item => ({
        id: item.id?.toString() || generateRandomId(),
        created_at: new Date(item.timestamp).toISOString(),
        formattedDate: formatRelativeDate(new Date(item.timestamp).toISOString()),
        inference: { 
          confidence: typeof item.confidence === 'number' ? item.confidence : 0
        },
        leafInfo: {
          name: item.predicted_class || 'Unknown Leaf',
          scientificName: item.scientific_name || 'Unknown Species',
          image: item.image_path || ''
        }
      }));
    }
  },
  staleTime: 1000 * 60 * 5, // 5 minutes
  retry: 1,
  refetchOnWindowFocus: false
});

// Set up real-time subscription
let subscription: any = null;

const setupRealtimeSubscription = () => {
  subscription = supabase
    .channel('inference_results_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'inference_results'
      },
      (payload) => {
        console.log('Realtime inference result change:', payload.eventType, payload)
        // Refresh the data when any change occurs
        fetchRecentIdentifications()
      }
    )
    .subscribe((status) => {
      console.log('Realtime subscription status:', status)
    })
}

// Cleanup function for subscription
const cleanupSubscription = () => {
  if (subscription) {
    supabase.removeChannel(subscription)
    subscription = null
  }
}

// Add network status ref
const isNetworkConnected = ref(true);

// Add network change handler
const handleNetworkChange = async (status: { connected: boolean }) => {
  console.log('Network status changed:', status);
  isNetworkConnected.value = status.connected;
  
  if (status.connected) {
    // If we're coming back online
    console.log('Network is back online, refreshing data');
    setupRealtimeSubscription();
    await fetchRecentIdentifications();
  } else {
    // If we're going offline
    console.log('Network is offline, cleaning up subscription');
    cleanupSubscription();
    await fetchRecentIdentifications(); // Fetch from local storage
  }
};

// Update the onMounted hook
onMounted(async () => {
  console.log("%c🍃 RecentIdentifications component mounted", "font-size: 14px; color: green; font-weight: bold;");
  
  // Check initial network status
  const initialStatus = await Network.getStatus();
  isNetworkConnected.value = initialStatus.connected;
  
  // Set up network change listener
  Network.addListener('networkStatusChange', handleNetworkChange);
  
  // Set up real-time subscription only if online
  if (isNetworkConnected.value) {
    setupRealtimeSubscription();
  }
  
  // Fetch initial data
  await fetchRecentIdentifications();
});

// Update onUnmounted to clean up network listener
onUnmounted(() => {
  cleanupSubscription();
  // Remove network listener
  Network.removeAllListeners();
})

// Add modal state
const isModalOpen = ref(false)
const selectedLeaf = ref<any>(null)

const setModalOpen = (open: boolean) => {
  isModalOpen.value = open
}

// Function to handle data changes from LeafInfoModal
const handleLeafDataChange = async (leafId: string) => {
  console.log('Leaf data changed, refreshing data for ID:', leafId);
  
  // Refresh the specific leaf data
  if (selectedLeaf.value?.id === leafId) {
    await fetchLeafData();
  }
  
  // Also refresh the list of recent identifications
  await fetchRecentIdentifications();
}

// Add this query function
const { data: selectedLeafData, refetch: fetchLeafData } = useQuery({
  queryKey: ['leafData', selectedLeaf],
  queryFn: async () => {
    if (!selectedLeaf.value?.id) return null;
    
    const isOnline = (await Network.getStatus()).connected;
    if (isOnline) {
      // Updated query to join with plant_details table
      const { data, error } = await supabase
        .from('inference_results')
        .select(`
          *,
          plant_details(*)
        `)
        .eq('id', selectedLeaf.value.id)
        .single();
      
      if (error) throw error;
      
      // Transform data to include plant_details fields
      if (data) {
        // Get plant details from the joined query
        const details = data.plant_details && data.plant_details.length > 0 
                      ? data.plant_details[0] 
                      : null;
        
        // Return a complete object with both inference and details data
        return {
          ...data,
          // Add leafInfo structure with all needed fields
          leafInfo: {
            name: data.result || 'Unknown Plant',
            scientificName: data.scientific_name || '',
            description: data.description || '',
            habitat: data.habitat || '',
            image: data.image || null,
            growthHabits: data.growth_habits || '',
            // Fields from plant_details
            color: details?.color || '',
            foliage: details?.foliage || '',
            bark: details?.bark || '',
            fruit: details?.fruit || '',
            crown: details?.crown || '',
            trunk: details?.trunk || '',
            leaves: details?.leaves || '',
            retention: details?.retention || '',
            texture: details?.texture || '',
            venation: details?.venation || '',
            behavior: details?.behavior || '',
            edibleUses: details?.edible_uses || '',
            medicinalUses: details?.med_uses || '',
            timberUses: details?.timber_uses || '',
            otherUses: details?.other_uses || '',
            climate: details?.climate || '',
            lifespan: details?.lifespan || '',
            lightNeeds: details?.light_needs || '',
            waterNeeds: details?.water_needs || '',
            soilRequirements: details?.soil_req || '',
            aliases: details?.aliases || []
          }
        };
      }
      
      return data;
    } else {
      // Offline mode: fetch from SQLite
      const offlineResults = await sqliteService.getUnsyncedResults();
      return offlineResults.find(result => result.id === selectedLeaf.value.id);
    }
  },
  enabled: false, // Don't run automatically
  staleTime: 1000 * 60 * 5, // 5 minutes
});

// Modify the openLeafInfo function
const openLeafInfo = async (leaf: any) => {
  selectedLeaf.value = leaf;
  setModalOpen(true);
  
  // Check network status before fetching additional data
  const isOnline = (await Network.getStatus()).connected;
  
  if (isOnline) {
    // Online mode - fetch from Supabase
    await fetchLeafData();
  } else {
    // Offline mode - format the existing data for the modal
    // This ensures we're using the SQLite data properly
    console.log('Opening leaf in offline mode:', leaf);
    
    // Get complete inference data with plant details by querying SQLite directly
    try {
      // First try to get full inference data from SQLite
      const offlineResults = await sqliteService.getInferenceResults();
      console.log('Fetched full offline results:', offlineResults);
      
      // Find the matching leaf with all its details
      const fullLeafData = offlineResults.find(result => result.id.toString() === leaf.id.toString());
      
      if (fullLeafData) {
        console.log('Found matching offline data with details:', fullLeafData);
        // Use the fully populated data from SQLite with all plant details
        selectedLeafData.value = {
          id: fullLeafData.id,
          result: fullLeafData.result || 'Unknown Plant',
          scientific_name: fullLeafData.scientific_name || '',
          family_name: fullLeafData.family_name || '',
          description: fullLeafData.description || '',
          habitat: fullLeafData.habitat || '',
          image: fullLeafData.imagePath || '',
          created_at: new Date(fullLeafData.timestamp).toISOString(),
          confidence: fullLeafData.confidence || 0.8,
          synced: fullLeafData.synced || false,
          
          // Include all plant detail fields
          color: fullLeafData.color || '',
          foliage: fullLeafData.foliage || '',
          bark: fullLeafData.bark || '',
          fruit: fullLeafData.fruit || '',
          crown: fullLeafData.crown || '',
          trunk: fullLeafData.trunk || '',
          leaves: fullLeafData.leaves || '',
          retention: fullLeafData.retention || '',
          texture: fullLeafData.texture || '',
          venation: fullLeafData.venation || '',
          behavior: fullLeafData.behavior || '',
          edible_uses: fullLeafData.edible_uses || '',
          med_uses: fullLeafData.med_uses || '',
          timber_uses: fullLeafData.timber_uses || '',
          other_uses: fullLeafData.other_uses || '',
          climate: fullLeafData.climate || '',
          lifespan: fullLeafData.lifespan || '',
          light_needs: fullLeafData.light_needs || '',
          water_needs: fullLeafData.water_needs || '',
          soil_req: fullLeafData.soil_req || '',
          aliases: fullLeafData.aliases || [],
          growthHabits: fullLeafData.growthHabits || '',
          
          // Include the full leafInfo structure for compatibility with LeafInfoModal
          leafInfo: fullLeafData.leafInfo || {
            name: fullLeafData.result || 'Unknown Plant',
            scientificName: fullLeafData.scientific_name || '',
            familyName: fullLeafData.family_name || '',
            description: fullLeafData.description || '',
            habitat: fullLeafData.habitat || '',
            image: fullLeafData.imagePath || '',
            color: fullLeafData.color || '',
            foliage: fullLeafData.foliage || '',
            bark: fullLeafData.bark || '',
            fruit: fullLeafData.fruit || '',
            crown: fullLeafData.crown || '',
            trunk: fullLeafData.trunk || '',
            leaves: fullLeafData.leaves || '',
            retention: fullLeafData.retention || '',
            texture: fullLeafData.texture || '',
            venation: fullLeafData.venation || '',
            behavior: fullLeafData.behavior || '',
            edibleUses: fullLeafData.edible_uses || '',
            medicinalUses: fullLeafData.med_uses || '',
            timberUses: fullLeafData.timber_uses || '',
            otherUses: fullLeafData.other_uses || '',
            climate: fullLeafData.climate || '',
            lifespan: fullLeafData.lifespan || '',
            lightNeeds: fullLeafData.light_needs || '',
            waterNeeds: fullLeafData.water_needs || '',
            soilRequirements: fullLeafData.soil_req || '',
            aliases: fullLeafData.aliases || [],
            growthHabits: fullLeafData.growthHabits || ''
          }
        };
        return;
      }
    } catch (error) {
      console.error('Error fetching complete offline data:', error);
    }
    
    // Fallback to basic data if full details can't be found
    selectedLeafData.value = {
      id: leaf.id,
      result: leaf.leafInfo?.name || leaf.name || 'Unknown Plant',
      scientific_name: leaf.leafInfo?.scientificName || leaf.scientific_name || '',
      family_name: leaf.leafInfo?.familyName || leaf.family_name || '',
      description: leaf.leafInfo?.description || leaf.description || '',
      habitat: leaf.leafInfo?.habitat || leaf.habitat || '',
      image: leaf.leafInfo?.image || leaf.image || '',
      created_at: leaf.created_at || new Date().toISOString(),
      confidence: leaf.inference?.confidence || leaf.confidence || 0.8,
      synced: false, // Assume unsynced in offline mode
      
      // Add color if available
      color: leaf.color || leaf.leafInfo?.color || '',
      growthHabits: leaf.growthHabits || leaf.leafInfo?.growthHabits || '',
      
      // Structure the data in the leafInfo format as well for compatibility
      leafInfo: {
        name: leaf.leafInfo?.name || leaf.name || leaf.result || 'Unknown Plant',
        scientificName: leaf.leafInfo?.scientificName || leaf.scientific_name || '',
        familyName: leaf.leafInfo?.familyName || leaf.family_name || '',
        description: leaf.leafInfo?.description || leaf.description || '',
        habitat: leaf.leafInfo?.habitat || leaf.habitat || '',
        image: leaf.leafInfo?.image || leaf.image || '',
        color: leaf.leafInfo?.color || leaf.color || '',
        growthHabits: leaf.leafInfo?.growthHabits || leaf.growthHabits || ''
      }
    };
  }
}

// Add refresher handler
const handleRefresh = async (event: CustomEvent) => {
  console.log('Pull to refresh triggered in Recent Identifications');
  try {
    // Check network status and update component state
    const networkStatus = await Network.getStatus();
    isNetworkConnected.value = networkStatus.connected;
    
    if (networkStatus.connected) {
      // Online - refresh from server
      setupRealtimeSubscription();
      await fetchRecentIdentifications();
    } else {
      // Offline - refresh from SQLite
      await fetchRecentIdentifications(); // This will use SQLite in offline mode
    }
  } catch (error) {
    console.error('Error during refresh:', error);
  } finally {
    // Always complete the refresher
    setTimeout(() => {
      // Use type assertion for TypeScript
      const refresher = event.target as HTMLIonRefresherElement;
      if (refresher && refresher.complete) {
        refresher.complete();
        console.log('Refresh completed');
      }
    }, 500);
  }
};
</script>

<style scoped>
.icon {
  font-size: 1.5rem;
  color: #5a9155;
}

.recent-identifications {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-title {
  color: var(--ion-color-dark);
  font-weight: bold;
}

.view-all {
  font-size: 0.9rem;
  color: var(--ion-color-primary);
  text-decoration: none;
}

.scroll-wrapper {
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 10px;
}

.scroll-container {
  display: flex;
  gap: 16px;
}

.card-item {
  flex: 0 0 auto;
  width: 150px;
  height: 200px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.empty-icon {
  font-size: 4rem;
  color: var(--ion-color-medium);
  margin-bottom: 10px;
}

.empty-subtitle {
  color: var(--ion-color-medium);
  text-align: center;
}

/* Debug styles */
.debug-info {
  background-color: rgba(255, 255, 0, 0.1);
  padding: 5px;
  border: 1px dashed #ccc;
  margin-bottom: 10px;
  font-size: 0.8rem;
  color: #555;
}

.test-card-section {
  margin-top: 20px;
  border-top: 1px dashed #ccc;
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
