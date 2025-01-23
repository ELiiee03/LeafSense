import { sqliteService } from './sqliteService';
import { supabase } from '@/supabaseClient';
import axios from 'axios';

/// <reference lib="dom" />

declare const window: {
    LeafInference: {
        runInference(imagePath: string): Promise<any>;
    }
};


export const inferenceService = {
    async performInference(imagePath: string) {
        try {
            const isOnline = navigator.onLine;
            const timestamp = Date.now();

            if (isOnline) {
                // Online: Use Flask API
                const formData = new FormData(); 
                formData.append('image', imagePath);
                
                const response = await axios.post('your_flask_api_url/predict', formData);
                // const result = response.data;
                const result = await window.LeafInference.runInference(imagePath);

                // Store in Supabase
                await supabase.from('inference_results').insert({
                    image_path: imagePath,
                    result: JSON.stringify(result),
                    timestamp
                });

                return result;
            } else {
                // Offline: Use local TFLite model
                const result = await window.LeafInference.runInference(imagePath);
                
                // Store in SQLite for later sync
                await sqliteService.saveInferenceResult({
                    imagePath,
                    result: JSON.stringify(result),
                    timestamp,
                    synced: 0
                });

                return result;
            }
        } catch (error) {
            console.error('Error in inference:', error);
            throw error;
        }
    }
}; 