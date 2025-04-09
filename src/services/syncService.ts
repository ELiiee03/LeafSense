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
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting current user during sync:', userError);
      }
      
      for (const result of unsyncedResults) {
        // Only include fields that exist in the inference_results table
        const { data, error } = await supabase
          .from('inference_results')
          .insert({
            // Use camelCase to snake_case naming conversion
            image: result.image_path, // changed from image_path to match table schema
            scientific_name: result.scientific_name,
            family_name: result.family_name,
            description: result.description,
            habitat: result.habitat,
            result: result.predicted_class, // Use predicted_class as the result field
            growth_habits: result.growth_habits,
            confidence: result.confidence,
            timestamp: result.timestamp,
            user_id: user?.id || null
          });

        if (!error) {
          await dbService.markAsSynced(result.id!);
        } else {
          console.error('Error syncing inference result:', error);
        }
      }
    } finally {
      this.isSyncing.value = false;
    }
  }
};