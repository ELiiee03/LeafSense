<template>
  <!-- Add Filter Component -->
  <FilterComponent :allLogs="allLogs" @filter-changed="handleFilterChange" />
  
  <ion-list>
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
import { Network } from '@capacitor/network';
import LeafInfoModal from './LeafInfoModal.vue';
import FilterComponent from './FilterComponent.vue';
import { useLogsQuery, useDeleteLogMutation, useSyncMutation } from '@/services/queryService';

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
    const isOnline = ref(true);

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

    // Monitor network status
    const checkNetworkStatus = async () => {
      const status = await Network.getStatus();
      isOnline.value = status.connected;
      return status.connected;
    };

    // Set up real-time subscription
    let subscription: any = null;

    const setupRealtimeSubscription = () => {
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

    // Add scroll handler for infinite loading
    const handleScroll = async (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
        if (!isLoading.value) {
          page.value++;
        }
      }
    };

    onMounted(async () => {
      // Set up network listener
      Network.addListener('networkStatusChange', async (status) => {
        console.log('Network status changed:', status);
        isOnline.value = status.connected;
        
        if (status.connected) {
          try {
            await syncMutation.mutateAsync();
            console.log('Data synced with Supabase');
          } catch (error) {
            console.error('Error syncing with Supabase:', error);
          }
          setupRealtimeSubscription();
        }
      });
      
      // Check current network status and initialize
      await checkNetworkStatus();
      
      if (isOnline.value) {
        setupRealtimeSubscription();
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
      
      // Remove network listener
      Network.removeAllListeners();

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
      deleteLog
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