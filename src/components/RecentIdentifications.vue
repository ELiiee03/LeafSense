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

    <div v-if="templateConditions.showLoading" class="loading-container">
      <ion-spinner name="dots" />
      <p>Loading recent identifications...</p>
    </div>

    <div v-else-if="templateConditions.showEmpty" class="empty-container">
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
import { ref, onMounted, onUnmounted, watchEffect, computed } from 'vue'
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

// Add network status ref
const isNetworkConnected = ref(true);
// Add a UI-specific network state that updates instantly for UI renders
const uiNetworkState = ref(true);

// Add network change handler
const handleNetworkChange = async (status: { connected: boolean }) => {
  console.log('Network status changed:', status);
  
  // Update UI state IMMEDIATELY for faster UI rendering
  uiNetworkState.value = status.connected;
  
  // Then update the actual network state for data operations
  isNetworkConnected.value = status.connected;
  
  if (status.connected) {
    // If we're coming back online
    console.log('Network is back online, refreshing data');
    setupRealtimeSubscription();
    // Don't block UI on data fetch
    setTimeout(() => {
      fetchRecentIdentifications().catch(err => 
        console.error('Error fetching data after coming online:', err)
      );
    }, 0);
  } else {
    // If we're going offline
    console.log('Network is offline, cleaning up subscription');
    cleanupSubscription();
    // Don't block UI on data fetch
    setTimeout(() => {
      fetchRecentIdentifications().catch(err => 
        console.error('Error fetching offline data:', err)
      );
    }, 0);
  }
};

// Get recent identifications with vue-query
const { data: recentLeaves, isLoading, error, refetch: fetchRecentIdentifications } = useQuery({
  queryKey: ['recentIdentifications'],
  queryFn: async () => {
    // Use the current network state without rechecking with Network.getStatus()
    // This prevents blocking on potentially slow network calls
    const isOnline = isNetworkConnected.value;
    
    // Add a timeout wrapper for network operations
    const withTimeout = <T>(promise: Promise<T> | PromiseLike<T>, ms = 2000): Promise<T> => { // Reduce timeout to 2s from 3s
      let timeoutId: ReturnType<typeof setTimeout>;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Operation timed out')), ms);
      });
      
      return Promise.race([promise, timeoutPromise])
        .finally(() => clearTimeout(timeoutId));
    };
    
    if (isOnline) {
      try {
        const promise = supabase
          .from('inference_results')
          .select('id, created_at, result, scientific_name, family_name, confidence, image')
          .order('created_at', { ascending: false })
          .limit(5);
        
        const { data, error } = await withTimeout(promise as unknown as Promise<{data: any[], error: any}>);
        
        if (error) throw error;
        return data.map((item: any) => ({
          id: item.id?.toString() || generateRandomId(),
          created_at: item.created_at || new Date().toISOString(),
          formattedDate: formatRelativeDate(item.created_at),
          inference: { 
            confidence: parseFloat(item.confidence) || 0
          },
          leafInfo: {
            name: item.result || 'Unknown Leaf',
            scientificName: item.scientific_name || 'Unknown Species',
            familyName: item.family_name || 'Unknown Family',
            image: item.image || ''
          }
        }));
      } catch (err) {
        console.error('Error in online fetch, falling back to offline:', err);
        // Fall back to offline mode on error - update both states
        isNetworkConnected.value = false;
        uiNetworkState.value = false;
        
        // Return offline data
        const offlineResults = await sqliteService.getUnsyncedResults();
        return offlineResults.map(item => ({
          id: item.id?.toString() || generateRandomId(),
          created_at: new Date(item.timestamp).toISOString(),
          formattedDate: formatRelativeDate(new Date(item.timestamp).toISOString()),
          inference: { 
            confidence: parseFloat(item.confidence) || 0
          },
          leafInfo: {
            name: item.predicted_class || 'Unknown Leaf',
            scientificName: item.scientific_name || 'Unknown Species',
            familyName: item.family_name || 'Unknown Family',
            image: item.image_path || ''
          }
        }));
      }
    } else {
      // Offline mode: fetch from SQLite
      const offlineResults = await sqliteService.getUnsyncedResults();
      return offlineResults.map(item => ({
        id: item.id?.toString() || generateRandomId(),
        created_at: new Date(item.timestamp).toISOString(),
        formattedDate: formatRelativeDate(new Date(item.timestamp).toISOString()),
        inference: { 
          confidence: parseFloat(item.confidence) || 0
        },
        leafInfo: {
          name: item.predicted_class || 'Unknown Leaf',
          scientificName: item.scientific_name || 'Unknown Species',
          familyName: item.family_name || 'Unknown Family',
          image: item.image_path || ''
        }
      }));
    }
  },
  staleTime: 1000 * 60 * 5, // 5 minutes
  retry: 1,
  refetchOnWindowFocus: false,
  // Add these options to make network transitions smoother
  refetchInterval: false,
  placeholderData: (previousData) => previousData // Replace keepPreviousData with placeholderData
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
    
    // Use existing network state instead of checking again
    if (isNetworkConnected.value) {
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
      
      console.log('Modal data fetched from Supabase:', data);
      
      // Transform data to include plant_details fields
      if (data) {
        // Get plant details from the joined query
        const details = data.plant_details && data.plant_details.length > 0 
                      ? data.plant_details[0] 
                      : null;
        
        // Return a complete object with both inference and details data
        return {
          ...data,
          // Ensure confidence is properly formatted as a number between 0-1
          confidence: parseFloat(data.confidence) || 0, // Convert to number and default to 0 if null
          // Add inference property for compatibility with LeafInfoModal
          inference: {
            confidence: parseFloat(data.confidence) || 0
          },
          // Add leafInfo structure with all needed fields
          leafInfo: {
            name: data.result || 'Unknown Plant',
            scientificName: data.scientific_name || '',
            familyName: data.family_name || 'Unknown Family',
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
      return offlineResults.find(result => result.id === selectedLeaf.value?.id);
    }
  },
  enabled: false, // Don't run automatically
  staleTime: 1000 * 60 * 5, // 5 minutes
});

