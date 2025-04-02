<template>
  <!-- Add Filter Component -->
  <FilterComponent :allLogs="allLogs" @filter-changed="handleFilterChange" />
  
  <ion-list>
    <NetworkAwareComponent @online="handleNetworkOnline" @offline="handleNetworkOffline" @refresh="refreshLogs">
      <template #online>
    <ion-card v-for="log in logs" :key="log.id">
      <ion-item-sliding>
        <ion-item button @click="openLeafInfo(log)" :detail="false">
          <ion-thumbnail>
            <img 
              :alt="log.result || 'Leaf image'" 
              :src="log.image || 'https://ionicframework.com/docs/img/demos/thumbnail.svg'" 
              @error="handleImageError"
            />
          </ion-thumbnail>
          <ion-label>
            <strong>{{ log.result }}</strong>
            <br />
            <i><ion-text>{{ log.scientific_name }}</ion-text></i>
            <div class="timestamp-wrapper">
              <ion-icon :icon="timeOutline" size="small"></ion-icon>
              <ion-note color="medium" class="ion-text-wrap">
                {{ formatTimestamp(log.created_at) }}
              </ion-note>
            </div>
          </ion-label>
          <div class="metadata-end-wrapper" slot="end">
            <ion-chip :color="log.synced === false ? 'warning' : 'success'" class="sync-status-chip">
              <ion-icon v-if="log.synced === false" :icon="cloudOfflineOutline"></ion-icon>
              <ion-icon v-else :icon="cloudDoneOutline"></ion-icon>
              {{ log.synced === false ? 'Pending' : 'Synced' }}
            </ion-chip>
            <ion-icon color="medium" :icon="chevronForward"></ion-icon>
          </div>
        </ion-item>

        <ion-item-options>
          <ion-item-option>Favorite</ion-item-option>
          <ion-item-option color="danger" @click="deleteLog(log)">Delete</ion-item-option>
        </ion-item-options>
      </ion-item-sliding>
    </ion-card>

    <!-- Empty state when no logs match the filters -->
    <div class="empty-state" v-if="logs.length === 0 && !loading">
      <ion-icon :icon="leafOutline" size="large"></ion-icon>
      <p>No leaves match your filter criteria</p>
      <ion-button fill="clear" @click="resetFilters">Reset Filters</ion-button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <ion-spinner></ion-spinner>
    </div>
      </template>
      
      <template #offline>
        <div class="offline-logs-container">
          <div class="offline-header">
            <ion-icon :icon="cloudOfflineOutline" size="large"></ion-icon>
            <h3>Offline Mode</h3>
            <p>Showing locally stored data</p>
          </div>
          
          <ion-card v-for="log in offlineLogs" :key="log.id">
            <ion-item-sliding>
              <ion-item button @click="openLeafInfo(log)" :detail="false">
                <ion-thumbnail>
                  <img 
                    :alt="log.result || 'Leaf image'" 
                    :src="log.image || 'https://ionicframework.com/docs/img/demos/thumbnail.svg'" 
                    @error="handleImageError"
                  />
                </ion-thumbnail>
                <ion-label>
                  <strong>{{ log.result }}</strong>
                  <br />
                  <i><ion-text>{{ log.scientific_name }}</ion-text></i>
                  <div class="timestamp-wrapper">
                    <ion-icon :icon="timeOutline" size="small"></ion-icon>
                    <ion-note color="medium" class="ion-text-wrap">
                      {{ formatTimestamp(log.created_at) }}
                    </ion-note>
                  </div>
                </ion-label>
                <div class="metadata-end-wrapper" slot="end">
                  <ion-chip color="warning" class="sync-status-chip">
                    <ion-icon :icon="cloudOfflineOutline"></ion-icon>
                    Pending
                  </ion-chip>
                  <ion-icon color="medium" :icon="chevronForward"></ion-icon>
                </div>
              </ion-item>
            </ion-item-sliding>
          </ion-card>
          
          <!-- Empty offline state -->
          <div class="empty-state" v-if="offlineLogs.length === 0 && !loading">
            <ion-icon :icon="leafOutline" size="large"></ion-icon>
            <p>No offline data available</p>
          </div>
        </div>
      </template>
    </NetworkAwareComponent>

    <!-- Use LeafInfoModal as a reusable component -->
    <LeafInfoModal :isOpen="isOpen" :onClose="() => setOpen(false)" :leaf="selectedLeaf" />
  </ion-list>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { chevronForward, leafOutline, timeOutline, cloudOfflineOutline, cloudDoneOutline } from 'ionicons/icons';
