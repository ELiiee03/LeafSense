import { useQuery, useMutation } from '@tanstack/vue-query';
import { Network } from '@capacitor/network';
import { sqliteService } from '@/services/sqliteService';
import { supabase } from '@/supabaseClient';
import { ref, computed } from 'vue';

export function useLeafData() {
  const isOnline = ref(true);
  
  // Query for network status
  const networkQuery = useQuery({
    queryKey: ['networkStatus'],
    queryFn: async () => {
      const status = await Network.getStatus();
      isOnline.value = status.connected;
      return status.connected;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Mutation for syncing offline data
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!isOnline.value) return { synced: false };
      const result = await sqliteService.syncWithSupabase();
      return { synced: true, ...result };
    },
    onSuccess: (data) => {
      const count = 'syncedCount' in data ? data.syncedCount : 0;
      console.log(`Sync completed. Synced ${count} records.`);
    },
    onError: (error) => {
      console.error('Error during sync:', error);
    }
  });

  // Mutation for saving plant data online
  const savePlantOnlineMutation = useMutation({
    mutationFn: async ({ 
      imageData, 
      inferenceData, 
      plantDetails 
    }: { 
      imageData: string,
      inferenceData: any,
      plantDetails: any
    }) => {
      // Ensure we have valid image data
      console.log("Saving image data:", imageData ? imageData.substring(0, 50) + "..." : "No image");
      
      // Remove any fields that don't match the database schema
      const sanitizedDetails = { ...plantDetails };
      
      // Ensure aliases are stored as a proper JSONB array, not as a string
      if (sanitizedDetails.aliases) {
        // If it's already a string representation of an array, parse it first
        if (typeof sanitizedDetails.aliases === 'string' && 
            sanitizedDetails.aliases.startsWith('[') && 
            sanitizedDetails.aliases.endsWith(']')) {
          try {
            sanitizedDetails.aliases = JSON.parse(sanitizedDetails.aliases);
          } catch (e) {
            console.error('Error parsing aliases string:', e);
            // Keep as is if parsing fails
          }
        }
        
        // Make sure it's an array before storing
        if (!Array.isArray(sanitizedDetails.aliases)) {
          sanitizedDetails.aliases = [sanitizedDetails.aliases];
        }
        
        console.log('Storing aliases as:', sanitizedDetails.aliases);
      }
      
      // Fix soil_req/solid_req field name if needed
      if (sanitizedDetails.solid_req !== undefined && sanitizedDetails.soil_req === undefined) {
        sanitizedDetails.soil_req = sanitizedDetails.solid_req;
        delete sanitizedDetails.solid_req;
      }
      
      // Save inference result first
      const { data, error } = await supabase
        .from('inference_results')
        .insert({
          image: imageData, // This saves the image to Supabase
          scientific_name: inferenceData.scientificName,
          family_name: inferenceData.familyName,
          description: inferenceData.description,
          habitat: inferenceData.habitat,
          result: inferenceData.predictedClass,
          confidence: inferenceData.confidence,
          growth_habits: inferenceData.growthHabits,
          user_id: null
        })
        .select();

      if (error) {
        console.error("Supabase inference insert error:", error);
        console.error("Error details:", error.details, error.hint, error.code);
        throw new Error(`Failed to save inference data: ${error.message}`);
      }
      
      // Now save plant details
      if (data && data.length > 0) {
        console.log("Saving plant details with inference_result_id:", data[0].id);
        console.log("Plant details data:", sanitizedDetails);
        
        const { error: detailsError } = await supabase
          .from('plant_details')
          .insert({
            inference_result_id: data[0].id,
            ...sanitizedDetails
          });
          
        if (detailsError) {
          console.error("Supabase plant details insert error:", detailsError);
          console.error("Details error specifics:", detailsError.details, detailsError.hint, detailsError.code);
          throw new Error(`Failed to save plant details: ${detailsError.message}`);
        }
      }
      
      return data;
    }
  });

  // Mutation for saving plant data offline
  const savePlantOfflineMutation = useMutation({
    mutationFn: async ({ 
      imageData, 
      inferenceData,
      plantDetails
    }: { 
      imageData: string,
      inferenceData: any,
      plantDetails: any 
    }) => {
      // Fix soil_req field if needed
      if (plantDetails.solid_req !== undefined && plantDetails.soil_req === undefined) {
        plantDetails.soil_req = plantDetails.solid_req;
        delete plantDetails.solid_req;
      }
      
      const result = await sqliteService.saveOfflineInferenceResult({
        imagePath: imageData, // Store full image path/data
        predictedClass: inferenceData.predictedClass,
        scientificName: inferenceData.scientificName,
        familyName: inferenceData.familyName,
        description: inferenceData.description,
        habitat: inferenceData.habitat,
        confidence: inferenceData.confidence,
        growthHabits: inferenceData.growthHabits
      });
      
      if (result && result.id) {
        // Fix field names for SQLite
        const offlineDetails = { ...plantDetails };
        if (offlineDetails.soil_req) {
          offlineDetails.soilReq = offlineDetails.soil_req;
          delete offlineDetails.soil_req;
        }
        if (offlineDetails.solid_req) {
          offlineDetails.soilReq = offlineDetails.solid_req;
          delete offlineDetails.solid_req;
        }
        
        await sqliteService.saveOfflinePlantDetails({
          inferenceResultId: result.id,
          ...offlineDetails
        });
      }
      
      return result;
    }
  });

  // Combined save function 
  const savePlantData = async (data: {
    imageData: string,
    inferenceData: any,
    plantDetails: any
  }) => {
    // Check network status
    const networkStatus = await Network.getStatus();
    
    if (networkStatus.connected) {
      return savePlantOnlineMutation.mutateAsync(data);
    } else {
      return savePlantOfflineMutation.mutateAsync(data);
    }
  };

  return {
    isOnline: computed(() => isOnline.value),
    networkStatus: networkQuery,
    syncOfflineData: () => syncMutation.mutate(),
    savePlantData,
    isLoading: computed(() => 
      savePlantOnlineMutation.isPending.value || 
      savePlantOfflineMutation.isPending.value
    ),
    isSaving: computed(() => 
      savePlantOnlineMutation.isPending.value || 
      savePlantOfflineMutation.isPending.value
    )
  };
} 