import { dbService } from './dbService';
import { Network } from '@capacitor/network';
import { supabase } from '@/supabaseClient';
import { ref } from 'vue';
import { sqliteService } from './sqliteService';

// Add a flag to prevent multiple syncs running at once
let isSyncingInProgress = false;
// Add last sync timestamp to prevent frequent syncs
let lastSyncTimestamp = 0;
const MIN_SYNC_INTERVAL = 30000; // 30 seconds minimum between syncs

export const syncService = {
  isSyncing: ref(false),
  lastSyncResult: ref<any>(null),
  
  init() {
    // Listen for network status changes
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        await this.syncInferenceResults({showToasts: false});
      }
    });

    // Check if online and sync on initialization
    this.checkAndSync();
  },

  async checkAndSync() {
    const status = await Network.getStatus();
    if (status.connected) {
      await this.syncInferenceResults({showToasts: false});
    }
  },

  async syncInferenceResults(options = {showToasts: true}) {
    const {showToasts} = options;
    
    // Prevent syncing too frequently
    const now = Date.now();
    if (now - lastSyncTimestamp < MIN_SYNC_INTERVAL) {
      console.log(`⚠️ Last sync was less than ${MIN_SYNC_INTERVAL / 1000} seconds ago. Skipping.`);
      return { syncedCount: 0, tooSoon: true };
    }

    // Prevent multiple syncs from running simultaneously
    if (isSyncingInProgress) {
      console.log("⚠️ A sync operation is already in progress. Skipping.");
      return { syncedCount: 0, alreadyInProgress: true };
    }

    try {
      // Check if there's anything to sync before starting the sync process
      const unsyncedCount = await this.getUnsyncedCount();
      if (unsyncedCount === 0) {
        console.log("✅ No unsynced results to sync - skipping sync operation");
        return { syncedCount: 0, nothingToSync: true };
      }
      
      isSyncingInProgress = true;
      this.isSyncing.value = true;
      lastSyncTimestamp = now; // Update last sync timestamp

      console.log("🔄 Starting inference results sync process");

      // First check if there are already synced records that weren't properly cleaned up
      try {
        const { values: syncedCount } = await sqliteService.executeQuery(
          `SELECT COUNT(*) as count FROM unsynced_inferences WHERE synced = 1`
        );

        if (syncedCount && syncedCount[0] && syncedCount[0].count > 0) {
          console.log(`⚠️ Found ${syncedCount[0].count} records already marked as synced but not cleaned up`);
          console.log(`🧹 Cleaning up these records before starting new sync...`);

          // Clean up synced records to prevent duplicates
          await this.cleanupSyncedRecords();
        }
      } catch (cleanupError) {
        console.error('❌ Error during pre-sync cleanup:', cleanupError);
      }

      // Use sqliteService to get all unsynced records
      const unsyncedResults = await sqliteService.getUnsyncedResults();
      console.log(`🔄 Found ${unsyncedResults.length} unsynced results to sync`);

      if (unsyncedResults.length === 0) {
        console.log("✅ No unsynced results to sync");
        return { syncedCount: 0 };
      }

      // Print IDs of records to be synced for debugging
      if (unsyncedResults.length > 0) {
        const ids = unsyncedResults.map(r => r.id).join(', ');
        console.log(`🔄 Syncing records with IDs: ${ids}`);
      }

      // Get current user
      let user = null;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          // Instead of failing, just log it and continue without a user
          console.log('⚠️ No authenticated user found during sync. Results will be synced without user ID.');
        } else {
          user = data.user;
        }
      } catch (userError: any) {
        // Catch any auth errors but continue with sync
        console.log('⚠️ Auth error during sync:', userError.message);
        console.log('⚠️ Continuing sync without user ID');
      }

      // Track unique identifiers to prevent duplicates
      const processedUniqueIds = new Set();

      let successCount = 0;
      let failureCount = 0;
      let duplicateCount = 0;
      let alreadySyncedCount = 0;

      // Process one record at a time
      for (const result of unsyncedResults) {
        try {
          // Skip records that are already marked as synced but weren't cleaned up
          if (result.synced === 1) {
            console.log(`⏩ Skipping record ID ${result.id} as it's already marked as synced`);
            alreadySyncedCount++;
            continue;
          }

          // Generate a unique identifier for this record to prevent duplicates
          // Use scientific_name + timestamp as they should be unique together
          const uniqueId = `${result.scientific_name}_${result.timestamp}`;

          // Skip if we've already processed this unique ID in this sync batch
          if (processedUniqueIds.has(uniqueId)) {
            console.log(`⚠️ Skipping duplicate record with ID ${result.id} (${uniqueId})`);
            duplicateCount++;

            // Mark as synced so it doesn't try to sync again
            await sqliteService.markAsSynced(result.id);
            continue;
          }

          console.log(`🔄 Processing record ID: ${result.id}`);

          // Add to processed set
          processedUniqueIds.add(uniqueId);

          // First check if a similar record already exists in Supabase
          // This will prevent duplication if records were previously synced
          const { data: existingRecords, error: checkError } = await supabase
            .from('inference_results')
            .select('id')
            .eq('scientific_name', result.scientific_name)
            .eq('result', result.predicted_class)
            // Use approximate timestamp match within 1-minute window
            .gte('created_at', new Date(result.timestamp - 60000).toISOString())
            .lte('created_at', new Date(result.timestamp + 60000).toISOString())
            .limit(1);

          if (checkError) {
            console.error(`❌ Error checking for existing record:`, checkError);
          } else if (existingRecords && existingRecords.length > 0) {
            // Record already exists in Supabase
            console.log(`⚠️ Found existing record in Supabase for ID ${result.id} - marking as synced`);
            await sqliteService.markAsSynced(result.id);
            duplicateCount++;
            continue;
          }

          // 1. Insert inference result
          const { data: inferenceData, error: inferenceError } = await supabase
            .from('inference_results')
            .insert({
              image: result.image_path,
              scientific_name: result.scientific_name,
              family_name: result.family_name,
              description: result.description,
              habitat: result.habitat,
              result: result.predicted_class,
              growth_habits: result.growth_habits,
              confidence: result.confidence,
              user_id: user?.id || null,
              sync_origin: 'offline'
            })
            .select();

          if (inferenceError) {
            console.error(`❌ Error inserting inference result ID ${result.id}:`, inferenceError);
            failureCount++;
            continue;
          }

          if (!inferenceData || inferenceData.length === 0) {
            console.error(`❌ No data returned when inserting inference ID ${result.id}`);
            failureCount++;
            continue;
          }

          console.log(`✅ Successfully inserted inference with Supabase ID: ${inferenceData[0].id}`);

          // 2. Look for and insert plant details
          try {
            const plantDetailsResult = await sqliteService.executeQuery(
              `SELECT * FROM offline_plant_details WHERE inference_result_id = ?`,
              [result.id]
            );

            const plantDetails = plantDetailsResult.values?.[0];

            if (plantDetails) {
              console.log(`🔄 Found plant details for inference ID ${result.id}`);

              // Parse aliases if needed
              let parsedAliases = plantDetails.aliases;
              if (typeof parsedAliases === 'string' && parsedAliases) {
                try {
                  if (parsedAliases.startsWith('[') && parsedAliases.endsWith(']')) {
                    parsedAliases = JSON.parse(parsedAliases);
                  } else {
                    parsedAliases = [parsedAliases];
                  }
                } catch (e) {
                  console.error('Error parsing aliases:', e);
                  parsedAliases = [parsedAliases];
                }
              }

              console.log(`🔄 Inserting plant details for Supabase inference ID: ${inferenceData[0].id}`);

              // Insert plant details with all fields
              const { data: plantData, error: plantError } = await supabase
                .from('plant_details')
                .insert({
                  inference_result_id: inferenceData[0].id,
                  aliases: parsedAliases || [],
                  color: plantDetails.color || null,
                  foliage: plantDetails.foliage || null,
                  bark: plantDetails.bark || null,
                  fruit: plantDetails.fruit || null,
                  crown: plantDetails.crown || null,
                  trunk: plantDetails.trunk || null,
                  leaves: plantDetails.leaves || null,
                  retention: plantDetails.retention || null,
                  texture: plantDetails.texture || null,
                  venation: plantDetails.venation || null,
                  behavior: plantDetails.behavior || null,
                  edible_uses: plantDetails.edible_uses || null,
                  med_uses: plantDetails.med_uses || null,
                  timber_uses: plantDetails.timber_uses || null,
                  other_uses: plantDetails.other_uses || null,
                  climate: plantDetails.climate || null,
                  lifespan: plantDetails.lifespan || null,
                  light_needs: plantDetails.light_needs || null,
                  water_needs: plantDetails.water_needs || null,
                  soil_req: plantDetails.soil_req || null
                })
                .select();

              if (plantError) {
                console.error(`❌ Error inserting plant details for inference ID ${result.id}:`, plantError);
                console.error(`Error details:`, plantError.message, plantError.details);
              } else {
                console.log(`✅ Successfully synced plant details with ID: ${plantData?.[0]?.id || 'unknown'}`);
              }
            } else {
              console.log(`ℹ️ No plant details found for inference ID ${result.id}`);
            }
          } catch (detailsError) {
            console.error(`❌ Error processing plant details for inference ID ${result.id}:`, detailsError);
          }

          // 3. Mark as synced regardless of plant details results
          await sqliteService.markAsSynced(result.id);
          successCount++;

        } catch (recordError) {
          console.error(`❌ Error syncing record ID ${result.id}:`, recordError);
          failureCount++;
        }
      }

      console.log(`🔄 Sync Summary: ${successCount} records synced, ${failureCount} failures, ${duplicateCount} duplicates skipped, ${alreadySyncedCount} already synced`);

      // Clean up synced records without using transactions
      if (successCount > 0 || duplicateCount > 0) {
        try {
          await this.cleanupSyncedRecords();
        } catch (cleanupError) {
          console.error('❌ Error cleaning up synced records:', cleanupError);
        }
      }

      const syncResult = {
        syncedCount: successCount,
        failureCount,
        duplicateCount,
        alreadySyncedCount,
        totalProcessed: successCount + failureCount + duplicateCount + alreadySyncedCount
      };
      
      // Store the last sync result
      this.lastSyncResult.value = syncResult;
      
      return syncResult;
    } catch (error) {
      console.error('❌ Error in syncInferenceResults:', error);
      throw error;
    } finally {
      this.isSyncing.value = false;
      isSyncingInProgress = false;
    }
  },
  
  // Add a helper method to check if there are any unsynced results
  async getUnsyncedCount() {
    try {
      const { values } = await sqliteService.executeQuery(
        `SELECT COUNT(*) as count FROM unsynced_inferences WHERE synced = 0`
      );
      
      return values && values[0] ? values[0].count : 0;
    } catch (error) {
      console.error('Error checking unsynced count:', error);
      return 0;
    }
  },

  // Safe method to clean up synced records without transactions
  async cleanupSyncedRecords() {
    try {
      console.log('🧹 Cleaning up synced records safely without transactions');

      // 1. Get all synced records
      const { values: syncedIds } = await sqliteService.executeQuery(
        `SELECT id FROM unsynced_inferences WHERE synced = 1 LIMIT 50`
      );

      if (!syncedIds || syncedIds.length === 0) {
        console.log('🧹 No synced records to clean up');
        return { success: true, count: 0 };
      }

      console.log(`🧹 Found ${syncedIds.length} synced records to clean up (processing in batches)`);

      // 2. Delete each record individually
      let totalDeleted = 0;

      for (const item of syncedIds) {
        try {
          // Delete associated plant details first
          await sqliteService.executeQuery(
            `DELETE FROM offline_plant_details WHERE inference_result_id = ?`,
            [item.id]
          );

          // Then delete the inference record
          const inferenceResult = await sqliteService.executeQuery(
            `DELETE FROM unsynced_inferences WHERE id = ? AND synced = 1`,
            [item.id]
          );

          if (inferenceResult.changes && inferenceResult.changes > 0) {
            totalDeleted++;
          } else {
            console.warn(`⚠️ Record ID ${item.id} not deleted, no changes reported`);
          }
        } catch (recordError) {
          console.error(`❌ Error deleting record ID ${item.id}:`, recordError);
        }
      }

      console.log(`🧹 Cleaned up ${totalDeleted} synced records`);
      return { success: true, count: totalDeleted };
    } catch (error) {
      console.error('❌ Error in cleanupSyncedRecords:', error);
      throw error;
    }
  }
};
