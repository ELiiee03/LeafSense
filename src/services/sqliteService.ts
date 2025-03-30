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
        const { error } = await supabase
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
          });

        if (!error) {
          await this.markAsSynced(result.id);
          console.log('Successfully synced result:', result.id);
        } else {
          console.error('Error syncing result:', error);
        }
      }
      console.log('Sync with Supabase completed');
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      throw error;
    }
  }
};