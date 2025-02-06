import { sqliteService } from './sqliteService';
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
                await sqliteService.syncWithSupabase();
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
        const unsyncedResults = await sqliteService.getUnsyncedResults();
        this.isSyncing.value = true;
        
        for (const result of unsyncedResults) {
            try {
                const { error } = await supabase
                    .from('inference_results')
                    .insert({
                        image_path: result.imagePath,
                        result: JSON.parse(result.result),
                        timestamp: result.timestamp
                    });

                if (!error) {
                    await sqliteService.markAsSynced(result.id!);
                    console.log('Successfully synced result:', result.id);
                }
            } catch (error) {
                console.error('Error syncing result:', error);
            } finally {
                this.isSyncing.value = false;
            }
        }
    }
};