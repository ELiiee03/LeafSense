import { supabase } from '@/supabaseClient';
import { sqliteService } from './sqliteService';

export const syncService = {
    init() {
        globalThis.addEventListener('online', this.syncInferenceResults);
    },

    async syncInferenceResults() {
        const unsyncedResults = await sqliteService.getUnsyncedResults();
        
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
                }
            } catch (error) {
                console.error('Error syncing result:', error);
            }
        }
    }
};