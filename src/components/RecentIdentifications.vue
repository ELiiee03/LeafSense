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

    <div v-if="isLoading" class="loading-container">
      <ion-spinner name="dots" />
      <p>Loading recent identifications...</p>
    </div>

    <div v-else-if="recentLeaves?.length === 0" class="empty-container">
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

// Update the onMounted hook
onMounted(async () => {
  console.log("%c🍃 RecentIdentifications component mounted", "font-size: 14px; color: green; font-weight: bold;");
  
  // Set up real-time subscription only if online
  const isOnline = (await Network.getStatus()).connected;
  if (isOnline) {
    setupRealtimeSubscription();
  }
});

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
