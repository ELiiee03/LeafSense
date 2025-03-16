<template>
  <!-- Add Filter Component -->
  <FilterComponent :allLogs="allLogs" @filter-changed="handleFilterChange" />
  
  <!-- <ion-list> -->
  <ion-card v-for="log in logs" :key="log.id">
    <ion-item-sliding>
      <ion-item button @click="openLeafInfo(log)" :detail="false">
        <ion-label>
          <strong>{{ log.result }}</strong>  <!-- Changed from leafInfo.name -->
          <br />
          <ion-text>{{ log.scientific_name }}</ion-text>
          <br />
          <ion-note color="medium" class="ion-text-wrap">
            {{ log.description }}
          </ion-note>
        </ion-label>
        <div class="metadata-end-wrapper" slot="end">
          <ion-note color="medium">{{ formatTimestamp(log.created_at) }}</ion-note>
          <ion-icon color="medium" :icon="chevronForward"></ion-icon>
        </div>
      </ion-item>

      <ion-item-options>
        <ion-item-option>Favorite</ion-item-option>
        <ion-item-option color="danger">Delete</ion-item-option>
      </ion-item-options>
    </ion-item-sliding>

    <!-- Empty state when no logs match the filters -->
    <div class="empty-state" v-if="logs.length === 0 && !loading">
      <ion-icon :icon="leafOutline" size="large"></ion-icon>
      <p>No leaves match your filter criteria</p>
      <ion-button fill="clear" @click="resetFilters">Reset Filters</ion-button>
    </div>

    <!-- Loading state -->
    <div class="loading-state" v-if="loading">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Loading leaves...</p>
    </div>

    <!-- Use LeafInfoModal as a reusable component -->
    <LeafInfoModal :isOpen="isOpen" :onClose="() => setOpen(false)" :leaf="selectedLeaf" />
  <!-- </ion-list> -->
</ion-card>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { chevronForward, leafOutline } from 'ionicons/icons';
import { IonCard, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonNote, IonText, IonButton, IonIcon, IonSpinner } from '@ionic/vue';
import { supabase } from '@/supabaseClient';
import LeafInfoModal from './LeafInfoModal.vue';
import FilterComponent from './FilterComponent.vue';

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
  },
  
  setup() {
    interface Log {
      id: number;
      result: string;          // Common name
      scientific_name: string;
      description: string; 
      created_at: string;      // Use Supabase's timestamp field
      habitat?: string;        // Optional field
      growthHabits?: string;   // Added growth habits field  
      image?: string;          // Added image field
    }

    const allLogs = ref<Log[]>([]); // Store all unfiltered logs
    const logs = ref<Log[]>([]);    // Filtered logs to display
    const isOpen = ref(false);
    const selectedLeaf = ref<Log | null>(null);
    const loading = ref(true);
    const error = ref<string | null>(null);

    const setOpen = (open: boolean) => {
      isOpen.value = open;
    };

    const fetchLogs = async () => {
      loading.value = true;
      try {
        // Always fetch fresh data from Supabase
        const { data, error } = await supabase
          .from('inference_results')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching logs:', error);
          error.value = error.message;
        } else {
          // Update both allLogs and logs with fresh data
          allLogs.value = data || [];
          logs.value = data || [];
          // Update localStorage with fresh data
          localStorage.setItem('logs', JSON.stringify(data));
        }
      } catch (err) {
        console.error('Error in fetchLogs:', err);
        error.value = 'Failed to fetch logs';
      } finally {
        loading.value = false;
      }
    };

    // Set up real-time subscription
    let subscription: any = null;

    const setupRealtimeSubscription = () => {
      // Remove existing subscription if any
      if (subscription) {
        supabase.removeChannel(subscription);
      }

      // Set up new subscription
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
            console.log('Change received:', payload);
            // Refresh data when any change occurs
            fetchLogs();
          }
        )
        .subscribe();
    };

    const clearCache = () => {
      localStorage.removeItem('logs');
      fetchLogs(); // Fetch fresh data after clearing cache
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

    onMounted(() => {
      fetchLogs();
      setupRealtimeSubscription();
    });

    onUnmounted(() => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    });

    return {
      chevronForward,
      leafOutline,
      logs,
      allLogs,
      isOpen,
      setOpen,
      selectedLeaf,
      openLeafInfo,
      formatTimestamp,
      loading,
      error,
      clearCache,
      handleFilterChange,
      resetFilters
    };
  },
});
</script>

<style scoped>
.unread-indicator {
  background: var(--ion-color-primary);
  width: 10px;
  height: 10px;
  border-radius: 100%;
  position: absolute;
  inset-inline-start: 12px;
  top: 12px;
}

.metadata-end-wrapper {
  position: absolute;
  top: 10px;
  inset-inline-end: 10px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
}

ion-item {
  --background: #dedfe2;
}

/* Empty state styles */
.empty-state, .loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--ion-color-medium);
}

.empty-state ion-icon, .loading-state ion-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--ion-color-medium);
}

.empty-state p, .loading-state p {
  margin: 8px 0;
  font-size: 16px;
}

.loading-state ion-spinner {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
}
</style>