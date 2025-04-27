import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { supabase } from '@/supabaseClient';

interface QueryResult {
  values?: any[];
  changes?: number;
}

let db: SQLiteDBConnection | null = null;
const sqlite = new SQLiteConnection(CapacitorSQLite);

// Add flag to prevent multiple syncs running at once
let isSyncingInProgress = false;

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
      console.log("📊 Initializing offline database tables...");
      
      // Check if tables exist
      const tableInfoUnsynced = await this.executeQuery(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='unsynced_inferences';
      `);
      
      const tableInfoDetails = await this.executeQuery(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='offline_plant_details';
      `);
      
      const hasUnsyncedTable = tableInfoUnsynced.values && tableInfoUnsynced.values.length > 0;
      const hasDetailsTable = tableInfoDetails.values && tableInfoDetails.values.length > 0;
      
      console.log(`📊 Table check: unsynced_inferences exists: ${hasUnsyncedTable}, offline_plant_details exists: ${hasDetailsTable}`);
      
      // If both tables exist, we don't need to recreate them
      if (hasUnsyncedTable && hasDetailsTable) {
        console.log("📊 Offline tables already exist, checking for sync_origin column");
        
        // Check if sync_origin column exists in unsynced_inferences
        const columnInfo = await this.executeQuery(`PRAGMA table_info(unsynced_inferences);`);
        const hasOriginColumn = columnInfo.values && 
          columnInfo.values.some((col: any) => col.name === 'sync_origin');
        
        // Add sync_origin column if it doesn't exist
        if (!hasOriginColumn) {
          console.log("📊 Adding sync_origin column to unsynced_inferences table");
          await this.executeQuery(`ALTER TABLE unsynced_inferences ADD COLUMN sync_origin TEXT DEFAULT 'offline';`);
        }
        
        // Check column structure of offline_plant_details
        console.log("📊 Verifying offline_plant_details table structure");
        const detailsColumnInfo = await this.executeQuery(`PRAGMA table_info(offline_plant_details);`);
        console.log(`📊 offline_plant_details columns:`, JSON.stringify(detailsColumnInfo.values, null, 2));
        
        // Make sure foreign key is set up properly
        await this.executeQuery("PRAGMA foreign_keys = ON;");
        console.log("📊 Foreign keys enabled");
        
        return;
      }
      
      // If only one exists, we need to drop both to maintain consistency
      console.log("📊 Need to recreate tables for consistency");
      
      // Drop child table first to avoid foreign key issues
      if (hasDetailsTable) {
        console.log("📊 Dropping existing offline_plant_details table");
        await this.executeQuery(`DROP TABLE IF EXISTS offline_plant_details;`);
      }
      
      if (hasUnsyncedTable) {
        console.log("📊 Dropping existing unsynced_inferences table");
        await this.executeQuery(`DROP TABLE IF EXISTS unsynced_inferences;`);
      }
      
      // Explicitly enable foreign key support
      await this.executeQuery("PRAGMA foreign_keys = ON;");
      console.log("📊 Foreign keys enabled for new tables");

      // Create the parent table first
      console.log("📊 Creating unsynced_inferences table");
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
      console.log("📊 Creating offline_plant_details table with foreign key constraint");
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
      
      // Verify the tables were created properly
      const verifyUnsynced = await this.executeQuery(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='unsynced_inferences';
      `);
      
      const verifyDetails = await this.executeQuery(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='offline_plant_details';
      `);
      
      if (verifyUnsynced.values && verifyUnsynced.values.length > 0 && 
          verifyDetails.values && verifyDetails.values.length > 0) {
        console.log("✅ Offline tables initialized successfully with sync_origin field");
      } else {
        console.error("❌ Failed to verify table creation:", {
          unsynced: verifyUnsynced.values && verifyUnsynced.values.length > 0,
          details: verifyDetails.values && verifyDetails.values.length > 0
        });
      }
    } catch (error) {
      console.error("❌ Error initializing offline tables:", error);
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
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
    console.log('🌱 Saving offline plant details for inference result ID:', data.inferenceResultId);
    
    // DIAGNOSTIC: Log the source data fields received
    const nonNullFields = Object.entries(data)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '' && key !== 'inferenceResultId')
      .map(([key]) => key);
    
    console.log(`📊 DIAGNOSTIC: Received plant details with data for fields: ${nonNullFields.join(', ') || 'NONE'}`);
    
    if (nonNullFields.length === 0) {
      console.warn('⚠️ WARNING: No non-null plant details fields provided. Nothing to save.');
      return null;
    }

    try {
      // First verify that the parent inference record exists
      const checkInference = await this.executeQuery(
        `SELECT id FROM unsynced_inferences WHERE id = ?`,
        [data.inferenceResultId]
      );
      
      if (!checkInference.values || checkInference.values.length === 0) {
        console.error(`❌ ERROR: Cannot save plant details - parent inference record ${data.inferenceResultId} does not exist`);
        return null;
      }
      
      console.log(`✅ Parent inference record ${data.inferenceResultId} exists, proceeding with plant details save`);
      
      // Check if we already have details for this inference
      const existingResult = await this.executeQuery(
        `SELECT id FROM offline_plant_details WHERE inference_result_id = ?`,
        [data.inferenceResultId]
      );
      
      // Handle aliases formatting
      let aliases: string | string[] | undefined = data.aliases;
      if (aliases && Array.isArray(aliases)) {
        aliases = JSON.stringify(aliases);
      }
      
      // Prepare a debug object with all values for logging
      const debugValues = {
        inferenceResultId: data.inferenceResultId,
        aliases: aliases,
        color: data.color || null,
        foliage: data.foliage || null,
        bark: data.bark || null,
        fruit: data.fruit || null,
        crown: data.crown || null,
        trunk: data.trunk || null,
        leaves: data.leaves || null,
        retention: data.retention || null,
        texture: data.texture || null,
        venation: data.venation || null,
        behavior: data.behavior || null,
        edibleUses: data.edibleUses || null,
        medUses: data.medUses || null,
        timberUses: data.timberUses || null,
        otherUses: data.otherUses || null,
        climate: data.climate || null,
        lifespan: data.lifespan || null,
        lightNeeds: data.lightNeeds || null,
        waterNeeds: data.waterNeeds || null,
        soilReq: data.soilReq || null
      };
      
      console.log(`📊 DIAGNOSTIC: Plant details values to save:`, JSON.stringify(debugValues, null, 2));
      
      if (existingResult.values && existingResult.values.length > 0) {
        console.log(`ℹ️ Plant details already exist for inference ID ${data.inferenceResultId}, updating...`);
        
        // Prepare and log the update fields for debugging
        const updates = [];
        const params = [];
        
        if (data.aliases !== undefined) {
          updates.push('aliases = ?');
          params.push(aliases);
        }
        if (data.color !== undefined) {
          updates.push('color = ?');
          params.push(data.color);
        }
        if (data.foliage !== undefined) {
          updates.push('foliage = ?');
          params.push(data.foliage);
        }
        if (data.bark !== undefined) {
          updates.push('bark = ?');
          params.push(data.bark);
        }
        if (data.fruit !== undefined) {
          updates.push('fruit = ?');
          params.push(data.fruit);
        }
        if (data.crown !== undefined) {
          updates.push('crown = ?');
          params.push(data.crown);
        }
        if (data.trunk !== undefined) {
          updates.push('trunk = ?');
          params.push(data.trunk);
        }
        if (data.leaves !== undefined) {
          updates.push('leaves = ?');
          params.push(data.leaves);
        }
        if (data.retention !== undefined) {
          updates.push('retention = ?');
          params.push(data.retention);
        }
        if (data.texture !== undefined) {
          updates.push('texture = ?');
          params.push(data.texture);
        }
        if (data.venation !== undefined) {
          updates.push('venation = ?');
          params.push(data.venation);
        }
        if (data.behavior !== undefined) {
          updates.push('behavior = ?');
          params.push(data.behavior);
        }
        if (data.edibleUses !== undefined) {
          updates.push('edible_uses = ?');
          params.push(data.edibleUses);
        }
        if (data.medUses !== undefined) {
          updates.push('med_uses = ?');
          params.push(data.medUses);
        }
        if (data.timberUses !== undefined) {
          updates.push('timber_uses = ?');
          params.push(data.timberUses);
        }
        if (data.otherUses !== undefined) {
          updates.push('other_uses = ?');
          params.push(data.otherUses);
        }
        if (data.climate !== undefined) {
          updates.push('climate = ?');
          params.push(data.climate);
        }
        if (data.lifespan !== undefined) {
          updates.push('lifespan = ?');
          params.push(data.lifespan);
        }
        if (data.lightNeeds !== undefined) {
          updates.push('light_needs = ?');
          params.push(data.lightNeeds);
        }
        if (data.waterNeeds !== undefined) {
          updates.push('water_needs = ?');
          params.push(data.waterNeeds);
        }
        if (data.soilReq !== undefined) {
          updates.push('soil_req = ?');
          params.push(data.soilReq);
        }
        
        // Add the inference ID as the last parameter
        params.push(data.inferenceResultId);
        
        // Log the updates we're making
        console.log(`📊 DIAGNOSTIC: Updating fields: ${updates.join(', ')}`);
        
        if (updates.length === 0) {
          console.log(`ℹ️ No fields to update for inference ID ${data.inferenceResultId}`);
          return existingResult.values[0].id;
        }
        
        const updateQuery = `
          UPDATE offline_plant_details 
          SET ${updates.join(', ')} 
          WHERE inference_result_id = ?
        `;
        
        const result = await this.executeQuery(updateQuery, params);
        console.log(`✅ Updated plant details for inference ID ${data.inferenceResultId}. Changes: ${result.changes}`);
        
        // Verify the update by retrieving the record
        const verifyResult = await this.executeQuery(
          `SELECT * FROM offline_plant_details WHERE inference_result_id = ?`,
          [data.inferenceResultId]
        );
        
        if (verifyResult.values && verifyResult.values.length > 0) {
          console.log(`📊 DIAGNOSTIC: Updated plant details record:`, JSON.stringify(verifyResult.values[0], null, 2));
        } else {
          console.warn(`⚠️ WARNING: Failed to verify updated plant details record`);
        }
        
        return existingResult.values[0].id;
      } else {
        console.log(`🆕 Creating new plant details record for inference ID ${data.inferenceResultId}`);
        
        // Insert new record - be explicit about column names to avoid schema issues
        const insertQuery = `
          INSERT INTO offline_plant_details (
            inference_result_id, aliases, color, foliage, bark, fruit, crown, trunk, 
            leaves, retention, texture, venation, behavior, edible_uses, med_uses, 
            timber_uses, other_uses, climate, lifespan, light_needs, water_needs, soil_req
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
          data.inferenceResultId,
          aliases || null,
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
        ];
        
        // Execute the insert
        try {
          const result = await this.executeQuery(insertQuery, params);
          console.log(`✅ Inserted new plant details record for inference ID ${data.inferenceResultId}`);
          
          // Get the inserted record ID
          const getIdResult = await this.executeQuery(
            `SELECT id FROM offline_plant_details WHERE inference_result_id = ? ORDER BY id DESC LIMIT 1`,
            [data.inferenceResultId]
          );
          
          // Verify the insert by retrieving the record
          const verifyResult = await this.executeQuery(
            `SELECT * FROM offline_plant_details WHERE inference_result_id = ?`,
            [data.inferenceResultId]
          );
          
          if (verifyResult.values && verifyResult.values.length > 0) {
            console.log(`📊 DIAGNOSTIC: Inserted plant details record:`, JSON.stringify(verifyResult.values[0], null, 2));
            return verifyResult.values[0].id;
          } else {
            console.warn(`⚠️ WARNING: Failed to verify inserted plant details record`);
            return null;
          }
        } catch (insertError) {
          console.error(`❌ Error inserting plant details for inference ID ${data.inferenceResultId}:`, insertError);
          console.error('Query:', insertQuery);
          console.error('Params:', JSON.stringify(params, null, 2));
          
          if (insertError instanceof Error) {
            console.error('Error details:', insertError.message);
          }
          
          throw insertError;
        }
      }
    } catch (error) {
      console.error(`❌ Error in saveOfflinePlantDetails for inference ID ${data.inferenceResultId}:`, error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  },

  async getUnsyncedResults() {
    try {
      console.log('🔍 Finding unsynced records with synced = 0');
      
      // First check if there are any records with NULL synced value and fix them
      const nullCheckResult = await this.executeQuery(
        `SELECT COUNT(*) as count FROM unsynced_inferences WHERE synced IS NULL`
      );
      
      const nullCount = nullCheckResult.values?.[0]?.count || 0;
      if (nullCount > 0) {
        console.log(`⚠️ Found ${nullCount} records with NULL synced value, fixing to synced = 0`);
        await this.executeQuery(
          `UPDATE unsynced_inferences SET synced = 0 WHERE synced IS NULL`
        );
      }
      
      // Now get only unsynced records (synced = 0)
      const result = await this.executeQuery(
        `SELECT * FROM unsynced_inferences WHERE synced = 0`
      );
      
      const unsyncedCount = result.values?.length || 0;
      console.log(`📊 Found ${unsyncedCount} unsynced records to sync`);
      
      // For debugging, log the IDs
      if (unsyncedCount > 0 && result.values) {
        const ids = result.values.map((r: any) => r.id).join(', ');
        console.log(`📋 Unsynced record IDs: ${ids}`);
      }
      
      return result.values || [];
    } catch (error) {
      console.error('❌ Error in getUnsyncedResults:', error);
      return [];
    }
  },

  async markAsSynced(id: number) {
    try {
      console.log(`✅ Marking record ID ${id} as synced (synced = 1)`);
      const result = await this.executeQuery(
        `UPDATE unsynced_inferences SET synced = 1 WHERE id = ?`,
        [id]
      );
      
      // Verify the update was successful
      if (result.changes && result.changes > 0) {
        console.log(`✅ Successfully marked record ID ${id} as synced`);
      } else {
        console.warn(`⚠️ No records were updated when marking ID ${id} as synced`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Error marking record ${id} as synced:`, error);
      throw error;
    }
  },

  async deleteUnsyncedRecord(id: number) {
    try {
      // First explicitly enable foreign keys
      await this.executeQuery("PRAGMA foreign_keys = ON;");
      
      // Check if there are related plant details to delete
      const detailsCheck = await this.executeQuery(
        `SELECT id FROM offline_plant_details WHERE inference_result_id = ?`,
        [id]
      );
      
      // If there are related records, delete them first
      if (detailsCheck.values && detailsCheck.values.length > 0) {
        console.log(`Deleting ${detailsCheck.values.length} plant detail records for inference ID ${id}`);
        await this.executeQuery(
          `DELETE FROM offline_plant_details WHERE inference_result_id = ?`,
          [id]
        );
      }
      
      // Now delete the inference record
      const result = await this.executeQuery(
        `DELETE FROM unsynced_inferences WHERE id = ?`,
        [id]
      );
      
      console.log(`Successfully deleted inference record with ID ${id} and its related details`);
      
      return result;
    } catch (error) {
      console.error(`Failed to delete inference record ${id}:`, error);
      throw error;
    }
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
    // If a sync is already in progress, return early
    if (isSyncingInProgress) {
      console.log('⚠️ Sync already in progress, skipping this request');
      return { syncedCount: 0, alreadyInProgress: true };
    }
    
    try {
      // Set the flag to indicate sync is in progress
      isSyncingInProgress = true;
      
      console.log('🔄 Starting sync process with Supabase...');
      console.time('Sync Duration');
      
      // DIAGNOSTIC: Check plant_details table structure
      try {
        console.log("📊 DIAGNOSTIC: Checking plant_details table structure");
        const tableInfo = await this.executeQuery(`PRAGMA table_info(offline_plant_details)`);
        console.log("Plant details table columns:", tableInfo.values?.map((col: any) => col.name).join(", "));
        
        // Count how many plant detail records exist in the database
        const countResult = await this.executeQuery(`SELECT COUNT(*) as count FROM offline_plant_details`);
        const pdCount = countResult.values?.[0]?.count || 0;
        console.log(`📊 DIAGNOSTIC: Found ${pdCount} total plant detail records in SQLite`);
        
        // Sample a record to see what data looks like
        if (pdCount > 0) {
          const sampleResult = await this.executeQuery(`SELECT * FROM offline_plant_details LIMIT 1`);
          const sample = sampleResult.values?.[0];
          console.log("📊 DIAGNOSTIC: Sample plant detail record:", JSON.stringify(sample, null, 2));
          
          // Check if this plant detail is associated with an unsynced record
          if (sample && sample.inference_result_id) {
            const inferenceResult = await this.executeQuery(
              `SELECT * FROM unsynced_inferences WHERE id = ?`, 
              [sample.inference_result_id]
            );
            const inference = inferenceResult.values?.[0];
            console.log(`📊 DIAGNOSTIC: Associated inference record synced status: ${inference?.synced ? 'SYNCED' : 'UNSYNCED'}`);
          }
        }
      } catch (diagError) {
        console.error("Error in diagnostics:", diagError);
      }

      // First check if there are old synced records that weren't properly cleaned up
      const { values: syncedRecords } = await this.executeQuery(
        `SELECT COUNT(*) as count FROM unsynced_inferences WHERE synced = 1`
      );
      
      const syncedCount = syncedRecords?.[0]?.count || 0;
      if (syncedCount > 0) {
        console.log(`⚠️ Found ${syncedCount} records already marked as synced but not cleaned up`);
        console.log(`🧹 Cleaning up these records before starting new sync`);
        
        await this.deleteAllSyncedData();
      }
      
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
      
      // Log all unsynced record info for debugging
      if (unsyncedResults.length > 0) {
        console.log('📋 All unsynced records to sync:');
        unsyncedResults.forEach((result: any, index: number) => {
          console.log(`  [${index+1}] ID: ${result.id}, Class: ${result.predicted_class}, Timestamp: ${new Date(result.timestamp).toISOString()}`);
        });
      }
      
      if (unsyncedResults.length === 0) {
        console.log('✅ No records to sync, process completed');
        console.timeEnd('Sync Duration');
        return { syncedCount: 0 };
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
            
            // DIAGNOSTIC: Enhanced logging for plant details
            const plantDetailsCount = plantDetailsQuery.values?.length || 0;
            console.log(`📊 DIAGNOSTIC: Found ${plantDetailsCount} plant details for inference ID ${result.id}`);
            
            const plantDetails = plantDetailsQuery.values?.[0];
            
            if (plantDetails && inferenceData && inferenceData.length > 0) {
              console.log(`🔄 Found plant details for inference ID: ${result.id}, syncing to Supabase`);
              
              // DIAGNOSTIC: Log non-null values in plant details to see what fields have data
              const nonNullFields = Object.entries(plantDetails)
                .filter(([key, value]) => value !== null && value !== undefined && key !== 'id' && key !== 'inference_result_id')
                .map(([key, value]) => `${key}: ${typeof value === 'string' && value.length > 20 ? value.substr(0, 20) + '...' : value}`);
              
              console.log(`📊 DIAGNOSTIC: Plant details has data for fields: ${nonNullFields.join(', ') || 'NONE'}`);
              
              // Log the raw plant details data for debugging
              console.log('Raw plant details data:', JSON.stringify(plantDetails, null, 2));
              
              // Fix the typo in soild_req/soil_req if present
              if (plantDetails.soild_req !== undefined && plantDetails.soil_req === undefined) {
                plantDetails.soil_req = plantDetails.soild_req;
                delete plantDetails.soild_req;
              }
              
              // Parse aliases if it's a string
              let parsedAliases: string | string[] | undefined = plantDetails.aliases;
              if (typeof plantDetails.aliases === 'string' && plantDetails.aliases) {
                try {
                  parsedAliases = JSON.parse(plantDetails.aliases);
                } catch (e) {
                  console.error('Error parsing aliases:', e);
                  parsedAliases = plantDetails.aliases.split(',').map((s: string) => s.trim());
                }
              }
              
              // Prepare the plant details data for insertion
              const detailsToInsert = {
                inference_result_id: inferenceData[0].id,
                aliases: parsedAliases || [],
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
                soil_req: plantDetails.soil_req || null
              };
              
              // Log the exact data being sent to Supabase
              console.log('📊 DIAGNOSTIC: Sending plant details to Supabase:', JSON.stringify(detailsToInsert, null, 2));
              
              // Log non-null fields to see what's being synced
              const nonNullFieldsToSync = Object.entries(detailsToInsert)
                .filter(([key, value]) => value !== null && value !== undefined && key !== 'inference_result_id')
                .map(([key]) => key);
              
              console.log(`🔄 Plant details fields to sync: ${nonNullFieldsToSync.join(', ') || 'NONE'}`);
              
              // Check if we have any meaningful data to sync beyond just the inference_result_id
              if (nonNullFieldsToSync.length === 0) {
                console.warn(`⚠️ WARNING: No non-null fields found in plant details for inference ID ${result.id}`);
              }
              
              // 3. Insert plant details with the new inference_result_id from Supabase
              console.log(`🔄 Inserting plant details with Supabase inference_result_id: ${inferenceData[0].id}`);
              
              const { data: plantData, error: plantError } = await supabase
                .from('plant_details')
                .insert(detailsToInsert)
                .select();
              
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
                console.log(`✅ Plant details synced successfully with ID: ${plantData?.[0]?.id || 'unknown'}`);
                console.log(`✅ Plant details synced for inference ID: ${result.id}`);
                
                // DIAGNOSTIC: Log what was actually stored in Supabase
                console.log(`📊 DIAGNOSTIC: Supabase plant_details response:`, JSON.stringify(plantData && plantData[0] ? plantData[0] : 'No data returned'));
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
      
      // If we successfully synced some records, delete them from SQLite
      if (successCount > 0) {
        try {
          console.log(`🧹 Cleaning up ${successCount} synced records from SQLite...`);
          await this.deleteAllSyncedData();
        } catch (cleanupError) {
          console.error('❌ Error cleaning up synced data:', cleanupError);
        }
      }
      
      console.timeEnd('Sync Duration');
      return { syncedCount: successCount, failureCount };
    } catch (error) {
      console.error('❌ Error in syncWithSupabase:', error);
      console.timeEnd('Sync Duration');
      throw error;
    } finally {
      // Reset the flag when sync is done, regardless of success or failure
      isSyncingInProgress = false;
    }
  },

  // Function to delete all synced data from SQLite
  async deleteAllSyncedData() {
    try {
      console.log('🧹 Starting cleanup of synced records without transactions');
      
      // Enable foreign keys to ensure cascade delete works properly
      await this.executeQuery("PRAGMA foreign_keys = ON;");
      
      // Get the IDs of all synced inference results first
      const { values: syncedIds } = await this.executeQuery(
        `SELECT id FROM unsynced_inferences WHERE synced = 1`
      );
      
      if (!syncedIds || syncedIds.length === 0) {
        console.log('🧹 No synced records found to delete');
        return { success: true, deletedCount: 0, message: 'No synced records to delete' };
      }
      
      console.log(`🧹 Found ${syncedIds.length} synced inference records to delete with IDs: ${syncedIds.map(r => r.id).join(', ')}`);
      
      // Delete row by row without using a transaction
      let totalDetailsDeleted = 0;
      let totalInferencesDeleted = 0;
      
      for (const item of syncedIds) {
        try {
          // First delete associated plant details
          const { changes: detailsDeleted } = await this.executeQuery(
            `DELETE FROM offline_plant_details WHERE inference_result_id = ?`,
            [item.id]
          );
          totalDetailsDeleted += detailsDeleted || 0;
          
          // Then delete the inference record
          const { changes: inferenceDeleted } = await this.executeQuery(
            `DELETE FROM unsynced_inferences WHERE id = ?`,
            [item.id]
          );
          
          if (inferenceDeleted && inferenceDeleted > 0) {
            totalInferencesDeleted++;
          }
        } catch (deleteError) {
          console.error(`❌ Error deleting record ID ${item.id}:`, deleteError);
          // Continue with other records even if this one fails
        }
      }
      
      console.log(`🧹 Deleted ${totalDetailsDeleted} plant details records and ${totalInferencesDeleted} inference records`);
      
      // Verify all records were deleted
      const { values: remainingCheck } = await this.executeQuery(
        `SELECT COUNT(*) as count FROM unsynced_inferences WHERE synced = 1`
      );
      
      const remainingCount = remainingCheck?.[0]?.count || 0;
      if (remainingCount > 0) {
        console.warn(`⚠️ After deletion, ${remainingCount} synced records still remain`);
      } else {
        console.log('✅ All synced records have been successfully deleted');
      }
      
      return { 
        success: true, 
        deletedCount: totalInferencesDeleted,
        message: `Successfully deleted ${totalInferencesDeleted} synced records and ${totalDetailsDeleted} related plant details`
      };
    } catch (error) {
      console.error('❌ Error deleting synced data:', error);
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