import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { supabase } from '@/supabaseClient';

interface SavedLeaf {
    imagePath: string;
    leafInfo: string; // JSON stringified leaf data
    timestamp: number;
    synced: number;
}

interface InferenceResult {
    id?: number;
    imagePath: string;
    result: string;
    timestamp: number;
    synced: number;
}

class SQLiteService {
    private sqlite: SQLiteConnection;
    private db!: SQLiteDBConnection;
    
    constructor() {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
        this.initializeDatabase();
    }

    private async initializeDatabase() {
        try {
            // Create database
            const db = await this.sqlite.createConnection(
                'leaf_results',
                false,
                'no-encryption',
                1,
                false
            );
            
            await db.open();
            
            // Create table if not exists
            const inferenceTableQuery = `
                CREATE TABLE IF NOT EXISTS inference_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    image_path TEXT,
                    result TEXT,
                    scientific_name TEXT,
                    family_name TEXT,
                    description TEXT,
                    habitat TEXT,
                    timestamp INTEGER,
                    synced INTEGER DEFAULT 0
                );
            `;
            // saved_leaves tables
            const savedLeavesTableQuery = `
            CREATE TABLE IF NOT EXISTS saved_leaves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                image_path TEXT,
                result TEXT,
                scientific_name TEXT,
                family_name TEXT,
                description TEXT,
                habitat TEXT,
                timestamp INTEGER,
                synced INTEGER DEFAULT 0
            );
        `;
            
            await db.execute(inferenceTableQuery);
            await db.execute(savedLeavesTableQuery);    
            this.db = db;
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }
    async saveLeaf(data: SavedLeaf) {
        try {
            const query = `
                INSERT INTO saved_leaves (image_path, leaf_info, timestamp, synced)
                VALUES (?, ?, ?, ?)
            `;
            const values = [
                data.imagePath,
                data.leafInfo,
                data.timestamp,
                data.synced
            ];
            
            return await this.db.run(query, values);
        } catch (error) {
            console.error('Error saving leaf:', error);
            throw error;
        }
    }

    async syncWithSupabase() {
        try {
            const unsyncedLeaves = await this.getUnsyncedLeaves();
            
            for (const leaf of unsyncedLeaves) {
                try {
                    // Insert into Supabase
                    const { data, error } = await supabase
                    .from('leaf_info')  // Updated table name
                    .insert({
                        image: leaf.imagePath,
                        scientific_name: leaf.leafInfo,
                        family_name: leaf.leafInfo,
                        description: leaf.leafInfo,
                        habitat: leaf.leafInfo
                        });

                    if (error) throw error;
                    
                    // If successfully inserted to Supabase, mark as synced in SQLite
                    await this.markAsSynced(leaf.id);
                    
                    // Optionally: Delete from SQLite after successful sync
                    // await this.deleteLeaf(leaf.id);
                } catch (error) {
                    console.error('Error syncing leaf:', error);
                    continue;
                }
            }
        } catch (error) {
            console.error('Error in sync process:', error);
            throw error;
        }
        
    }
        // Optional: Add method to delete synced records
        async deleteLeaf(id: number) {
            try {
                const query = `
                    DELETE FROM saved_leaves 
                    WHERE id = ?
                `;
                
                await this.db.run(query, [id]);
            } catch (error) {
                console.error('Error deleting leaf:', error);
                throw error;
            }
        }

                    
    async saveInferenceResult(result: InferenceResult) {
        try {
            const query = `
                INSERT INTO inference_results (image_path, result, timestamp, synced)
                VALUES (?, ?, ?, ?)
            `;
            const values = [
                result.imagePath,
                result.result,
                result.timestamp,
                0
            ];
            
            return await this.db.run(query, values);
        } catch (error) {
            console.error('Error saving inference result:', error);
            throw error;
        }
    }

    async getUnsyncedResults() {
        try {
            const query = `
                SELECT * FROM inference_results 
                WHERE synced = 0
            `;
            
            const results = await this.db.query(query);
            return results.values || [];
        } catch (error) {
            console.error('Error getting unsynced results:', error);
            return [];
        }
    }

    async markAsSynced(id: number) {
        try {
            const query = `
                UPDATE inference_results 
                SET synced = 1 
                WHERE id = ?
            `;
            
            await this.db.run(query, [id]);
        } catch (error) {
            console.error('Error marking as synced:', error);
            throw error;
        }
    }

    async getUnsyncedLeaves() {
        try {
            const query = `
                SELECT * FROM saved_leaves 
                WHERE synced = 0
            `;
            
            const results = await this.db.query(query);
            return results.values || [];
        } catch (error) {
            console.error('Error getting unsynced leaves:', error);
            return [];
        }
    }
}

export const sqliteService = new SQLiteService();