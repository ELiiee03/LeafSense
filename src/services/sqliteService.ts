import Dexie from 'dexie';

class SQLiteService extends Dexie {
  items: Dexie.Table<any, number>;

  constructor() {
    super('SQLiteDB');
    this.version(1).stores({
      items: '++id, name, value'
    });
    this.items = this.table('items');
  }

  async addItem(item: { name: string; value: string }) {
    return await this.items.add(item);
  }

  async getItems() {
    return await this.items.toArray();
  }

  async clearItems() {
    return await this.items.clear();
  }
}

export const sqliteService = new SQLiteService();