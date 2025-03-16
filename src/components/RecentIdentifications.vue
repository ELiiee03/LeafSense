<template>
  <div class="recent-identifications">
    <div class="header">
      <h4 class="section-title">
        <ion-icon :icon="timeOutline" class="icon" />
        Recent Identifications
      </h4>
      <router-link to="/history" class="view-all">View All →</router-link>
    </div>

    <div v-if="isLoading" class="loading-container">
      <ion-spinner name="dots" />
      <p>Loading recent identifications...</p>
    </div>

    <div v-else-if="recentLeaves.length === 0" class="empty-container">
      <ion-icon :icon="leafOutline" class="empty-icon" />
      <p>No leaf identifications yet</p>
      <p class="empty-subtitle">Identify your first leaf to see it here</p>
      
      <!-- Test card to verify LeafCard component works -->
      <div class="test-card-section">
        <p>Test card below:</p>
        <LeafCard :leaf="testLeaf" class="card-item" />
      </div>
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
      :leaf="selectedLeaf" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { timeOutline, leafOutline } from 'ionicons/icons'
import LeafCard from './LeafCards.vue'
import LeafInfoModal from './LeafInfoModal.vue'
import { supabase } from '@/supabaseClient'
import { RouterLink } from 'vue-router'
import { IonSpinner, IonIcon } from '@ionic/vue'
import defaultLeafImage from '@/assets/pine needle.jpg'

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

// Data to store recent identifications
const recentLeaves = ref<LeafData[]>([])

// Loading state
const isLoading = ref(true)

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

// Fallback to a simple query if the complex one fails
const fetchSimpleRecentIdentifications = async () => {
  try {
    console.log('Trying simple fallback query...')
    const { data, error } = await supabase
      .from('inference_results')
      .select('id, created_at, result, scientific_name, confidence, image')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('Error fetching simple identifications:', error)
      return
    }
    
    console.log('Simple fallback data:', data)
    
    if (!data || data.length === 0) {
      console.log('No data returned from simple query')
      return
    }
    
    // Simple direct mapping without fancy grouping
    recentLeaves.value = data.map(item => {
      // Make sure we have valid data by checking for null/undefined
      const id = item.id?.toString() || generateRandomId();
      const created_at = item.created_at || new Date().toISOString();
      const confidence = typeof item.confidence === 'number' ? item.confidence : 0;
      const name = item.result || 'Unknown Leaf';
      const scientificName = item.scientific_name || 'Unknown Species';
      
      return {
        id,
        created_at,
        formattedDate: formatRelativeDate(created_at),
        inference: { 
          confidence
        },
        leafInfo: {
          name,
          scientificName,
          image: item.image || ''
        }
      };
    });
    
    console.log('Simple recentLeaves value:', recentLeaves.value)
  } catch (error) {
    console.error('Failed to fetch simple identifications:', error)
  } finally {
    isLoading.value = false
  }
}

