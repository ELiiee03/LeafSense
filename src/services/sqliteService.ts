import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

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
                'leaf_inference',
                false,
                'no-encryption',
                1,
                false
            );
            
            await db.open();
            
            // Create table if not exists
            const query = `
                CREATE TABLE IF NOT EXISTS inference_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    image_path TEXT,
                    result TEXT,
                    timestamp INTEGER,
                    synced INTEGER DEFAULT 0
                );
            `;
            
            await db.execute(query);
            this.db = db;
        } catch (error) {
            console.error('Error initializing database:', error);
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
}

export const sqliteService = new SQLiteService();