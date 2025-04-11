<template>
  <!-- Add Filter Component -->
  <FilterComponent :allLogs="allLogs" @filter-changed="handleFilterChange" />
  
  <ion-list>
    <NetworkAwareComponent 
      @online="handleNetworkOnline" 
      @offline="handleNetworkOffline" 
      @refresh="refreshLogs"
      :forceOfflineUI="!isOnline"
    >
      <template #online>
        <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
          <ion-refresher-content
            pullingText="Pull to refresh"
            refreshingText="Refreshing..."
          >
          </ion-refresher-content>
        </ion-refresher>
        
        <!-- Add cleanup button for synced records -->
        <!-- <ion-item lines="none" v-if="isOnline">
          <ion-button 
            slot="end" 
            size="small" 
            fill="clear" 
            color="medium" 
            @click="cleanupSyncedLogs"
            :disabled="cleanupLoading">
            <ion-icon slot="start" :icon="trashOutline"></ion-icon>
            Clean Synced Logs
          </ion-button>
        </ion-item> -->
        
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
            <ion-chip :color="getSyncChipColor(log)" class="sync-status-chip">
              <ion-icon v-if="log.synced === false" :icon="cloudOfflineOutline"></ion-icon>
              <ion-icon v-else-if="log.sync_origin === 'offline'" :icon="syncOutline"></ion-icon>
              <ion-icon v-else :icon="cloudDoneOutline"></ion-icon>
              {{ getSyncChipLabel(log) }}
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
    <div v-if="loading && isOnline" class="loading-state">
      <ion-spinner></ion-spinner>
    </div>
      </template>
      
      <template #offline>
        <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
          <ion-refresher-content
            pullingText="Pull to refresh"
            refreshingText="Refreshing..."
          >
          </ion-refresher-content>
        </ion-refresher>
        
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
              
              <ion-item-options>
                <ion-item-option>Favorite</ion-item-option>
                <ion-item-option color="danger" @click="deleteOfflineLog(log)">Delete</ion-item-option>
              </ion-item-options>
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
import { chevronForward, leafOutline, timeOutline, cloudOfflineOutline, cloudDoneOutline, syncOutline, trashOutline } from 'ionicons/icons';
import { IonThumbnail, IonChip, IonCard, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonNote, IonText, IonButton, IonIcon, IonSpinner, alertController, toastController, IonRefresher, IonRefresherContent } from '@ionic/vue';
import { supabase } from '@/supabaseClient';
import { sqliteService } from '@/services/sqliteService';
import { networkState, initNetworkService } from '@/services/networkService';
import LeafInfoModal from './LeafInfoModal.vue';
import FilterComponent from './FilterComponent.vue';
import { useLogsQuery, useDeleteLogMutation, useSyncAndCleanMutation } from '@/services/queryService';
import NetworkAwareComponent from './NetworkAwareComponent.vue';
import { Network } from '@capacitor/network';
import { useQueryClient } from '@tanstack/vue-query';

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
    IonRefresher,
    IonRefresherContent,
  },
  
  setup(props, { emit }) {
    interface LeafInfo {
      name?: string;
      scientificName?: string;
      familyName?: string;
      description?: string;
      habitat?: string;
      growthHabits?: string;
      color?: string;
    }
    
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
      leafInfo?: LeafInfo;     // Add leafInfo property
      confidence?: number;     // Add confidence property
      sync_origin?: string;    // Add sync_origin property
    }

    const page = ref(1);
    const isOpen = ref(false);
    const selectedLeaf = ref<Log | null>(null);
    const error = ref<string | null>(null);
    const isOnline = computed(() => networkState.isOnline.value);
    const offlineLogs = ref<Log[]>([]);
    
    // Add queryClient
    const queryClient = useQueryClient();
    
    // Add cleanup state
    const cleanupLoading = ref(false);
    
    // Network handling methods
    const handleNetworkOnline = async () => {
      console.log('Network is online, reloading data from server');
      // Reset loading state immediately
      isLoading.value = false;
      
      // Set up realtime subscription when we come online
      setupRealtimeSubscription();
      await syncPendingData();
      refreshLogs();
    };
    
    const handleNetworkOffline = () => {
      console.log('Network is offline, loading data from local storage');
      // Reset loading state immediately and ensure it stays false
      isLoading.value = false;
      
      // Clean up subscriptions when we go offline
      if (subscription) {
        supabase.removeChannel(subscription);
        subscription = null;
      }
      
      // Immediately load offline data
      loadOfflineData();
    };
    
    const syncPendingData = async () => {
      try {
        // Show syncing indicator if needed
        const toast = await toastController.create({
          message: 'Syncing data...',
          duration: 2000,
          color: 'primary',
          position: 'top',
          cssClass: 'no-shadow-toast'
        });
        await toast.present();
        
        // Sync data
        const syncResult = await syncMutation.mutateAsync();
        console.log('Pending data synced:', syncResult);
        
        // If we synced some records, refresh the offline logs
        if (syncResult && syncResult.syncedCount > 0) {
          // Reload offline data to show updated list
          await loadOfflineData();
          
          // Show success toast
          const successToast = await toastController.create({
            message: `Synced ${syncResult.syncedCount} records. Offline data cleaned up.`,
            duration: 2000,
            color: 'success',
            position: 'top',
            cssClass: 'no-shadow-toast'
          });
          await successToast.present();
        }
      } catch (error) {
        console.error('Error syncing data:', error);
        
        // Show error toast
        const errorToast = await toastController.create({
          message: 'Error syncing data. Try again later.',
          duration: 3000,
          color: 'danger',
          position: 'top',
          cssClass: 'no-shadow-toast'
        });
        await errorToast.present();
      }
    };
    
    const loadOfflineData = async () => {
      try {
        // Immediately clear loading state to prevent spinner in offline mode
        isLoading.value = false;
        
        // Load logs from SQLite
        const localLogs = await sqliteService.getInferenceResults();
        console.log('Loaded offline data:', localLogs);
        
        // Ensure the offline logs are immediately populated
        offlineLogs.value = localLogs.map(log => {
          // The result object should already be properly formatted from sqliteService
          return {
            id: log.id,
            result: log.result || log.leafInfo?.name || 'Unknown',
            scientific_name: log.scientific_name || log.leafInfo?.scientificName || '',
            family_name: log.family_name || log.leafInfo?.familyName || '',
            description: log.description || log.leafInfo?.description || '',
            created_at: new Date(log.timestamp).toISOString(),
            habitat: log.habitat || log.leafInfo?.habitat || '',
            growthHabits: log.growthHabits || log.leafInfo?.growthHabits || '',
            image: log.imagePath || '',
            synced: false,
            confidence: log.confidence || 0.8,
            
            // Include all plant detail fields directly
            color: log.color || '',
            foliage: log.foliage || '',
            bark: log.bark || '',
            fruit: log.fruit || '',
            crown: log.crown || '',
            trunk: log.trunk || '',
            leaves: log.leaves || '',
            retention: log.retention || '',
            texture: log.texture || '',
            venation: log.venation || '',
            behavior: log.behavior || '',
            edible_uses: log.edible_uses || '',
            med_uses: log.med_uses || '',
            timber_uses: log.timber_uses || '',
            other_uses: log.other_uses || '',
            climate: log.climate || '',
            lifespan: log.lifespan || '',
            light_needs: log.light_needs || '',
            water_needs: log.water_needs || '',
            soil_req: log.soil_req || '',
            aliases: log.aliases || [],
            
            // Comprehensive leafInfo structure for LeafInfoModal
            leafInfo: {
              name: log.result || 'Unknown',
              scientificName: log.scientific_name || '',
              familyName: log.family_name || '',
              description: log.description || '',
              habitat: log.habitat || '',
              growthHabits: log.growthHabits || '',
              color: log.color || '',
              foliage: log.foliage || '',
              bark: log.bark || '',
              fruit: log.fruit || '',
              crown: log.crown || '',
              trunk: log.trunk || '',
              leaves: log.leaves || '',
              retention: log.retention || '',
              texture: log.texture || '',
              venation: log.venation || '',
              behavior: log.behavior || '',
              edibleUses: log.edible_uses || '',
              medicinalUses: log.med_uses || '',
              timberUses: log.timber_uses || '',
              otherUses: log.other_uses || '',
              climate: log.climate || '',
              lifespan: log.lifespan || '',
              lightNeeds: log.light_needs || '',
              waterNeeds: log.water_needs || '',
              soilRequirements: log.soil_req || '',
              aliases: log.aliases || []
            }
          };
        });
        
        console.log('Formatted offline logs:', offlineLogs.value);
        
        // Ensure loading state is explicitly false after data is loaded
        isLoading.value = false;
      } catch (error) {
        console.error('Error loading offline data:', error);
        offlineLogs.value = [];
        // Ensure loading state is false even if there's an error
        isLoading.value = false;
      }
    };
    
    const refreshLogs = async () => {
      try {
        console.log('Refreshing logs data');
        // Reset pagination
        page.value = 1;
        
        // Invalidate the cache for logs
        queryClient.invalidateQueries({ queryKey: ['logs'] });
        
        // Force refetch from the server if online
        if (isOnline.value) {
          await refetch(); // Use the refetch method from the existing query
          
          // Update the local logs array
          if (logsData.value) {
            logs.value = [...logsData.value];
          }
        } else {
          await loadOfflineData();
        }
        
        console.log('Logs data refreshed successfully');
      } catch (error) {
        console.error('Error refreshing logs:', error);
      }
    };

    // Use TanStack Query hooks
    const { data: logsData, isLoading, isError, refetch } = useLogsQuery(page.value);
    const deleteMutation = useDeleteLogMutation();
    const syncMutation = useSyncAndCleanMutation();

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

    // Watch for network state changes
    watch(() => networkState.isOnline.value, (isOnline, prevIsOnline) => {
      console.log('Network state changed in LogsComponent:', isOnline ? 'Online' : 'Offline');
      
      // Reset loading state immediately to prevent endless spinner
      isLoading.value = false;
      
      if (!isOnline) {
        // Force offline UI immediately
        loadOfflineData();
      } else if (isOnline && prevIsOnline === false) {
        // Only when coming back online from offline state
        syncPendingData().then(() => refreshLogs());
      }
    }, { immediate: true });

    // Watch the loading state and emit it to parent
    watch(isLoading, (newValue) => {
      console.log('LogsComponent loading state changed:', newValue);
      emit('loading-changed', newValue);
    });

    const setOpen = (open: boolean) => {
      isOpen.value = open;
    };

    const openLeafInfo = (log: Log) => {
      console.log('Opening leaf info with data:', log);
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

    // Add the deleteOfflineLog function
    const deleteOfflineLog = async (log: Log) => {
      try {
        const alert = await alertController.create({
          header: 'Confirm Delete',
          message: 'Are you sure you want to delete this offline leaf data? This action cannot be undone.',
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
                  console.log('🗑️ Attempting to delete offline record with ID:', log.id);
                  
                  // Delete the record from SQLite
                  await sqliteService.deleteUnsyncedRecord(log.id);
                  console.log('🗑️ Successfully deleted offline record from SQLite');
                  
                  // Update the local logs array to remove the deleted item
                  offlineLogs.value = offlineLogs.value.filter(item => item.id !== log.id);
                  
                  const toast = await toastController.create({
                    message: 'Offline record deleted successfully',
                    duration: 2000,
                    color: 'success',
                    position: 'top',
                    cssClass: 'no-shadow-toast'
                  });
                  
                  await toast.present();
                } catch (err) {
                  console.error('❌ Error deleting offline log:', err);
                  
                  // Show error toast
                  const toast = await toastController.create({
                    message: 'Failed to delete offline record',
                    duration: 3000,
                    color: 'danger',
                    position: 'top',
                    cssClass: 'no-shadow-toast'
                  });
                  
                  await toast.present();
                }
              }
            }
          ]
        });
        
        await alert.present();
      } catch (error) {
        console.error('Error in deleteOfflineLog:', error);
      }
    };

    // Add the deleteLog function that works in both online and offline modes
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
                  // Check if we're online or offline
                  if (!isOnline.value || log.synced === false) {
                    // For offline logs or when we're offline, use direct SQLite delete
                    console.log('📲 Deleting record directly from SQLite:', log.id);
                    await sqliteService.deleteUnsyncedRecord(log.id);
                    
                    // Update the local logs array
                    logs.value = logs.value.filter(item => item.id !== log.id);
                  } else {
                    // For online synchronized logs, use the mutation
                    console.log('🌐 Deleting record using online mutation:', log.id);
                    await deleteMutation.mutateAsync(log);
                    
                    // Update the local logs array
                    logs.value = logs.value.filter(item => item.id !== log.id);
                  }
                  
                  const toast = await toastController.create({
                    message: 'Item deleted successfully',
                    duration: 2000,
                    color: 'success',
                    position: 'top',
                    cssClass: 'no-shadow-toast'
                  });
                  await toast.present();
                  
                  // Refresh logs if needed
                  if (!isOnline.value) {
                    await loadOfflineData();
                  }
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
                    position: 'top',
                    cssClass: 'no-shadow-toast'
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
      
      // Clean up any existing subscriptions first
      if (subscription) {
        supabase.removeChannel(subscription);
        subscription = null;
      }

      console.log('Setting up realtime subscriptions for logs...');

      // Subscribe to inference_results changes
      subscription = supabase
        .channel('logs_inference_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'inference_results'
          },
          (payload) => {
            console.log('Realtime logs update (inference):', payload.eventType, payload);
            // Immediately refresh data when changes occur
            refreshLogs();
          }
        )
        .subscribe((status) => {
          console.log('Logs subscription status (inference):', status);
        });
        
      // Also subscribe to plant_details changes in a separate channel
      const detailsSubscription = supabase
        .channel('logs_details_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events
            schema: 'public',
            table: 'plant_details'
          },
          (payload) => {
            console.log('Plant details update in logs:', payload.eventType, payload);
            // Refresh logs when plant details change
            refreshLogs();
          }
        )
        .subscribe((status) => {
          console.log('Logs subscription status (details):', status);
        });
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

    // Add refresher handler
    const handleRefresh = async (event: CustomEvent) => {
      console.log('Pull to refresh triggered');
      try {
        // Check network status
        const networkStatus = await Network.getStatus();
        networkState.isOnline.value = networkStatus.connected;
        
        if (networkStatus.connected) {
          // Online - refresh logs from server
          await syncPendingData();
          await refreshLogs();
        } else {
          // Offline - refresh logs from SQLite
          await loadOfflineData();
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

    // Add the methods to determine chip color and label based on sync status
    const getSyncChipColor = (log: Log) => {
      if (log.synced === false) {
        return 'warning';
      } else if (log.sync_origin === 'offline') {
        return 'secondary';
      }
      return 'success';
    };

    const getSyncChipLabel = (log: Log) => {
      if (log.synced === false) {
        return 'Pending';
      } else if (log.sync_origin === 'offline') {
        return 'Synced (offline)';
      }
      return 'Synced';
    };

    // Add manual cleanup function
    const cleanupSyncedLogs = async () => {
      try {
        if (!isOnline.value) {
          const toast = await toastController.create({
            message: 'Cannot clean up logs while offline',
            duration: 3000,
            color: 'warning',
            position: 'top',
            cssClass: 'no-shadow-toast'
          });
          await toast.present();
          return;
        }
        
        // Show confirmation alert
        const alert = await alertController.create({
          header: 'Confirm Cleanup',
          message: 'Are you sure you want to clean up all synced logs from the device? This will only delete local copies that have already been synced to the server.',
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Clean Up',
              handler: async () => {
                try {
                  cleanupLoading.value = true;
                  
                  // Show progress toast
                  const progressToast = await toastController.create({
                    message: 'Cleaning up synced logs...',
                    duration: 2000,
                    color: 'primary',
                    position: 'top',
                    cssClass: 'no-shadow-toast'
                  });
                  await progressToast.present();
                  
                  // Call the cleanup function
                  const result = await sqliteService.deleteAllSyncedData();
                  
                  // Refresh the offline logs
                  await loadOfflineData();
                  
                  // Show success toast
                  const successToast = await toastController.create({
                    message: `Cleaned up ${result.deletedCount} synced logs`,
                    duration: 2000,
                    color: 'success',
                    position: 'top',
                    cssClass: 'no-shadow-toast'
                  });
                  await successToast.present();
                } catch (error) {
                  console.error('Error cleaning up logs:', error);
                  
                  // Show error toast
                  const errorToast = await toastController.create({
                    message: 'Error cleaning up logs',
                    duration: 3000,
                    color: 'danger',
                    position: 'top',
                    cssClass: 'no-shadow-toast'
                  });
                  await errorToast.present();
                } finally {
                  cleanupLoading.value = false;
                }
              }
            }
          ]
        });
        
        await alert.present();
      } catch (error) {
        console.error('Error in cleanupSyncedLogs:', error);
        cleanupLoading.value = false;
      }
    };

    onMounted(async () => {
      // Initialize network service
      await initNetworkService();
      
      // Immediately check network status and force UI update
      const networkStatus = await Network.getStatus();
      networkState.isOnline.value = networkStatus.connected;
      console.log('Initial network status on mount:', networkStatus.connected);
      
      // Reset loading state explicitly
      isLoading.value = false;
      
      // Add network change listener with immediate UI updates
      Network.addListener('networkStatusChange', async (status) => {
        console.log('Network status changed:', status);
        // Force loading state false immediately to prevent spinner
        isLoading.value = false;
        
        // Update the networkState directly
        networkState.isOnline.value = status.connected;
        networkState.lastUpdated.value = new Date();
        
        if (!status.connected) {
          // Go directly to offline mode without waiting
          handleNetworkOffline();
        } else {
          // For online status, can use slight delay before loading data
          setTimeout(() => {
            handleNetworkOnline();
          }, 100);
        }
      });
      
      // Initialize based on current network status
      if (networkState.isOnline.value) {
        setupRealtimeSubscription();
        refreshLogs();
      } else {
        // If offline on mount, immediately load offline data
        await loadOfflineData();
      }

      // Add scroll event listener
      const content = document.querySelector('ion-content');
      if (content) {
        content.addEventListener('scroll', handleScroll);
      }
      
      // Also listen for custom network status change events from HomePage
      window.addEventListener('network-status-changed', (event: any) => {
        console.log('Received network-status-changed event:', event.detail);
        // Reset loading state immediately
        isLoading.value = false;
        
        if (!event.detail.connected) {
          // Offline - switch immediately to offline mode
          handleNetworkOffline();
        } else {
          // Online - can wait a tiny bit
          setTimeout(() => handleNetworkOnline(), 100);
        }
      });
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
      
      // Remove network listeners
      Network.removeAllListeners();
      
      // Remove custom event listener
      window.removeEventListener('network-status-changed', (event: any) => {});
    });

    return {
      chevronForward,
      leafOutline,
      timeOutline,
      cloudOfflineOutline,
      cloudDoneOutline,
      syncOutline,
      trashOutline,
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
      handleNetworkOffline,
      handleRefresh,
      getSyncChipColor,
      getSyncChipLabel,
      deleteOfflineLog,
      cleanupSyncedLogs,
      cleanupLoading,
      isOnline,
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

/* Toast styles */
:global(.no-shadow-toast) {
  --box-shadow: none !important;
}
</style>