// Fetch recent identifications from Supabase
const fetchRecentIdentifications = async () => {
  isLoading.value = true
  try {
    console.log('Fetching identifications...')
    // Fetch a larger number to ensure we have enough data for grouping
    const { data, error } = await supabase
      .from('inference_results')
      .select('id, created_at, result, scientific_name, confidence, image')
      .order('created_at', { ascending: false })
      .limit(30) // Increased limit to have enough data for grouping
    
    if (error) {
      console.error('Error fetching identifications:', error)
      // Try the simple fallback query
      await fetchSimpleRecentIdentifications()
      return
    }
    
    console.log('Raw data from Supabase:', data)
    if (!data || data.length === 0) {
      console.log('No data returned from Supabase')
      isLoading.value = false
      return
    }
    
    // Transform data to include formatted date
    const formattedData: ExtendedLeafData[] = data.map(item => {
      // Make sure we have valid data by checking for null/undefined
      const id = item.id?.toString() || generateRandomId();
      const created_at = item.created_at || new Date().toISOString();
      const confidence = typeof item.confidence === 'number' ? item.confidence : 0;
      const name = item.result || 'Unknown Leaf';
      const scientificName = item.scientific_name || 'Unknown Species';
      
      return {
        id,
        created_at,
        formattedDate: formatRelativeDate(created_at),
        inference: { 
          confidence
        },
        leafInfo: {
          name,
          scientificName,
          image: item.image || ''
        },
        // Keep the original date info for sorting within groups
        dateObj: new Date(created_at)
      };
    });
    
    console.log('Formatted data:', formattedData)
    
    // Group by formatted date
    const groupedByDate: GroupedData = formattedData.reduce<GroupedData>((groups, item) => {
      const date = item.formattedDate || '';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {})
    
    console.log('Grouped by date:', groupedByDate)
    
    // Get only the most recent item from each date group
    const representative = Object.keys(groupedByDate).map(date => {
      // Sort by dateObj (in case there are multiple entries in a day)
      const sorted = groupedByDate[date].sort((a, b) => 
        b.dateObj.getTime() - a.dateObj.getTime()
      );
      // Return the most recent entry
      return sorted[0];
    });
    
    console.log('Representative items:', representative)
    
    // Sort by recency order: Today, Yesterday, 3 days ago, A week ago, etc.
    const dateOrder = ['Today', 'Yesterday', '3 days ago', 'A week ago'];
    
    representative.sort((a, b) => {
      const aIndex = dateOrder.indexOf(a.formattedDate || '');
      const bIndex = dateOrder.indexOf(b.formattedDate || '');
      
      // If both dates are in our predefined order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      } 
      // If only a is in the predefined order
      else if (aIndex !== -1) {
        return -1;
      } 
      // If only b is in the predefined order
      else if (bIndex !== -1) {
        return 1;
      } 
      // Otherwise sort by date
      else {
        return b.dateObj.getTime() - a.dateObj.getTime();
      }
    });
    
    console.log('Sorted representative items:', representative)
    
    // Remove the temporary dateObj property
    recentLeaves.value = representative.map(({ dateObj, ...item }) => item);
    
    console.log('Final recentLeaves value:', recentLeaves.value)
    
    // If we ended up with no leaves after all the processing, try the simple fallback
    if (recentLeaves.value.length === 0) {
      console.log('Complex query produced no results, trying fallback...')
      await fetchSimpleRecentIdentifications()
    }
    
  } catch (error) {
    console.error('Failed to fetch leaf identifications:', error)
    // Try the simple fallback query
    await fetchSimpleRecentIdentifications()
  } finally {
    isLoading.value = false
  }
}

// Set up real-time subscription
let subscription: any = null;

const setupRealtimeSubscription = () => {
  subscription = supabase
    .channel('inference_results_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'inference_results'
      },
      (payload) => {
        console.log('New inference result:', payload)
        // Refresh the data when a new record is added
        fetchRecentIdentifications()
      }
    )
    .subscribe()
}

// Cleanup function for subscription
const cleanupSubscription = () => {
  if (subscription) {
    supabase.removeChannel(subscription)
    subscription = null
  }
}

// Call the fetch function and set up subscription when component mounts
onMounted(async () => {
  console.log("%c🍃 RecentIdentifications component mounted", "font-size: 14px; color: green; font-weight: bold;");
  
  // Check Supabase connection
  try {
    console.log("Checking Supabase connection...")
    
    // Test if Supabase client is initialized
    if (!supabase) {
      console.error("Supabase client is not initialized")
    } else {
      console.log("Supabase client is initialized")
      
      // Check if we can get table info
      const { data, error } = await supabase
        .from('inference_results')
        .select('count()')
        .limit(1)
      
      if (error) {
        console.error("Error accessing inference_results table:", error)
      } else {
        console.log("Successfully accessed inference_results table, count:", data)
      }
    }
  } catch (e) {
    console.error("Error checking Supabase connection:", e)
  }
  
  // Proceed with normal initialization
  fetchRecentIdentifications()
  setupRealtimeSubscription()
})

// Clean up subscription when component unmounts
onUnmounted(() => {
  cleanupSubscription()
})

// Add modal state
const isModalOpen = ref(false)
const selectedLeaf = ref<any>(null)

const setModalOpen = (open: boolean) => {
  isModalOpen.value = open
}

// Add function to open leaf info
const openLeafInfo = (leaf: any) => {
  selectedLeaf.value = leaf
  setModalOpen(true)
}
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