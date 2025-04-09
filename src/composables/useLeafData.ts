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
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting current user:", userError);
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
          user_id: user?.id || null // Use the authenticated user's ID
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
      
      console.log('Plant details for offline storage:', JSON.stringify(plantDetails, null, 2));
      
      // Only pass the basic inference data to saveOfflineInferenceResult
      const result = await sqliteService.saveOfflineInferenceResult({
        imagePath: imageData, // Store full image path/data
        predictedClass: inferenceData.predictedClass,
        scientificName: inferenceData.scientificName,
        familyName: inferenceData.familyName,
        description: inferenceData.description,
        habitat: inferenceData.habitat,
        confidence: inferenceData.confidence,
        growthHabits: inferenceData.growthHabits,
        color: plantDetails.color || null
      });
      
      if (result && result.id) {
        // Save the detailed plant information separately
        await sqliteService.saveOfflinePlantDetails({
          inferenceResultId: result.id,
          aliases: plantDetails.aliases,
          color: plantDetails.color,
          foliage: plantDetails.foliage,
          bark: plantDetails.bark,
          fruit: plantDetails.fruit,
          crown: plantDetails.crown,
          trunk: plantDetails.trunk,
          leaves: plantDetails.leaves,
          retention: plantDetails.retention,
          texture: plantDetails.texture,
          venation: plantDetails.venation,
          behavior: plantDetails.behavior,
          edibleUses: plantDetails.edible_uses || plantDetails.edibleUses,
          medUses: plantDetails.med_uses || plantDetails.medUses,
          timberUses: plantDetails.timber_uses || plantDetails.timberUses,
          otherUses: plantDetails.other_uses || plantDetails.otherUses,
          climate: plantDetails.climate,
          lifespan: plantDetails.lifespan,
          lightNeeds: plantDetails.light_needs || plantDetails.lightNeeds,
          waterNeeds: plantDetails.water_needs || plantDetails.waterNeeds,
          soilReq: plantDetails.soil_req || plantDetails.soilReq
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
    ),
    cleanupSyncedData: async () => {
      try {
        if (!isOnline.value) {
          console.warn('Cannot clean up synced data while offline');
          return { success: false, reason: 'offline' };
        }
        return await sqliteService.deleteAllSyncedData();
      } catch (error) {
        console.error('Error cleaning up synced data:', error);
        return { success: false, error };
      }
    },
    // New function to sync and clean up in one step
    syncAndCleanup: async () => {
      try {
        if (!isOnline.value) {
          console.warn('Cannot sync and clean up while offline');
          return { success: false, reason: 'offline' };
        }
        
        // First, sync data
        const syncResult = await syncMutation.mutateAsync();
        console.log('Sync completed with result:', syncResult);
        
        // Extract syncedCount with type guard
        const syncedCount = 'syncedCount' in syncResult ? syncResult.syncedCount : 0;
        
        // Then, clean up synced data (should already be done by syncWithSupabase)
        // This is just to make sure cleanup is complete
        const cleanupResult = await sqliteService.deleteAllSyncedData();
        console.log('Cleanup completed with result:', cleanupResult);
        
        return {
          success: true,
          syncedCount: syncedCount,
          cleanedCount: cleanupResult.deletedCount || 0,
          message: `Synced ${syncedCount} records and cleaned up ${cleanupResult.deletedCount || 0} records`
        };
      } catch (error) {
        console.error('Error in sync and cleanup:', error);
        return { success: false, error };
      }
    }
  };
} 