// Modify the openLeafInfo function to not check network status again
const openLeafInfo = async (leaf: any) => {
  selectedLeaf.value = leaf;
  setModalOpen(true);
  
  // Use the existing network state instead of checking again
  // This makes the UI response much faster
  if (isNetworkConnected.value) {
    // Online mode - fetch from Supabase
    fetchLeafData().catch(err => console.error('Error fetching leaf data:', err));
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
          confidence: parseFloat(fullLeafData.confidence) || 0,
          // Add inference property for compatibility with LeafInfoModal
          inference: {
            confidence: parseFloat(fullLeafData.confidence) || 0
          },
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
      confidence: parseFloat(leaf.inference?.confidence) || 0,
      // Add inference property for direct compatibility
      inference: {
        confidence: parseFloat(leaf.inference?.confidence) || 0
      },
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

// Update the onMounted hook
onMounted(async () => {
  console.log("%c🍃 RecentIdentifications component mounted", "font-size: 14px; color: green; font-weight: bold;");
  
  try {
    // Update the network status check functions
    const checkNetworkWithTimeout = async (): Promise<{connected: boolean}> => {
      return Promise.race([
        Network.getStatus(),
        new Promise<{connected: boolean}>((_, reject) => {
          setTimeout(() => reject(new Error('Network check timed out')), 2000);
        })
      ]).catch(err => {
        console.warn('Network check timed out, assuming offline:', err);
        return { connected: false };
      });
    };
    
    const initialStatus = await checkNetworkWithTimeout();
    isNetworkConnected.value = initialStatus?.connected ?? false;
    
    // Set up network change listener
    Network.addListener('networkStatusChange', handleNetworkChange);
    
    // Set up real-time subscription only if online
    if (isNetworkConnected.value) {
      setupRealtimeSubscription();
    }
    
    // Fetch initial data - don't await
    setTimeout(() => {
      fetchRecentIdentifications().catch(err => 
        console.error('Error in initial data fetch:', err)
      );
    }, 0);
  } catch (error) {
    console.error('Error during component initialization:', error);
    isNetworkConnected.value = false;
  }
});

// Update onUnmounted to clean up network listener
onUnmounted(() => {
  cleanupSubscription();
  // Remove network listener
  Network.removeAllListeners();
})

// Update handleRefresh function to be even more responsive
const handleRefresh = async (event: CustomEvent) => {
  console.log('Pull to refresh triggered in Recent Identifications');
  try {
    // Update UI immediately
    const refresher = event.target as HTMLIonRefresherElement;
    
    // Check network with a shorter timeout (1 second)
    const networkStatus = await Promise.race([
      Network.getStatus(),
      new Promise<{connected: boolean}>((_, reject) => {
        setTimeout(() => reject(new Error('Network check timed out')), 1000);
      })
    ]).catch(() => ({ connected: false }));
    
    // Update both states immediately
    uiNetworkState.value = networkStatus.connected;
    isNetworkConnected.value = networkStatus.connected;
    
    // Trigger refresh asynchronously and complete the refresher immediately
    setTimeout(() => {
      if (networkStatus.connected) {
        setupRealtimeSubscription();
      } else {
        cleanupSubscription();
      }
      fetchRecentIdentifications();
    }, 0);
    
    // Complete the refresher IMMEDIATELY instead of waiting
    if (refresher && refresher.complete) {
      refresher.complete();
      console.log('Refresh completed immediately');
    }
  } catch (error) {
    console.error('Error during refresh:', error);
    
    // Always complete the refresher even on error
    const refresher = event.target as HTMLIonRefresherElement;
    if (refresher && refresher.complete) {
      refresher.complete();
    }
  }
};

// Modify template to use uiNetworkState for conditional rendering
const templateConditions = computed(() => {
  return {
    showEmpty: !isLoading.value && (!recentLeaves.value || recentLeaves.value.length === 0),
    showLoading: isLoading.value,
    showOfflineIndicator: !uiNetworkState.value
  };
});
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
