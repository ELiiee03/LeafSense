import { dbService } from './dbService';
import { Network } from '@capacitor/network';
import { supabase } from '@/supabaseClient';
import { ref } from 'vue';

export const syncService = {
  isSyncing: ref(false),
  init() {
    // Listen for network status changes
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        await this.syncInferenceResults();
      }
    });

    // Check if online and sync on initialization
    this.checkAndSync();
  },

  async checkAndSync() {
    const status = await Network.getStatus();
    if (status.connected) {
      await this.syncInferenceResults();
    }
  },

  async syncInferenceResults() {
    const unsyncedResults = await dbService.getUnsyncedResults();
    this.isSyncing.value = true;

    try {
      for (const result of unsyncedResults) {
        const { error } = await supabase
          .from('inference_results')
          .insert({
            image_path: result.image_path,
            result: JSON.stringify({
              predictedClass: result.predicted_class,
              scientificName: result.scientific_name,
              familyName: result.family_name,
              description: result.description,
              habitat: result.habitat,
            }),
            timestamp: result.timestamp,
            synced: true
          });

        if (!error) {
          await dbService.markAsSynced(result.id!);
        }
      }
    } finally {
      this.isSyncing.value = false;
    }
  }
};