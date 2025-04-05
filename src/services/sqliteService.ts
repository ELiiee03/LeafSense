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

      // Create all necessary tables
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

      await this.initializeOfflineTable();
    } catch (error) {
      console.error('Error initializing database:', error);
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

  // Offline-specific methods
  async initializeOfflineTable() {
    // Drop the table if it exists
    await this.executeQuery(`
      DROP TABLE IF EXISTS unsynced_inferences;
    `);

    // Create the table with the correct schema
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
        shape TEXT,
        margin TEXT,
        growth_habits TEXT,
        confidence REAL,
        timestamp INTEGER NOT NULL,
        synced BOOLEAN DEFAULT 0
      );
    `);
    
    // Create plant_details table
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
        FOREIGN KEY (inference_result_id) REFERENCES unsynced_inferences(id)
      );
    `);
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
  }) {
    const result = await this.executeQuery(
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
    
    // Return the inserted ID for reference
    const { values } = await this.executeQuery('SELECT last_insert_rowid() as id');
    return { id: values?.[0]?.id };
  },
  
  async saveOfflinePlantDetails(data: {
    inferenceResultId: number;
    aliases: string[];
    color: string;
    foliage: string;
    bark: string;
    fruit: string;
    crown: string;
    trunk: string;
    leaves: string;
    retention: string;
    texture: string;
    venation: string;
    behavior: string;
    edibleUses: string;
    medUses: string;
    timberUses: string;
    otherUses: string;
    climate: string;
    lifespan: string;
    lightNeeds: string;
    waterNeeds: string;
    soilReq: string;
  }) {
    return this.executeQuery(
      `INSERT INTO offline_plant_details (
        inference_result_id, aliases, color, foliage, bark,
        fruit, crown, trunk, leaves, retention, texture,
        venation, behavior, edible_uses, med_uses, timber_uses,
        other_uses, climate, lifespan, light_needs, water_needs, soil_req
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.inferenceResultId,
        JSON.stringify(data.aliases),
        data.color,
        data.foliage,
        data.bark,
        data.fruit,
        data.crown,
        data.trunk,
        data.leaves,
        data.retention,
        data.texture,
        data.venation,
        data.behavior,
        data.edibleUses,
        data.medUses,
        data.timberUses,
        data.otherUses,
        data.climate,
        data.lifespan,
        data.lightNeeds,
        data.waterNeeds,
        data.soilReq
      ]
    );
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
      // First try to get results from the unsynced_inferences table
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
          shape,
          margin,
          growth_habits as growthHabits,
          confidence,
          timestamp,
          synced
        FROM unsynced_inferences
        ORDER BY timestamp DESC`
      );
      
      return result.values || [];
    } catch (error) {
      console.error('Error getting inference results:', error);
      return [];
    }
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
      const unsyncedResults = await this.getUnsyncedResults();
      console.log(`Found ${unsyncedResults.length} unsynced results to sync`);
      
      for (const result of unsyncedResults) {
        console.log(`Syncing result ID: ${result.id}`);
        
        // 1. First, insert the inference result
        const { data: inferenceData, error: infError } = await supabase
          .from('inference_results')
          .insert({
            image: result.image_path,
            scientific_name: result.scientific_name,
            family_name: result.family_name,
            description: result.description,
            habitat: result.habitat,
            result: result.predicted_class,
            color: result.color,
            shape: result.shape,
            margin: result.margin,
            growth_habits: result.growth_habits,
            confidence: result.confidence,
            timestamp: result.timestamp
          })
          .select();

        if (infError) {
          console.error('Error syncing inference result:', infError);
          continue;
        }
        
        // 2. Get related plant details
        try {
          const plantDetailsQuery = await this.executeQuery(
            `SELECT * FROM offline_plant_details WHERE inference_result_id = ?`,
            [result.id]
          );
          
          const plantDetails = plantDetailsQuery.values?.[0];
          
          if (plantDetails && inferenceData && inferenceData.length > 0) {
            // 3. Insert plant details with the new inference_result_id from Supabase
            const { error: plantError } = await supabase
              .from('plant_details')
              .insert({
                inference_result_id: inferenceData[0].id,
                aliases: plantDetails.aliases ? JSON.parse(plantDetails.aliases) : [],
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
                edible_uses: plantDetails.edible_uses,
                med_uses: plantDetails.med_uses,
                timber_uses: plantDetails.timber_uses,
                other_uses: plantDetails.other_uses,
                climate: plantDetails.climate,
                lifespan: plantDetails.lifespan,
                light_needs: plantDetails.light_needs,
                water_needs: plantDetails.water_needs,
                soil_req: plantDetails.soil_req
              });
            
            if (plantError) {
              console.error('Error syncing plant details:', plantError);
            } else {
              console.log('Plant details synced successfully');
            }
          }
        } catch (plantQueryError) {
          console.error('Error retrieving plant details:', plantQueryError);
        }

        // Mark as synced even if plant details sync failed (to avoid stuck records)
        await this.markAsSynced(result.id);
        console.log('Successfully synced result:', result.id);
      }
      
      console.log('Sync with Supabase completed');
      return { syncedCount: unsyncedResults.length };
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      throw error;
    }
  }
};