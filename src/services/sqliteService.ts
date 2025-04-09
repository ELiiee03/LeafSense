import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { supabase } from '@/supabaseClient';

interface QueryResult {
  values?: any[];
  changes?: number;
}

let db: SQLiteDBConnection | null = null;
const sqlite = new SQLiteConnection(CapacitorSQLite);

export const sqliteService = {
  // Initialize database connection
  async initializeDatabase() {
    try {
      db = await sqlite.createConnection(
        'leaf_results',
        false,
        'no-encryption',
        1,
        false
      );
      await db.open();
      
      // Explicitly enable foreign keys
      await this.executeQuery("PRAGMA foreign_keys = ON;");

      // Create base tables
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS inference_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          image_path TEXT,
          result TEXT,
          timestamp INTEGER,
          synced INTEGER DEFAULT 0
        );
      `);

      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS saved_leaves (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          image_path TEXT,
          leaf_info TEXT,
          timestamp INTEGER,
          synced INTEGER DEFAULT 0
        );
      `);

      // Create schema version table first to handle migrations properly
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS schema_version (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          version INTEGER NOT NULL DEFAULT 1
        );
      `);
      
      // Check if schema_version exists and initialize if needed
      const versionResult = await this.executeQuery(`SELECT version FROM schema_version WHERE id = 1;`);
      if (!versionResult.values || versionResult.values.length === 0) {
        await this.executeQuery(`INSERT OR IGNORE INTO schema_version (id, version) VALUES (1, 1);`);
      }
      
      // Get current schema version
      const currentVersion = await this.getSchemaVersion();
      
      // Initialize offline tables without dropping existing ones first
      await this.safeInitializeOfflineTables(currentVersion);
      
      // Then run upgrade if needed
      await this.upgradeDatabaseIfNeeded();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  },
  
  // Safer initialization of offline tables
  async safeInitializeOfflineTables(currentVersion: number) {
    try {
      // Check if the tables already exist
      const checkInference = await this.executeQuery(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='unsynced_inferences';`
      );
      
      const checkDetails = await this.executeQuery(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='offline_plant_details';`
      );
      
      const inferenceExists = checkInference.values && checkInference.values.length > 0;
      const detailsExists = checkDetails.values && checkDetails.values.length > 0;
      
      // Only create tables if they don't exist already
      if (!inferenceExists) {
        console.log("Creating unsynced_inferences table");
        await this.executeQuery(`
          CREATE TABLE IF NOT EXISTS unsynced_inferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_path TEXT NOT NULL,
            predicted_class TEXT NOT NULL,
            scientific_name TEXT NOT NULL,
            family_name TEXT NOT NULL,
            description TEXT NOT NULL,
            habitat TEXT NOT NULL,
            color TEXT,
            growth_habits TEXT,
            confidence REAL,
            timestamp INTEGER NOT NULL,
            synced BOOLEAN DEFAULT 0
          );
        `);
      }
      
      if (!detailsExists) {
        console.log("Creating offline_plant_details table");
        await this.executeQuery(`
          CREATE TABLE IF NOT EXISTS offline_plant_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inference_result_id INTEGER NOT NULL,
            aliases TEXT,
            color TEXT,
            foliage TEXT,
            bark TEXT,
            fruit TEXT,
            crown TEXT,
            trunk TEXT,
            leaves TEXT,
            retention TEXT,
            texture TEXT,
            venation TEXT,
            behavior TEXT,
            edible_uses TEXT,
            med_uses TEXT,
            timber_uses TEXT,
            other_uses TEXT,
            climate TEXT,
            lifespan TEXT,
            light_needs TEXT,
            water_needs TEXT,
            soil_req TEXT,
            FOREIGN KEY (inference_result_id) REFERENCES unsynced_inferences(id) ON DELETE CASCADE
          );
        `);
      }
      
      // Don't initialize offline table the old way if tables already exist
      if (!inferenceExists || !detailsExists) {
        console.log("Tables created successfully");
      } else {
        console.log("Tables already exist, no need to recreate");
      }
    } catch (error) {
      console.error("Error in safe table initialization:", error);
      throw error;
    }
  },

  // Offline-specific methods
  async initializeOfflineTable() {
    try {
      // Check if tables exist
      const tableInfoUnsynced = await this.executeQuery(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='unsynced_inferences';
      `);
      
      const tableInfoDetails = await this.executeQuery(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='offline_plant_details';
      `);
      
      const hasUnsyncedTable = tableInfoUnsynced.values && tableInfoUnsynced.values.length > 0;
      const hasDetailsTable = tableInfoDetails.values && tableInfoDetails.values.length > 0;
      
      // If both tables exist, we don't need to recreate them
      if (hasUnsyncedTable && hasDetailsTable) {
        console.log("Offline tables already exist, checking for sync_origin column");
        
        // Check if sync_origin column exists in unsynced_inferences
        const columnInfo = await this.executeQuery(`PRAGMA table_info(unsynced_inferences);`);
        const hasOriginColumn = columnInfo.values && 
          columnInfo.values.some((col: any) => col.name === 'sync_origin');
        
        // Add sync_origin column if it doesn't exist
        if (!hasOriginColumn) {
          console.log("Adding sync_origin column to unsynced_inferences table");
          await this.executeQuery(`ALTER TABLE unsynced_inferences ADD COLUMN sync_origin TEXT DEFAULT 'offline';`);
        }
        
        return;
      }
      
      // If only one exists, we need to drop both to maintain consistency
      // Drop child table first to avoid foreign key issues
      if (hasDetailsTable) {
        await this.executeQuery(`DROP TABLE IF EXISTS offline_plant_details;`);
      }
      
      if (hasUnsyncedTable) {
        await this.executeQuery(`DROP TABLE IF EXISTS unsynced_inferences;`);
      }
      
      // Explicitly enable foreign key support
      await this.executeQuery("PRAGMA foreign_keys = ON;");

      // Create the parent table first
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS unsynced_inferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          image_path TEXT NOT NULL,
          predicted_class TEXT NOT NULL,
          scientific_name TEXT NOT NULL,
          family_name TEXT NOT NULL,
          description TEXT NOT NULL,
          habitat TEXT NOT NULL,
          color TEXT,
          growth_habits TEXT,
          confidence REAL,
          timestamp INTEGER NOT NULL,
          synced BOOLEAN DEFAULT 0,
          sync_origin TEXT DEFAULT 'offline'
        );
      `);
      
      // Now create the child table with the foreign key
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS offline_plant_details (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          inference_result_id INTEGER NOT NULL,
          aliases TEXT,
          color TEXT,
          foliage TEXT,
          bark TEXT,
          fruit TEXT,
          crown TEXT,
          trunk TEXT,
          leaves TEXT,
          retention TEXT,
          texture TEXT,
          venation TEXT,
          behavior TEXT,
          edible_uses TEXT,
          med_uses TEXT,
          timber_uses TEXT,
          other_uses TEXT,
          climate TEXT,
          lifespan TEXT,
          light_needs TEXT,
          water_needs TEXT,
          soil_req TEXT,
          FOREIGN KEY (inference_result_id) REFERENCES unsynced_inferences(id) ON DELETE CASCADE
        );
      `);
      
      console.log("Offline tables initialized successfully with sync_origin field");
    } catch (error) {
      console.error("Error initializing offline tables:", error);
      throw error;
    }
  },

  // Generic query executor
  async executeQuery(query: string, params: any[] = []): Promise<QueryResult> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      const isWriteOperation = query.startsWith('INSERT') ||
        query.startsWith('UPDATE') ||
        query.startsWith('DELETE');

      if (isWriteOperation) {
        const result = await db.run(query, params);
        return { changes: typeof result.changes === 'number' ? result.changes : 0 };
      } else {
        const result = await db.query(query, params);
        return { values: result.values };
      }
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  },

  async saveOfflineResult(data: {
    imagePath: string;
    predictedClass: string;
    scientificName: string;
    familyName: string;
    description: string;
    habitat: string;
    color?: string;
    shape?: string;
    margin?: string;
    growthHabits?: string;
    confidence?: number;
  }) {
    return this.executeQuery(
      `INSERT INTO unsynced_inferences (
        image_path, predicted_class, scientific_name,
        family_name, description, habitat, 
        color, shape, margin, growth_habits, confidence, timestamp
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.imagePath,
        data.predictedClass,
        data.scientificName,
        data.familyName,
        data.description,
        data.habitat,
        data.color || null,
        data.shape || null,
        data.margin || null,
        data.growthHabits || null,
        data.confidence || null,
        Date.now()
      ]
    );
  },

  async saveOfflineInferenceResult(data: {
    imagePath: string;
    predictedClass: string;
    scientificName: string;
    familyName: string;
    description: string;
    habitat: string;
    growthHabits?: string;
    confidence: number;
    color?: string;
  }) {
    let transactionStarted = false;
    
    try {
      console.log("Saving offline inference data:", {
        ...data,
        imagePath: data.imagePath ? "Image data available" : "No image data"
      });
      
      // Check if we're already in a transaction by querying the transaction state
      const { values: transactionState } = await this.executeQuery("PRAGMA transaction_status");
      const isInTransaction = transactionState?.[0]?.transaction_status !== "0";
      
      if (!isInTransaction) {
        // Start a transaction only if we're not already in one
        await this.executeQuery('BEGIN TRANSACTION');
        transactionStarted = true;
        console.log("Started new transaction for offline inference save");
      } else {
        console.log("Using existing transaction for offline inference save");
      }
      
      try {
        // First, insert the inference result with fields that match inference_results table
        await this.executeQuery(
          `INSERT INTO unsynced_inferences (
            image_path, predicted_class, scientific_name,
            family_name, description, habitat, 
            growth_habits, confidence, timestamp
          ) VALUES (?,?,?,?,?,?,?,?,?)`,
          [
            data.imagePath,
            data.predictedClass,
            data.scientificName,
            data.familyName,
            data.description,
            data.habitat,
            data.growthHabits || null,
            data.confidence,
            Date.now()
          ]
        );
        
        // Get the last inserted ID
        const { values } = await this.executeQuery('SELECT last_insert_rowid() as id');
        const insertedId = values?.[0]?.id;
        
        if (!insertedId) {
          throw new Error("Failed to get inserted ID");
        }
        
        // If we have color, create a basic plant details record
        if (data.color) {
          await this.executeQuery(
            `INSERT INTO offline_plant_details (
              inference_result_id, color
            ) VALUES (?,?)`,
            [
              insertedId,
              data.color
            ]
          );
          console.log("Saved basic plant details for offline inference");
        }
        
        // Commit the transaction only if we started it
        if (transactionStarted) {
          await this.executeQuery('COMMIT');
          console.log("Committed transaction for offline inference save");
        }
        
        console.log("Successfully saved offline inference with ID:", insertedId);
        
        return { id: insertedId };
      } catch (error) {
        // Roll back the transaction only if we started it
        if (transactionStarted) {
          try {
            await this.executeQuery('ROLLBACK');
            console.log("Rolled back transaction after error");
          } catch (rollbackError) {
            console.error("Error during rollback:", rollbackError);
          }
        }
        console.error("Transaction error in saveOfflineInferenceResult:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error saving offline inference result:", error);
      throw error;
    }
  },
  
  async saveOfflinePlantDetails(data: {
    inferenceResultId: number;
    aliases?: string[];
    color?: string;
    foliage?: string;
    bark?: string;
    fruit?: string;
    crown?: string;
    trunk?: string;
    leaves?: string;
    retention?: string;
    texture?: string;
    venation?: string;
    behavior?: string;
    edibleUses?: string;
    medUses?: string;
    timberUses?: string;
    otherUses?: string;
    climate?: string;
    lifespan?: string;
    lightNeeds?: string;
    waterNeeds?: string;
    soilReq?: string;
  }) {
    try {
      console.log("Saving offline plant details for inference ID:", data.inferenceResultId);
      
      // Check if there's an existing record for this inference result
      const existingRecord = await this.executeQuery(
        `SELECT id FROM offline_plant_details WHERE inference_result_id = ?`,
        [data.inferenceResultId]
      );
      
      if (existingRecord.values && existingRecord.values.length > 0) {
        // Update existing record
        console.log("Updating existing plant details record");
        return this.executeQuery(
          `UPDATE offline_plant_details SET 
            aliases = ?,
            color = ?,
            foliage = ?,
            bark = ?,
            fruit = ?,
            crown = ?,
            trunk = ?,
            leaves = ?,
            retention = ?,
            texture = ?,
            venation = ?,
            behavior = ?,
            edible_uses = ?,
            med_uses = ?,
            timber_uses = ?,
            other_uses = ?,
            climate = ?,
            lifespan = ?,
            light_needs = ?,
            water_needs = ?,
            soil_req = ?
          WHERE inference_result_id = ?`,
          [
            data.aliases ? JSON.stringify(data.aliases) : '[]',
            data.color || null,
            data.foliage || null,
            data.bark || null,
            data.fruit || null,
            data.crown || null,
            data.trunk || null,
            data.leaves || null,
            data.retention || null,
            data.texture || null,
            data.venation || null,
            data.behavior || null,
            data.edibleUses || null,
            data.medUses || null,
            data.timberUses || null,
            data.otherUses || null,
            data.climate || null,
            data.lifespan || null,
            data.lightNeeds || null,
            data.waterNeeds || null,
            data.soilReq || null,
            data.inferenceResultId
          ]
        );
      } else {
        // Insert new record
        console.log("Creating new plant details record");
        return this.executeQuery(
          `INSERT INTO offline_plant_details (
            inference_result_id, aliases, color, foliage, bark,
            fruit, crown, trunk, leaves, retention, texture,
            venation, behavior, edible_uses, med_uses, timber_uses,
            other_uses, climate, lifespan, light_needs, water_needs, soil_req
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            data.inferenceResultId,
            data.aliases ? JSON.stringify(data.aliases) : '[]',
            data.color || null,
            data.foliage || null,
            data.bark || null,
            data.fruit || null,
            data.crown || null,
            data.trunk || null,
            data.leaves || null,
            data.retention || null,
            data.texture || null,
            data.venation || null,
            data.behavior || null,
            data.edibleUses || null,
            data.medUses || null,
            data.timberUses || null,
            data.otherUses || null,
            data.climate || null,
            data.lifespan || null,
            data.lightNeeds || null,
            data.waterNeeds || null,
            data.soilReq || null
          ]
        );
      }
    } catch (error) {
      console.error("Error saving offline plant details:", error);
      throw error;
    }
  },

  async getUnsyncedResults() {
    const result = await this.executeQuery(
      `SELECT * FROM unsynced_inferences WHERE synced = 0`
    );
    return result.values || [];
  },

  async markAsSynced(id: number) {
    return this.executeQuery(
      `UPDATE unsynced_inferences SET synced = 1 WHERE id = ?`,
      [id]
    );
  },

  async deleteUnsyncedRecord(id: number) {
    return this.executeQuery(
      `DELETE FROM unsynced_inferences WHERE id = ?`,
      [id]
    );
  },

  // Get all inference results for offline viewing
  async getInferenceResults() {
    try {
      console.log('🔍 getInferenceResults called - retrieving offline data');
      
      // First try querying with a left join to get any associated plant details
      try {
        const result = await this.executeQuery(
          `SELECT 
            ui.id,
            ui.image_path as imagePath,
            ui.predicted_class as result,
            ui.scientific_name,
            ui.family_name,
            ui.description,
            ui.habitat,
            ui.growth_habits as growthHabits,
            ui.confidence,
            ui.timestamp,
            ui.synced,
            ui.color,
            pd.color as pd_color,
            pd.aliases,
            pd.foliage,
            pd.bark,
            pd.fruit,
            pd.crown,
            pd.trunk,
            pd.leaves,
            pd.retention,
            pd.texture,
            pd.venation,
            pd.behavior,
            pd.edible_uses,
            pd.med_uses,
            pd.timber_uses,
            pd.other_uses,
            pd.climate,
            pd.lifespan,
            pd.light_needs,
            pd.water_needs,
            pd.soil_req
          FROM unsynced_inferences ui
          LEFT JOIN offline_plant_details pd ON ui.id = pd.inference_result_id
          ORDER BY ui.timestamp DESC`
        );
        
        console.log(`🔍 Retrieved ${result.values?.length || 0} offline inference results with plant details`);
        
        // Check if we have valid results before logging sample data
        if (result.values && result.values.length > 0) {
          console.log('🔍 Sample offline data:', JSON.stringify(result.values[0], null, 2));
        }
        
        // Process the results
        const formattedResults = this.formatInferenceResults(result.values || []);
        console.log(`🔍 Formatted ${formattedResults.length} offline results for display`);
        return formattedResults;
      } catch (joinError) {
        // If the join fails (likely due to missing columns), fall back to a simple query
        console.error('❌ Error with join query, falling back:', joinError);
        const result = await this.executeQuery(
          `SELECT 
            id,
            image_path as imagePath,
            predicted_class as result,
            scientific_name,
            family_name,
            description,
            habitat,
            color,
            growth_habits as growthHabits,
            confidence,
            timestamp,
            synced
          FROM unsynced_inferences
          ORDER BY timestamp DESC`
        );
        
        console.log(`🔍 Retrieved ${result.values?.length || 0} offline inference results (fallback)`);
        
        // Process the results
        return this.formatInferenceResults(result.values || []);
      }
    } catch (error) {
      console.error('❌ Error getting inference results:', error);
      return [];
    }
  },
  
  // Helper to format inference results consistently
  formatInferenceResults(items: any[]) {
    console.log('🔧 Formatting inference results:', items.length, 'items');
    
    // Format the data to match the structure expected by the app
    return items.map(item => {
      // Parse aliases if needed
      let parsedAliases = item.aliases;
      
      // Handle aliases if they're stored as a string
      if (typeof item.aliases === 'string' && item.aliases) {
        try {
          // Try parsing JSON
          if (item.aliases.startsWith('[') && item.aliases.endsWith(']')) {
            parsedAliases = JSON.parse(item.aliases);
            console.log('🔧 Parsed aliases from JSON:', parsedAliases);
          } else {
            // Otherwise, treat as comma-separated values
            parsedAliases = item.aliases.split(',').map((s: string) => s.trim());
            console.log('🔧 Parsed aliases from comma-separated string:', parsedAliases);
          }
        } catch (e) {
          console.error('❌ Error parsing aliases:', e);
          // If parsing fails, keep as a single item array
          parsedAliases = [item.aliases];
        }
      } else if (!item.aliases) {
        // Default to empty array if null or undefined
        parsedAliases = [];
      }
      
      // Create a structured result object that matches what's expected in the UI
      const formattedResult = {
        id: item.id,
        imagePath: item.imagePath,
        timestamp: item.timestamp,
        synced: item.synced === 1 || item.synced === true,
        // Use fields from the item
        result: item.result,
        scientific_name: item.scientific_name,
        family_name: item.family_name,
        description: item.description,
        habitat: item.habitat,
        growthHabits: item.growthHabits,
        confidence: item.confidence,
        color: item.pd_color || item.color || null,
        // Add all plant details fields
        aliases: parsedAliases,
        foliage: item.foliage,
        bark: item.bark,
        fruit: item.fruit,
        crown: item.crown,
        trunk: item.trunk,
        leaves: item.leaves,
        retention: item.retention,
        texture: item.texture,
        venation: item.venation,
        behavior: item.behavior,
        edible_uses: item.edible_uses,
        med_uses: item.med_uses,
        timber_uses: item.timber_uses,
        other_uses: item.other_uses,
        climate: item.climate,
        lifespan: item.lifespan,
        light_needs: item.light_needs,
        water_needs: item.water_needs,
        soil_req: item.soil_req,
        
        // Add structured data for PlantDetails component to parse
        leafInfo: {
          name: item.result,
          scientificName: item.scientific_name,
          familyName: item.family_name,
          description: item.description,
          habitat: item.habitat,
          growthHabits: item.growthHabits,
          color: item.pd_color || item.color || null,
          // Add all remaining plant details fields
          aliases: parsedAliases,
          foliage: item.foliage,
          bark: item.bark,
          fruit: item.fruit,
          crown: item.crown,
          trunk: item.trunk, 
          leaves: item.leaves,
          retention: item.retention,
          texture: item.texture,
          venation: item.venation,
          behavior: item.behavior,
          edibleUses: item.edible_uses,
          medicinalUses: item.med_uses,
          timberUses: item.timber_uses,
          otherUses: item.other_uses,
          climate: item.climate,
          lifespan: item.lifespan,
          lightNeeds: item.light_needs,
          waterNeeds: item.water_needs,
          soilRequirements: item.soil_req
        }
      };
      
      return formattedResult;
    });
  },

  // Existing methods
  async saveLeaf(data: {
    imagePath: string;
    leafInfo: string;
    timestamp: number;
    synced: number;
  }) {
    return this.executeQuery(
      `INSERT INTO saved_leaves (image_path, leaf_info, timestamp, synced)
       VALUES (?,?,?,?)`,
      [data.imagePath, data.leafInfo, data.timestamp, data.synced]
    );
  },

  async syncWithSupabase() {
    try {
      console.log('🔄 Starting sync process with Supabase...');
      console.time('Sync Duration');
      
      // First, check the Supabase table schema
      await this.checkSupabaseSchema();
      
      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Error getting current user during sync:', userError);
      } else {
        console.log('👤 Current user:', user?.id || 'No user ID available');
      }
      
      const unsyncedResults = await this.getUnsyncedResults();
      console.log(`🔄 Found ${unsyncedResults.length} unsynced results to sync`);
      
      if (unsyncedResults.length === 0) {
        console.log('✅ No records to sync, process completed');
        console.timeEnd('Sync Duration');
        return { syncedCount: 0 };
      }
      
      // Log sample unsynced record data
      if (unsyncedResults.length > 0) {
        console.log('🔄 Sample unsynced record:', JSON.stringify({
          id: unsyncedResults[0].id,
          predicted_class: unsyncedResults[0].predicted_class,
          timestamp: unsyncedResults[0].timestamp,
          has_image: !!unsyncedResults[0].image_path
        }, null, 2));
      }
      
      let successCount = 0;
      let failureCount = 0;
      
      for (const result of unsyncedResults) {
        console.log(`🔄 Syncing result ID: ${result.id} (${result.predicted_class || 'Unknown class'})`);
        
        try {
          // 1. First, insert the inference result with ONLY the fields that belong in inference_results table
          console.log(`🔄 Inserting inference record to Supabase for ID: ${result.id}`);
          const { data: inferenceData, error: infError } = await supabase
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
              timestamp: result.timestamp ? new Date(result.timestamp).toISOString() : new Date().toISOString(),
              user_id: user?.id || null, // Include the user ID
              // Add sync_origin field to track that this came from offline mode
              sync_origin: result.sync_origin || 'offline'
            })
            .select();
  
          if (infError) {
            console.error(`❌ Error syncing inference result ID ${result.id}:`, infError);
            console.error(`❌ Error details for ID ${result.id}:`, 
              JSON.stringify({
                message: infError.message,
                details: infError.details,
                hint: infError.hint,
                code: infError.code
              }, null, 2)
            );
            failureCount++;
            continue;
          }
          
          console.log(`✅ Successfully inserted inference record to Supabase, new ID: ${inferenceData?.[0]?.id || 'unknown'}`);
          
          // 2. Get related plant details
          try {
            console.log(`🔄 Looking for plant details for inference ID: ${result.id}`);
            const plantDetailsQuery = await this.executeQuery(
              `SELECT * FROM offline_plant_details WHERE inference_result_id = ?`,
              [result.id]
            );
            
            const plantDetails = plantDetailsQuery.values?.[0];
            
            if (plantDetails && inferenceData && inferenceData.length > 0) {
              console.log(`🔄 Found plant details for inference ID: ${result.id}, syncing to Supabase`);
              
              // Prepare the plant details data for insertion
              const detailsToInsert = {
                inference_result_id: inferenceData[0].id,
                aliases: plantDetails.aliases ? JSON.parse(plantDetails.aliases) : [],
                color: plantDetails.color || result.color || null,
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
                soil_req: plantDetails.soil_req || null,
                // Add sync_origin field to plant details as well
                sync_origin: 'offline'
              };
              
              // Log non-null fields to see what's being synced
              const nonNullFields = Object.entries(detailsToInsert)
                .filter(([key, value]) => value !== null && key !== 'inference_result_id')
                .map(([key]) => key);
              
              console.log(`🔄 Plant details fields to sync: ${nonNullFields.join(', ')}`);
              
              // 3. Insert plant details with the new inference_result_id from Supabase
              const { error: plantError } = await supabase
                .from('plant_details')
                .insert(detailsToInsert);
              
              if (plantError) {
                console.error(`❌ Error syncing plant details for inference ID ${result.id}:`, plantError);
                console.error(`❌ Plant details error for ID ${result.id}:`, 
                  JSON.stringify({
                    message: plantError.message,
                    details: plantError.details,
                    hint: plantError.hint,
                    code: plantError.code
                  }, null, 2)
                );
              } else {
                console.log(`✅ Plant details synced successfully with sync_origin for inference ID: ${result.id}`);
              }
            } else {
              // If no plant details found but we have color data, create a basic record
              if (inferenceData && inferenceData.length > 0 && result.color) {
                console.log(`🔄 No detailed plant info found, creating basic record with color for inference ID: ${result.id}`);
                const { error: basicPlantError } = await supabase
                  .from('plant_details')
                  .insert({
                    inference_result_id: inferenceData[0].id,
                    color: result.color || null,
                    sync_origin: 'offline'
                  });
                  
                if (basicPlantError) {
                  console.error(`❌ Error creating basic plant details for inference ID ${result.id}:`, basicPlantError);
                } else {
                  console.log(`✅ Basic plant details created for inference ID: ${result.id}`);
                }
              } else {
                console.log(`ℹ️ No plant details found and no color data available for inference ID: ${result.id}`);
              }
            }
          } catch (plantQueryError) {
            console.error(`❌ Error retrieving plant details for inference ID ${result.id}:`, plantQueryError);
          }
  
          // Mark as synced even if plant details sync failed (to avoid stuck records)
          await this.markAsSynced(result.id);
          console.log(`✅ Successfully synced inference result ID: ${result.id}`);
          successCount++;
        } catch (recordError) {
          console.error(`❌ Unexpected error syncing record ID ${result.id}:`, recordError);
          failureCount++;
        }
      }
      
      console.log(`🔄 Sync Summary: ${successCount} records synced successfully, ${failureCount} failures`);
      console.timeEnd('Sync Duration');
      return { syncedCount: successCount, failureCount };
    } catch (error) {
      console.error('❌ Error in syncWithSupabase:', error);
      console.timeEnd('Sync Duration');
      throw error;
    }
  },

  // Function to check Supabase table schema
  async checkSupabaseSchema() {
    try {
      console.log('🔍 Checking Supabase inference_results table schema...');
      
      // Try to get just one row to see the structure
      const { data, error } = await supabase
        .from('inference_results')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Error checking Supabase schema:', error);
        return false;
      }
      
      // If we have data, log the column names
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('✅ Supabase inference_results columns:', columns.join(', '));
        return true;
      } else {
        console.log('ℹ️ No data in Supabase table, cannot determine schema.');
        
        // Try a basic insert to see if we get a column error
        const testData = {
          image: null,
          scientific_name: "Test Scientific Name",
          family_name: "Test Family",
          description: "Test description",
          habitat: "Test habitat",
          result: "Test result",
          confidence: 0.99,
          timestamp: new Date().toISOString(),
          sync_origin: 'schema_test'
        };
        
        const { error: testError } = await supabase
          .from('inference_results')
          .insert(testData)
          .select();
        
        if (testError) {
          console.error('❌ Test insert failed with error:', testError);
          console.error('❌ This may indicate schema mismatch. Error details:', 
            JSON.stringify({
              message: testError.message,
              details: testError.details,
              hint: testError.hint,
              code: testError.code
            }, null, 2)
          );
          return false;
        } else {
          console.log('✅ Test insert succeeded, schema appears compatible');
          
          // Clean up test data
          await supabase
            .from('inference_results')
            .delete()
            .eq('sync_origin', 'schema_test');
            
          return true;
        }
      }
    } catch (error) {
      console.error('❌ Error in checkSupabaseSchema:', error);
      return false;
    }
  },

  // Upgrade database schema if needed
  async upgradeDatabaseIfNeeded() {
    try {
      console.log("Checking if database schema needs upgrading...");
      
      // Create schema_version table if it doesn't exist
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS schema_version (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          version INTEGER NOT NULL DEFAULT 1
        );
      `);
      
      // Get current version or initialize to version 1
      const versionResult = await this.executeQuery(`SELECT version FROM schema_version WHERE id = 1;`);
      let currentVersion = 1;
      
      if (versionResult.values && versionResult.values.length > 0) {
        currentVersion = versionResult.values[0].version;
      } else {
        await this.executeQuery(`INSERT OR IGNORE INTO schema_version (id, version) VALUES (1, 1);`);
      }
      
      console.log(`Current database schema version: ${currentVersion}`);
      
      // If we're on schema version 1, upgrade to version 2 (removes shape and margin columns)
      if (currentVersion < 2) {
        console.log("Upgrading database schema to version 2...");
        
        try {
          // Ensure foreign keys are enabled
          await this.executeQuery("PRAGMA foreign_keys = ON;");
          
          // Use a transaction to ensure consistency
          await this.executeQuery("BEGIN TRANSACTION;");
          
          try {
            // First check if the offline_plant_details table exists
            const tableInfoResult = await this.executeQuery(`PRAGMA table_info(offline_plant_details);`);
            
            if (tableInfoResult.values && tableInfoResult.values.length > 0) {
              console.log("Found offline_plant_details table, checking for deprecated columns...");
              
              // Get column names
              const columns = tableInfoResult.values.map((col: any) => col.name);
              console.log("Current columns:", columns);
              
              // If deprecated columns exist, migrate the table
              if (columns.includes('shape') || columns.includes('margin')) {
                console.log("Found deprecated columns, migrating table...");
                
                // Backup existing data first (critical step)
                const { values: existingData } = await this.executeQuery(
                  `SELECT * FROM offline_plant_details;`
                );
                console.log(`Backing up ${existingData?.length || 0} rows from offline_plant_details`);
                
                // Drop the foreign key table first
                await this.executeQuery(`DROP TABLE IF EXISTS offline_plant_details;`);
                
                // Create the table with the updated schema
                await this.executeQuery(`
                  CREATE TABLE IF NOT EXISTS offline_plant_details (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    inference_result_id INTEGER NOT NULL,
                    aliases TEXT,
                    color TEXT,
                    foliage TEXT,
                    bark TEXT,
                    fruit TEXT,
                    crown TEXT,
                    trunk TEXT,
                    leaves TEXT,
                    retention TEXT,
                    texture TEXT,
                    venation TEXT,
                    behavior TEXT,
                    edible_uses TEXT,
                    med_uses TEXT,
                    timber_uses TEXT,
                    other_uses TEXT,
                    climate TEXT,
                    lifespan TEXT,
                    light_needs TEXT,
                    water_needs TEXT,
                    soil_req TEXT,
                    FOREIGN KEY (inference_result_id) REFERENCES unsynced_inferences(id) ON DELETE CASCADE
                  );
                `);
                
                // Restore the data
                if (existingData && existingData.length > 0) {
                  for (const row of existingData) {
                    await this.executeQuery(
                      `INSERT INTO offline_plant_details (
                        id, inference_result_id, aliases, color, foliage, bark, 
                        fruit, crown, trunk, leaves, retention, texture,
                        venation, behavior, edible_uses, med_uses, timber_uses,
                        other_uses, climate, lifespan, light_needs, water_needs, soil_req
                      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                      [
                        row.id,
                        row.inference_result_id,
                        row.aliases,
                        row.color,
                        row.foliage,
                        row.bark,
                        row.fruit,
                        row.crown,
                        row.trunk,
                        row.leaves,
                        row.retention,
                        row.texture,
                        row.venation,
                        row.behavior,
                        row.edible_uses,
                        row.med_uses,
                        row.timber_uses,
                        row.other_uses,
                        row.climate,
                        row.lifespan,
                        row.light_needs,
                        row.water_needs,
                        row.soil_req
                      ]
                    );
                  }
                  console.log(`Restored ${existingData.length} rows to offline_plant_details`);
                }
              }
            }
            
            // Check unsynced_inferences table for deprecated columns
            const inferenceTableInfo = await this.executeQuery(`PRAGMA table_info(unsynced_inferences);`);
            
            if (inferenceTableInfo.values && inferenceTableInfo.values.length > 0) {
              const inferenceColumns = inferenceTableInfo.values.map((col: any) => col.name);
              
              // If deprecated columns exist, migrate the table
              if (inferenceColumns.includes('shape') || inferenceColumns.includes('margin')) {
                console.log("Found deprecated columns in unsynced_inferences, migrating table...");
                
                // Backup existing inference data first
                const { values: existingInferences } = await this.executeQuery(
                  `SELECT * FROM unsynced_inferences;`
                );
                console.log(`Backing up ${existingInferences?.length || 0} rows from unsynced_inferences`);
                
                // Drop foreign key table first, then parent table
                await this.executeQuery(`DROP TABLE IF EXISTS offline_plant_details;`);
                await this.executeQuery(`DROP TABLE IF EXISTS unsynced_inferences;`);
                
                // Recreate parent table first
                await this.executeQuery(`
                  CREATE TABLE IF NOT EXISTS unsynced_inferences (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    image_path TEXT NOT NULL,
                    predicted_class TEXT NOT NULL,
                    scientific_name TEXT NOT NULL,
                    family_name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    habitat TEXT NOT NULL,
                    color TEXT,
                    growth_habits TEXT,
                    confidence REAL,
                    timestamp INTEGER NOT NULL,
                    synced BOOLEAN DEFAULT 0
                  );
                `);
                
                // Recreate the child table
                await this.executeQuery(`
                  CREATE TABLE IF NOT EXISTS offline_plant_details (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    inference_result_id INTEGER NOT NULL,
                    aliases TEXT,
                    color TEXT,
                    foliage TEXT,
                    bark TEXT,
                    fruit TEXT,
                    crown TEXT,
                    trunk TEXT,
                    leaves TEXT,
                    retention TEXT,
                    texture TEXT,
                    venation TEXT,
                    behavior TEXT,
                    edible_uses TEXT,
                    med_uses TEXT,
                    timber_uses TEXT,
                    other_uses TEXT,
                    climate TEXT,
                    lifespan TEXT,
                    light_needs TEXT,
                    water_needs TEXT,
                    soil_req TEXT,
                    FOREIGN KEY (inference_result_id) REFERENCES unsynced_inferences(id) ON DELETE CASCADE
                  );
                `);
                
                // Restore the inference data first
                if (existingInferences && existingInferences.length > 0) {
                  for (const row of existingInferences) {
                    await this.executeQuery(
                      `INSERT INTO unsynced_inferences (
                        id, image_path, predicted_class, scientific_name, family_name,
                        description, habitat, color, growth_habits, confidence, timestamp, synced
                      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
                      [
                        row.id,
                        row.image_path,
                        row.predicted_class,
                        row.scientific_name,
                        row.family_name,
                        row.description,
                        row.habitat,
                        row.color,
                        row.growth_habits,
                        row.confidence,
                        row.timestamp,
                        row.synced
                      ]
                    );
                  }
                  console.log(`Restored ${existingInferences.length} rows to unsynced_inferences`);
                }
              }
            }
            
            // Update to version 2
            await this.executeQuery(`UPDATE schema_version SET version = 2 WHERE id = 1;`);
            console.log("Database upgraded to schema version 2");
            
            // Commit the transaction
            await this.executeQuery("COMMIT;");
          } catch (migrationError) {
            // Rollback on error
            await this.executeQuery("ROLLBACK;");
            console.error("Migration error:", migrationError);
            throw migrationError;
          }
        } catch (error) {
          console.error("Transaction error during upgrade:", error);
          throw error;
        }
      }
      
      console.log("Database schema check complete");
    } catch (error) {
      console.error("Error during database upgrade:", error);
      throw error;
    }
  },
  
  // Get current schema version
  async getSchemaVersion(): Promise<number> {
    try {
      // Create schema_version table if it doesn't exist
      await this.executeQuery(`
        CREATE TABLE IF NOT EXISTS schema_version (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          version INTEGER NOT NULL
        );
      `);
      
      // Get current version
      const versionResult = await this.executeQuery(`SELECT version FROM schema_version WHERE id = 1;`);
      
      if (versionResult.values && versionResult.values.length > 0) {
        return versionResult.values[0].version;
      } else {
        // Insert initial version if not exists
        await this.executeQuery(`INSERT OR IGNORE INTO schema_version (id, version) VALUES (1, 1);`);
        return 1;
      }
    } catch (error) {
      console.error("Error getting schema version:", error);
      return 1; // Default to version 1
    }
  },
  
  // Set schema version
  async setSchemaVersion(version: number): Promise<void> {
    try {
      await this.executeQuery(`
        UPDATE schema_version SET version = ? WHERE id = 1;
      `, [version]);
    } catch (error) {
      console.error("Error setting schema version:", error);
    }
  },

  // Helper method to check database health
  async checkDatabase() {
    try {
      console.log("Performing database health check...");
      
      // Check if we have a valid database connection
      if (!db) {
        console.error("Database connection not initialized");
        return { 
          status: "error", 
          message: "Database connection not initialized",
          tables: [] 
        };
      }
      
      // Get a list of all tables
      const { values: tables } = await this.executeQuery(
        `SELECT name FROM sqlite_master WHERE type='table'`
      );
      
      console.log("Tables in database:", tables?.map((t: any) => t.name).join(", "));
      
      // Check foreign key status
      const { values: fkStatus } = await this.executeQuery(
        `PRAGMA foreign_keys`
      );
      
      console.log("Foreign keys enabled:", fkStatus?.[0]?.foreign_keys === 1 ? "Yes" : "No");
      
      // Check table structures
      let tableStructures: Record<string, any> = {};
      for (const table of tables || []) {
        const { values: columns } = await this.executeQuery(
          `PRAGMA table_info(${table.name})`
        );
        
        tableStructures[table.name] = columns;
      }
      
      // Try a simple query to verify read access
      let readStatus = "unknown";
      try {
        await this.executeQuery(`SELECT 1`);
        readStatus = "success";
      } catch (readError) {
        readStatus = "failed";
        console.error("Read query failed:", readError);
      }
      
      // Try a simple transaction to verify write access
      let writeStatus = "unknown";
      try {
        await this.executeQuery("BEGIN TRANSACTION");
        await this.executeQuery("COMMIT");
        writeStatus = "success";
      } catch (writeError) {
        writeStatus = "failed";
        console.error("Write transaction failed:", writeError);
        // Try to rollback if we failed
        try {
          await this.executeQuery("ROLLBACK");
        } catch (e) {
          // Ignore rollback errors
        }
      }
      
      return {
        status: "success",
        message: "Database check completed",
        tables: tables?.map((t: any) => t.name) || [],
        foreignKeysEnabled: fkStatus?.[0]?.foreign_keys === 1,
        readStatus,
        writeStatus,
        schema: tableStructures
      };
    } catch (error: unknown) {
      console.error("Database health check failed:", error);
      return { 
        status: "error", 
        message: error instanceof Error ? error.message : "Unknown error during database check",
        tables: []
      };
    }
  },

  // Reset database completely (use with caution)
  async resetDatabase() {
    try {
      console.log("RESETTING DATABASE - This will delete all offline data!");
      
      // Drop all tables in the correct order (respecting foreign keys)
      const { values: tables } = await this.executeQuery(
        `SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'`
      );
      
      if (tables && tables.length > 0) {
        // Disable foreign keys temporarily to avoid issues during drop
        await this.executeQuery("PRAGMA foreign_keys = OFF");
        
        // Sort tables to ensure dependent tables are dropped first
        // This is a simple approach - dependent tables first, then parent tables
        const tablesToDrop = tables.map((t: any) => t.name);
        
        // Known dependent tables should be dropped first
        const knownDependents = ['offline_plant_details'];
        const knownParents = ['unsynced_inferences'];
        
        // Filter out known tables
        const remainingTables = tablesToDrop.filter(
          (t: string) => !knownDependents.includes(t) && !knownParents.includes(t)
        );
        
        // Drop in the right order
        const dropOrder = [...knownDependents, ...remainingTables, ...knownParents];
        
        for (const tableName of dropOrder) {
          console.log(`Dropping table: ${tableName}`);
          await this.executeQuery(`DROP TABLE IF EXISTS ${tableName}`);
        }
        
        console.log("All tables dropped");
        
        // Re-enable foreign keys
        await this.executeQuery("PRAGMA foreign_keys = ON");
      }
      
      // Close and reopen the database
      if (db) {
        await db.close();
        db = null;
      }
      
      // Reinitialize database
      await this.initializeDatabase();
      
      return { success: true, message: "Database reset and reinitialized successfully" };
    } catch (error: unknown) {
      console.error("Error resetting database:", error);
      return { 
        success: false, 
        message: `Failed to reset database: ${error instanceof Error ? error.message : "Unknown error"}` 
      };
    }
  },

  // Add diagnostic method to check plant details for a specific inference
  async checkPlantDetailsForInference(inferenceId: number) {
    try {
      console.log(`Checking plant details for inference ID: ${inferenceId}`);
      
      // Query basic inference data
      const inferenceResult = await this.executeQuery(
        `SELECT * FROM unsynced_inferences WHERE id = ?`,
        [inferenceId]
      );
      
      // Query detailed plant information
      const plantDetailsResult = await this.executeQuery(
        `SELECT * FROM offline_plant_details WHERE inference_result_id = ?`,
        [inferenceId]
      );
      
      const inferenceData = inferenceResult.values?.[0] || null;
      const plantDetails = plantDetailsResult.values?.[0] || null;
      
      const diagnosticResult = {
        hasInferenceRecord: !!inferenceData,
        hasPlantDetailsRecord: !!plantDetails,
        inferenceData,
        plantDetails,
        combinedFields: {}
      };
      
      // Combine the data as it would appear when formatted
      if (inferenceData) {
        diagnosticResult.combinedFields = {
          ...inferenceData,
          ...(plantDetails || {})
        };
      }
      
      console.log('Diagnostic result:', JSON.stringify(diagnosticResult, null, 2));
      return diagnosticResult;
    } catch (error: any) {
      console.error('Error in diagnosis:', error);
      return { error: error.message || 'Unknown error' };
    }
  },
};