import { IonThumbnail, IonChip, IonCard, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonNote, IonText, IonButton, IonIcon, IonSpinner, alertController, toastController } from '@ionic/vue';
import { supabase } from '@/supabaseClient';
import { sqliteService } from '@/services/sqliteService';
import { networkState, initNetworkService } from '@/services/networkService';
import LeafInfoModal from './LeafInfoModal.vue';
import FilterComponent from './FilterComponent.vue';
import { useLogsQuery, useDeleteLogMutation, useSyncMutation } from '@/services/queryService';
import NetworkAwareComponent from './NetworkAwareComponent.vue';

export default defineComponent({
  components: {
    IonItem,
    IonCard,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonList,
    LeafInfoModal,
    FilterComponent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonChip,
    IonThumbnail,
    NetworkAwareComponent,
  },
  
  setup(props, { emit }) {
    interface Log {
      id: number;
      result: string;          // Common name
      scientific_name: string;
      family_name: string;
      description: string; 
      created_at: string;      // Use Supabase's timestamp field
      habitat?: string;        // Optional field
      growthHabits?: string;   // Added growth habits field  
      image?: string;          // Added image field
      synced?: boolean;        // Track sync status
    }

    const page = ref(1);
    const isOpen = ref(false);
    const selectedLeaf = ref<Log | null>(null);
    const error = ref<string | null>(null);
    const isOnline = computed(() => networkState.isOnline.value);
    const offlineLogs = ref<Log[]>([]);
    
    // Network handling methods
    const handleNetworkOnline = async () => {
      console.log('Network is online, reloading data from server');
      await syncPendingData();
      refreshLogs();
    };
    
    const handleNetworkOffline = () => {
      console.log('Network is offline, loading data from local storage');
      loadOfflineData();
    };
    
    const syncPendingData = async () => {
      try {
        await syncMutation.mutateAsync();
        console.log('Pending data synced');
      } catch (error) {
        console.error('Error syncing data:', error);
      }
    };
    
    const loadOfflineData = async () => {
      try {
        // Load logs from SQLite
        const localLogs = await sqliteService.getInferenceResults();
        offlineLogs.value = localLogs.map(log => {
          // Parse the result JSON if stored as string
          let parsedResult;
          try {
            parsedResult = typeof log.result === 'string' ? JSON.parse(log.result) : log.result;
          } catch (e) {
            parsedResult = { leafInfo: { name: 'Unknown' } };
          }
          
          return {
            id: log.id,
            result: parsedResult?.leafInfo?.name || 'Unknown',
            scientific_name: parsedResult?.leafInfo?.scientificName || '',
            family_name: parsedResult?.leafInfo?.familyName || '',
            description: parsedResult?.leafInfo?.description || '',
            created_at: log.timestamp || new Date().toISOString(),
            habitat: parsedResult?.leafInfo?.habitat || '',
            growthHabits: parsedResult?.leafInfo?.growthHabits || '',
            image: log.imagePath || '',
            synced: false,
          };
        });
      } catch (error) {
        console.error('Error loading offline data:', error);
        offlineLogs.value = [];
      }
    };
    
    const refreshLogs = async () => {
      // Reset pagination and reload data
      page.value = 1;
      await useLogsQuery(page.value).refetch();
      
      if (!isOnline.value) {
        await loadOfflineData();
      }
    };

    // Use TanStack Query hooks
    const { data: logsData, isLoading, isError } = useLogsQuery(page.value);
    const deleteMutation = useDeleteLogMutation();
    const syncMutation = useSyncMutation();

    // Computed properties for logs
    const allLogs = computed(() => logsData.value || []);
    const logs = ref<Log[]>([]);

    // Watch for data changes
    watch(logsData, (newData) => {
      if (newData) {
        if (page.value === 1) {
          logs.value = newData;
        } else {
          logs.value = [...logs.value, ...newData];
        }
      }
    }, { immediate: true });

    // Watch the loading state and emit it to parent
    watch(isLoading, (newValue) => {
      emit('loading-changed', newValue);
    });

    const setOpen = (open: boolean) => {
      isOpen.value = open;
    };

    const openLeafInfo = (log: Log) => {
      selectedLeaf.value = log;
      setOpen(true);
    };

    const formatTimestamp = (timestamp: string) => {
      return new Date(timestamp).toLocaleString();
    };

    // Handler for filter changes from FilterComponent
    const handleFilterChange = (filteredLogs: Log[]) => {
      logs.value = filteredLogs;
    };

    // Reset filters and show all logs
    const resetFilters = () => {
      logs.value = [...allLogs.value];
    };

    const handleImageError = (event: Event) => {
      const imgElement = event.target as HTMLImageElement;
      console.error('Error loading image:', imgElement.src);
      imgElement.src = 'https://ionicframework.com/docs/img/demos/thumbnail.svg';
    };

    // Add delete functionality
    const deleteLog = async (log: Log) => {
      try {
        const alert = await alertController.create({
          header: 'Confirm Delete',
          message: 'Are you sure you want to delete this leaf data? This action cannot be undone.',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: async () => {
                try {
                  await deleteMutation.mutateAsync(log);
                  
                  // Update the local logs array to remove the deleted item
                  logs.value = logs.value.filter(item => item.id !== log.id);
                  
                  const toast = await toastController.create({
                    message: 'Item deleted successfully',
                    duration: 2000,
                    color: 'success',
                    position: 'top'
                  });
                  await toast.present();
                } catch (err) {
                  console.error('Error deleting log:', err);
                  
                  // Check for specific error types
                  let errorMessage = 'Failed to delete';
                  
                  if (err instanceof Error) {
                    errorMessage = err.message;
                    
                    // Handle special cases
                    if (errorMessage.includes('409') || errorMessage.includes('constraint')) {
                      errorMessage = 'Cannot delete this item because it is referenced by other data';
                    }
                  }
                  
                  const toast = await toastController.create({
                    message: errorMessage,
                    duration: 3000,
                    color: 'danger',
                    position: 'top'
                  });
                  await toast.present();
                }
              }
            }
          ]
        });
        
        await alert.present();
      } catch (error) {
        console.error('Error in deleteLog:', error);
      }
    };

    // Set up real-time subscription
    let subscription: any = null;

    const setupRealtimeSubscription = () => {
      if (!isOnline.value) return;
      
      if (subscription) {
        supabase.removeChannel(subscription);
      }

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
            // Add new item to the beginning of the list
            if (logs.value) {
              const newLog = payload.new as Log;
              logs.value = [newLog, ...logs.value];
            }
          }
        )
        .subscribe();
    };

    // Add scroll handler for infinite loading
    const handleScroll = async (event: Event) => {
      if (!isOnline.value) return; // Don't load more in offline mode
      
      const target = event.target as HTMLElement;
      if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
        if (!isLoading.value) {
          page.value++;
        }
      }
    };

    onMounted(async () => {
      // Initialize network service
      await initNetworkService();
      
      // Check current network status and initialize
      if (isOnline.value) {
        setupRealtimeSubscription();
      } else {
        await loadOfflineData();
      }

      // Add scroll event listener
      const content = document.querySelector('ion-content');
      if (content) {
        content.addEventListener('scroll', handleScroll);
      }
    });

    onUnmounted(() => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }

      // Remove scroll event listener
      const content = document.querySelector('ion-content');
      if (content) {
        content.removeEventListener('scroll', handleScroll);
      }
    });

    return {
      chevronForward,
      leafOutline,
      timeOutline,
      cloudOfflineOutline,
      cloudDoneOutline,
      logs,
      offlineLogs,
      allLogs,
      isOpen,
      setOpen,
      selectedLeaf,
      openLeafInfo,
      formatTimestamp,
      loading: isLoading,
      error: isError,
      handleFilterChange,
      resetFilters,
      handleImageError,
      deleteLog,
      refreshLogs,
      handleNetworkOnline,
      handleNetworkOffline
    };
  },
  emits: ['loading-changed']
});
</script>

<style scoped>
ion-thumbnail {
  margin-right: 10px;
}

img {
  border-radius: 8px;
}

.unread-indicator {
  background: var(--ion-color-primary);
  width: 10px;
  height: 10px;
  border-radius: 100%;
  position: absolute;
  inset-inline-start: 12px;
  top: 12px;
}

.timestamp-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.metadata-end-wrapper {
  position: absolute;
  top: 10px;
  inset-inline-end: 10px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
}

.sync-status-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
}

ion-item {
  --background: #F8F8FF;
}

/* Empty state styles */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--ion-color-medium);
}

.empty-state p {
  margin: 8px 0;
  font-size: 16px;
}

/* Offline mode styles */
.offline-logs-container {
  padding: 10px;
}

.offline-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.offline-header ion-icon {
  font-size: 32px;
  color: var(--ion-color-warning);
  margin-bottom: 10px;
}

.offline-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-color-dark);
}

.offline-header p {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

/* Loading state */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 20px;
}

ion-text-wrap {
  margin-top: 20px;
}

ion-card {
  border-radius: 15px;
}

ion-note {
  margin-top: 6px;
  display: inline-block;
}
</style>