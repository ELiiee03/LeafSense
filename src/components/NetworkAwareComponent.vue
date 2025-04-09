<template>
  <div class="network-aware-container">
    <!-- Show online content when network is available -->
    <div v-if="isOnline">
      <slot name="online"></slot>
    </div>
    
    <!-- Show offline content when network is unavailable -->
    <div v-else>
      <slot name="offline">
        <!-- Default offline UI if no offline slot is provided -->
        <div class="offline-fallback">
          <ion-icon :icon="cloudOfflineOutline" size="large"></ion-icon>
          <h3>You're offline</h3>
          <p>This content requires an internet connection</p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { cloudOfflineOutline, refreshOutline } from 'ionicons/icons';
import { IonIcon, IonButton, IonSpinner } from '@ionic/vue';
import { networkState, onNetworkChange, initNetworkService } from '@/services/networkService';

// Props to customize behavior
const props = defineProps({
  // Whether to automatically retry loading when connection is restored
  autoRefresh: {
    type: Boolean,
    default: true
  },
  // Whether to force refresh content when component is mounted
  refreshOnMount: {
    type: Boolean,
    default: false
  },
});

// Emit events when network status changes
const emit = defineEmits(['online', 'offline', 'refresh']);

// Local reactive state
const isRefreshing = ref(false);
const isOnline = computed(() => networkState.isOnline.value);

// Track last network state to detect changes
let unsubscribe: (() => void) | null = null;

// Handle network status changes
const handleNetworkChange = async (status: { connected: boolean }) => {
  if (status.connected) {
    emit('online');
    
    // Auto refresh content when coming back online if autoRefresh is enabled
    if (props.autoRefresh) {
      refreshContent();
    }
  } else {
    emit('offline');
  }
};

// Function to refresh content
const refreshContent = async () => {
  if (isRefreshing.value) return;
  
  isRefreshing.value = true;
  emit('refresh');
  
  // Simulate a minimum refresh time for better UX
  setTimeout(() => {
    isRefreshing.value = false;
  }, 800);
};

// Setup component
onMounted(async () => {
  // Initialize network service
  await initNetworkService();
  
  // Set up network change listener
  unsubscribe = onNetworkChange(handleNetworkChange);
  
  // Emit initial state
  if (isOnline.value) {
    emit('online');
  } else {
    emit('offline');
  }
  
  // Initial refresh if requested
  if (props.refreshOnMount) {
    refreshContent();
  }
  
  // Watch for network state changes
  watch(() => networkState.lastUpdated.value, () => {
    if (isOnline.value && props.autoRefresh) {
      refreshContent();
    }
  });
});

// Clean up
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

// Expose refresh method to parent components
defineExpose({
  refresh: refreshContent
});
</script>

<style scoped>
.network-aware-container {
  width: 100%;
  height: 100%;
}

.offline-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background-color: var(--background);
  border-radius: 8px;
  margin: 1rem 0;
}

.offline-fallback ion-icon {
  font-size: 3rem;
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

.offline-fallback h3 {
  margin: 0 0 0.5rem 0;
  color: var(--ion-color-dark);
}

.offline-fallback p {
  margin: 0;
  color: var(--ion-color-medium);
}
</style> 