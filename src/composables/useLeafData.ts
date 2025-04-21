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
  }, forceOffline?: boolean) => {
    // Define a safe wrapper for Network.getStatus with timeout and retries
    const checkNetworkWithRetry = async (timeoutMs = 2000, retries = 2): Promise<{connected: boolean}> => {
      for (let i = 0; i < retries; i++) {
        try {
          const result = await Promise.race([
            Network.getStatus(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Network check timeout')), timeoutMs)
            )
          ]);
          return result;
        } catch (err) {
          console.warn(`Network check attempt ${i+1}/${retries} failed:`, err);
          // Last retry - return offline
          if (i === retries - 1) {
            return { connected: false };
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      return { connected: false };
    };

    // Check network status unless forceOffline is explicitly set
    if (forceOffline === true) {
      console.log("Forcing offline save mode");
      isOnline.value = false;
      // Add offline flag to help caller identify offline saves
      return savePlantOfflineMutation.mutateAsync(data)
        .then(result => ({ ...(result as object || {}), offline: true }));
    }
    
    try {
      // Check network status with the enhanced retry function
      const networkStatus = await checkNetworkWithRetry();
      
      // Update the online state
      isOnline.value = networkStatus.connected;
      console.log(`Network check result: ${networkStatus.connected ? 'online' : 'offline'}`);
      
      // If network status indicates we're online, try online save with fallback
      if (networkStatus.connected) {
        try {
          // Try online save with timeout to prevent hanging
          const onlineSavePromise = savePlantOnlineMutation.mutateAsync(data);
          
          // Add a timeout to prevent hanging indefinitely
          const result = await Promise.race([
            onlineSavePromise,
            new Promise<never>((_, reject) => {
              const timeoutError = new Error('Online save timeout');
              timeoutError.name = 'NetworkTimeoutError'; // Custom error type for better detection
              setTimeout(() => reject(timeoutError), 5000); // Shorter timeout for better UX
            })
          ]);
          
          return { ...(result as object || {}), offline: false };
        } catch (error) {
          // Check if this is a timeout error (either by name or message)
          const isTimeoutError = 
            (error instanceof Error && error.name === 'NetworkTimeoutError') ||
            (error instanceof Error && error.message.includes('timeout'));
          
          console.error(`Online save failed or timed out (timeout: ${isTimeoutError}):`, error);
          
          // If it's a timeout, assume network transition and go straight to offline mode
          if (isTimeoutError) {
            console.log('Detected timeout during online save, assuming network transition to offline');
            isOnline.value = false;
            const offlineResult = await savePlantOfflineMutation.mutateAsync(data);
            return { ...(offlineResult as object || {}), offline: true, wasNetworkTransition: true };
          }
          
          // For non-timeout errors, double-check network status
          const currentNetworkStatus = await checkNetworkWithRetry(1500, 1);
          
          // If network is truly down, update state and use offline save
          if (!currentNetworkStatus.connected) {
            console.log('Network is now confirmed offline, switching to offline save');
            isOnline.value = false; // Update state to reflect reality
            const offlineResult = await savePlantOfflineMutation.mutateAsync(data);
            return { ...(offlineResult as object || {}), offline: true };
          } else {
            // Network is still up but save failed for other reasons
            console.error('Network is still available but save failed. Trying offline save as fallback');
            const offlineResult = await savePlantOfflineMutation.mutateAsync(data);
            return { ...(offlineResult as object || {}), offline: true };
          }
        }
      } else {
        // Already know we're offline, go straight to offline save
        console.log('Using offline save mode due to network status');
        const offlineResult = await savePlantOfflineMutation.mutateAsync(data);
        return { ...(offlineResult as object || {}), offline: true };
      }
    } catch (error) {
      console.error('Error during save with network check:', error);
      // Last resort fallback - if any network errors occur, try offline save
      isOnline.value = false;
      try {
        const offlineResult = await savePlantOfflineMutation.mutateAsync(data);
        return { ...(offlineResult as object || {}), offline: true, wasFallback: true };
      } catch (offlineError) {
        // If even offline save fails, rethrow with more context
        console.error('Offline save also failed:', offlineError);
        const errorMessage = offlineError instanceof Error ? offlineError.message : 'Unknown error';
        throw new Error(`Failed to save data: ${errorMessage}`);
      }
    }
  };

  return {
    isOnline: computed(() => isOnline.value),
    setOnlineStatus: (status: boolean) => {
      isOnline.value = status;
    },
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