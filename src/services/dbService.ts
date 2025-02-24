import { liveQuery } from 'dexie';
import Dexie from 'dexie';

interface InferenceResult {
  id?: number;
  image_path: string;
  predicted_class: string;
  scientific_name: string;
  family_name: string;
  description: string;
  habitat: string;
  timestamp: number;
  synced: boolean;
}

class LeafDB extends Dexie {
  inferences!: Dexie.Table<InferenceResult, number>;
  savedLeaves!: Dexie.Table<any, number>;
  
  constructor() {
    super('LeafDB');
    this.version(1).stores({
      inferences: '++id, image_path, synced, timestamp',
      savedLeaves: '++id, image_path, synced, timestamp'
    });
  }
}

export const db = new LeafDB();

export const dbService = {
  async saveOfflineResult(data: Omit<InferenceResult, 'id' | 'synced'>) {
    return db.inferences.add({
      ...data,
      synced: false
    });
  },

  async getUnsyncedResults() {
    return db.inferences
      .where('synced').equals(0)
      .toArray();
  },

  async markAsSynced(id: number) {
    return db.inferences.update(id, { synced: true });
  },

  async saveLeaf(data: any) {
    return db.savedLeaves.add({
      ...data,
      synced: false
    });
  },

  observeUnsynced() {
    return liveQuery(() => 
      db.inferences.where('synced').equals(0).toArray()
    );
  }
};
