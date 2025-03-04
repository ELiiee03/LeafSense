<template>
  <ion-list>
    <ion-item-sliding v-for="log in logs" :key="log.id">
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

    <!-- Use LeafInfoModal as a reusable component -->
    <LeafInfoModal :isOpen="isOpen" :onClose="() => setOpen(false)" :leaf="selectedLeaf" />
  </ion-list>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { chevronForward } from 'ionicons/icons';
import { IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonNote, IonText } from '@ionic/vue';
import { supabase } from '@/supabaseClient';
import LeafInfoModal from './LeafInfoModal.vue';

export default defineComponent({
  components: {
    IonItem,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonLabel,
    IonList,
    LeafInfoModal,
  },
  
  setup() {
    interface Log {
      id: number;
      result: string;          // Common name
      scientific_name: string;
      description: string; 
      created_at: string;      // Use Supabase's timestamp field
      habitat?: string;        // Optional field   
    }

    const logs = ref<Log[]>([]);
    const isOpen = ref(false);
    const selectedLeaf = ref<Log | null>(null);

    const setOpen = (open: boolean) => {
      isOpen.value = open;
    };

    // Add error state and loading state
    const loading = ref(true);
    const error = ref<string | null>(null);

    const fetchLogs = async () => {
      const cachedLogs = localStorage.getItem('logs');
      if (cachedLogs) {
        logs.value = JSON.parse(cachedLogs);
        loading.value = false;
      } else {
        const { data, error } = await supabase
          .from('inference_results')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching logs:', error);
          loading.value = false;
        } else {
          logs.value = data;
          localStorage.setItem('logs', JSON.stringify(data));
          loading.value = false;
        }
      }
    };

    const clearCache = () => {
      localStorage.removeItem('logs');
    };

    const openLeafInfo = (log: Log) => {
      selectedLeaf.value = log;
      setOpen(true);
    };

    const formatTimestamp = (timestamp: string) => {
      return new Date(timestamp).toLocaleString();
    };

    onMounted(() => {
      fetchLogs();
    });

    // Add loading state display
    return {
      chevronForward,
      logs,
      isOpen,
      setOpen,
      selectedLeaf,
      openLeafInfo,
      formatTimestamp,
      loading,
      error,
      clearCache
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
</style>